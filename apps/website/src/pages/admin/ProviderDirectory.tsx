import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  Search, 
  Filter, 
  Plus,
  Edit,
  MapPin,
  Phone,
  Star,
  StarOff,
  CheckCircle,
  XCircle,
  Building2,
  Stethoscope,
  User,
  Eye,
  Download
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb';
import { AdminLayout } from '../../components/admin/AdminLayout';

interface Provider {
  id: string;
  name: string;
  specialty: string;
  facility_name?: string;
  facility_type: 'hospital' | 'clinic' | 'urgent_care' | 'pharmacy' | 'lab' | 'imaging' | 'specialist';
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  email?: string;
  website?: string;
  accepting_new_patients: boolean;
  is_preferred: boolean;
  is_active: boolean;
  rating?: number;
  review_count?: number;
  languages?: string[];
  insurance_accepted?: string[];
  created_at: string;
  updated_at: string;
}

const ProviderDirectory: React.FC = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, _setSpecialtyFilter] = useState<string>('all');
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [_viewMode, _setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    loadProviders();
  }, [specialtyFilter, facilityTypeFilter, statusFilter]);

  const loadProviders = async () => {
    setLoading(true);

    try {
      let query = supabase
        .from('providers')
        .select('*')
        .order('name', { ascending: true });

      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      if (facilityTypeFilter !== 'all') {
        query = query.eq('facility_type', facilityTypeFilter);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Error loading providers:', error);
      } else {
        setProviders(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    }

    setLoading(false);
  };

  const filteredProviders = providers.filter(provider => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      provider.name?.toLowerCase().includes(search) ||
      provider.specialty?.toLowerCase().includes(search) ||
      provider.facility_name?.toLowerCase().includes(search) ||
      provider.city?.toLowerCase().includes(search) ||
      provider.state?.toLowerCase().includes(search)
    );
  });

  const getFacilityIcon = (type: string) => {
    switch (type) {
      case 'hospital':
        return <Building2 className="h-5 w-5 text-red-500" />;
      case 'clinic':
        return <Stethoscope className="h-5 w-5 text-blue-500" />;
      case 'urgent_care':
        return <Building2 className="h-5 w-5 text-orange-500" />;
      case 'pharmacy':
        return <Building2 className="h-5 w-5 text-green-500" />;
      case 'lab':
        return <Building2 className="h-5 w-5 text-purple-500" />;
      case 'imaging':
        return <Building2 className="h-5 w-5 text-cyan-500" />;
      case 'specialist':
        return <User className="h-5 w-5 text-indigo-500" />;
      default:
        return <Building2 className="h-5 w-5 text-gray-500" />;
    }
  };

  const _getFacilityTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      hospital: 'Hospital',
      clinic: 'Clinic',
      urgent_care: 'Urgent Care',
      pharmacy: 'Pharmacy',
      lab: 'Laboratory',
      imaging: 'Imaging Center',
      specialist: 'Specialist'
    };
    return labels[type] || type;
  };

  const handleToggleActive = async (providerId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('providers')
      .update({ is_active: !currentStatus })
      .eq('id', providerId);

    if (!error) {
      loadProviders();
    }
  };

  const handleTogglePreferred = async (providerId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('providers')
      .update({ is_preferred: !currentStatus })
      .eq('id', providerId);

    if (!error) {
      loadProviders();
    }
  };

  const stats = {
    total: providers.length,
    active: providers.filter(p => p.is_active).length,
    preferred: providers.filter(p => p.is_preferred).length,
    acceptingPatients: providers.filter(p => p.accepting_new_patients).length
  };

  const handleExport = () => {
    const csvContent = [
      ['Name', 'Specialty', 'Facility', 'Type', 'Address', 'City', 'State', 'ZIP', 'Phone', 'Status'].join(','),
      ...filteredProviders.map(p => [
        `"${p.name}"`,
        `"${p.specialty}"`,
        `"${p.facility_name || ''}"`,
        p.facility_type,
        `"${p.address}"`,
        p.city,
        p.state,
        p.zip_code,
        p.phone,
        p.is_active ? 'Active' : 'Inactive'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `provider-directory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <AdminLayout activeView="providers" onViewChange={(view) => navigate(`/admin?view=${view}`)}>
      <Helmet>
        <title>Provider Directory - Admin - MPB Health</title>
        <meta name="description" content="Manage healthcare provider listings" />
      </Helmet>

      <div>
        <AdminBreadcrumb currentPage="Provider Directory" />

          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">Provider Directory</h1>
                <p className="mt-2 text-neutral-600">Manage healthcare provider listings</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex items-center gap-2" onClick={handleExport}>
                  <Download className="h-5 w-5" />
                  Export
                </Button>
                <Button className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add Provider
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-blue-50 border-l-4 border-blue-600">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Total Providers</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.total}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-green-50 border-l-4 border-green-600">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Active</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.active}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-amber-50 border-l-4 border-amber-600">
              <div className="flex items-center gap-3">
                <Star className="h-8 w-8 text-amber-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Preferred</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.preferred}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-purple-50 border-l-4 border-purple-600">
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-purple-600" />
                <div>
                  <div className="text-sm font-medium text-neutral-600">Accepting Patients</div>
                  <div className="text-2xl font-bold text-neutral-900">{stats.acceptingPatients}</div>
                </div>
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search by name, specialty, facility, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-5 w-5 text-neutral-600" />
                <select
                  value={facilityTypeFilter}
                  onChange={(e) => setFacilityTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="hospital">Hospital</option>
                  <option value="clinic">Clinic</option>
                  <option value="urgent_care">Urgent Care</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="lab">Laboratory</option>
                  <option value="imaging">Imaging Center</option>
                  <option value="specialist">Specialist</option>
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Providers List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredProviders.length === 0 ? (
            <Card className="p-12 text-center">
              <Building2 className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">No providers found</h3>
              <p className="text-neutral-600">No providers match your criteria</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProviders.map((provider) => (
                <Card 
                  key={provider.id} 
                  className={`p-6 hover:shadow-md transition-shadow ${
                    provider.is_preferred ? 'ring-2 ring-amber-300' : ''
                  } ${!provider.is_active ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-neutral-100 rounded-lg">
                        {getFacilityIcon(provider.facility_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-neutral-900">{provider.name}</h3>
                        <p className="text-sm text-neutral-600">{provider.specialty}</p>
                      </div>
                    </div>
                    {provider.is_preferred && (
                      <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
                    )}
                  </div>

                  {provider.facility_name && (
                    <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                      <Building2 className="h-4 w-4" />
                      {provider.facility_name}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                    <MapPin className="h-4 w-4" />
                    {provider.city}, {provider.state} {provider.zip_code}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                    <Phone className="h-4 w-4" />
                    {provider.phone}
                  </div>

                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-neutral-200">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      provider.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {provider.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                      {provider.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      provider.accepting_new_patients ? 'bg-blue-100 text-blue-700' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {provider.accepting_new_patients ? 'Accepting Patients' : 'Not Accepting'}
                    </span>
                  </div>

                  <div className="flex justify-between mt-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTogglePreferred(provider.id, provider.is_preferred)}
                        className={`p-2 rounded-lg ${provider.is_preferred ? 'bg-amber-100 text-amber-600' : 'bg-neutral-100 text-neutral-400'}`}
                        title={provider.is_preferred ? 'Remove from preferred' : 'Mark as preferred'}
                      >
                        {provider.is_preferred ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleToggleActive(provider.id, provider.is_active)}
                        className={`p-2 rounded-lg ${provider.is_active ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-400'}`}
                        title={provider.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {provider.is_active ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
    </AdminLayout>
  );
};

export default ProviderDirectory;

