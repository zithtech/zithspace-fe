import { Form, Upload, Button } from "antd";
import { UploadOutlined } from "@ant-design/icons";

export default function Documents({ form }: any) {
  return (
    <Form form={form} layout="vertical">
      <Form.Item name="aadhaar" label="Aadhaar" rules={[{ required: true }]}>
        <Upload>
          <Button icon={<UploadOutlined />}>Abinash</Button>
        </Upload>
      </Form.Item>
    </Form>

  
  );
}
