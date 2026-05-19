import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical, Trash2, Type, Image, Layout, BarChart3, Columns, HelpCircle, Video, Minus,
  Megaphone, Quote, DollarSign, Layers, ListCollapse, Users, Building2, Timer, Mail,
  SplitSquareHorizontal, PlayCircle, Sparkles, AlertTriangle, MousePointer, MapPin, Table2,
} from 'lucide-react';
import type { CmsBlock, CmsBlockKind } from '@mpbhealth/database';

interface SortableBlockProps {
  block: CmsBlock;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

const BLOCK_ICONS: Partial<Record<CmsBlockKind, typeof Type>> = {
  hero: Layout,
  rich_text: Type,
  image: Image,
  image_grid: Image,
  cta_band: Layout,
  stats: BarChart3,
  two_column: Columns,
  faq: HelpCircle,
  embed: Video,
  spacer: Minus,
  banner: Megaphone,
  testimonial: Quote,
  testimonial_carousel: Quote,
  pricing_table: DollarSign,
  tabs: Layers,
  accordion: ListCollapse,
  team_grid: Users,
  logo_wall: Building2,
  countdown: Timer,
  newsletter_signup: Mail,
  divider: SplitSquareHorizontal,
  video_hero: PlayCircle,
  icon_grid: Sparkles,
  alert_box: AlertTriangle,
  button_group: MousePointer,
  map: MapPin,
  table: Table2,
};

const BLOCK_LABELS: Partial<Record<CmsBlockKind, string>> = {
  hero: 'Hero',
  rich_text: 'Rich Text',
  image: 'Image',
  image_grid: 'Image Grid',
  cta_band: 'CTA Band',
  stats: 'Stats',
  two_column: 'Two-Column',
  faq: 'FAQ',
  embed: 'Embed',
  spacer: 'Spacer',
  banner: 'Banner',
  testimonial: 'Testimonial',
  testimonial_carousel: 'Testimonials',
  pricing_table: 'Pricing Table',
  tabs: 'Tabs',
  accordion: 'Accordion',
  team_grid: 'Team Grid',
  logo_wall: 'Logo Wall',
  countdown: 'Countdown',
  newsletter_signup: 'Newsletter',
  divider: 'Divider',
  video_hero: 'Video Hero',
  icon_grid: 'Icon Grid',
  alert_box: 'Alert Box',
  button_group: 'Buttons',
  map: 'Map',
  table: 'Table',
};

function getBlockPreview(block: CmsBlock): string {
  const props = block.props as Record<string, unknown>;
  switch (block.kind) {
    case 'hero': return block.props.title || 'Untitled Hero';
    case 'rich_text': return (block.props.html || '').replace(/<[^>]+>/g, '').slice(0, 80) || 'Empty';
    case 'image': return block.props.alt || block.props.src?.split('/').pop() || 'No image';
    case 'image_grid': return `${block.props.items.length} images`;
    case 'cta_band': return block.props.title || 'CTA';
    case 'stats': return `${block.props.items.length} stats`;
    case 'two_column': return block.props.title || 'Two-column section';
    case 'faq': return `${block.props.items.length} questions`;
    case 'embed': return block.props.url || 'No URL';
    case 'spacer': return `${block.props.size || 'md'} spacer`;
    default:
      return (props.title as string) || (props.text as string) || block.kind.replace(/_/g, ' ');
  }
}

export function SortableBlock({ block, isSelected, onSelect, onRemove }: SortableBlockProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = BLOCK_ICONS[block.kind] ?? Layout;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group border-2 transition-colors mx-2 my-1 rounded-lg ${
        isSelected
          ? 'border-th-accent-600 bg-th-accent-600/5'
          : isDragging
            ? 'border-th-accent-400 bg-white'
            : 'border-transparent hover:border-neutral-300'
      }`}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      {/* Drag handle + block label overlay */}
      <div className={`absolute -top-3 left-3 flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium z-10 transition-opacity ${
        isSelected || isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      } bg-th-accent-600 text-white`}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-0.5"
        >
          <GripVertical className="w-3 h-3" />
        </button>
        <Icon className="w-3 h-3" />
        <span>{BLOCK_LABELS[block.kind]}</span>
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className={`absolute -top-3 right-3 p-1 rounded-md text-white bg-rose-500 hover:bg-rose-600 z-10 transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <Trash2 className="w-3 h-3" />
      </button>

      {/* Block preview content */}
      <div className="px-4 py-6 min-h-[60px] flex items-center">
        <div className="flex items-center gap-3 text-neutral-600">
          <Icon className="w-5 h-5 text-neutral-400 flex-shrink-0" />
          <span className="text-sm truncate">{getBlockPreview(block)}</span>
        </div>
      </div>
    </div>
  );
}
