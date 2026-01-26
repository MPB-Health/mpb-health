export const typography = {
  headings: {
    h1: {
      hero: 'text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight',
      page: 'text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight',
    },
    h2: {
      section: 'text-3xl sm:text-4xl font-bold leading-tight',
      subsection: 'text-2xl sm:text-3xl font-bold leading-tight',
    },
    h3: {
      card: 'text-xl sm:text-2xl font-bold leading-tight',
      default: 'text-xl font-bold leading-tight',
    },
    h4: {
      default: 'text-lg sm:text-xl font-semibold leading-tight',
    },
  },

  body: {
    large: 'text-lg sm:text-xl leading-relaxed',
    default: 'text-base md:text-lg leading-relaxed',
    small: 'text-sm md:text-base leading-relaxed',
    xs: 'text-sm leading-relaxed',
  },

  gradients: {
    primary: 'bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent',
    brand: 'bg-gradient-to-r from-cyan-600 via-[#a3cc43] to-blue-600 bg-clip-text text-transparent',
    neutral: 'bg-gradient-to-r from-neutral-900 via-primary to-neutral-800 bg-clip-text text-transparent',
    success: 'bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent',
  },

  display: {
    hero: 'text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight tracking-tight',
    metric: 'text-5xl sm:text-6xl font-bold tabular-nums',
    price: 'text-4xl sm:text-5xl font-bold tabular-nums',
  },
} as const;

export const getHeadingClasses = (
  level: 'h1' | 'h2' | 'h3' | 'h4',
  variant?: string,
  gradient?: 'primary' | 'brand' | 'neutral' | 'success'
): string => {
  let classes = '';

  switch (level) {
    case 'h1':
      classes = variant === 'page' ? typography.headings.h1.page : typography.headings.h1.hero;
      break;
    case 'h2':
      classes = variant === 'subsection' ? typography.headings.h2.subsection : typography.headings.h2.section;
      break;
    case 'h3':
      classes = variant === 'card' ? typography.headings.h3.card : typography.headings.h3.default;
      break;
    case 'h4':
      classes = typography.headings.h4.default;
      break;
  }

  if (gradient) {
    return `${classes} ${typography.gradients[gradient]}`;
  }

  return `${classes} text-neutral-900`;
};
