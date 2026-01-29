import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { ChevronDown, ExternalLink, Briefcase, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { Badge } from '../ui/Badge';
import {
  advisorCMSService,
  AdvisorQuickLink,
  QuickLinkCategory,
  QUICK_LINK_CATEGORIES,
} from '../../lib/advisorCMSService';

// Helper to dynamically render Lucide icons by name
const DynamicIcon = ({ name, className }: { name: string; className?: string }) => {
  const icons = LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>;
  const IconComponent = icons[name] || LucideIcons.Link;
  return <IconComponent className={className} />;
};

interface AdvisorToolkitProps {
  className?: string;
}

export const AdvisorToolkit: React.FC<AdvisorToolkitProps> = ({ className }) => {
  const [linksByCategory, setLinksByCategory] = useState<Record<QuickLinkCategory, AdvisorQuickLink[]>>({
    resources: [],
    advisor_forms: [],
    employer_forms: [],
    member_forms: [],
    bulletins: [],
  });
  const [selectedCategory, setSelectedCategory] = useState<QuickLinkCategory>('resources');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      setLoading(true);
      const grouped = await advisorCMSService.getQuickLinksByCategory();
      setLinksByCategory(grouped);
      
      // Set initial category to first one that has links
      const firstWithLinks = QUICK_LINK_CATEGORIES.find(cat => grouped[cat.value].length > 0);
      if (firstWithLinks) {
        setSelectedCategory(firstWithLinks.value);
      }
    } catch (error) {
      console.error('Failed to load quick links:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = QUICK_LINK_CATEGORIES.find(c => c.value === selectedCategory);
  const currentLinks = linksByCategory[selectedCategory] || [];

  // Count total links across all categories
  const totalLinks = Object.values(linksByCategory).reduce((sum, links) => sum + links.length, 0);

  if (loading) {
    return (
      <Card className={`p-6 ${className || ''}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (totalLinks === 0) {
    return null;
  }

  return (
    <Card className={`p-6 ${className || ''}`}>
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-blue-600" />
        Advisor Toolkit
      </h2>

      {/* Category Dropdown */}
      <div className="relative mb-4">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <DynamicIcon name={currentCategory?.icon || 'Folder'} className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">{currentCategory?.label}</span>
            <Badge variant="outline" className="ml-2 text-xs">
              {currentLinks.length}
            </Badge>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
            {QUICK_LINK_CATEGORIES.map((category) => {
              const count = linksByCategory[category.value]?.length || 0;
              return (
                <button
                  key={category.value}
                  onClick={() => {
                    setSelectedCategory(category.value);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                    selectedCategory === category.value ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DynamicIcon
                      name={category.icon}
                      className={`w-4 h-4 ${selectedCategory === category.value ? 'text-blue-600' : 'text-gray-500'}`}
                    />
                    <span
                      className={`font-medium ${
                        selectedCategory === category.value ? 'text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      {category.label}
                    </span>
                  </div>
                  <Badge
                    variant={count > 0 ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {count}
                  </Badge>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Links for Selected Category */}
      <div className="space-y-1">
        {currentLinks.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No links in this category yet.
          </p>
        ) : (
          currentLinks.map((link) => {
            const linkContent = (
              <div className="flex items-center w-full">
                <DynamicIcon name={link.icon} className="w-4 h-4 mr-2 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <span>{link.label}</span>
                  {link.description && (
                    <span className="ml-2 inline-flex items-center" title={link.description}>
                      <Info className="w-3 h-3 text-blue-500" />
                    </span>
                  )}
                </div>
                {link.is_external && <ExternalLink className="w-3 h-3 ml-2 text-gray-400 flex-shrink-0" />}
              </div>
            );

            return link.is_external ? (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="ghost" className="w-full justify-start h-auto py-2" size="sm">
                  {linkContent}
                </Button>
              </a>
            ) : (
              <Link key={link.id} to={link.url} className="block">
                <Button variant="ghost" className="w-full justify-start h-auto py-2" size="sm">
                  {linkContent}
                </Button>
              </Link>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default AdvisorToolkit;
