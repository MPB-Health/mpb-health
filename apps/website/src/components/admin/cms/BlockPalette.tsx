import {
  Layout,
  Type,
  Image,
  BarChart3,
  Columns,
  HelpCircle,
  Video,
  Minus,
  MousePointerClick,
  Grid3X3,
  Megaphone,
  Quote,
  DollarSign,
  Layers,
  ListCollapse,
  Users,
  Building2,
  Timer,
  Mail,
  SplitSquareHorizontal,
  PlayCircle,
  Sparkles,
  AlertTriangle,
  MousePointer,
  MapPin,
  Table2,
} from 'lucide-react';
import type { CmsBlockKind } from '@mpbhealth/database';

interface BlockPaletteItem {
  kind: CmsBlockKind;
  label: string;
  description: string;
  icon: typeof Layout;
  category: 'content' | 'media' | 'layout' | 'interactive' | 'marketing' | 'structure';
}

const PALETTE_BLOCKS: BlockPaletteItem[] = [
  // Structure (containers)
  { kind: 'section', label: 'Section', description: 'Full-width wrapper with background', icon: Layout, category: 'structure' },
  { kind: 'columns', label: 'Columns', description: 'Multi-column responsive grid', icon: Columns, category: 'structure' },
  { kind: 'container', label: 'Container', description: 'Max-width centered wrapper', icon: Layout, category: 'structure' },
  // Layout
  { kind: 'hero', label: 'Hero', description: 'Title, subtitle, CTA buttons', icon: Layout, category: 'layout' },
  { kind: 'video_hero', label: 'Video Hero', description: 'Hero with background video', icon: PlayCircle, category: 'layout' },
  { kind: 'two_column', label: 'Two-Column', description: 'Image + text side-by-side', icon: Columns, category: 'layout' },
  { kind: 'spacer', label: 'Spacer', description: 'Vertical space', icon: Minus, category: 'layout' },
  { kind: 'divider', label: 'Divider', description: 'Styled separator line', icon: SplitSquareHorizontal, category: 'layout' },
  // Content
  { kind: 'rich_text', label: 'Rich Text', description: 'Formatted content', icon: Type, category: 'content' },
  { kind: 'stats', label: 'Stats', description: 'Number cards', icon: BarChart3, category: 'content' },
  { kind: 'icon_grid', label: 'Icon Grid', description: 'Feature cards with icons', icon: Sparkles, category: 'content' },
  { kind: 'team_grid', label: 'Team Grid', description: 'People cards', icon: Users, category: 'content' },
  { kind: 'tabs', label: 'Tabs', description: 'Tabbed content sections', icon: Layers, category: 'content' },
  { kind: 'accordion', label: 'Accordion', description: 'Expandable sections', icon: ListCollapse, category: 'content' },
  { kind: 'faq', label: 'FAQ', description: 'Collapsible Q&A', icon: HelpCircle, category: 'content' },
  { kind: 'table', label: 'Table', description: 'Data table', icon: Table2, category: 'content' },
  { kind: 'alert_box', label: 'Alert Box', description: 'Info/warning callout', icon: AlertTriangle, category: 'content' },
  // Media
  { kind: 'image', label: 'Image', description: 'Single image with caption', icon: Image, category: 'media' },
  { kind: 'image_grid', label: 'Image Grid', description: 'Multi-image gallery', icon: Grid3X3, category: 'media' },
  { kind: 'embed', label: 'Embed', description: 'YouTube, Vimeo, iframe', icon: Video, category: 'media' },
  { kind: 'logo_wall', label: 'Logo Wall', description: 'Partner/client logos', icon: Building2, category: 'media' },
  { kind: 'map', label: 'Map', description: 'Embedded Google Map', icon: MapPin, category: 'media' },
  // Interactive / Marketing
  { kind: 'cta_band', label: 'CTA Band', description: 'Full-width call to action', icon: MousePointerClick, category: 'interactive' },
  { kind: 'button_group', label: 'Button Group', description: 'Multiple CTA buttons', icon: MousePointer, category: 'interactive' },
  { kind: 'testimonial', label: 'Testimonial', description: 'Quote with author', icon: Quote, category: 'interactive' },
  { kind: 'testimonial_carousel', label: 'Testimonials', description: 'Rotating quotes', icon: Quote, category: 'interactive' },
  { kind: 'pricing_table', label: 'Pricing Table', description: 'Plan comparison', icon: DollarSign, category: 'interactive' },
  { kind: 'countdown', label: 'Countdown', description: 'Timer to a date', icon: Timer, category: 'interactive' },
  { kind: 'banner', label: 'Banner', description: 'Announcement bar', icon: Megaphone, category: 'marketing' },
  { kind: 'newsletter_signup', label: 'Newsletter', description: 'Email capture form', icon: Mail, category: 'marketing' },
];

const CATEGORIES = [
  { key: 'structure', label: 'Structure' },
  { key: 'layout', label: 'Layout' },
  { key: 'content', label: 'Content' },
  { key: 'media', label: 'Media' },
  { key: 'interactive', label: 'Interactive' },
  { key: 'marketing', label: 'Marketing' },
] as const;

interface BlockPaletteProps {
  onAddBlock: (kind: CmsBlockKind) => void;
}

export function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-th-text-primary px-1">Add Blocks</h3>
      {CATEGORIES.map((cat) => {
        const items = PALETTE_BLOCKS.filter((b) => b.category === cat.key);
        if (items.length === 0) return null;
        return (
          <div key={cat.key}>
            <p className="text-xs font-medium text-th-text-tertiary uppercase tracking-wider mb-2 px-1">
              {cat.label}
            </p>
            <div className="space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.kind}
                    type="button"
                    onClick={() => onAddBlock(item.kind)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-surface-tertiary transition-colors group"
                  >
                    <div className="p-1.5 rounded-md bg-th-accent-600/10 text-th-accent-700 group-hover:bg-th-accent-600 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-th-text-primary">{item.label}</div>
                      <div className="text-xs text-th-text-tertiary truncate">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
