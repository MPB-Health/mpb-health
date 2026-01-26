import React, { useState } from 'react';
import { Linkedin, Twitter, Facebook, Link2, Check } from 'lucide-react';

interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
}

export const ShareButtons: React.FC<ShareButtonsProps> = ({
  url,
  title,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = {
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  return (
    <div className={`${className}`}>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        Share this article
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleShare('linkedin')}
          className="flex items-center gap-2 px-4 py-2 bg-[#0A66C2] text-white text-sm font-medium rounded-lg hover:bg-[#004182] transition-colors"
          aria-label="Share on LinkedIn"
        >
          <Linkedin className="w-4 h-4" />
          <span className="hidden sm:inline">LinkedIn</span>
        </button>

        <button
          onClick={() => handleShare('twitter')}
          className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
          aria-label="Share on X (Twitter)"
        >
          <Twitter className="w-4 h-4" />
          <span className="hidden sm:inline">X</span>
        </button>

        <button
          onClick={() => handleShare('facebook')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1877F2] text-white text-sm font-medium rounded-lg hover:bg-[#0d65d9] transition-colors"
          aria-label="Share on Facebook"
        >
          <Facebook className="w-4 h-4" />
          <span className="hidden sm:inline">Facebook</span>
        </button>

        <button
          onClick={handleCopyLink}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            copied
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
          aria-label="Copy link"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4" />
              <span className="hidden sm:inline">Copy Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ShareButtons;
