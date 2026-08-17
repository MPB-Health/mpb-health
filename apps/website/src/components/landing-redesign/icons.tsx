import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

export function RxIcon({ strokeWidth = 1.6, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M5 19V5h5a3.5 3.5 0 0 1 0 7H5" />
      <path d="M9.5 12l6 8" />
      <path d="M14 14l7 6.5" />
      <path d="M21 14l-7 6.5" />
    </svg>
  );
}

export function AgentIcon({ strokeWidth = 1.6, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="10.5" r="3.4" />
      <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
      <path d="M6.8 11V9.8a5.2 5.2 0 0 1 10.4 0V11" />
      <path d="M17.2 11.4v.6a2.6 2.6 0 0 1-2.6 2.6" />
      <rect x="5.8" y="10" width="2" height="2.8" rx="1" />
      <rect x="16.2" y="10" width="2" height="2.8" rx="1" />
    </svg>
  );
}

export function GoogleGIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path fill="currentColor" d="M12 11.2v2.9h4.9c-.2 1.2-.9 2.2-1.9 2.9l3.1 2.4c1.8-1.7 2.9-4.1 2.9-7 0-.7-.1-1.3-.2-1.9H12z" />
      <path fill="currentColor" d="M12 21c2.6 0 4.8-.9 6.4-2.3l-3.1-2.4c-.9.6-2 1-3.3 1-2.5 0-4.6-1.7-5.4-4H3.4v2.5C5 18.9 8.2 21 12 21z" />
      <path fill="currentColor" d="M6.6 13.3c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V7.2H3.4C2.7 8.6 2.3 10.2 2.3 12s.4 3.4 1.1 4.8l3.2-3.5z" />
      <path fill="currentColor" d="M12 5.7c1.4 0 2.7.5 3.7 1.4l2.8-2.8C16.8 2.7 14.6 1.8 12 1.8 8.2 1.8 5 3.9 3.4 7.2l3.2 2.5c.8-2.3 2.9-4 5.4-4z" />
    </svg>
  );
}
