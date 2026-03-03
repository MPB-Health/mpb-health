import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Users,
  Loader2,
  X,
  Save,
  Mail,
  Phone,
  Upload,
  Filter,
} from 'lucide-react';
import {
  contactDirectoryService,
  type ContactEntry,
  type ContactCreateInput,
} from '@mpbhealth/admin-core';

const EMPTY_FORM: ContactCreateInput = {
  name: '',
  title: null,
  department: null,
  email: null,
  phone: null,
  extension: null,
  avatar_url: null,
  bio: null,
  is_active: true,
  display_order: 0,
};

export default function ContactDirectory() {
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [stats, setStats] = useState({ total: 0, active: 0 });
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<ContactEntry | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalForm, setModalForm] = useState<ContactCreateInput>(EMPTY_FORM);
  const [modalSaving, setModalSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const tempIdRef = useRef(`new-${Date.now()}`);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [contactsData, deptsData, statsData] = await Promise.all([
        contactDirectoryService.getContacts(true), // include inactive
        contactDirectoryService.getDepartments(),
        contactDirectoryService.getStats(),
      ]);
      setContacts(contactsData);
      setDepartments(deptsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (contact: ContactEntry) => {
    try {
      await contactDirectoryService.toggleActive(contact.id);
      toast.success(contact.is_active ? 'Contact hidden' : 'Contact activated');
      loadData();
    } catch (error) {
      toast.error('Failed to update contact');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    setDeleting(id);
    try {
      await contactDirectoryService.deleteContact(id);
      toast.success('Contact deleted');
      loadData();
    } catch (error) {
      toast.error('Failed to delete contact');
    } finally {
      setDeleting(null);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setUploadingAvatar(true);
    try {
      const id = editingContact?.id || tempIdRef.current;
      const url = await contactDirectoryService.uploadAvatar(file, id);
      setModalForm((p) => ({ ...p, avatar_url: url }));
      toast.success('Avatar uploaded!');
    } catch (error) {
      toast.error('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const openEdit = (contact: ContactEntry) => {
    setEditingContact(contact);
    setModalForm({
      name: contact.name,
      title: contact.title,
      department: contact.department,
      email: contact.email,
      phone: contact.phone,
      extension: contact.extension,
      avatar_url: contact.avatar_url,
      bio: contact.bio,
      is_active: contact.is_active,
      display_order: contact.display_order,
    });
    setShowModal(true);
  };

  const openCreate = () => {
    setEditingContact(null);
    tempIdRef.current = `new-${Date.now()}`;
    setModalForm({ ...EMPTY_FORM, display_order: contacts.length });
    setShowModal(true);
  };

  const handleModalSave = async () => {
    if (!modalForm.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setModalSaving(true);
    try {
      const payload = {
        ...modalForm,
        name: modalForm.name.trim(),
        title: modalForm.title?.trim() || null,
        department: modalForm.department?.trim() || null,
        email: modalForm.email?.trim() || null,
        phone: modalForm.phone?.trim() || null,
        extension: modalForm.extension?.trim() || null,
        bio: modalForm.bio?.trim() || null,
      };

      if (editingContact) {
        await contactDirectoryService.updateContact(editingContact.id, payload);
        toast.success('Contact updated!');
      } else {
        await contactDirectoryService.createContact(payload);
        toast.success('Contact created!');
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      toast.error('Failed to save contact');
    } finally {
      setModalSaving(false);
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = !filterDept || c.department === filterDept;
    return matchesSearch && matchesDept;
  });

  // Group by department for display
  const grouped = filteredContacts.reduce<Record<string, ContactEntry[]>>((acc, contact) => {
    const dept = contact.department || 'General';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(contact);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-th-accent-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-th-text-primary">Contact Directory</h1>
          <p className="text-th-text-tertiary text-sm mt-1">Staff contacts displayed in the advisor portal</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center space-x-2 px-4 py-2.5 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Contact</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'Total Contacts', value: stats.total, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
          { label: 'Active', value: stats.active, color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400' },
        ].map((s) => (
          <div key={s.label} className="bg-surface-primary rounded-xl border border-th-border p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-xl ${s.color}`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-th-text-primary">{s.value}</p>
              <p className="text-sm text-th-text-tertiary">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-th-border rounded-xl text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
          />
        </div>
        {departments.length > 0 && (
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-th-text-tertiary pointer-events-none" />
            <select
              aria-label="Filter by department"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="pl-10 pr-8 py-2.5 bg-surface-primary border border-th-border rounded-xl text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500 appearance-none"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Contacts grouped by department */}
      {filteredContacts.length === 0 ? (
        <div className="bg-surface-primary rounded-xl border border-th-border text-center py-16">
          <Users className="w-12 h-12 mx-auto mb-4 text-th-text-tertiary" />
          <h3 className="text-lg font-semibold text-th-text-primary mb-1">No contacts found</h3>
          <p className="text-th-text-tertiary mb-6">
            {searchQuery || filterDept ? 'Try adjusting your filters' : 'Add your first staff contact'}
          </p>
          {!searchQuery && !filterDept && (
            <button
              onClick={openCreate}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Contact</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([dept, deptContacts]) => (
            <div key={dept}>
              <h2 className="text-sm font-semibold text-th-text-tertiary uppercase tracking-wide mb-3">{dept}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {deptContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`bg-surface-primary rounded-xl border border-th-border p-5 group relative ${
                      !contact.is_active ? 'opacity-60' : ''
                    }`}
                  >
                    {/* Hover actions */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleToggleActive(contact)}
                        title={contact.is_active ? 'Hide' : 'Show'}
                        className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                      >
                        {contact.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => openEdit(contact)}
                        title="Edit"
                        className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-surface-tertiary hover:text-th-text-primary transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        disabled={deleting === contact.id}
                        title="Delete"
                        className="p-1.5 rounded-lg text-th-text-tertiary hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                      >
                        {deleting === contact.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      {contact.avatar_url ? (
                        <img
                          src={contact.avatar_url}
                          alt={contact.name}
                          className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-th-accent-100 dark:bg-th-accent-900/30 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-semibold text-th-accent-600">
                            {contact.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-th-text-primary truncate">{contact.name}</h3>
                        {contact.title && (
                          <p className="text-xs text-th-text-secondary truncate">{contact.title}</p>
                        )}
                      </div>
                    </div>

                    {/* Contact details */}
                    <div className="mt-3 space-y-1">
                      {contact.email && (
                        <div className="flex items-center gap-1.5 text-xs text-th-text-tertiary">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{contact.email}</span>
                        </div>
                      )}
                      {contact.phone && (
                        <div className="flex items-center gap-1.5 text-xs text-th-text-tertiary">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          <span>{contact.phone}{contact.extension ? ` x${contact.extension}` : ''}</span>
                        </div>
                      )}
                    </div>

                    {!contact.is_active && (
                      <span className="absolute bottom-3 left-3 text-xs text-gray-400">Hidden</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-primary rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-th-border sticky top-0 bg-surface-primary">
              <h3 className="text-lg font-semibold text-th-text-primary">
                {editingContact ? 'Edit Contact' : 'New Contact'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 text-th-text-tertiary hover:text-th-text-primary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {modalForm.avatar_url ? (
                    <img src={modalForm.avatar_url} alt="Avatar" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-surface-tertiary flex items-center justify-center">
                      <Users className="w-7 h-7 text-th-text-tertiary" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1.5 border border-th-border rounded-lg text-sm text-th-text-secondary hover:bg-surface-tertiary transition-colors"
                  >
                    {uploadingAvatar ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Upload Photo
                  </button>
                  <input
                    type="url"
                    value={modalForm.avatar_url || ''}
                    onChange={(e) => setModalForm((p) => ({ ...p, avatar_url: e.target.value || null }))}
                    placeholder="Or paste image URL"
                    className="w-full px-3 py-1.5 bg-surface-primary border border-th-border rounded-lg text-sm text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                  <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Name *</label>
                <input
                  type="text"
                  value={modalForm.name}
                  onChange={(e) => setModalForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Title</label>
                  <input
                    type="text"
                    value={modalForm.title || ''}
                    onChange={(e) => setModalForm((p) => ({ ...p, title: e.target.value || null }))}
                    placeholder="Job title"
                    className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Department</label>
                  {departments.length > 0 ? (
                    <input
                      type="text"
                      list="dept-list"
                      value={modalForm.department || ''}
                      onChange={(e) => setModalForm((p) => ({ ...p, department: e.target.value || null }))}
                      placeholder="Department"
                      className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                    />
                  ) : (
                    <input
                      type="text"
                      value={modalForm.department || ''}
                      onChange={(e) => setModalForm((p) => ({ ...p, department: e.target.value || null }))}
                      placeholder="Department"
                      className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                    />
                  )}
                  <datalist id="dept-list">
                    {departments.map((d) => <option key={d} value={d} />)}
                  </datalist>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Email</label>
                <input
                  type="email"
                  value={modalForm.email || ''}
                  onChange={(e) => setModalForm((p) => ({ ...p, email: e.target.value || null }))}
                  placeholder="email@example.com"
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Phone</label>
                  <input
                    type="tel"
                    value={modalForm.phone || ''}
                    onChange={(e) => setModalForm((p) => ({ ...p, phone: e.target.value || null }))}
                    placeholder="(555) 000-0000"
                    className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Extension</label>
                  <input
                    type="text"
                    value={modalForm.extension || ''}
                    onChange={(e) => setModalForm((p) => ({ ...p, extension: e.target.value || null }))}
                    placeholder="1234"
                    className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-th-text-secondary mb-1">Bio</label>
                <textarea
                  value={modalForm.bio || ''}
                  onChange={(e) => setModalForm((p) => ({ ...p, bio: e.target.value || null }))}
                  placeholder="Short bio..."
                  rows={2}
                  className="w-full px-3 py-2.5 bg-surface-primary border border-th-border rounded-lg text-th-text-primary placeholder-th-text-tertiary focus:outline-none focus:ring-2 focus:ring-th-accent-500 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-th-text-secondary mb-1">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={modalForm.display_order}
                    onChange={(e) => setModalForm((p) => ({ ...p, display_order: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-surface-primary border border-th-border rounded-lg text-th-text-primary focus:outline-none focus:ring-2 focus:ring-th-accent-500"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={modalForm.is_active}
                      onChange={(e) => setModalForm((p) => ({ ...p, is_active: e.target.checked }))}
                      className="rounded border-th-border text-th-accent-600 focus:ring-th-accent-500"
                    />
                    <span className="text-sm text-th-text-secondary">Active</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-th-border">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-th-border rounded-xl text-th-text-secondary hover:bg-surface-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleModalSave}
                disabled={modalSaving}
                className="flex items-center space-x-2 px-4 py-2 bg-th-accent-600 text-white rounded-xl font-medium hover:bg-th-accent-700 disabled:opacity-50 transition-colors"
              >
                {modalSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{editingContact ? 'Update' : 'Create'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
