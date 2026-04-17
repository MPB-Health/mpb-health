import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Camera,
  Save,
  X,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Github,
  Globe,
  Phone,
  Smartphone,
  MapPin,
  Clock,
  Languages,
  Mail,
  Building2,
  Briefcase,
  AlertTriangle,
  ArrowLeft,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import { supabase } from '../lib/supabase';

interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  bio: string;
  job_title: string;
  department: string;
  avatar_url: string;
  phone: string;
  mobile_phone: string;
  linkedin_url: string;
  twitter_url: string;
  facebook_url: string;
  instagram_url: string;
  github_url: string;
  website_url: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  timezone: string;
  locale: string;
  created_at: string;
  updated_at: string;
}

const EMPTY_PROFILE: Omit<ProfileData, 'id' | 'created_at' | 'updated_at'> = {
  first_name: '',
  last_name: '',
  display_name: '',
  email: '',
  bio: '',
  job_title: '',
  department: '',
  avatar_url: '',
  phone: '',
  mobile_phone: '',
  linkedin_url: '',
  twitter_url: '',
  facebook_url: '',
  instagram_url: '',
  github_url: '',
  website_url: '',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
  timezone: 'America/New_York',
  locale: 'en-US',
};

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Phoenix',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Argentina/Buenos_Aires',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Amsterdam',
  'Europe/Moscow',
  'Europe/Istanbul',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
];

const LOCALES = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'en-AU', label: 'English (Australia)' },
  { value: 'en-CA', label: 'English (Canada)' },
  { value: 'es-ES', label: 'Spanish (Spain)' },
  { value: 'es-MX', label: 'Spanish (Mexico)' },
  { value: 'fr-FR', label: 'French (France)' },
  { value: 'fr-CA', label: 'French (Canada)' },
  { value: 'de-DE', label: 'German' },
  { value: 'it-IT', label: 'Italian' },
  { value: 'pt-BR', label: 'Portuguese (Brazil)' },
  { value: 'pt-PT', label: 'Portuguese (Portugal)' },
  { value: 'ja-JP', label: 'Japanese' },
  { value: 'ko-KR', label: 'Korean' },
  { value: 'zh-CN', label: 'Chinese (Simplified)' },
  { value: 'zh-TW', label: 'Chinese (Traditional)' },
  { value: 'ar-SA', label: 'Arabic' },
  { value: 'hi-IN', label: 'Hindi' },
];

const URL_PATTERN = /^https?:\/\/.+/;

function isValidUrl(url: string): boolean {
  if (!url) return true;
  return URL_PATTERN.test(url);
}

