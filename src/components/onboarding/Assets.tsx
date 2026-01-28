"use client";
import React, { useState } from "react";
import { Button, Modal, Form, Input, Upload, Card, Row, Col,Select } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { model } from "mongoose";

const Assets = () => {
  const [open, setOpen] = useState(false);
  const [assetsform] = Form.useForm();
  const [assets, setAssets] = useState<any[]>([]);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  // ADD / UPDATE ASSET
  const handleAddOrUpdateAsset = async () => {
    const values = await assetsform.validateFields();

    const fileObj = values.image?.[0];
    const imageUrl = fileObj?.originFileObj
      ? URL.createObjectURL(fileObj.originFileObj)
      : fileObj?.url || "";

    const assetData = {
      item: values.item,
      brand: values.brand,
      model: values.model,
      modelNumber: values.modelNumber,
      image: imageUrl,
    };

    if (editIndex !== null) {
      // UPDATE
      setAssets((prev) =>
        prev.map((a, i) => (i === editIndex ? assetData : a)),
      );
      setEditIndex(null);
    } else {
      // ADD
      setAssets((prev) => [...prev, assetData]);
    }

    assetsform.resetFields();
    setOpen(false);
  };

  // DELETE
  const handleDelete = (index: number) => {
    setAssets((prev) => prev.filter((_, i) => i !== index));
  };

  // EDIT
  const handleEdit = (asset: any, index: number) => {
    setEditIndex(index);
    setOpen(true);

    assetsform.setFieldsValue({
      item: asset.item,
      brand: asset.brand,
      model: asset.model,
      modelNumber: asset.modelNumber,
      image: asset.image
        ? [
            {
              uid: "-1",
              name: "asset.png",
              status: "done",
              url: asset.image,
            },
          ]
        : [],
    });
  };

  return (
    <div style={{ padding: 20 }}>
      {/* ADD BUTTON */}{" "}
      <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpen(true)} style={{ marginBottom: 20 }} > Add New Asset </Button>
      <Row gutter={[16, 16]}>
        {/* ADD NEW ASSET CARD */}
        {/* <Col span={6}>
          <Card
            hoverable
            onClick={() => {
              setEditIndex(null);
              assetsform.resetFields();
              setOpen(true);
            }}
            style={{
              height: 240,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px dashed #1677ff",
            }}
          >
            <div style={{ textAlign: "center", color: "#1677ff" }}>
              <PlusOutlined style={{ fontSize: 32 }} />
              <div style={{ marginTop: 8, fontWeight: 500 }}>Add New Asset</div>
            </div>
          </Card>
        </Col> */}

        {/* ASSET CARDS */}
        {assets.map((asset, index) => (
          <Col span={6} key={index}>
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {/* HOVER ICONS */}
              {hoverIndex === index && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    display: "flex",
                    gap: 8,
                    zIndex: 2,
                  }}
                >
                  <EditOutlined
                    onClick={() => handleEdit(asset, index)}
                    style={{
                      background: "#fff",
                      padding: 6,
                      borderRadius: "50%",
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                  />
                  <DeleteOutlined
                    onClick={() => handleDelete(index)}
                    style={{
                      background: "#fff",
                      padding: 6,
                      borderRadius: "50%",
                      cursor: "pointer",
                      color: "red",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              )}

              <Card
                hoverable
                cover={
                  asset.image && (
                    <img
                      src={asset.image}
                      alt="asset"
                      style={{ height: 160, objectFit: "cover" }}
                    />
                  )
                }
              >
                <p>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginRight: 6,
                    }}
                  >
                    Item :
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {asset.item}
                  </span>
                </p>
                <p>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginRight: 6,
                    }}
                  >
                    Model :
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {asset.model}
                  </span>
                </p>
                 <p>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginRight: 6,
                    }}
                  >
                    Modal Number :
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {asset.modelNumber}
                  </span>
                </p>
                <p>
                  <span
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      marginRight: 6,
                    }}
                  >
                    Brand :
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#111827",
                    }}
                  >
                    {asset.brand}
                  </span>
                </p>
              </Card>
            </div>
          </Col>
        ))}
      </Row>
      {/* MODAL */}
      <Modal
        title={editIndex !== null ? "Edit Asset" : "Add New Asset"}
        open={open}
        onCancel={() => {
          setOpen(false);
          setEditIndex(null);
        }}
        onOk={handleAddOrUpdateAsset}
        okText={editIndex !== null ? "Update Asset" : "Add Asset"}
      >
        <Form form={assetsform} layout="vertical">
        <Form.Item
  label="Item Name"
  name="item"
  rules={[{ required: true, message: "Please select an item" }]}
>
  <Select placeholder="Select item">
    <Select.Option value="Mobile">Mobile</Select.Option>
    <Select.Option value="Laptop">Laptop</Select.Option>
    <Select.Option value="Tab">Tab</Select.Option>
    <Select.Option value="Monitor">Monitor</Select.Option>
    <Select.Option value="Keyboard">Keyboard</Select.Option>
    <Select.Option value="Mouse">Mouse</Select.Option>
    <Select.Option value="Bag">Bag</Select.Option>
    <Select.Option value="Headphone">Head phone</Select.Option>
  </Select>
</Form.Item>


          <Form.Item
            label="Brand Name"
            name="brand"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Model Name"
            name="model"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

           <Form.Item
            label="Model Number"
            name="modelNumber"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Upload Image"
            name="image"
            valuePropName="fileList"
            getValueFromEvent={(e) => e?.fileList}
          >
            <Upload
              listType="picture-card"
              beforeUpload={() => false}
              maxCount={1}
            >
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Assets;
