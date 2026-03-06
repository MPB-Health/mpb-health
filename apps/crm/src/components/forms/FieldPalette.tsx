import {
  Type,
  Mail,
  Phone,
  Hash,
  AlignLeft,
  ChevronDown,
  Circle,
  CheckSquare,
  Calendar,
  EyeOff,
  Heading,
  FileText,
  GripVertical,
} from 'lucide-react';
import type { FormFieldType } from '@mpbhealth/crm-core';

interface FieldTypeConfig {
  type: FormFieldType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'input' | 'choice' | 'layout';
}

const FIELD_TYPES: FieldTypeConfig[] = [
  { type: 'text', label: 'Text', icon: Type, category: 'input' },
  { type: 'email', label: 'Email', icon: Mail, category: 'input' },
  { type: 'phone', label: 'Phone', icon: Phone, category: 'input' },
  { type: 'number', label: 'Number', icon: Hash, category: 'input' },
  { type: 'textarea', label: 'Text Area', icon: AlignLeft, category: 'input' },
  { type: 'date', label: 'Date', icon: Calendar, category: 'input' },
  { type: 'select', label: 'Dropdown', icon: ChevronDown, category: 'choice' },
  { type: 'radio', label: 'Radio', icon: Circle, category: 'choice' },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare, category: 'choice' },
  { type: 'hidden', label: 'Hidden', icon: EyeOff, category: 'input' },
  { type: 'heading', label: 'Heading', icon: Heading, category: 'layout' },
  { type: 'paragraph', label: 'Paragraph', icon: FileText, category: 'layout' },
];

interface FieldPaletteProps {
  onAddField: (type: FormFieldType) => void;
}

export function FieldPalette({ onAddField }: FieldPaletteProps) {
  const inputFields = FIELD_TYPES.filter((f) => f.category === 'input');
  const choiceFields = FIELD_TYPES.filter((f) => f.category === 'choice');
  const layoutFields = FIELD_TYPES.filter((f) => f.category === 'layout');

  const handleDragStart = (e: React.DragEvent, type: FormFieldType) => {
    e.dataTransfer.setData('fieldType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const renderFieldButton = (field: FieldTypeConfig) => {
    const Icon = field.icon;
    return (
      <button
        key={field.type}
        draggable
        onDragStart={(e) => handleDragStart(e, field.type)}
        onClick={() => onAddField(field.type)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-th-text-secondary hover:bg-surface-secondary rounded-lg cursor-grab active:cursor-grabbing transition-colors"
      >
        <GripVertical className="w-3 h-3 text-th-text-tertiary" />
        <Icon className="w-4 h-4" />
        <span>{field.label}</span>
      </button>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold text-th-text-tertiary uppercase tracking-wider px-1">
        Fields
      </h3>

      <div>
        <p className="text-xs font-medium text-th-text-secondary mb-1 px-1">Input</p>
        <div className="space-y-0.5">
          {inputFields.map(renderFieldButton)}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-th-text-secondary mb-1 px-1">Choice</p>
        <div className="space-y-0.5">
          {choiceFields.map(renderFieldButton)}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-th-text-secondary mb-1 px-1">Layout</p>
        <div className="space-y-0.5">
          {layoutFields.map(renderFieldButton)}
        </div>
      </div>
    </div>
  );
}
