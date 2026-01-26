import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Eye, Download, FileText, Video, CheckSquare, Megaphone, FileCheck, File, Star } from 'lucide-react';
import { Resource } from '../../lib/supabase';
import { Badge } from '../ui/Badge';

interface ResourceCardProps {
  resource: Resource;
}

const getResourceIcon = (type: string) => {
  switch (type) {
    case 'Guide':
      return FileText;
    case 'Webinar':
      return Video;
    case 'Checklist':
      return CheckSquare;
    case 'Marketing':
      return Megaphone;
    case 'Form':
      return FileCheck;
    default:
      return File;
  }
};

const getAudienceBadgeVariant = (audience: string): 'default' | 'primary' | 'success' | 'accent' => {
  switch (audience) {
    case 'Members':
      return 'primary';
    case 'Employers':
      return 'success';
    case 'Advisors':
      return 'accent';
    default:
      return 'default';
  }
};

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource }) => {
  const Icon = getResourceIcon(resource.resource_type);

  return (
    <Link
      to={`/resources/${resource.slug}`}
      className="group relative bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-neutral-200"
    >
      {resource.is_featured && (
        <div className="absolute top-3 right-3 z-10 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-semibold shadow-lg">
          <Star className="h-3 w-3 fill-current" />
          FEATURED
        </div>
      )}

      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200">
        {resource.featured_image_url ? (
          <img
            src={
              resource.featured_image_url.startsWith('http')
                ? resource.featured_image_url
                : `/${resource.featured_image_url.replace(/^\//, '')}`
            }
            alt={resource.title}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="h-16 w-16 text-neutral-300" />
          </div>
        )}
      </div>

      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
            <Icon className="h-3.5 w-3.5" />
            {resource.resource_type}
          </div>
          <Badge variant={getAudienceBadgeVariant(resource.target_audience)}>
            {resource.target_audience}
          </Badge>
        </div>

        <h3 className="text-lg font-bold text-neutral-900 group-hover:text-primary transition-colors line-clamp-2 min-h-[3.5rem]">
          {resource.title}
        </h3>

        <p className="text-neutral-600 text-sm line-clamp-2 min-h-[2.5rem]">
          {resource.description}
        </p>

        <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(resource.published_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              <span>{resource.view_count}</span>
            </div>
            {resource.file_url && (
              <div className="flex items-center gap-1">
                <Download className="h-3.5 w-3.5" />
                <span>{resource.download_count}</span>
              </div>
            )}
          </div>
        </div>

        {resource.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {resource.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded"
              >
                {topic}
              </span>
            ))}
            {resource.topics.length > 3 && (
              <span className="inline-block px-2 py-0.5 bg-neutral-100 text-neutral-600 text-xs rounded">
                +{resource.topics.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};
