import { MapPin, Wifi } from 'lucide-react';
import type { StaffOfficeLocation, StaffRemoteStatus } from '../../lib/hr';

export function GeoGateBanner({
  remoteEligible,
  remoteStatus,
  office,
}: {
  remoteEligible: boolean;
  remoteStatus: StaffRemoteStatus;
  office: StaffOfficeLocation | null;
}) {
  if (remoteEligible) {
    return (
      <div className="flex gap-3 rounded-2xl bg-emerald-50/90 px-4 py-3 ring-1 ring-emerald-200/80">
        <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
        <div>
          <p className="text-sm font-medium text-emerald-900">Remote punch enabled</p>
          <p className="mt-0.5 text-xs leading-relaxed text-emerald-800/80">
            HR has approved remote work
            {remoteStatus === 'approved' ? ' (standing)' : ' for today'}. You can clock in
            without being at the office.
          </p>
        </div>
      </div>
    );
  }

  const address = office
    ? [office.address_line, office.city, office.state, office.postal_code]
        .filter(Boolean)
        .join(', ')
    : 'the MPB Health office';

  return (
    <div className="flex gap-3 rounded-2xl bg-sky-50/90 px-4 py-3 ring-1 ring-sky-200/80">
      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-700" />
      <div>
        <p className="text-sm font-medium text-sky-900">Office location required</p>
        <p className="mt-0.5 text-xs leading-relaxed text-sky-800/80">
          {remoteStatus === 'pending'
            ? 'Your remote request is pending HR approval. Until then, '
            : ''}
          Clock in and out only while within about {office?.radius_m ?? 150}m of {address}.
        </p>
      </div>
    </div>
  );
}
