import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Search, Users, MapPin, X, ChevronDown } from 'lucide-react';
import { AdvisorCard } from '../components/advisor/AdvisorCard';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import {
  getAdvisors,
  getUniqueStates,
  getUniqueAgentTypes,
  type Advisor,
  type AdvisorFilters
} from '../lib/advisorDirectoryService';

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

      {/* Hero Section - Compact */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              Find a Health Advisor
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Connect with licensed advisors ready to help you find the right health sharing plan
            </p>
            <div className="flex items-center justify-center gap-6 mt-5 text-sm text-blue-200">
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                {advisors.length} Advisors
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {states.length} States
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search & Filter Bar - Floating */}
          <div className="relative -mt-8 mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by name, company, or city..."
                    value={filters.search}
                    onChange={handleSearchChange}
                    className="pl-9 h-10 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>

                {/* State Filter */}
                <div className="relative sm:w-40">
                  <select
                    value={filters.state}
                    onChange={handleStateChange}
                    className="w-full h-10 pl-3 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="all">All States</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Agent Type Filter */}
                <div className="relative sm:w-40">
                  <select
                    value={filters.agentType}
                    onChange={handleAgentTypeChange}
                    className="w-full h-10 pl-3 pr-8 text-sm bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                  >
                    <option value="all">All Types</option>
                    {agentTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                {/* Clear Button */}
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="h-10 px-3 text-gray-500 hover:text-gray-700 border-gray-200"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Results Count */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">
                  {isLoading ? (
                    'Loading advisors...'
                  ) : (
                    <>
                      Showing <span className="font-medium text-gray-900">{filteredAdvisors.length}</span>
                      {filteredAdvisors.length !== advisors.length && (
                        <> of {advisors.length}</>
                      )} advisors
                    </>
                  )}
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Advisors Grid */}
          <div className="pb-16">
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-11 h-11 bg-gray-200 rounded-full" />
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-200 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="border-t border-gray-100 pt-3 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                      <div className="h-3 bg-gray-200 rounded w-4/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredAdvisors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAdvisors.map(advisor => (
                  <AdvisorCard key={advisor.id} advisor={advisor} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No advisors found
                </h3>
                <p className="text-gray-500 mb-6">
                  Try adjusting your search or filter criteria
                </p>
                {hasActiveFilters && (
                  <Button
                    onClick={clearFilters}
                    variant="outline"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdvisorDirectory;
