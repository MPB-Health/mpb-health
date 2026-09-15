import React from 'react';
import { Mail, Phone, MapPin, ExternalLink, Building2 } from 'lucide-react';
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
  const primaryPhone = formatPhoneNumber(advisor.phone_1);
  const secondaryPhone = formatPhoneNumber(advisor.phone_2);

  // Get initials for avatar
  const initials = `${advisor.first_name?.[0] || ''}${advisor.last_name?.[0] || ''}`.toUpperCase() || 'A';

  return (
    <article className="ad-card">
      {/* Header */}
      <div className="ad-card__head">
        <div className="ad-card__id">
          <span className="ad-card__avatar" aria-hidden="true">{initials}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 className="ad-card__name">{displayName}</h3>
            <div className="ad-card__tags">
              {advisor.agent_type && (
                <span className="ad-card__badge">{advisor.agent_type}</span>
              )}
              {advisor.state && (
                <span className="ad-card__where">
                  {advisor.city ? `${advisor.city}, ` : ''}{advisor.state}
                </span>
              )}
            </div>
          </div>
        </div>

        {advisor.company && (
          <div className="ad-card__company">
            <Building2 aria-hidden="true" />
            <span>{advisor.company}</span>
          </div>
        )}
      </div>

      {/* Contact info */}
      <div className="ad-card__body">
        {advisor.email && (
          <div className="ad-card__row">
            <Mail aria-hidden="true" />
            <a href={`mailto:${advisor.email}`}>{advisor.email}</a>
          </div>
        )}

        {primaryPhone && (
          <div className="ad-card__row">
            <Phone aria-hidden="true" />
            <span style={{ minWidth: 0 }}>
              <a href={`tel:${primaryPhone.replace(/\D/g, '')}`}>{primaryPhone}</a>
              {secondaryPhone && (
                <>
                  {' • '}
                  <a href={`tel:${secondaryPhone.replace(/\D/g, '')}`}>{secondaryPhone}</a>
                </>
              )}
            </span>
          </div>
        )}

        {fullAddress && (
          <div className="ad-card__row ad-card__row--wrap">
            <MapPin aria-hidden="true" />
            <span>{fullAddress}</span>
          </div>
        )}

        {advisor.license_states && (
          <p className="ad-card__licensed">
            <strong>Licensed:</strong> {advisor.license_states}
          </p>
        )}
      </div>

      {/* Website button */}
      {advisor.website_link && (
        <a
          className="ad-card__cta"
          href={advisor.website_link}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit Website
          <ExternalLink aria-hidden="true" />
        </a>
      )}
    </article>
  );
};
