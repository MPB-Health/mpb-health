import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Users, MapPin, X, ChevronDown } from 'lucide-react';
import { AdvisorCard } from '../components/advisor/AdvisorCard';
import { LandingHeader } from '../components/landing-redesign/LandingHeader';
import { LandingFooter } from '../components/landing-redesign/LandingFooter';
import {
  getAdvisors,
  getUniqueStates,
  getUniqueAgentTypes,
  type Advisor,
  type AdvisorFilters
} from '../lib/advisorDirectoryService';
import '../components/landing-redesign/landing-redesign.css';
import './advisor-directory.css';

export const AdvisorDirectory: React.FC = () => {
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [filteredAdvisors, setFilteredAdvisors] = useState<Advisor[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [agentTypes, setAgentTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<AdvisorFilters>({
    search: '',
    state: 'all',
    agentType: 'all'
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, advisors]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [advisorsData, statesData, typesData] = await Promise.all([
        getAdvisors(),
        getUniqueStates(),
        getUniqueAgentTypes()
      ]);

      setAdvisors(advisorsData);
      setFilteredAdvisors(advisorsData);
      setStates(statesData);
      setAgentTypes(typesData);
    } catch (error) {
      console.error('[AdvisorDirectory] Error loading advisor data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...advisors];

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(advisor => {
        const name = `${advisor.first_name || ''} ${advisor.last_name || ''}`.toLowerCase();
        const company = (advisor.company || '').toLowerCase();
        const city = (advisor.city || '').toLowerCase();
        const state = (advisor.state || '').toLowerCase();

        return (
          name.includes(searchTerm) ||
          company.includes(searchTerm) ||
          city.includes(searchTerm) ||
          state.includes(searchTerm)
        );
      });
    }

    if (filters.state && filters.state !== 'all') {
      filtered = filtered.filter(advisor => advisor.state === filters.state);
    }

    if (filters.agentType && filters.agentType !== 'all') {
      filtered = filtered.filter(advisor => advisor.agent_type === filters.agentType);
    }

    setFilteredAdvisors(filtered);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, search: e.target.value }));
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, state: e.target.value }));
  };

  const handleAgentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters(prev => ({ ...prev, agentType: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      state: 'all',
      agentType: 'all'
    });
  };

  const hasActiveFilters = filters.search || filters.state !== 'all' || filters.agentType !== 'all';

  return (
    <>
      <Helmet>
        <title>Advisor Directory | MPB Health</title>
        <meta
          name="description"
          content="Find your MPB Health advisor. Search our directory of licensed healthcare advisors by location, specialty, or name."
        />
      </Helmet>

      <div className="lr ad">
        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="ad-hero" aria-label="Find a health advisor">
          <LandingHeader />
          <div className="ad-hero__content">
            <h1 className="ad-hero__title">Find a Health Advisor</h1>
            <p className="ad-hero__sub">
              Connect with licensed advisors ready to help you find the right health sharing
              membership
            </p>
            <div className="ad-hero__stats">
              <span className="ad-stat">
                <Users aria-hidden="true" />
                {advisors.length} Advisors
              </span>
              <span className="ad-stat">
                <MapPin aria-hidden="true" />
                {states.length} States
              </span>
            </div>
          </div>
        </section>

        {/* ── Main content ─────────────────────────────────────────── */}
        <div className="ad-main">
          <div className="ad-inner">
            {/* Search & filter card (floats over the hero edge) */}
            <div className="ad-filters">
              <div className="ad-filters__row">
                <div className="ad-filters__search">
                  <Search aria-hidden="true" />
                  <input
                    type="text"
                    className="ad-filters__input"
                    placeholder="Search by name, company, or city..."
                    value={filters.search}
                    onChange={handleSearchChange}
                  />
                </div>

                <div className="ad-filters__select-wrap">
                  <select
                    className="ad-filters__select"
                    value={filters.state}
                    onChange={handleStateChange}
                  >
                    <option value="all">All States</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </div>

                <div className="ad-filters__select-wrap">
                  <select
                    className="ad-filters__select"
                    value={filters.agentType}
                    onChange={handleAgentTypeChange}
                  >
                    <option value="all">All Types</option>
                    {agentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden="true" />
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    className="ad-filters__clear"
                    onClick={clearFilters}
                    aria-label="Clear filters"
                  >
                    <X aria-hidden="true" />
                  </button>
                )}
              </div>

              <div className="ad-filters__meta">
                <span className="ad-filters__count">
                  {isLoading ? (
                    'Loading advisors...'
                  ) : (
                    <>
                      Showing <strong>{filteredAdvisors.length}</strong>
                      {filteredAdvisors.length !== advisors.length && (
                        <> of {advisors.length}</>
                      )} advisors
                    </>
                  )}
                </span>
                {hasActiveFilters && (
                  <button type="button" className="ad-filters__reset" onClick={clearFilters}>
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* Advisors grid */}
            {isLoading ? (
              <div className="ad-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="ad-skeleton">
                    <div className="ad-skeleton__head">
                      <div className="ad-skeleton__avatar" />
                      <div style={{ flex: 1 }}>
                        <div className="ad-skeleton__bar" style={{ height: '0.9rem', width: '75%', marginBottom: '0.5rem' }} />
                        <div className="ad-skeleton__bar" style={{ height: '0.7rem', width: '50%' }} />
                      </div>
                    </div>
                    <div className="ad-skeleton__bar" style={{ height: '0.7rem', width: '100%', marginBottom: '0.5rem' }} />
                    <div className="ad-skeleton__bar" style={{ height: '0.7rem', width: '66%', marginBottom: '0.5rem' }} />
                    <div className="ad-skeleton__bar" style={{ height: '0.7rem', width: '80%' }} />
                  </div>
                ))}
              </div>
            ) : filteredAdvisors.length > 0 ? (
              <div className="ad-grid">
                {filteredAdvisors.map(advisor => (
                  <AdvisorCard key={advisor.id} advisor={advisor} />
                ))}
              </div>
            ) : (
              <div className="ad-empty">
                <div className="ad-empty__icon">
                  <Users aria-hidden="true" />
                </div>
                <h3 className="ad-empty__title">No advisors found</h3>
                <p className="ad-empty__text">Try adjusting your search or filter criteria</p>
                {hasActiveFilters && (
                  <button type="button" className="ad-empty__btn" onClick={clearFilters}>
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer (same as landing page) ────────────────────────── */}
        <LandingFooter />
      </div>
    </>
  );
};

export default AdvisorDirectory;
