import React from 'react';
import { Mail, Phone, MapPin, ExternalLink, Building2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import type { Advisor } from '../../lib/advisorDirectoryService';
import {
  formatPhoneNumber,
  getAdvisorDisplayName,
  getAdvisorFullAddress
} from '../../lib/advisorDirectoryService';

interface AdvisorCardProps {
  advisor: Advisor;
}

export const AdvisorCard: React.FC<AdvisorCardProps> = ({ advisor }) => {
  const displayName = getAdvisorDisplayName(advisor);
  const fullAddress = getAdvisorFullAddress(advisor);
  const primaryPhone = formatPhoneNumber(advisor.phone_1 || advisor.phone);
  const secondaryPhone = formatPhoneNumber(advisor.phone_2);

  // Get initials for avatar
  const initials = `${advisor.first_name?.[0] || ''}${advisor.last_name?.[0] || ''}`.toUpperCase() || 'A';

  return (
    <Card className="group relative overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-white">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white font-semibold text-sm">{initials}</span>
          </div>

          {/* Name & Type */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate leading-tight">
              {displayName}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              {advisor.agent_type && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-medium text-blue-600 border-blue-200 bg-blue-50">
                  {advisor.agent_type}
                </Badge>
              )}
              {advisor.state && (
                <span className="text-xs text-gray-500">{advisor.city ? `${advisor.city}, ` : ''}{advisor.state}</span>
              )}
            </div>
          </div>
        </div>

        {/* Company */}
        {advisor.company && (
          <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-600">
            <Building2 className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{advisor.company}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Contact Info */}
      <div className="p-4 pt-3 space-y-2">
        {/* Email */}
        {advisor.email && (
          <a
            href={`mailto:${advisor.email}`}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors group/link"
          >
            <Mail className="h-3.5 w-3.5 text-gray-400 group-hover/link:text-blue-500 flex-shrink-0" />
            <span className="truncate">{advisor.email}</span>
          </a>
        )}

        {/* Phone(s) */}
        {primaryPhone && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            <a
              href={`tel:${primaryPhone.replace(/\D/g, '')}`}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              {primaryPhone}
            </a>
            {secondaryPhone && (
              <>
                <span className="text-gray-300">•</span>
                <a
                  href={`tel:${secondaryPhone.replace(/\D/g, '')}`}
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                >
                  {secondaryPhone}
                </a>
              </>
            )}
          </div>
        )}

        {/* Address */}
        {fullAddress && (
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <span className="line-clamp-2">{fullAddress}</span>
          </div>
        )}

        {/* Licensed States */}
        {advisor.license_states && (
          <div className="flex items-start gap-2 text-sm">
            <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">Licensed:</span>
            <span className="text-gray-600 text-xs">{advisor.license_states}</span>
          </div>
        )}
      </div>

      {/* Website Button */}
      {advisor.website_link && (
        <div className="px-4 pb-4 pt-1">
          <a
            href={advisor.website_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 w-full py-2 px-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Visit Website
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </Card>
  );
};
