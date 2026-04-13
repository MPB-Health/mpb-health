import { ExternalLink } from 'lucide-react';

interface SunbizLookupProps {
  companyName?: string | null;
  className?: string;
}

export function SunbizLookup({ companyName, className = '' }: SunbizLookupProps) {
  if (!companyName) return null;

  const url = `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchByName?searchNameOrder=${encodeURIComponent(companyName)}&searchTerm=${encodeURIComponent(companyName)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 text-sm text-th-accent-600 hover:text-th-accent-700 font-medium transition-colors ${className}`}
    >
      <ExternalLink className="h-3.5 w-3.5" />
      Lookup on Sunbiz
    </a>
  );
}
