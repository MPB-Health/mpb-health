import React from 'react';
import { Linkedin, Twitter, Globe, User } from 'lucide-react';
import { BlogAuthor } from '../../lib/supabase';

interface AuthorBoxProps {
  author?: BlogAuthor;
  authorName?: string; // Fallback if no author object
  className?: string;
}

export const AuthorBox: React.FC<AuthorBoxProps> = ({
  author,
  authorName,
  className = '',
}) => {
  // If no author data at all, don't render
  if (!author && !authorName) return null;

  const displayName = author?.name || authorName || 'MPB Health Team';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 ${className}`}>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4">
        About the Author
      </p>
      
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {author?.avatar_url ? (
            <img
              src={author.avatar_url}
              alt={displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className={`w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center ${author?.avatar_url ? 'hidden' : ''}`}>
            {initials ? (
              <span className="text-xl font-bold text-white">{initials}</span>
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {displayName}
          </h3>
          {author?.role && (
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
              {author.role}
            </p>
          )}
          {author?.bio && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {author.bio}
            </p>
          )}

          {/* Social Links */}
          {author && (author.social_linkedin || author.social_twitter || author.social_website) && (
            <div className="flex items-center gap-3 mt-3">
              {author.social_linkedin && (
                <a
                  href={author.social_linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="LinkedIn profile"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              )}
              {author.social_twitter && (
                <a
                  href={author.social_twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-sky-500 dark:text-gray-400 dark:hover:text-sky-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Twitter profile"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              )}
              {author.social_website && (
                <a
                  href={author.social_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Website"
                >
                  <Globe className="w-5 h-5" />
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthorBox;