function getInitials(first: string, last: string, display: string): string {
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (display) return display.slice(0, 2).toUpperCase();
  return '??';
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function roleBadgeClasses(role: string | null): string {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-700';
    case 'admin':
      return 'bg-blue-100 text-blue-700';
    case 'manager':
      return 'bg-green-100 text-green-700';
    case 'advisor':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

export default function UserProfile() {
  const { userId: paramUserId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeOrgId, activeOrg, orgRole } = useOrg();

  const targetUserId = paramUserId ?? user?.id;
  const isOwnProfile = !paramUserId || paramUserId === user?.id;
  const canEdit = isOwnProfile || orgRole === 'owner' || orgRole === 'admin';

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [original, setOriginal] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDirty = useMemo(() => {
    if (!profile || !original) return false;
    return JSON.stringify(profile) !== JSON.stringify(original);
  }, [profile, original]);

  // Warn on unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Fetch profile
  const fetchProfile = useCallback(async () => {
    if (!targetUserId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, display_name, email, bio, job_title, department, avatar_url, phone, mobile_phone, linkedin_url, twitter_url, facebook_url, instagram_url, github_url, website_url, address_line1, address_line2, city, state, postal_code, country, timezone, locale, created_at, updated_at')
        .eq('id', targetUserId)
        .single();

      if (error) throw error;

      const merged: ProfileData = {
        ...EMPTY_PROFILE,
        ...data,
        id: targetUserId,
        created_at: data?.created_at || '',
        updated_at: data?.updated_at || '',
        email: data?.email || user?.email || '',
      };
      setProfile(merged);
      setOriginal(merged);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [targetUserId, user?.email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Field change handler
  const updateField = useCallback(
    (field: keyof ProfileData, value: string) => {
      setProfile((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    [],
  );

  // Save profile
  const handleSave = useCallback(async () => {
    if (!profile || !targetUserId) return;

    const urlFields = [
      'linkedin_url',
      'twitter_url',
      'facebook_url',
      'instagram_url',
      'github_url',
      'website_url',
    ] as const;

    for (const field of urlFields) {
      if (profile[field] && !isValidUrl(profile[field])) {
        toast.error(`Invalid URL in ${field.replace(/_url$/, '').replace(/_/g, ' ')}`);
        return;
      }
    }

    setSaving(true);
    try {
      const { id, created_at, updated_at, email, ...updatable } = profile;
      const { error } = await supabase
        .from('profiles')
        .update(updatable)
        .eq('id', targetUserId);

      if (error) throw error;

      setOriginal(profile);
      toast.success('Profile saved');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [profile, targetUserId]);

  // Cancel changes
  const handleCancel = useCallback(() => {
    if (original) setProfile(original);
  }, [original]);

  // Avatar upload
  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !targetUserId) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be under 2 MB');
        return;
      }

      setUploadingAvatar(true);
      try {
        const ext = file.name.split('.').pop() ?? 'png';
        const path = `${targetUserId}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(path);

        const avatar_url = urlData.publicUrl;

        await supabase
          .from('profiles')
          .update({ avatar_url })
          .eq('id', targetUserId);

        setProfile((prev) => (prev ? { ...prev, avatar_url } : prev));
        setOriginal((prev) => (prev ? { ...prev, avatar_url } : prev));
        toast.success('Avatar updated');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to upload avatar';
        toast.error(message);
      } finally {
        setUploadingAvatar(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [targetUserId],
  );

  // Render helpers --------------------------------------------------

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-th-accent-600 border-t-transparent" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 text-th-text-secondary">
        <UserIcon className="h-12 w-12 opacity-40" />
        <p>Profile not found</p>
        <button
          onClick={() => navigate(-1)}
          className="text-th-accent-600 hover:underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const initials = getInitials(
    profile.first_name,
    profile.last_name,
    profile.display_name,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 pb-28 sm:px-6 lg:px-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        {paramUserId && (
          <button
            onClick={() => navigate(-1)}
            aria-label="Go back"
            className="rounded-lg p-2 text-th-text-secondary hover:bg-surface-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">
            {isOwnProfile ? 'My Profile' : `${profile.first_name || 'User'}'s Profile`}
          </h1>
          <p className="text-sm text-th-text-tertiary">
            {isOwnProfile
              ? 'Manage your personal information and preferences'
              : 'Viewing team member profile'}
          </p>
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Personal Information */}
          <Card title="Personal Information" icon={<UserIcon className="h-5 w-5" />}>
            {/* Avatar row */}
            <div className="mb-6 flex items-center gap-5">
              <div className="relative">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Avatar"
                    className="h-20 w-20 rounded-full object-cover ring-2 ring-th-border"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-th-accent-600 text-xl font-semibold text-white ring-2 ring-th-border">
                    {initials}
                  </div>
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    aria-label="Upload avatar"
                    className="absolute -bottom-1 -right-1 rounded-full bg-th-accent-600 p-1.5 text-white shadow-md hover:bg-th-accent-700 disabled:opacity-50"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  aria-label="Upload avatar image"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div>
                <p className="font-medium text-th-text-primary">
                  {profile.display_name || `${profile.first_name} ${profile.last_name}`.trim() || 'No name set'}
                </p>
                <p className="text-sm text-th-text-tertiary">{profile.email}</p>
                {uploadingAvatar && (
                  <p className="mt-1 text-xs text-th-accent-600">Uploading...</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="First Name"
                value={profile.first_name}
                onChange={(v) => updateField('first_name', v)}
                disabled={!canEdit}
              />
              <Field
                label="Last Name"
                value={profile.last_name}
                onChange={(v) => updateField('last_name', v)}
                disabled={!canEdit}
              />
              <Field
                label="Display Name"
                value={profile.display_name}
                onChange={(v) => updateField('display_name', v)}
                disabled={!canEdit}
                className="sm:col-span-2"
              />
              <div className="sm:col-span-2">
                <Field
                  label="Email"
                  value={profile.email}
                  disabled
                  icon={<Mail className="h-4 w-4" />}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-th-text-secondary">
                  Bio
                </label>
                <textarea
                  value={profile.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  disabled={!canEdit}
                  rows={3}
                  className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm text-th-text-primary placeholder:text-th-text-tertiary focus:border-th-accent-600 focus:outline-none focus:ring-1 focus:ring-th-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="A short bio about yourself..."
                />
              </div>
              <Field
                label="Job Title"
                value={profile.job_title}
                onChange={(v) => updateField('job_title', v)}
                disabled={!canEdit}
                icon={<Briefcase className="h-4 w-4" />}
              />
              <Field
                label="Department"
                value={profile.department}
                onChange={(v) => updateField('department', v)}
                disabled={!canEdit}
                icon={<Building2 className="h-4 w-4" />}
              />
            </div>
          </Card>

          {/* Social Media */}
          <Card title="Social Media" icon={<Globe className="h-5 w-5" />}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="LinkedIn"
                value={profile.linkedin_url}
                onChange={(v) => updateField('linkedin_url', v)}
                disabled={!canEdit}
                icon={<Linkedin className="h-4 w-4" />}
                placeholder="https://linkedin.com/in/..."
                error={profile.linkedin_url && !isValidUrl(profile.linkedin_url) ? 'Invalid URL' : undefined}
              />
              <Field
                label="Twitter / X"
                value={profile.twitter_url}
                onChange={(v) => updateField('twitter_url', v)}
                disabled={!canEdit}
                icon={<Twitter className="h-4 w-4" />}
                placeholder="https://x.com/..."
                error={profile.twitter_url && !isValidUrl(profile.twitter_url) ? 'Invalid URL' : undefined}
              />
              <Field
                label="Facebook"
                value={profile.facebook_url}
                onChange={(v) => updateField('facebook_url', v)}
                disabled={!canEdit}
                icon={<Facebook className="h-4 w-4" />}
                placeholder="https://facebook.com/..."
                error={profile.facebook_url && !isValidUrl(profile.facebook_url) ? 'Invalid URL' : undefined}
              />
              <Field
                label="Instagram"
                value={profile.instagram_url}
                onChange={(v) => updateField('instagram_url', v)}
                disabled={!canEdit}
                icon={<Instagram className="h-4 w-4" />}
                placeholder="https://instagram.com/..."
                error={profile.instagram_url && !isValidUrl(profile.instagram_url) ? 'Invalid URL' : undefined}
              />
              <Field
                label="GitHub"
                value={profile.github_url}
                onChange={(v) => updateField('github_url', v)}
                disabled={!canEdit}
                icon={<Github className="h-4 w-4" />}
                placeholder="https://github.com/..."
                error={profile.github_url && !isValidUrl(profile.github_url) ? 'Invalid URL' : undefined}
              />
              <Field
                label="Website"
                value={profile.website_url}
                onChange={(v) => updateField('website_url', v)}
                disabled={!canEdit}
                icon={<Globe className="h-4 w-4" />}
                placeholder="https://yoursite.com"
                error={profile.website_url && !isValidUrl(profile.website_url) ? 'Invalid URL' : undefined}
              />
            </div>
          </Card>

          {/* Address */}
          <Card title="Address" icon={<MapPin className="h-5 w-5" />}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="Address Line 1"
                value={profile.address_line1}
                onChange={(v) => updateField('address_line1', v)}
                disabled={!canEdit}
                className="sm:col-span-2"
              />
              <Field
                label="Address Line 2"
                value={profile.address_line2}
                onChange={(v) => updateField('address_line2', v)}
                disabled={!canEdit}
                className="sm:col-span-2"
              />
              <Field
                label="City"
                value={profile.city}
                onChange={(v) => updateField('city', v)}
                disabled={!canEdit}
              />
              <Field
                label="State / Province"
                value={profile.state}
                onChange={(v) => updateField('state', v)}
                disabled={!canEdit}
              />
              <Field
                label="Postal Code"
                value={profile.postal_code}
                onChange={(v) => updateField('postal_code', v)}
                disabled={!canEdit}
              />
              <Field
                label="Country"
                value={profile.country}
                onChange={(v) => updateField('country', v)}
                disabled={!canEdit}
              />
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card title="Quick Info" icon={<Shield className="h-5 w-5" />}>
            <div className="flex flex-col items-center gap-3 pb-2 text-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="h-16 w-16 rounded-full object-cover ring-2 ring-th-border"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-th-accent-600 text-lg font-semibold text-white ring-2 ring-th-border">
                  {initials}
                </div>
              )}
              <div>
                <p className="font-semibold text-th-text-primary">
                  {profile.display_name || `${profile.first_name} ${profile.last_name}`.trim() || '—'}
                </p>
                {profile.job_title && (
                  <p className="text-xs text-th-text-tertiary">{profile.job_title}</p>
                )}
              </div>
              {orgRole && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${roleBadgeClasses(orgRole)}`}
                >
                  {orgRole}
                </span>
              )}
            </div>
            <dl className="mt-3 space-y-2 border-t border-th-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-th-text-tertiary">Member since</dt>
                <dd className="font-medium text-th-text-primary">
                  {formatDate(profile.created_at)}
                </dd>
              </div>
              {activeOrg && (
                <div className="flex justify-between">
                  <dt className="text-th-text-tertiary">Organization</dt>
                  <dd className="font-medium text-th-text-primary truncate max-w-[140px]">
                    {activeOrg.name}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Contact Details */}
          <Card title="Contact Details" icon={<Phone className="h-5 w-5" />}>
            <div className="space-y-4">
              <Field
                label="Phone"
                value={profile.phone}
                onChange={(v) => updateField('phone', v)}
                disabled={!canEdit}
                icon={<Phone className="h-4 w-4" />}
                placeholder="+1 (555) 000-0000"
              />
              <Field
                label="Mobile Phone"
                value={profile.mobile_phone}
                onChange={(v) => updateField('mobile_phone', v)}
                disabled={!canEdit}
                icon={<Smartphone className="h-4 w-4" />}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </Card>

          {/* Preferences */}
          <Card title="Preferences" icon={<Clock className="h-5 w-5" />}>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-th-text-secondary">
                  Timezone
                </label>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-th-text-tertiary" />
                  <select
                    value={profile.timezone}
                    onChange={(e) => updateField('timezone', e.target.value)}
                    disabled={!canEdit}
                    aria-label="Timezone"
                    className="w-full appearance-none rounded-lg border border-th-border bg-surface-primary py-2 pl-9 pr-8 text-sm text-th-text-primary focus:border-th-accent-600 focus:outline-none focus:ring-1 focus:ring-th-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-th-text-secondary">
                  Locale
                </label>
                <div className="relative">
                  <Languages className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-th-text-tertiary" />
                  <select
                    value={profile.locale}
                    onChange={(e) => updateField('locale', e.target.value)}
                    disabled={!canEdit}
                    aria-label="Locale"
                    className="w-full appearance-none rounded-lg border border-th-border bg-surface-primary py-2 pl-9 pr-8 text-sm text-th-text-primary focus:border-th-accent-600 focus:outline-none focus:ring-1 focus:ring-th-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {LOCALES.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Sticky save bar */}
      <AnimatePresence>
        {canEdit && isDirty && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-th-border bg-surface-primary/95 backdrop-blur-sm"
          >
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 text-sm text-th-text-secondary">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                You have unsaved changes
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-th-border px-4 py-2 text-sm font-medium text-th-text-primary hover:bg-surface-secondary disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-th-accent-600 px-4 py-2 text-sm font-medium text-white hover:bg-th-accent-700 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------------
// Sub-components
// ------------------------------------------------------------------

function Card({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-th-border bg-surface-primary p-5 shadow-sm"
    >
      <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-th-text-primary">
        <span className="text-th-accent-600">{icon}</span>
        {title}
      </h2>
      {children}
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  icon,
  placeholder,
  error,
  className,
}: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  placeholder?: string;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-th-text-secondary">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-th-text-tertiary">
            {icon}
          </span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`w-full rounded-lg border bg-surface-primary py-2 text-sm text-th-text-primary placeholder:text-th-text-tertiary focus:border-th-accent-600 focus:outline-none focus:ring-1 focus:ring-th-accent-600 disabled:cursor-not-allowed disabled:opacity-60 ${
            icon ? 'pl-9 pr-3' : 'px-3'
          } ${error ? 'border-red-400' : 'border-th-border'}`}
        />
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
