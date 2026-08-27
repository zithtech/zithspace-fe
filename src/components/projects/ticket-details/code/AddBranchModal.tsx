"use client";
import React, { useState } from "react";
import { Modal, Form, Input, Select, Button, message, Divider, Typography, Space } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { useRepositories, useAddBranch, useCreateRepository } from "@/hooks/useCodeIntegration";

const { Text } = Typography;

interface AddBranchModalProps {
    open: boolean;
    onClose: () => void;
    ticketId: string;
}

export default function AddBranchModal({ open, onClose, ticketId }: AddBranchModalProps) {
    const [form] = Form.useForm();
    const { data: repositories, isLoading: isLoadingRepos } = useRepositories();
    const { mutate: addBranch, isPending: isAddingBranch } = useAddBranch(ticketId);
    const { mutate: createRepository, isPending: isCreatingRepo } = useCreateRepository();

    const [isCreatingNewRepo, setIsCreatingNewRepo] = useState(false);
    const [newRepoForm] = Form.useForm();

    const handleCreateRepo = async () => {
        try {
            console.log("Validating new repository form...");
            const values = await newRepoForm.validateFields();
            console.log("Validation passed, creating repo:", values);

            createRepository(values, {
                onSuccess: (newRepo) => {
                    console.log("Repository created successfully:", newRepo);
                    message.success("Repository created");
                    setIsCreatingNewRepo(false);
                    newRepoForm.resetFields();
                    form.setFieldsValue({ repositoryId: newRepo.id });
                },
                onError: (error) => {
                    console.error("Failed to create repository:", error);
                    message.error("Failed to create repository: " + (error as any)?.response?.data?.error || "Unknown error");
                }
            });
        } catch (error) {
            console.error("Validation failed or other error:", error);
            if ((error as any).errorFields) {
                message.error("Please fill in all required fields");
            }
        }
    };

    const handleFinish = (values: any) => {
        addBranch(values, {
            onSuccess: () => {
                message.success("Branch linked successfully");
                form.resetFields();
                onClose();
            },
            onError: () => message.error("Failed to link branch")
        });
    };

    return (
        <Modal
            title="Link Branch"
            open={open}
            onCancel={() => {
                onClose();
                setIsCreatingNewRepo(false);
                form.resetFields();
            }}
            footer={null}
            destroyOnClose
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
                                    <Divider style={{ margin: '8px 0' }} />
                                    <Button type="text" block icon={<PlusOutlined />} onClick={() => setIsCreatingNewRepo(true)}>
                                        Create new repository
                                    </Button>
                                </>
                            )}
                            options={repositories?.map(repo => ({ label: repo.name, value: repo.id }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Branch Name"
                        name="name"
                        rules={[{ required: true, message: "Please enter branch name" }]}
                    >
                        <Input placeholder="e.g. feat/ticket-123-login" />
                    </Form.Item>

                    <Form.Item
                        label="Branch URL (Optional)"
                        name="url"
                    >
                        <Input placeholder="https://github.com/org/repo/tree/..." />
                    </Form.Item>

                    <div style={{ textAlign: "right" }}>
                        <Space>
                            <Button onClick={onClose}>Cancel</Button>
                            <Button type="primary" htmlType="submit" loading={isAddingBranch}>
                                Link Branch
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
                    <Text strong>Create New Repository</Text>

                    <Form form={newRepoForm} layout="vertical" style={{ marginTop: 16 }}>
                        <Form.Item label="Repository Name" name="name" rules={[{ required: true }]}>
                            <Input placeholder="e.g. frontend-monorepo" />
                        </Form.Item>
                        <Form.Item label="Repository URL" name="url" rules={[{ required: true }]}>
                            <Input placeholder="https://github.com/org/repo" />
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
