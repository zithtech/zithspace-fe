'use client';

import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Modal, Button, Slider, Space, Typography, Alert } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, RotateRightOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface LogoCropperProps {
  image: string;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedImageBase64: string) => void;
  loading?: boolean;
}

const LogoCropper: React.FC<LogoCropperProps> = ({
  image,
  open,
  onClose,
  onCropComplete,
  loading = false,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onRotationChange = (rotation: number) => {
    setRotation(rotation);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => {
        console.log('Image loaded successfully for cropping');
        resolve(image);
      });
      image.addEventListener('error', (error) => {
        console.error('Image load error for cropping:', error);
        reject(new Error('Failed to load image for cropping. Check CORS settings.'));
      });
      image.setAttribute('crossOrigin', 'anonymous');
      // Use backend proxy to bypass CORS issues for canvas operations
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const proxyUrl = `${apiUrl}/api/proxy-logo?url=${encodeURIComponent(url)}`;
      image.src = proxyUrl;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    rotation = 0
  ): Promise<string> => {
    try {
      console.log('Starting image cropping process...');
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      const rotRad = (rotation * Math.PI) / 180;
      const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
        image.width,
        image.height,
        rotation
      );

      canvas.width = bBoxWidth;
      canvas.height = bBoxHeight;

      ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
      ctx.rotate(rotRad);
      ctx.translate(-image.width / 2, -image.height / 2);

      ctx.drawImage(image, 0, 0);

      const data = ctx.getImageData(
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height
      );

      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;

      ctx.putImageData(data, 0, 0);

      console.log('Canvas operations complete, exporting to data URL...');
      return canvas.toDataURL('image/jpeg');
    } catch (err) {
      console.error('Error in getCroppedImg:', err);
      throw err;
    }
  };

  const rotateSize = (width: number, height: number, rotation: number) => {
    const rotRad = (rotation * Math.PI) / 180;

    return {
      width:
        Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
      height:
        Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
    };
  };

  const handleSave = async () => {
    try {
      setError(null);
      if (croppedAreaPixels) {
        console.log('Saving crop with pixels:', croppedAreaPixels);
        const croppedImage = await getCroppedImg(image, croppedAreaPixels, rotation);
        console.log('Crop successful, calling onCropComplete...');
        onCropComplete(croppedImage);
      } else {
        console.warn('No croppedAreaPixels defined');
      }
    } catch (e: any) {
      console.error('handleSave failed:', e);
      setError(e.message || 'Failed to crop image. This usually happens due to CORS policy on the image storage.');
    }
  };

  return (
    <Modal
      title="Edit Logo"
      open={open}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="save" type="primary" onClick={handleSave} loading={loading}>
          Save Crop
        </Button>,
      ]}
      styles={{
        body: {
          padding: '20px 0',
        }
      }}
    >
      {error && (
        <Alert
          message="Crop Error"
          description={error}
          type="error"
          showIcon
          style={{ margin: '0 24px 16px' }}
          closable
          onClose={() => setError(null)}
        />
      )}
      <div style={{ position: 'relative', width: '100%', height: 400, background: '#333', borderRadius: 8, overflow: 'hidden' }}>
        {/* <Cropper
          image={image}
          crop={crop}
          rotation={rotation}
          zoom={zoom}
          aspect={4 / 1} // Common logo aspect ratio, can be adjusted or made dynamic
          onCropChange={onCropChange}
          onRotationChange={onRotationChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
        /> */}
        <Cropper
          image={image}
          crop={crop}
          zoom={zoom}
          rotation={rotation}
          aspect={1}              // ✅ square
          cropShape="round"       // ✅ circle UI
          showGrid={false}        // ✅ clean like WhatsApp
          objectFit="cover"       // ✅ proper fill
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteInternal}
          onZoomChange={onZoomChange}
        />
      </div>

      <div style={{ padding: '20px 24px 0' }}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ZoomOutOutlined style={{ color: '#888' }} />
            <Slider
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={setZoom}
              style={{ flex: 1 }}
            />
            <ZoomInOutlined style={{ color: '#888' }} />
            <Text type="secondary" style={{ minWidth: 40 }}>{zoom.toFixed(1)}x</Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <RotateRightOutlined style={{ color: '#888' }} />
            <Slider
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={setRotation}
              style={{ flex: 1 }}
            />
            <Text type="secondary" style={{ minWidth: 40 }}>{rotation}°</Text>
          </div>
        </Space>
      </div>
    </Modal>
  );
};

export default LogoCropper;
