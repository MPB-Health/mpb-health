// ============================================================================
// OrgSwitcher — Dropdown to switch between organizations
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import type { OrgWithMembership } from '../services/orgService';
import { ORG_ROLE_LABELS } from '../services/orgService';

export interface OrgSwitcherProps {
  orgs: OrgWithMembership[];
  activeOrg: OrgWithMembership | null;
  onSwitch: (orgId: string) => void;
  className?: string;
}

export function OrgSwitcher({ orgs, activeOrg, onSwitch, className = '' }: OrgSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (orgs.length <= 1) {
    // Single org — just show the name, no switcher
    return activeOrg ? (
      <div className={`flex items-center gap-2 px-3 py-2 text-sm ${className}`}>
        <span className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
          {activeOrg.name.charAt(0)}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-neutral-900 truncate">{activeOrg.name}</span>
          <span className="text-xs text-neutral-500">{ORG_ROLE_LABELS[activeOrg.membership.role]}</span>
        </div>
      </div>
    ) : null;
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-neutral-100 transition-colors w-full"
      >
        {activeOrg && (
          <>
            <span className="w-7 h-7 rounded-lg bg-primary-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
              {activeOrg.name.charAt(0)}
            </span>
            <div className="flex flex-col min-w-0 text-left">
              <span className="font-medium text-neutral-900 truncate">{activeOrg.name}</span>
              <span className="text-xs text-neutral-500">{ORG_ROLE_LABELS[activeOrg.membership.role]}</span>
            </div>
            <svg className={`w-4 h-4 text-neutral-400 ml-auto flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-neutral-200 py-1 z-50">
          <div className="px-3 py-2 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            Switch Organization
          </div>
          {orgs.map((org) => (
            <button
              key={org.id}
              type="button"
              onClick={() => {
                onSwitch(org.id);
                setIsOpen(false);
              }}
              className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm hover:bg-neutral-50 transition-colors ${
                org.id === activeOrg?.id ? 'bg-primary-50' : ''
              }`}
            >
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                org.id === activeOrg?.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-200 text-neutral-600'
              }`}>
                {org.name.charAt(0)}
              </span>
              <div className="flex flex-col min-w-0 text-left">
                <span className="font-medium text-neutral-900 truncate">{org.name}</span>
                <span className="text-xs text-neutral-500">{ORG_ROLE_LABELS[org.membership.role]}</span>
              </div>
              {org.id === activeOrg?.id && (
                <svg className="w-4 h-4 text-primary-600 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
