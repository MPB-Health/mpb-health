import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Palette,
  Type,
  RectangleHorizontal,
  Maximize2,
  Image as ImageIcon,
  Code,
  Save,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { themeService, type ThemeSettings } from '@mpbhealth/admin-core';
import { useAuth } from '../../../contexts/AuthContext';
import { ImageUploader } from '../../../components/admin/cms/ImageUploader';

const GOOGLE_FONTS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Nunito',
  'Playfair Display',
  'Merriweather',
  'Source Sans Pro',
  'PT Sans',
  'Work Sans',
  'DM Sans',
  'Outfit',
  'Manrope',
  'Plus Jakarta Sans',
];

const DEFAULT_THEME: ThemeSettings = {
  colors: {
    primary: '#1e40af',
    secondary: '#0f766e',
    accent: '#7c3aed',
    background: '#ffffff',
    text_primary: '#1e293b',
    text_secondary: '#64748b',
  },
  typography: {
    heading_font: 'Inter',
    body_font: 'Inter',
    base_size: 16,
  },
  buttons: {
    border_radius: 8,
    shadow: true,
  },
  spacing_multiplier: 1,
  logo_url: '',
  favicon_url: '',
  custom_css: '',
};

export default function ThemeEditor() {
  const { user } = useAuth();
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      setLoading(true);
      const data = await themeService.getTheme();
      setTheme(data);
    } catch (err) {
      toast.error('Failed to load theme settings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const update = useCallback(<K extends keyof ThemeSettings>(key: K, value: ThemeSettings[K]) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  }, []);

  const updateColor = useCallback((key: keyof ThemeSettings['colors'], value: string) => {
    setTheme((prev) => ({
      ...prev,
      colors: { ...prev.colors, [key]: value },
    }));
    setDirty(true);
  }, []);

  const updateTypography = useCallback(<K extends keyof ThemeSettings['typography']>(
    key: K,
    value: ThemeSettings['typography'][K],
  ) => {
    setTheme((prev) => ({
      ...prev,
      typography: { ...prev.typography, [key]: value },
    }));
    setDirty(true);
  }, []);

  const updateButtons = useCallback(<K extends keyof ThemeSettings['buttons']>(
    key: K,
    value: ThemeSettings['buttons'][K],
  ) => {
    setTheme((prev) => ({
      ...prev,
      buttons: { ...prev.buttons, [key]: value },
    }));
    setDirty(true);
  }, []);

  const handleSave = async () => {
    if (!user?.id) return;
    try {
      setSaving(true);
      await themeService.updateTheme(theme, user.id);
      setDirty(false);
      toast.success('Theme saved successfully');
    } catch (err) {
      toast.error('Failed to save theme');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTheme(DEFAULT_THEME);
    setDirty(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Theme & Global Styles</h1>
          <p className="text-sm text-th-text-secondary mt-1">
            Customize colors, typography, and branding for the public website
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-th-border text-th-text-secondary hover:bg-surface-tertiary transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-xl bg-th-accent-600 text-white hover:bg-th-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Theme
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column: settings */}
        <div className="xl:col-span-2 space-y-6">
          {/* Color Palette */}
          <Section icon={Palette} title="Color Palette">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <ColorInput label="Primary" value={theme.colors.primary} onChange={(v) => updateColor('primary', v)} />
              <ColorInput label="Secondary" value={theme.colors.secondary} onChange={(v) => updateColor('secondary', v)} />
              <ColorInput label="Accent" value={theme.colors.accent} onChange={(v) => updateColor('accent', v)} />
              <ColorInput label="Background" value={theme.colors.background} onChange={(v) => updateColor('background', v)} />
              <ColorInput label="Text Primary" value={theme.colors.text_primary} onChange={(v) => updateColor('text_primary', v)} />
              <ColorInput label="Text Secondary" value={theme.colors.text_secondary} onChange={(v) => updateColor('text_secondary', v)} />
            </div>
          </Section>

          {/* Typography */}
          <Section icon={Type} title="Typography">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-th-text-primary mb-1.5">Heading Font</label>
                <select
                  value={theme.typography.heading_font}
                  onChange={(e) => updateTypography('heading_font', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                >
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-primary mb-1.5">Body Font</label>
                <select
                  value={theme.typography.body_font}
                  onChange={(e) => updateTypography('body_font', e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary"
                >
                  {GOOGLE_FONTS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-th-text-primary mb-1.5">
                Base Font Size: {theme.typography.base_size}px
              </label>
              <input
                type="range"
                min={12}
                max={24}
                step={1}
                value={theme.typography.base_size}
                onChange={(e) => updateTypography('base_size', Number(e.target.value))}
                className="w-full accent-th-accent-600"
              />
              <div className="flex justify-between text-xs text-th-text-tertiary mt-1">
                <span>12px</span>
                <span>24px</span>
              </div>
            </div>
          </Section>

          {/* Button Styles */}
          <Section icon={RectangleHorizontal} title="Button Styles">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-th-text-primary mb-1.5">
                  Border Radius: {theme.buttons.border_radius}px
                </label>
                <input
                  type="range"
                  min={0}
                  max={24}
                  step={1}
                  value={theme.buttons.border_radius}
                  onChange={(e) => updateButtons('border_radius', Number(e.target.value))}
                  className="w-full accent-th-accent-600"
                />
                <div className="flex justify-between text-xs text-th-text-tertiary mt-1">
                  <span>0px (sharp)</span>
                  <span>24px (pill)</span>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-6">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={theme.buttons.shadow}
                    onChange={(e) => updateButtons('shadow', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-th-accent-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-th-accent-600" />
                </label>
                <span className="text-sm font-medium text-th-text-primary">Drop Shadow</span>
              </div>
            </div>
          </Section>

          {/* Spacing */}
          <Section icon={Maximize2} title="Spacing">
            <div>
              <label className="block text-sm font-medium text-th-text-primary mb-1.5">
                Spacing Multiplier: {theme.spacing_multiplier.toFixed(2)}x
              </label>
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.05}
                value={theme.spacing_multiplier}
                onChange={(e) => update('spacing_multiplier', Number(e.target.value))}
                className="w-full accent-th-accent-600"
              />
              <div className="flex justify-between text-xs text-th-text-tertiary mt-1">
                <span>0.5x (compact)</span>
                <span>2x (spacious)</span>
              </div>
            </div>
          </Section>

          {/* Branding */}
          <Section icon={ImageIcon} title="Branding">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-th-text-primary mb-2">Logo</label>
                <ImageUploader
                  value={theme.logo_url}
                  onChange={(url) => update('logo_url', url)}
                  slug="theme-logo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-primary mb-2">Favicon</label>
                <ImageUploader
                  value={theme.favicon_url}
                  onChange={(url) => update('favicon_url', url)}
                  slug="theme-favicon"
                />
              </div>
            </div>
          </Section>

          {/* Custom CSS */}
          <Section icon={Code} title="Custom CSS">
            <textarea
              value={theme.custom_css}
              onChange={(e) => update('custom_css', e.target.value)}
              placeholder="/* Add custom CSS overrides here */\n\nbody {\n  /* ... */\n}"
              rows={10}
              className="w-full px-4 py-3 text-sm font-mono bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary placeholder-th-text-tertiary resize-y"
            />
          </Section>
        </div>

        {/* Right column: live preview */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-sm font-semibold text-th-text-primary mb-3 uppercase tracking-wider">
              Live Preview
            </h3>
            <LivePreview theme={theme} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-surface-primary border border-th-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-5 w-5 text-th-accent-600" />
        <h2 className="text-lg font-semibold text-th-text-primary">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-th-text-primary mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-th-border cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 text-sm bg-surface-primary border border-th-border rounded-lg focus:outline-none focus:ring-2 focus:ring-th-accent-500 text-th-text-primary font-mono"
        />
      </div>
    </div>
  );
}

function LivePreview({ theme }: { theme: ThemeSettings }) {
  const previewStyles: React.CSSProperties = {
    backgroundColor: theme.colors.background,
    fontFamily: `"${theme.typography.body_font}", sans-serif`,
    fontSize: `${theme.typography.base_size}px`,
    padding: `${24 * theme.spacing_multiplier}px`,
    borderRadius: '12px',
    border: '1px solid var(--border-color, #e2e8f0)',
    overflow: 'hidden',
  };

  const btnStyle: React.CSSProperties = {
    backgroundColor: theme.colors.primary,
    color: '#fff',
    borderRadius: `${theme.buttons.border_radius}px`,
    padding: `${8 * theme.spacing_multiplier}px ${20 * theme.spacing_multiplier}px`,
    border: 'none',
    fontSize: `${theme.typography.base_size * 0.875}px`,
    fontFamily: `"${theme.typography.body_font}", sans-serif`,
    cursor: 'pointer',
    boxShadow: theme.buttons.shadow ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
  };

  const secondaryBtnStyle: React.CSSProperties = {
    ...btnStyle,
    backgroundColor: theme.colors.secondary,
  };

  const accentBtnStyle: React.CSSProperties = {
    ...btnStyle,
    backgroundColor: theme.colors.accent,
  };

  return (
    <div style={previewStyles} className="space-y-4 shadow-lg">
      {/* Logo preview */}
      {theme.logo_url && (
        <img
          src={theme.logo_url}
          alt="Logo preview"
          className="h-8 object-contain"
        />
      )}

      {/* Heading */}
      <h2
        style={{
          fontFamily: `"${theme.typography.heading_font}", sans-serif`,
          color: theme.colors.text_primary,
          fontSize: `${theme.typography.base_size * 1.5}px`,
          fontWeight: 700,
          margin: 0,
        }}
      >
        Heading Preview
      </h2>

      {/* Body text */}
      <p
        style={{
          color: theme.colors.text_primary,
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        This is how body text will appear on the website with your selected font and size.
      </p>

      <p
        style={{
          color: theme.colors.text_secondary,
          margin: 0,
          fontSize: `${theme.typography.base_size * 0.875}px`,
          lineHeight: 1.5,
        }}
      >
        Secondary text for captions, descriptions, and metadata.
      </p>

      {/* Color swatches */}
      <div className="flex gap-2 flex-wrap">
        {Object.entries(theme.colors).map(([key, color]) => (
          <div key={key} className="text-center">
            <div
              style={{ backgroundColor: color }}
              className="w-8 h-8 rounded-md border border-black/10"
            />
            <span style={{ fontSize: '9px', color: theme.colors.text_secondary }}>
              {key.replace('_', ' ')}
            </span>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button style={btnStyle} type="button">Primary</button>
        <button style={secondaryBtnStyle} type="button">Secondary</button>
        <button style={accentBtnStyle} type="button">Accent</button>
      </div>

      {/* Card preview */}
      <div
        style={{
          background: theme.colors.background,
          border: `1px solid ${theme.colors.text_secondary}33`,
          borderRadius: `${theme.buttons.border_radius}px`,
          padding: `${16 * theme.spacing_multiplier}px`,
        }}
      >
        <h3
          style={{
            fontFamily: `"${theme.typography.heading_font}", sans-serif`,
            color: theme.colors.text_primary,
            fontSize: `${theme.typography.base_size * 1.125}px`,
            fontWeight: 600,
            margin: '0 0 4px 0',
          }}
        >
          Card Component
        </h3>
        <p
          style={{
            color: theme.colors.text_secondary,
            fontSize: `${theme.typography.base_size * 0.8125}px`,
            margin: 0,
          }}
        >
          A sample card showing border radius and spacing.
        </p>
      </div>
    </div>
  );
}
