'use client';

import { useApp } from '@/context/AppContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { ReportView } from '@/components/reports/ReportView';
import { PageHeader } from '@/components/ui/PageHeader';

export default function ReportsPage() {
  const { entries, habits, isPremium } = useApp();
  return (
    <AppLayout title="Reports">
      <PageHeader title="Reports" description="Monthly, quarterly and annual summaries you can export or print." />
      <ReportView entries={entries} habits={habits} isPremium={isPremium} />
    </AppLayout>
  );
}
