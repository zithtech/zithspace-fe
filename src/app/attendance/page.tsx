'use client';

import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ComingSoon from '@/components/common/ComingSoon';
import { ClockCircleOutlined } from '@ant-design/icons';

export default function AttendancePage() {
  return (
    <MainLayout>
      <ComingSoon
        title="Attendance"
        description="Track team attendance, manage time logs, monitor work hours, and generate attendance reports."
        icon={<ClockCircleOutlined />}
      />
    </MainLayout>
  );
}
