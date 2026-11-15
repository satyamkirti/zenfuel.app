'use client';

import { useApp } from '@/context/AppContext';
import { FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ReportView } from '@/components/reports/ReportView';
import { PageHeader } from '@/components/ui/PageHeader';
import { useT } from '@/i18n/I18nProvider';

export default function ReportsPage() {
  const { entries, reductionEntries, habits, isPremium } = useApp();
  const t = useT();
  return (
    <AppLayout title={t('reports.title')}>
      <PageHeader icon={<FileText size={21} />} tone="cyan" title={t('reports.title')} description={t('reports.desc')} />
      <ReportView entries={entries} reductionEntries={reductionEntries} habits={habits} isPremium={isPremium} />
    </AppLayout>
  );
}
