import { useState } from 'react';
import { Link2, Mail, Share2, Check } from 'lucide-react';
import { Button } from '../ui/button';

interface ShareBarProps {
  url: string;
  title: string;
  emailTo?: string;
  emailSubject?: string;
  emailBody?: string;
}

export function ShareBar({ url, title, emailTo, emailSubject, emailBody }: ShareBarProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = url.startsWith('http') ? url : `https://mpb.health${url}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (fallbackErr) {
        console.error('Fallback copy failed:', fallbackErr);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleEmailShare = () => {
    const subject = emailSubject || `MPB Health Form: ${title}`;
    const body = emailBody || `I wanted to share this form with you:\n\n${title}\n${fullUrl}\n\nBest regards`;
    const mailtoLink = `mailto:${emailTo || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoLink;
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `MPB Health: ${title}`,
          text: `Check out this form from MPB Health`,
          url: fullUrl,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Native share failed:', err);
        }
      }
    }
  };

  const supportsNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-neutral-900 mb-1">Share This Form</h3>
          <p className="text-sm text-neutral-600">
            Send this form directly to members or colleagues
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button
          onClick={handleCopyLink}
          variant={copied ? 'default' : 'outline'}
          className={`flex-1 min-w-[140px] ${
            copied
              ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
              : 'bg-white hover:bg-blue-50'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              Link Copied!
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </Button>

        <Button
          onClick={handleEmailShare}
          variant="outline"
          className="flex-1 min-w-[140px] bg-white hover:bg-blue-50"
        >
          <Mail className="w-4 h-4 mr-2" />
          Email Share
        </Button>

        {supportsNativeShare && (
          <Button
            onClick={handleNativeShare}
            variant="outline"
            className="flex-1 min-w-[140px] bg-white hover:bg-blue-50"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        )}
      </div>

      <div className="mt-4 p-3 bg-white rounded-lg border border-blue-100">
        <p className="text-xs text-neutral-500 mb-1 font-medium">Form URL:</p>
        <p className="text-sm text-blue-600 font-mono break-all">{fullUrl}</p>
      </div>
    </div>
  );
}
