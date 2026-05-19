import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Shield,
  Users,
  Loader2,
  Check,
  X,
  Pencil,
  UserCheck,
  Lock,
  Unlock,
} from 'lucide-react';
import { supabase } from '@mpbhealth/database';

type CmsRole = 'editor' | 'publisher' | 'admin' | 'reviewer';

interface CmsUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  cms_role: CmsRole;
}

const CMS_ROLES: { value: CmsRole; label: string; description: string; color: string }[] = [
  { value: 'editor', label: 'Editor', description: 'Can create/edit drafts, cannot publish', color: 'bg-blue-100 text-blue-800' },
  { value: 'publisher', label: 'Publisher', description: 'Can publish, schedule, unpublish', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'admin', label: 'Admin', description: 'Full CMS access + global settings', color: 'bg-purple-100 text-purple-800' },
  { value: 'reviewer', label: 'Reviewer', description: 'Can comment on drafts before publish', color: 'bg-amber-100 text-amber-800' },
];

export default function ContentPermissions() {
  const [users, setUsers] = useState<CmsUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [approvalWorkflow, setApprovalWorkflow] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, first_name, last_name, role, cms_role')
        .in('role', ['admin', 'superadmin', 'staff'])
        .order('first_name');

      if (error) throw error;
      setUsers((data || []).map((u: any) => ({
        ...u,
        cms_role: u.cms_role || 'editor',
      })));
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const updateCmsRole = async (userId: string, cmsRole: CmsRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ cms_role: cmsRole })
        .eq('id', userId);

      if (error) throw error;
      toast.success('Role updated');
      setEditingUserId(null);
      loadUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-th-text-primary">Content Permissions</h1>
        <p className="text-sm text-th-text-secondary mt-1">
          Manage CMS roles and optional approval workflow for your team.
        </p>
      </header>

      {/* Role descriptions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CMS_ROLES.map((role) => (
          <div key={role.value} className="bg-surface-primary border border-th-border rounded-xl p-4">
            <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${role.color} mb-2`}>
              {role.label}
            </span>
            <p className="text-xs text-th-text-secondary">{role.description}</p>
          </div>
        ))}
      </div>

      {/* Approval workflow toggle */}
      <div className="bg-surface-primary border border-th-border rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-th-text-primary">Approval Workflow</p>
            <p className="text-xs text-th-text-secondary">
              Require review and approval before content can be published.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setApprovalWorkflow(!approvalWorkflow);
            toast.success(approvalWorkflow ? 'Approval workflow disabled' : 'Approval workflow enabled');
          }}
          className={`relative w-12 h-6 rounded-full transition-colors ${approvalWorkflow ? 'bg-th-accent-600' : 'bg-neutral-300'}`}
        >
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${approvalWorkflow ? 'translate-x-6' : ''}`} />
        </button>
      </div>

      {approvalWorkflow && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          <p className="font-medium">Workflow active:</p>
          <ol className="mt-2 space-y-1 list-decimal list-inside text-xs">
            <li>Editor creates/edits a draft</li>
            <li>Editor submits for review</li>
            <li>Reviewer approves or requests changes</li>
            <li>Publisher publishes the approved content</li>
          </ol>
        </div>
      )}

      {/* User list */}
      <div className="bg-surface-primary border border-th-border rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-th-border flex items-center gap-2">
          <Users className="w-4 h-4 text-th-text-tertiary" />
          <h3 className="text-sm font-semibold text-th-text-primary">Team Members ({users.length})</h3>
        </div>
        <div className="divide-y divide-th-border/60">
          {users.map((user) => {
            const roleInfo = CMS_ROLES.find((r) => r.value === user.cms_role) || CMS_ROLES[0];
            const isEditing = editingUserId === user.id;

            return (
              <div key={user.id} className="flex items-center justify-between px-4 py-3 hover:bg-surface-secondary/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-th-accent-600/10 flex items-center justify-center text-sm font-medium text-th-accent-700">
                    {user.first_name?.[0]}{user.last_name?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-th-text-primary">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-th-text-tertiary">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      {CMS_ROLES.map((role) => (
                        <button
                          key={role.value}
                          type="button"
                          onClick={() => updateCmsRole(user.id, role.value)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                            user.cms_role === role.value
                              ? role.color
                              : 'bg-surface-tertiary text-th-text-secondary hover:bg-surface-secondary'
                          }`}
                        >
                          {role.label}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setEditingUserId(null)}
                        className="p-1 rounded text-th-text-tertiary hover:bg-surface-tertiary"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingUserId(user.id)}
                        className="p-1.5 rounded text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
