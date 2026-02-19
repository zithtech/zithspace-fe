"use client";
import React, {
  forwardRef,
  useEffect,
  useState,
  useImperativeHandle,
} from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Upload,
  Card,
  Row,
  Col,
  Select,
  message,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import { model } from "mongoose";
import form from "antd/es/form";

const Assets = forwardRef(({ data }: any, ref: any) => {
  const [open, setOpen] = useState(false);
  const [assetsform] = Form.useForm();
  const [assets, setAssets] = useState<any[]>([]);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    if (data && Array.isArray(data)) {
      setAssets(data);
    }
  }, [data]);

  useImperativeHandle(ref, () => ({
    getData: () => assets,
  }));

  // useImperativeHandle(ref, () => ({
  //   async validateAndGetData() {
  //     return assets || [];
  //   },
  // }));

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB

  const handleBeforeUpload = (file: File) => {
    if (file.size > MAX_SIZE) {
      window.alert("File size must be less than 5MB");
      return Upload.LIST_IGNORE; // ❌ stop file from adding to list
    }

    return false; // prevent auto upload (because we convert to base64 manually)
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });
  };

  const handleAddOrUpdateAsset = async () => {
    const values = await assetsform.validateFields();

    const fileObj = values.image?.[0];

    let imageBase64 = "";
    let fileName = "";

    // 🔥 If new image selected
    if (fileObj?.originFileObj) {
      imageBase64 = await fileToBase64(fileObj.originFileObj);
      fileName = fileObj.originFileObj.name;
    }
    // 🔥 If editing existing asset (already saved URL)
    else if (fileObj?.url) {
      imageBase64 = fileObj.url; // already uploaded image URL
    }

    const assetData = {
      item: values.item,
      brand: values.brand,
      model: values.model,
      modelNumber: values.modelNumber,

      // 🔥 store base64 (or existing URL)
      image: imageBase64,
      imageName: fileName, // optional (useful for backend)
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
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setOpen(true)}
        style={{ marginBottom: 20 }}
      >
        {" "}
        Add New Asset{" "}
      </Button>
      <Row gutter={[16, 16]}>
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
              beforeUpload={handleBeforeUpload}
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
});
export default Assets;
