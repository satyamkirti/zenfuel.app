'use client';

import { Clock3 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { ScreenTimeView } from '@/components/screen-time/ScreenTimeView';
import { useScreenTime } from '@/hooks/useScreenTime';
import { useT } from '@/i18n/I18nProvider';

export default function ScreenTimePage() {
  const st = useScreenTime();
  const t = useT();
  return (
    <AppLayout title={t('st.title')}>
      <PageHeader
        icon={<Clock3 size={21} />}
        tone="blue"
        title={t('st.title')}
        description={st.phase === 'unsupported' ? t('st.descWeb') : t('st.desc')}
      />
      <ScreenTimeView st={st} />
    </AppLayout>
  );
}
