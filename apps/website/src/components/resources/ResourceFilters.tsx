import React, { useState, useEffect } from 'react';
import { Search, X, Filter, ChevronDown } from 'lucide-react';
import { ResourceType, TargetAudience, SortOption, ResourceFilters as IResourceFilters, ResourceTopic } from '../../lib/supabase';

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
    <div>
      <div className="rl-filters__row">
        <div className="rl-filters__search">
          <Search aria-hidden="true" />
          <input
            type="text"
            className="rl-filters__input"
            placeholder="Search resources..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div className="rl-filters__dd">
          <button
            type="button"
            className="rl-filters__btn"
            onClick={() => setShowTypeDropdown(!showTypeDropdown)}
          >
            <Filter aria-hidden="true" />
            {filters.types.length > 0 ? `Type (${filters.types.length})` : 'All Types'}
            <ChevronDown aria-hidden="true" />
          </button>
          {showTypeDropdown && (
            <div className="rl-filters__menu">
              {RESOURCE_TYPES.map((type) => (
                <label key={type.value} className="rl-filters__option">
                  <input
                    type="checkbox"
                    checked={filters.types.includes(type.value)}
                    onChange={() => toggleType(type.value)}
                  />
                  {type.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="rl-filters__dd">
          <button
            type="button"
            className="rl-filters__btn"
            onClick={() => setShowAudienceDropdown(!showAudienceDropdown)}
          >
            <Filter aria-hidden="true" />
            {filters.audiences.length > 0
              ? `Audience (${filters.audiences.length})`
              : 'All Audiences'}
            <ChevronDown aria-hidden="true" />
          </button>
          {showAudienceDropdown && (
            <div className="rl-filters__menu">
              {AUDIENCES.map((audience) => (
                <label key={audience.value} className="rl-filters__option">
                  <input
                    type="checkbox"
                    checked={filters.audiences.includes(audience.value)}
                    onChange={() => toggleAudience(audience.value)}
                  />
                  {audience.label}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="rl-filters__dd">
          <button
            type="button"
            className="rl-filters__btn"
            onClick={() => setShowTopicDropdown(!showTopicDropdown)}
          >
            <Filter aria-hidden="true" />
            {filters.topics.length > 0 ? `Topics (${filters.topics.length})` : 'All Topics'}
            <ChevronDown aria-hidden="true" />
          </button>
          {showTopicDropdown && (
            <div className="rl-filters__menu">
              {topics.map((topic) => (
                <label key={topic.slug} className="rl-filters__option">
                  <input
                    type="checkbox"
                    checked={filters.topics.includes(topic.name)}
                    onChange={() => toggleTopic(topic.name)}
                  />
                  {topic.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="rl-filters__select-wrap">
          <select
            className="rl-filters__select"
            value={filters.sortBy}
            onChange={(e) =>
              onFiltersChange({ ...filters, sortBy: e.target.value as SortOption })
            }
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" />
        </div>
      </div>

      {hasActiveFilters && (
        <div className="rl-filters__chips">
          <span className="rl-filters__chips-label">Active Filters:</span>
          {filters.types.map((type) => (
            <span key={type} className="rl-chip">
              {type}
              <button
                type="button"
                className="rl-chip__x"
                onClick={() => toggleType(type)}
                aria-label={`Remove ${type} filter`}
              >
                <X aria-hidden="true" />
              </button>
            </span>
          ))}
          {filters.audiences.map((audience) => (
            <span key={audience} className="rl-chip">
              {audience}
              <button
                type="button"
                className="rl-chip__x"
                onClick={() => toggleAudience(audience)}
                aria-label={`Remove ${audience} filter`}
              >
                <X aria-hidden="true" />
              </button>
            </span>
          ))}
          {filters.topics.map((topic) => (
            <span key={topic} className="rl-chip">
              {topic}
              <button
                type="button"
                className="rl-chip__x"
                onClick={() => toggleTopic(topic)}
                aria-label={`Remove ${topic} filter`}
              >
                <X aria-hidden="true" />
              </button>
            </span>
          ))}
          <button type="button" className="rl-filters__clear-all" onClick={clearAllFilters}>
            Clear All
          </button>
        </div>
      )}

      <div className="rl-filters__count">
        Showing <strong>{totalCount}</strong> {totalCount === 1 ? 'resource' : 'resources'}
      </div>
    </div>
  );
};
