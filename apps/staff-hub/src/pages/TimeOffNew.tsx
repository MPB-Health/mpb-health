import { useSearchParams } from 'react-router-dom';
import { TimeOffRequestForm } from '../components/hr/TimeOffRequestForm';
import { HrPageHeader } from '../components/hr/HrChrome';

export default function TimeOffNew() {
  const [params] = useSearchParams();
  const initialDate = params.get('date') ?? undefined;

  return (
    <div className="hr-surface mx-auto max-w-3xl animate-fade-up">
      <HrPageHeader
        title="New request"
        subtitle="Choose a leave type, set dates and times, and optionally attach a doctor's note or supporting file."
      />
      <TimeOffRequestForm initialDate={initialDate} />
    </div>
  );
}
