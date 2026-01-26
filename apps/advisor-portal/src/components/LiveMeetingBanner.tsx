import { useNavigate } from 'react-router-dom';
import { Radio, ArrowRight } from 'lucide-react';
import type { AdvisorMeeting } from '@mpbhealth/advisor-core';

interface LiveMeetingBannerProps {
  meetings: AdvisorMeeting[];
}

export default function LiveMeetingBanner({ meetings }: LiveMeetingBannerProps) {
  const navigate = useNavigate();
  const meeting = meetings[0]; // Show first live meeting

  if (!meeting) return null;

  return (
    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Radio className="w-5 h-5 animate-pulse" />
              <span className="font-semibold">LIVE NOW</span>
            </div>
            <span className="text-white/90">{meeting.title}</span>
            {meetings.length > 1 && (
              <span className="text-white/75 text-sm">
                +{meetings.length - 1} more
              </span>
            )}
          </div>
          <button
            onClick={() => navigate(`/meetings/${meeting.id}`)}
            className="flex items-center space-x-2 px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
          >
            <span>Join Meeting</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
