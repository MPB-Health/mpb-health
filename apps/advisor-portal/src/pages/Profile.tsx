import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Camera,
  Save,
  Award,
  GraduationCap,
  Video,
  FileText,
  CheckCircle2,
  Download,
} from 'lucide-react';
import {
  profileService,
  trainingService,
  type Certification,
} from '@mpbhealth/advisor-core';
import { Button } from '@mpbhealth/ui';
import { useAdvisor } from '../contexts/AdvisorContext';
import { generateCertificate } from '../utils/generateCertificate';

export default function Profile() {
  const { profile, trainingStats, refreshProfile } = useAdvisor();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({
    meetingsAttended: 0,
    formsSubmitted: 0,
  });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone || '',
      });

      // Load certifications and stats
      const loadData = async () => {
        const [certs, advisorStats] = await Promise.all([
          trainingService.getCertifications(profile.id),
          profileService.getAdvisorStats(profile.id),
        ]);
        setCertifications(certs);
        setStats({
          meetingsAttended: advisorStats.meetingsAttended,
          formsSubmitted: advisorStats.formsSubmitted,
        });
      };
      loadData();
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      await profileService.updateProfile(profile.id, formData);
      await refreshProfile();
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    try {
      await profileService.uploadAvatar(profile.id, file);
      await refreshProfile();
      toast.success('Avatar updated!');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to upload avatar';
      toast.error(message);
    }
  };

  const quizCert = certifications.find(c => c.name === 'MPB Healthcare Advisor');

  const handleDownloadCertificate = async () => {
    if (!profile || !quizCert) return;
    setGenerating(true);
    try {
      const date = new Date(quizCert.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const blob = await generateCertificate(
        `${profile.first_name} ${profile.last_name}`,
        date,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MPB_Healthcare_Advisor_Certificate.png';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerating(false);
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-th-text-primary">My Profile</h1>
        <p className="text-th-text-tertiary text-sm mt-1">
          Manage your profile and view your achievements
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                aria-hidden="true"
                role="presentation"
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-surface-tertiary rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-th-text-tertiary" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-th-accent-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-th-accent-700 transition-colors">
              <Camera className="w-4 h-4 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Info */}
          <div className="flex-1">
            {editing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-th-text-secondary mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-th-border rounded-lg bg-surface-primary text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <Button type="button" variant="primary" onClick={handleSave} disabled={saving}>
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-th-text-primary">
                      {profile.first_name} {profile.last_name}
                    </h2>
                    <p className="text-th-text-tertiary">{profile.specialization}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
                    Edit Profile
                  </Button>
                </div>
                <div className="flex items-center space-x-6 mt-4 text-sm text-th-text-secondary">
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>{profile.email}</span>
                  </div>
                  {profile.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Certificate Download */}
      {quizCert && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-50 dark:from-blue-950/30 dark:to-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h2 className="font-semibold text-th-text-primary">
                  Your earned MPB Certificate is available to download
                </h2>
                <p className="text-sm text-th-text-tertiary mt-0.5">
                  Issued on {new Date(quizCert.issued_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Button type="button" variant="primary" onClick={handleDownloadCertificate} disabled={generating}>
              <Download className="w-4 h-4" />
              <span>{generating ? 'Generating...' : 'Download'}</span>
            </Button>
          </div>
        </div>
      )}

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="bg-surface-primary rounded-xl border border-th-border">
          <div className="p-5 border-b border-th-border-subtle">
            <h2 className="font-semibold text-th-text-primary">Certifications</h2>
          </div>
          <div className="divide-y divide-th-border-subtle">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex items-center space-x-4 p-5">
                {cert.badge_url ? (
                  <img
                    src={cert.badge_url}
                    alt={`${cert.name} certification badge`}
                    className="w-12 h-12 rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-th-text-primary">{cert.name}</p>
                  {cert.description && (
                    <p className="text-sm text-th-text-tertiary">{cert.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-1 text-sm text-th-text-tertiary">
                    <span>Issued: {new Date(cert.issued_at).toLocaleDateString()}</span>
                    {cert.expires_at && (
                      <span>
                        Expires: {new Date(cert.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="bg-surface-primary rounded-xl border border-th-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                profile.status === 'active'
                  ? 'bg-green-500'
                  : profile.status === 'pending'
                  ? 'bg-yellow-500'
                  : 'bg-neutral-400 dark:bg-neutral-600'
              }`}
            />
            <div>
              <p className="font-medium text-th-text-primary capitalize">
                {profile.status}
              </p>
              <p className="text-sm text-th-text-tertiary">Account Status</p>
            </div>
          </div>
          {profile.onboarding_completed ? (
            <span className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span>Onboarding Complete</span>
            </span>
          ) : (
            <span className="text-yellow-600 dark:text-yellow-400">Onboarding In Progress</span>
          )}
        </div>
      </div>
    </div>
  );
}
