
"use client";

import React from "react";
import { Modal, Form, Input, Select, Button, message, InputNumber, Space, Row, Col } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useRepositories, useAddPullRequest, useCreateRepository } from "@/hooks/useCodeIntegration";

interface AddPRModalProps {
    open: boolean;
    onClose: () => void;
    ticketId: string;
}

export default function AddPRModal({ open, onClose, ticketId }: AddPRModalProps) {
    const [form] = Form.useForm();
    const { data: repositories, isLoading: isLoadingRepos } = useRepositories();
    const { mutate: addPR, isPending: isAddingPR } = useAddPullRequest(ticketId);
    const { mutate: createRepository, isPending: isCreatingRepo } = useCreateRepository();

    const [isCreatingNewRepo, setIsCreatingNewRepo] = React.useState(false);
    const [newRepoForm] = Form.useForm();

    const handleCreateRepo = async () => {
        try {
            const values = await newRepoForm.validateFields();
            createRepository(values, {
                onSuccess: (newRepo) => {
                    message.success("Repository created");
                    setIsCreatingNewRepo(false);
                    newRepoForm.resetFields();
                    form.setFieldsValue({ repositoryId: newRepo.id });
                },
                onError: (error) => {
                    console.error("Failed to create repository:", error);
                    message.error("Failed to create repository");
                }
            });
        } catch (error) {
            console.error("Validation failed:", error);
        }
    };

    const handleFinish = (values: any) => {
        addPR(values, {
            onSuccess: () => {
                message.success("PR linked successfully");
                form.resetFields();
                onClose();
            },
            onError: () => message.error("Failed to link PR")
        });
    };

    return (
        <Modal
            title="Link Pull Request"
            open={open}
            onCancel={() => {
                onClose();
                setIsCreatingNewRepo(false);
                form.resetFields();
            }}
            footer={null}
            destroyOnClose
            width={600}
        >
            {!isCreatingNewRepo ? (
                <Form form={form} layout="vertical" onFinish={handleFinish}>
                    <Form.Item
                        label="Repository"
                        name="repositoryId"
                        rules={[{ required: true, message: "Please select a repository" }]}
                    >
                        <Select
                            placeholder="Select repository"
                            loading={isLoadingRepos}
                            dropdownRender={(menu) => (
                                <>
                                    {menu}
                                    <div style={{ padding: '8px', borderTop: '1px solid #f0f0f0' }}>
                                        <Button type="text" block icon={<PlusOutlined />} onClick={() => setIsCreatingNewRepo(true)}>
                                            Create new repository
                                        </Button>
                                    </div>
                                </>
                            )}
                            options={repositories?.map(repo => ({ label: repo.name, value: repo.id }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="PR URL"
                        name="url"
                        rules={[{ required: true, message: "Please enter PR URL" }]}
                    >
                        <Input placeholder="https://github.com/org/repo/pull/123" />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                label="Branch Name (Optional)"
                                name="branchName"
                            >
                                <Input placeholder="feat/branch-name" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                label="Branch URL (Optional)"
                                name="branchUrl"
                            >
                                <Input placeholder="https://github.com/org/repo/tree/feat/..." />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        label="PR Title (Optional)"
                        name="title"
                    >
                        <Input placeholder="e.g. Fix: Login bug" />
                    </Form.Item>

                    <Space style={{ width: '100%' }} align="start">
                        <Form.Item
                            label="PR Number"
                            name="number"
                            style={{ width: 120 }}
                        >
                            <InputNumber placeholder="e.g. 123" style={{ width: '100%' }} />
                        </Form.Item>

                        <Form.Item
                            label="State"
                            name="state"
                            initialValue="open"
                            style={{ width: 120 }}
                        >
                            <Select
                                options={[
                                    { label: 'Open', value: 'open' },
                                    { label: 'Merged', value: 'merged' },
                                    { label: 'Closed', value: 'closed' },
                                ]}
                            />
                        </Form.Item>
                    </Space>

                    <div style={{ textAlign: "right" }}>
                        <Space>
                            <Button onClick={onClose}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={isAddingPR}>
                                Link PR
                            </Button>
                        </Space>
                    </div>
                </Form>
            ) : (
                <div>
                    <div style={{ marginBottom: 16 }}>
                        <Button type="text" size="small" onClick={() => setIsCreatingNewRepo(false)}>
                            &lt; Back to selection
                        </Button>
                    </div>
                    <div style={{ marginBottom: 16, fontWeight: 600 }}>Create New Repository</div>

                    <Form form={newRepoForm} layout="vertical">
                        <Form.Item label="Repository Name" name="name" rules={[{ required: true }]}>
                            <Input placeholder="e.g. frontend-monorepo" />
                        </Form.Item>
                        <Form.Item label="Repository URL" name="url" rules={[{ required: true }]}>
                            <Input placeholder="https://github.com/org/repo" />
                        </Form.Item>
                        <Form.Item label="Description" name="description">
                            <Input.TextArea placeholder="Optional description" rows={2} />
                        </Form.Item>
                        <div style={{ textAlign: "right" }}>
                            <Space>
                                <Button onClick={() => setIsCreatingNewRepo(false)}>Cancel</Button>
                                <Button type="primary" onClick={handleCreateRepo} loading={isCreatingRepo}>
                                    Create Repository
                                </Button>
                            </Space>
                        </div>
                    </Form>
                </div>
            )}
        </Modal>
    );
}
