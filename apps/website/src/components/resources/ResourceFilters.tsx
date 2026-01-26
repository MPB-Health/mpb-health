import React, { useState, useEffect } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { ResourceType, TargetAudience, SortOption, ResourceFilters as IResourceFilters, ResourceTopic } from '../../lib/supabase';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';

interface ResourceFiltersProps {
  filters: IResourceFilters;
  topics: ResourceTopic[];
  onFiltersChange: (filters: IResourceFilters) => void;
  totalCount: number;
}

const RESOURCE_TYPES: { value: ResourceType; label: string }[] = [
  { value: 'Guide', label: 'Guide' },
  { value: 'Webinar', label: 'Webinar' },
  { value: 'Checklist', label: 'Checklist' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Form', label: 'Form' },
  { value: 'Document', label: 'Document' },
];

const AUDIENCES: { value: TargetAudience; label: string }[] = [
  { value: 'All', label: 'All Audiences' },
  { value: 'Members', label: 'Members' },
  { value: 'Employers', label: 'Employers' },
  { value: 'Advisors', label: 'Advisors' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'most-viewed', label: 'Most Popular' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
];

export const ResourceFilters: React.FC<ResourceFiltersProps> = ({
  filters,
  topics,
  onFiltersChange,
  totalCount,
}) => {
  const [searchInput, setSearchInput] = useState(filters.search);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchInput });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const toggleType = (type: ResourceType) => {
    const newTypes = filters.types.includes(type)
      ? filters.types.filter((t) => t !== type)
      : [...filters.types, type];
    onFiltersChange({ ...filters, types: newTypes });
  };

  const toggleAudience = (audience: TargetAudience) => {
    const newAudiences = filters.audiences.includes(audience)
      ? filters.audiences.filter((a) => a !== audience)
      : [...filters.audiences, audience];
    onFiltersChange({ ...filters, audiences: newAudiences });
  };

  const toggleTopic = (topic: string) => {
    const newTopics = filters.topics.includes(topic)
      ? filters.topics.filter((t) => t !== topic)
      : [...filters.topics, topic];
    onFiltersChange({ ...filters, topics: newTopics });
  };

  const clearAllFilters = () => {
    setSearchInput('');
    onFiltersChange({
      search: '',
      types: [],
      audiences: [],
      topics: [],
      sortBy: 'newest',
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.types.length > 0 ||
    filters.audiences.length > 0 ||
    filters.topics.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <button
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="px-4 py-3 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 transition-colors flex items-center gap-2 min-w-[140px]"
            >
              <Filter className="h-4 w-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">
                {filters.types.length > 0 ? `Type (${filters.types.length})` : 'All Types'}
              </span>
              <ChevronDown className="h-4 w-4 text-neutral-400 ml-auto" />
            </button>
            {showTypeDropdown && (
              <div className="absolute top-full mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-20">
                <div className="p-2 space-y-1">
                  {RESOURCE_TYPES.map((type) => (
                    <label
                      key={type.value}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type.value)}
                        onChange={() => toggleType(type.value)}
                        className="rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-neutral-700">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowAudienceDropdown(!showAudienceDropdown)}
              className="px-4 py-3 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 transition-colors flex items-center gap-2 min-w-[160px]"
            >
              <Filter className="h-4 w-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">
                {filters.audiences.length > 0
                  ? `Audience (${filters.audiences.length})`
                  : 'All Audiences'}
              </span>
              <ChevronDown className="h-4 w-4 text-neutral-400 ml-auto" />
            </button>
            {showAudienceDropdown && (
              <div className="absolute top-full mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-20">
                <div className="p-2 space-y-1">
                  {AUDIENCES.map((audience) => (
                    <label
                      key={audience.value}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.audiences.includes(audience.value)}
                        onChange={() => toggleAudience(audience.value)}
                        className="rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-neutral-700">{audience.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setShowTopicDropdown(!showTopicDropdown)}
              className="px-4 py-3 border border-neutral-300 rounded-lg bg-white hover:bg-neutral-50 transition-colors flex items-center gap-2 min-w-[140px]"
            >
              <Filter className="h-4 w-4 text-neutral-600" />
              <span className="text-sm font-medium text-neutral-700">
                {filters.topics.length > 0 ? `Topics (${filters.topics.length})` : 'All Topics'}
              </span>
              <ChevronDown className="h-4 w-4 text-neutral-400 ml-auto" />
            </button>
            {showTopicDropdown && (
              <div className="absolute top-full mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {topics.map((topic) => (
                    <label
                      key={topic.slug}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-neutral-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filters.topics.includes(topic.name)}
                        onChange={() => toggleTopic(topic.name)}
                        className="rounded border-neutral-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm text-neutral-700">{topic.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Select
            value={filters.sortBy}
            onChange={(e) =>
              onFiltersChange({ ...filters, sortBy: e.target.value as SortOption })
            }
            className="min-w-[160px]"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-neutral-600 font-medium">Active Filters:</span>
          {filters.types.map((type) => (
            <Badge key={type} variant="default" className="flex items-center gap-1">
              {type}
              <button
                onClick={() => toggleType(type)}
                className="ml-1 hover:bg-neutral-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.audiences.map((audience) => (
            <Badge key={audience} variant="default" className="flex items-center gap-1">
              {audience}
              <button
                onClick={() => toggleAudience(audience)}
                className="ml-1 hover:bg-neutral-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {filters.topics.map((topic) => (
            <Badge key={topic} variant="default" className="flex items-center gap-1">
              {topic}
              <button
                onClick={() => toggleTopic(topic)}
                className="ml-1 hover:bg-neutral-300 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            onClick={clearAllFilters}
            className="text-sm text-primary hover:text-primary/80 font-medium ml-2"
          >
            Clear All
          </button>
        </div>
      )}

      <div className="text-sm text-neutral-600">
        Showing <span className="font-semibold text-neutral-900">{totalCount}</span>{' '}
        {totalCount === 1 ? 'resource' : 'resources'}
      </div>
    </div>
  );
};
