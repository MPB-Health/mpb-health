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
} from 'lucide-react';
import {
  profileService,
  trainingService,
  type Certification,
} from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';

export default function Profile() {
  const { profile, trainingStats, refreshProfile } = useAdvisor();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [stats, setStats] = useState({
    meetingsAttended: 0,
    formsSubmitted: 0,
  });
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    bio: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone || '',
        bio: profile.bio || '',
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
      toast.error('Failed to upload avatar');
    }
  };

  if (!profile) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">My Profile</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Manage your profile and view your achievements
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="relative">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-neutral-200 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-neutral-400" />
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-700 transition-colors">
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
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-neutral-900">
                      {profile.first_name} {profile.last_name}
                    </h2>
                    <p className="text-neutral-500">{profile.specialization}</p>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 border border-neutral-200 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
                <div className="flex items-center space-x-6 mt-4 text-sm text-neutral-600">
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
                {profile.bio && (
                  <p className="mt-4 text-neutral-600">{profile.bio}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {trainingStats.completedModules}
              </p>
              <p className="text-sm text-neutral-500">Modules Completed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Video className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {stats.meetingsAttended}
              </p>
              <p className="text-sm text-neutral-500">Meetings Attended</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {stats.formsSubmitted}
              </p>
              <p className="text-sm text-neutral-500">Forms Submitted</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-5">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Award className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-neutral-900">
                {certifications.length}
              </p>
              <p className="text-sm text-neutral-500">Certifications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Certifications */}
      {certifications.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200">
          <div className="p-5 border-b border-neutral-100">
            <h2 className="font-semibold text-neutral-900">Certifications</h2>
          </div>
          <div className="divide-y divide-neutral-100">
            {certifications.map((cert) => (
              <div key={cert.id} className="flex items-center space-x-4 p-5">
                {cert.badge_url ? (
                  <img
                    src={cert.badge_url}
                    alt=""
                    className="w-12 h-12 rounded-lg"
                  />
                ) : (
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Award className="w-6 h-6 text-yellow-600" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-neutral-900">{cert.name}</p>
                  {cert.description && (
                    <p className="text-sm text-neutral-500">{cert.description}</p>
                  )}
                  <div className="flex items-center space-x-4 mt-1 text-sm text-neutral-500">
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
      <div className="bg-white rounded-xl border border-neutral-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-3 h-3 rounded-full ${
                profile.status === 'active'
                  ? 'bg-green-500'
                  : profile.status === 'pending'
                  ? 'bg-yellow-500'
                  : 'bg-neutral-400'
              }`}
            />
            <div>
              <p className="font-medium text-neutral-900 capitalize">
                {profile.status}
              </p>
              <p className="text-sm text-neutral-500">Account Status</p>
            </div>
          </div>
          {profile.onboarding_completed ? (
            <span className="flex items-center space-x-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span>Onboarding Complete</span>
            </span>
          ) : (
            <span className="text-yellow-600">Onboarding In Progress</span>
          )}
        </div>
      </div>
    </div>
  );
}
