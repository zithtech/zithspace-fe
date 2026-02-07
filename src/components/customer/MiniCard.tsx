import { useState } from "react";
import { RightOutlined, DownOutlined } from "@ant-design/icons";

interface MiniCardProps {
  title: string;
  children: React.ReactNode;
}

export default function MiniCard({ title, children }: MiniCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border rounded-lg bg-white shadow-sm">
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        <span className="text-xs font-semibold text-gray-700 uppercase">
          {title}
        </span>

        {open ? (
          <DownOutlined className="text-gray-500 text-xs" />
        ) : (
          <RightOutlined className="text-gray-500 text-xs" />
        )}
      </div>
      {/* <div
  className="flex items-center justify-between px-3 py-2 cursor-pointer border-b bg-gray-50"
  onClick={() => setOpen(!open)}
>
  <span className="text-xs font-semibold tracking-wide text-gray-700">
    {title}
  </span>

  {open ? (
    <DownOutlined className="text-gray-500 text-xs" />
  ) : (
    <RightOutlined className="text-gray-500 text-xs" />
  )}
</div> */}





      {/* Body */}
      {open && (
  <div className="px-3 pb-3 pt-3 text-xs text-gray-600 overflow-hidden">
    {children}
  </div>
)}
    </div>
  );
}
