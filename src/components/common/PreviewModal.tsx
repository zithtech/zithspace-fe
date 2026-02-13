"use client";
import { Modal, Button } from "antd";
import { EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";

interface PreviewModalProps {
  open: boolean;
  onCancel: () => void;
  previewUrl: string;
  previewFileName: string;
}

export default function PreviewModal({ 
  open, 
  onCancel, 
  previewUrl, 
  previewFileName 
}: PreviewModalProps) {
  
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);

  const getFileExtension = (filename: string) => {
    return filename?.split('.').pop()?.toLowerCase() || '';
  };

  const ext = getFileExtension(previewFileName);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext);
  const isPdf = ext === 'pdf';
  const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext);
  const isVideo = ['mp4', 'avi', 'mov', 'wmv', 'webm', 'mkv'].includes(ext);
  const isAudio = ['mp3', 'wav', 'flac', 'ogg', 'm4a'].includes(ext);
  const isText = ['txt', 'md', 'json', 'xml', 'csv', 'log', 'yml', 'yaml'].includes(ext);
  const isCsv = ext === 'csv';

  // Fetch text content for text files
  useEffect(() => {
    if (open && (isText || isCsv) && previewUrl) {
      setLoading(true);
      fetch(previewUrl)
        .then(res => res.text())
        .then(text => {
          setTextContent(text);
          setLoading(false);
        })
        .catch(() => {
          setTextContent('Failed to load file content');
          setLoading(false);
        });
    }
  }, [open, previewUrl, isText, isCsv]);

  // Render CSV as table
  const renderCSV = () => {
    const rows = textContent.split('\n').map(row => row.split(','));
    return (
      <div className="w-full h-full overflow-auto bg-white p-4">
        <table className="min-w-full border-collapse">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i === 0 ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}>
                {row.map((cell, j) => (
                  <td key={j} className="border px-3 py-1.5 text-xs">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      title={
        <div className="flex items-center gap-2">
          <EyeOutlined className="text-blue-600" />
          <span className="font-semibold">{previewFileName || 'File Preview'}</span>
          <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
            {ext.toUpperCase()}
          </span>
        </div>
      }
      footer={
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {isImage && '📷 Image File'}
            {isPdf && '📄 PDF Document'}
            {isOffice && '📊 Office Document'}
            {isVideo && '🎥 Video File'}
            {isAudio && '🎵 Audio File'}
            {isCsv && '📊 CSV File'}
            {isText && !isCsv && '📝 Text File'}
            {!isImage && !isPdf && !isOffice && !isVideo && !isAudio && !isText && !isCsv && '📎 File'}
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                const link = document.createElement('a');
                link.href = previewUrl;
                link.download = previewFileName;
                link.click();
              }}
              icon={<DownloadOutlined />}
            >
              Download
            </Button>
            <Button onClick={onCancel}>
              Close
            </Button>
          </div>
        </div>
      }
      width={1000}
      centered
      styles={{ body: { padding: 0, height: '80vh' } }}
    >
      <div className="relative w-full h-full bg-gray-50 rounded border border-gray-200 overflow-hidden">
        {/* 📷 Image Preview */}
        {isImage && (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 overflow-auto p-4">
            <img 
              src={previewUrl} 
              alt={previewFileName} 
              className="max-w-full max-h-full object-contain shadow-lg"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+PHBhdGggZD0iTTIwIDE2QzE4LjQwODcgMTYgMTcgMTcuNDA4NyAxNyAxOUMxNyAyMC41OTEzIDE4LjQwODcgMjIgMjAgMjJDMjEuNTkxMyAyMiAyMyAyMC41OTEzIDIzIDE5QzIzIDE3LjQwODcgMjEuNTkxMyAxNiAyMCAxNloiIGZpbGw9IiM5Q0EzQUYiLz48cGF0aCBkPSJNMjAgMjRDMTguNDA4NyAyNCAxNyAyNS40MDg3IDE3IDI3QzE3IDI4LjU5MTMgMTguNDA4NyAzMCAyMCAzMEMyMS41OTEzIDMwIDIzIDI4LjU5MTMgMjMgMjdDMjMgMjUuNDA4NyAyMS41OTEzIDI0IDIwIDI0WiIgZmlsbD0iIzlDQTNBRiIvPjwvc3ZnPg==';
              }}
            />
          </div>
        )}

        {/* 📄 PDF & 📊 Office Docs - Google Docs Viewer (NO PACKAGE NEEDED!) */}
        {(isPdf || isOffice) && (
          <iframe 
            src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewUrl)}&embedded=true`}
            className="w-full h-full border-0" 
            title={previewFileName}
            style={{ background: '#fafafa' }}
          />
        )}

        {/* 🎥 Video Preview */}
        {isVideo && (
          <div className="w-full h-full flex items-center justify-center bg-black">
            <video 
              controls 
              className="max-w-full max-h-full"
              controlsList="nodownload"
            >
              <source src={previewUrl} type={`video/${ext}`} />
              Your browser does not support video playback.
            </video>
          </div>
        )}

        {/* 🎵 Audio Preview */}
        {isAudio && (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="text-center p-8 bg-white rounded-xl shadow-lg">
              <div className="text-7xl mb-6 text-blue-500">🎵</div>
              <div className="text-lg font-semibold text-gray-800 mb-4">{previewFileName}</div>
              <audio 
                controls 
                className="w-96"
                controlsList="nodownload"
              >
                <source src={previewUrl} type={`audio/${ext}`} />
                Your browser does not support audio playback.
              </audio>
            </div>
          </div>
        )}

        {/* 📊 CSV Preview */}
        {isCsv && (
          loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-500">Loading CSV...</div>
            </div>
          ) : (
            renderCSV()
          )
        )}

        {/* 📝 Text Preview */}
        {isText && !isCsv && (
          loading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-gray-500">Loading text...</div>
            </div>
          ) : (
            <pre className="w-full h-full overflow-auto bg-white p-4 font-mono text-xs whitespace-pre-wrap">
              {textContent}
            </pre>
          )
        )}

        {/* ❓ Unknown File Type */}
        {!isImage && !isPdf && !isOffice && !isVideo && !isAudio && !isText && !isCsv && (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50">
            <div className="text-7xl mb-4 text-gray-400">📄</div>
            <div className="text-gray-700 mb-2 text-lg font-medium">Preview Not Available</div>
            <p className="text-gray-500 mb-6 text-sm max-w-md text-center">
              This file type ({ext}) cannot be previewed directly.
              <br />Please download the file to view it.
            </p>
            <Button 
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => {
                const link = document.createElement('a');
                link.href = previewUrl;
                link.download = previewFileName;
                link.click();
              }}
              size="large"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Download File
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}