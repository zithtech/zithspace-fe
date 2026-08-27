import NoData from "@/components/common/NoData";
import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, message, Drawer } from 'antd';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import OpeningV2Service, { OpeningReferral } from '@/services/openingV2Service';
import { commonDrawerProps, drawerFormStyles as formStyles, SectionCard } from '@/components/common/DrawerSection';
import { User, FileText, Briefcase, Trash2 } from 'lucide-react';
import { MembersService } from '@/services/membersService';
import { ZukvoLoadingOverlay } from "@/components/common/ZukvoLoader";

export default function ReferralsTab({ openingId }: { openingId: string }) {
  const [referrals, setReferrals] = useState<OpeningReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [membersMap, setMembersMap] = useState<Record<string, any>>({});

  const [selectedReferral, setSelectedReferral] = useState<OpeningReferral | null>(null);
  const [viewResumeUrl, setViewResumeUrl] = useState<string | null>(null);

  const getFullUrl = (url: string) => {
    if (url.startsWith('/')) {
      return `${process.env.NEXT_PUBLIC_API_URL || ''}${url}`;
    }
    return url;
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await OpeningV2Service.listReferrals(openingId);
      setReferrals(data);
    } catch (err: any) {
      console.error(err);
      message.error('Failed to load referrals');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await MembersService.getMembers({ limit: 500 } as any);
      const list = Array.isArray(res) ? res : (res as any)?.data ?? [];
      const map: Record<string, any> = {};
      list.forEach((m: any) => {
        map[m.id] = m;
      });
      setMembersMap(map);
    } catch (err) {
      console.error('Failed to load members', err);
    }
  };

  useEffect(() => {
    load();
    fetchMembers();
  }, [openingId]);

  const handleConvert = async (ref: OpeningReferral, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    setConvertingId(ref.id);
    try {
      const { PipelineService } = await import('@/services/pipelineService');
      const opening = await OpeningV2Service.get(openingId);

      const candidateRes = await PipelineService.createCandidate({
        role: opening.jobTitle || 'Candidate',
        name: ref.name,
        email: ref.email,
        mobile: ref.mobile,
        resume_url: ref.resumeUrl,
        total_experience: ref.totalExperience || 0,
        skills: ref.skills || [],
      });

      const candidateId = candidateRes.data?.id;
      if (!candidateId) throw new Error('Failed to create candidate in pipeline');

      await OpeningV2Service.addApplication(openingId, {
        pipelineCandidateId: candidateId,
        source: 'employee_referral',
        referredBy: ref.referredBy,
        notes: ref.notes,
        resumeUrl: ref.resumeUrl,
      });

      await OpeningV2Service.considerAsCandidate(openingId, ref.id);

      message.success('Converted referral to candidate successfully!');
      if (selectedReferral?.id === ref.id) {
        setSelectedReferral({ ...ref, status: 'converted' });
      }
      load();
    } catch (err: any) {
      console.error(err);
      message.error(err.message || 'Failed to convert referral');
    } finally {
      setConvertingId(null);
    }
  };

  const handleDelete = async (ref: OpeningReferral, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    setDeletingId(ref.id);
    try {
      await OpeningV2Service.deleteReferral(openingId, ref.id);
      message.success('Referral deleted successfully');
      if (selectedReferral?.id === ref.id) {
        setSelectedReferral(null);
      }
      load();
    } catch (err: any) {
      console.error(err);
      message.error(err.message || 'Failed to delete referral');
    } finally {
      setDeletingId(null);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Mobile',
      dataIndex: 'mobile',
      key: 'mobile',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'converted' ? 'success' : 'processing'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: OpeningReferral) => (
        <Space size={[8, 0]} wrap onClick={(e) => e.stopPropagation()}>
          <Button
            type="primary"
            size="small"
            disabled={record.status !== 'pending'}
            loading={convertingId === record.id}
            onClick={() => handleConvert(record)}
          >
            {record.status === 'converted' ? 'Converted' : 'Consider as Candidate'}
          </Button>
          <ConfirmDialog
            tone="danger"
            icon={<Trash2 size={18} />}
            title="Delete this referral?"
            description="This action cannot be undone."
            confirmText="Yes, delete"
            onConfirm={() => handleDelete(record)}
          >
            <Button
              danger
              type="text"
              size="small"
              icon={<Trash2 size={16} />}
              loading={deletingId === record.id}
            />
          </ConfirmDialog>
        </Space>
      ),
    },
  ];

  const renderFieldValue = (label: string, value: React.ReactNode) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-slate-400)', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-slate-700)' }}>
        {value || <span style={{ color: 'var(--text-slate-300)' }}>—</span>}
      </div>
    </div>
  );

  return (
    <div className="omp-tab-body">
      <style jsx global>{formStyles}</style>
      <div className="omp-tab-header">
        <div style={{ fontSize: 13, color: 'var(--text-slate-500)', lineHeight: 1.4, paddingBottom: 16 }}>
          Employees have referred the following individuals for this opening. Review them and click "Consider as Candidate" to add them to the interview pipeline.
        </div>
      </div>
      <div className="omp-table-wrap">
        <ZukvoLoadingOverlay loading={loading} message="">
          <Table
            rowKey="id"
            size="small"
            dataSource={referrals}
            columns={columns}
            pagination={false}
            scroll={{ x: 800 }}
            onRow={(record) => ({
              onClick: () => setSelectedReferral(record),
              style: { cursor: 'pointer' },
            })} locale={{ emptyText: <NoData /> }}
          />
        </ZukvoLoadingOverlay>
      </div>

      <Drawer
        {...commonDrawerProps}
        className="customer-drawer-root"
        open={!!selectedReferral}
        onClose={() => setSelectedReferral(null)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Referral Details</span>
            {selectedReferral && (
              <Tag color={selectedReferral.status === 'converted' ? 'success' : 'processing'} style={{ margin: 0 }}>
                {selectedReferral.status.toUpperCase()}
              </Tag>
            )}
          </div>
        }
        width={640}
        extra={
          selectedReferral && selectedReferral.status === 'pending' && (
            <Space size={8}>
              <ConfirmDialog
                tone="danger"
                icon={<Trash2 size={18} />}
                title="Delete this referral?"
                description="This action cannot be undone."
                confirmText="Yes, delete"
                onConfirm={() => handleDelete(selectedReferral)}
              >
                <Button
                  danger
                  type="text"
                  icon={<Trash2 size={16} />}
                  loading={deletingId === selectedReferral.id}
                />
              </ConfirmDialog>
              <Button
                type="primary"
                loading={convertingId === selectedReferral.id}
                onClick={() => handleConvert(selectedReferral)}
              >
                Consider as Candidate
              </Button>
            </Space>
          )
        }
      >
        {selectedReferral && (
          <div style={{ padding: 24 }}>
            <SectionCard icon={<User size={16} />} title="Candidate Details">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {renderFieldValue('Name', selectedReferral.name)}
                {renderFieldValue('Email', selectedReferral.email)}
                {renderFieldValue('Mobile', selectedReferral.mobile)}
                {renderFieldValue('Status', selectedReferral.status)}
              </div>
            </SectionCard>

            <SectionCard icon={<Briefcase size={16} />} title="Experience & Skills">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {renderFieldValue('Experience', selectedReferral.totalExperience != null ? `${selectedReferral.totalExperience} yrs` : null)}
                {renderFieldValue(
                  'Skills',
                  selectedReferral.skills?.length ? (
                    <Space size={[0, 4]} wrap>
                      {selectedReferral.skills.map(skill => <Tag key={skill}>{skill}</Tag>)}
                    </Space>
                  ) : null
                )}
              </div>
            </SectionCard>

            <SectionCard icon={<FileText size={16} />} title="Referral Info">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {renderFieldValue('Referred By', membersMap[selectedReferral.referredBy]?.name || 'Unknown Employee')}
                {renderFieldValue(
                  'Resume',
                  selectedReferral.resumeUrl ? (
                    <Button
                      type="link"
                      style={{ padding: 0, height: 'auto', lineHeight: 1 }}
                      onClick={() => setViewResumeUrl(selectedReferral.resumeUrl!)}
                    >
                      View Resume
                    </Button>
                  ) : null
                )}
                {selectedReferral.notes && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    {renderFieldValue('Notes', selectedReferral.notes)}
                  </div>
                )}
              </div>
            </SectionCard>
          </div>
        )}
      </Drawer>

      <Drawer
        open={!!viewResumeUrl}
        onClose={() => setViewResumeUrl(null)}
        title="View Resume"
        placement="left"
        width={800}
      >
        {viewResumeUrl && (
          <iframe
            src={getFullUrl(viewResumeUrl)}
            width="100%"
            height="100%"
            style={{ border: 'none' }}
          />
        )}
      </Drawer>
    </div>
  );
}
