import { PageHeader } from '@/components/layout/PageHeader';
import { useContributorSummaries, useSettings } from '@/hooks/useData';
import { ContributorSummaryList } from '@/components/collections/ContributorSummaryList';

export default function ContributorsSummary() {
  const summaries = useContributorSummaries();
  const settings = useSettings();
  const currency = settings?.currency ?? 'INR';

  return (
    <div className="pb-10">
      <PageHeader eyebrow="Read Only" title="Contributors" />
      <div className="mx-auto max-w-2xl px-5 py-5">
        <ContributorSummaryList summaries={summaries} currency={currency} />
      </div>
    </div>
  );
}
