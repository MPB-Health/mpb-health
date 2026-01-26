export type Advisor = {
  advisor_id: string;
  display_name: string;
  city?: string;
  state?: string;
  landing_url?: string;
  photo_url?: string;
  phone?: string;
  email?: string;
};

export type Plan = {
  id: string;
  name: string;
  priceFrom: string;
  bullets: string[];
  href: string;
};

export type Benefit = {
  title: string;
  blurb: string;
};

export type HowItWorksStep = {
  id: number;
  title: string;
  blurb: string;
  detail: string;
  cta?: {
    label: string;
    href: string;
  };
};

export type FAQItem = {
  q: string;
  a: string;
};
