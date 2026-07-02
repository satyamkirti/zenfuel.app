'use client';

import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ReportView } from '@/components/reports/ReportView';

export default function ReportsPage() {
  const { entries, habits, isPremium } = useApp();
  return (
    <AppLayout title="Reports">
      <ReportView entries={entries} habits={habits} isPremium={isPremium} />
    </AppLayout>
  );
}
