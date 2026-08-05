'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { FileCheck, Upload, AlertCircle, CheckCircle, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from 'antd';

export default function CandidatePortalPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const res = await fetch(`${baseUrl}/api/pipeline/portal/${token}/documents`);
      let json;
      try {
        json = await res.json();
      } catch (e) {
        throw new Error(`Failed to load portal (Status: ${res.status})`);
      }
      if (!res.ok) throw new Error(json.error || `Failed to load portal (Status: ${res.status})`);
      if (!json.success) throw new Error(json.error || 'Failed to load portal');
      setData(json.data);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired link');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchData();
  }, [token]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setSelectedFiles(prev => ({ ...prev, [docId]: file }));
  };

  const removeFile = (docId: string) => {
    setSelectedFiles(prev => {
      const copy = { ...prev };
      delete copy[docId];
      return copy;
    });
  };

  const handleSubmitAll = async () => {
    const docIds = Object.keys(selectedFiles);
    if (docIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      
      for (const docId of docIds) {
        const file = selectedFiles[docId];
        const formData = new FormData();
        formData.append('document', file);

        const res = await fetch(`${baseUrl}/api/pipeline/portal/${token}/documents/${docId}/upload`, {
          method: 'POST',
          body: formData,
        });
        
        if (!res.ok) {
          let errorMsg = 'Upload failed';
          try {
            const json = await res.json();
            if (json.code === 'DUPLICATE_AADHAAR') {
              errorMsg = 'We have detected a recent application associated with this document. As per our policy, you may only re-apply after 6 months. If you believe this is an error, please contact the recruitment team.';
            } else if (json.error) {
              errorMsg = json.error;
            }
          } catch(e) {}
          throw new Error(errorMsg);
        }
      }
      
      await fetchData();
      setIsSubmitted(true);
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full overflow-y-auto bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-medium">Loading your portal...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="h-screen w-full overflow-y-auto bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="h-screen w-full overflow-y-auto bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-2xl shadow-sm text-center max-w-md w-full border border-slate-200">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-3">Successfully Submitted</h1>
          <p className="text-slate-500 leading-relaxed">
            Your documents have been submitted and are now under review by our team. You may close this window.
          </p>
        </div>
      </div>
    );
  }

  const { candidate, documents } = data;
  const hasPendingDocs = documents.some((d: any) => ['Pending', 'Resubmission Required'].includes(d.status));
  const hasSelectedDocs = Object.keys(selectedFiles).length > 0;

  return (
    <div className="h-screen w-full overflow-y-auto bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-20 -mt-20 pointer-events-none"></div>
            <h1 className="text-3xl font-bold mb-2 relative z-10">Welcome, {candidate.name}</h1>
            <p className="text-blue-100 font-medium relative z-10">Document Portal for {candidate.role}</p>
          </div>
          
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800">Required Documents</h2>
              <p className="text-sm text-slate-500 mt-1">
                Please upload the requested documents below to proceed with your offer. Only PDF or Image files under 5MB are allowed.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {documents.map((doc: any) => (
                <div key={doc.id} className="border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-white shadow-sm hover:border-blue-300 transition-colors">
                  <div>
                    <h3 className="font-bold text-slate-800">{doc.document_type}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                        doc.status === 'Verified' ? 'bg-green-100 text-green-700 border-green-200' :
                        doc.status === 'Under Review' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        doc.status === 'Resubmission Required' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-amber-100 text-amber-700 border-amber-200'
                      }`}>
                        {doc.status === 'Verified' && <CheckCircle size={12} />}
                        {doc.status === 'Under Review' && <Clock size={12} />}
                        {doc.status === 'Resubmission Required' && <AlertCircle size={12} />}
                        {doc.status === 'Pending' && <AlertCircle size={12} />}
                        {doc.status}
                      </span>
                    </div>
                    {doc.remarks && (
                      <div className="text-xs text-red-600 font-medium mt-2 bg-red-50 p-2 rounded-md border border-red-100">
                        <strong>HR Note:</strong> {doc.remarks}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {doc.document_url && (
                      <a 
                        href={doc.document_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <FileCheck size={16} /> View Uploaded
                      </a>
                    )}
                    
                    
                    {['Pending', 'Resubmission Required'].includes(doc.status) && (
                      <div className="relative flex items-center gap-2">
                        {selectedFiles[doc.id] ? (
                          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg">
                            <span className="text-sm font-medium text-blue-700 truncate max-w-[150px]">
                              {selectedFiles[doc.id].name}
                            </span>
                            <button
                              onClick={() => removeFile(doc.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                              title="Delete and reupload"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              id={`upload-${doc.id}`}
                              className="hidden"
                              disabled={isSubmitting}
                              onClick={(e) => { (e.target as HTMLInputElement).value = ''; }}
                              onChange={(e) => handleFileSelect(e, doc.id)}
                            />
                            <label 
                              htmlFor={`upload-${doc.id}`}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer transition-all ${
                                isSubmitting 
                                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                              }`}
                            >
                              <Upload size={16} />
                              Select File
                            </label>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {documents.length === 0 && (
                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-500">
                  No documents have been requested yet.
                </div>
              )}
            </div>

            {hasPendingDocs && (
              <div className="mt-8 flex justify-end border-t border-slate-200 pt-6">
                <button
                  onClick={handleSubmitAll}
                  disabled={!hasSelectedDocs || isSubmitting}
                  className={`px-8 py-3 rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2 ${
                    hasSelectedDocs && !isSubmitting
                      ? 'bg-blue-600 hover:bg-blue-700 text-white hover:-translate-y-0.5'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Submit Documents
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <Modal
        open={!!uploadError}
        onCancel={() => setUploadError(null)}
        footer={null}
        closable={false}
        width={400}
        bodyStyle={{ padding: 0 }}
        className="overflow-hidden rounded-2xl"
      >
        <div className="bg-red-50 p-6 flex flex-col items-center justify-center text-center border-b border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-red-700">Upload Blocked</h3>
        </div>
        <div className="p-6 bg-white">
          <p className="text-slate-600 text-sm text-center leading-relaxed">
            {uploadError}
          </p>
          <div className="mt-8">
            <button 
              onClick={() => {
                setUploadError(null);
                setError('Your portal session has been closed due to a duplicate application detection. Please contact HR for further assistance.');
              }} 
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl text-sm font-bold shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-red-500/20"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
