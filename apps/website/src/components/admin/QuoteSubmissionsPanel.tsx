import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertCircle, ExternalLink, ChevronDown, ChevronUp, User, Shield, DollarSign, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { leadSubmissionService } from '../../lib/leadSubmissionService';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

interface FormDataFields {
  household_type?: string;
  state?: string;
  primary_age?: number;
  spouse_age?: number;
  dependents_count?: number;
  coverage_priorities?: string[];
  selected_plan?: string;
  benefit_tier?: string;
  match_percentage?: number;
  calculated_rate?: number;
  traditional_cost?: number;
  monthly_savings?: number;
}

interface QuoteSubmission {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  household_size: number;
  zip_code: string;
  zoho_lead_id: string | null;
  zoho_sync_status: string;
  zoho_sync_attempts: number;
  zoho_error_message: string | null;
  source_cta: string | null;
  created_at: string;
  // Additional fields for complete quote info
  current_insurance: string | null;
  monthly_premium: string | null;
  coverage_preference: string | null;
  primary_concern: string | null;
  contact_preference: string | null;
  source_page: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  form_data: FormDataFields | null;
}

export const QuoteSubmissionsPanel: React.FC = () => {
  const [submissions, setSubmissions] = useState<QuoteSubmission[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, sourceFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('zoho_lead_submissions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') {
        query = query.eq('zoho_sync_status', statusFilter);
      }

      if (sourceFilter !== 'all') {
        if (sourceFilter === 'benefit-interest') {
          query = query.ilike('source_cta', 'benefit-interest-%');
        } else {
          query = query.eq('source_cta', sourceFilter);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setSubmissions(data || []);

      const statsData = await leadSubmissionService.getSubmissionStats(30);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryFailed = async () => {
    setRetrying(true);
    try {
      const result = await leadSubmissionService.retryFailedSubmissions(3);
      alert(`Retry complete:\n${result.attempted} attempted\n${result.succeeded} succeeded\n${result.failed} failed`);
      await loadData();
    } catch (error) {
      console.error('Retry failed:', error);
      alert('Failed to retry submissions');
    } finally {
      setRetrying(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Synced
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case 'retrying':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <RefreshCw className="h-3 w-3" />
            Retrying
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-neutral-900">{stats[0].total_submissions || 0}</div>
              <div className="text-sm text-neutral-600">Total Submissions</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">{stats[0].successful_syncs || 0}</div>
              <div className="text-sm text-neutral-600">Successfully Synced</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">{stats[0].pending_syncs || 0}</div>
              <div className="text-sm text-neutral-600">Pending Sync</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">{stats[0].failed_syncs || 0}</div>
              <div className="text-sm text-neutral-600">Failed Syncs</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Quote Submissions</CardTitle>
            <div className="flex items-center gap-2">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                aria-label="Filter by source"
              >
                <option value="all">All Sources</option>
                <option value="hero-calculator">Hero Calculator</option>
                <option value="quick-start-plan-finder">Quick Start Plan Finder</option>
                <option value="lead-form">Lead Form</option>
                <option value="multi-step-quote-form">Multi-Step Quote</option>
                <option value="benefit-interest">Benefit Interest</option>
                <option value="Quick Rate Estimate">Quick Rate Estimate</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-neutral-300 rounded-lg text-sm"
                aria-label="Filter by sync status"
              >
                <option value="all">All Status</option>
                <option value="success">Synced</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="retrying">Retrying</option>
              </select>
              <Button
                onClick={handleRetryFailed}
                disabled={retrying}
                size="sm"
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                Retry Failed
              </Button>
              <Button onClick={loadData} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-neutral-400" />
              <p className="text-neutral-600 mt-2">Loading submissions...</p>
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-600">No submissions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-sm font-medium text-neutral-600">
                    <th className="pb-3 w-8"></th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Contact</th>
                    <th className="pb-3">Details</th>
                    <th className="pb-3">Source</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Zoho Lead</th>
                    <th className="pb-3">Date</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {submissions.map((submission) => {
                    const isExpanded = expandedRows.has(submission.id);
                    const formData = submission.form_data;
                    
                    return (
                      <React.Fragment key={submission.id}>
                        <tr 
                          className={`border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer ${isExpanded ? 'bg-blue-50' : ''}`}
                          onClick={() => toggleRowExpansion(submission.id)}
                        >
                          <td className="py-3">
                            <button className="p-1 hover:bg-neutral-200 rounded">
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-neutral-600" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-neutral-600" />
                              )}
                            </button>
                          </td>
                          <td className="py-3">
                            <div className="font-medium text-neutral-900">
                              {submission.first_name} {submission.last_name}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="text-neutral-700">{submission.email}</div>
                            <div className="text-xs text-neutral-500">{submission.phone}</div>
                          </td>
                          <td className="py-3">
                            <div className="text-neutral-700">
                              {submission.household_size ? `${submission.household_size} people` : 'N/A'}
                            </div>
                            <div className="text-xs text-neutral-500">{submission.zip_code}</div>
                          </td>
                          <td className="py-3">
                            <div className="text-xs text-neutral-600">
                              {submission.source_cta || 'Direct'}
                            </div>
                          </td>
                          <td className="py-3">
                            <div className="flex flex-col gap-1">
                              {getStatusBadge(submission.zoho_sync_status)}
                              {submission.zoho_sync_attempts > 0 && (
                                <span className="text-xs text-neutral-500">
                                  {submission.zoho_sync_attempts} attempts
                                </span>
                              )}
                              {submission.zoho_error_message && (
                                <div className="flex items-start gap-1 text-xs text-red-600 mt-1">
                                  <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">{submission.zoho_error_message}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3">
                            {submission.zoho_lead_id ? (
                              <a
                                href={`https://crm.zoho.com/crm/org123/tab/Leads/${submission.zoho_lead_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs"
                                onClick={(e) => e.stopPropagation()}
                              >
                                View Lead
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-xs text-neutral-400">Not synced</span>
                            )}
                          </td>
                          <td className="py-3 text-xs text-neutral-600">
                            {new Date(submission.created_at).toLocaleString()}
                          </td>
                        </tr>
                        
                        {/* Expanded Details Row */}
                        {isExpanded && (
                          <tr className="bg-gradient-to-b from-blue-50 to-neutral-50">
                            <td colSpan={8} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                
                                {/* Demographics Section */}
                                <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3 text-neutral-800">
                                    <User className="h-4 w-4 text-blue-600" />
                                    <span className="font-semibold text-sm">Demographics</span>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-neutral-500">Household Type:</span>
                                      <span className="font-medium text-neutral-800 capitalize">
                                        {formData?.household_type || submission.household_size ? 
                                          (formData?.household_type || (submission.household_size === 1 ? 'Individual' : submission.household_size === 2 ? 'Couple' : 'Family')) 
                                          : 'N/A'}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-neutral-500">Primary Age:</span>
                                      <span className="font-medium text-neutral-800">{formData?.primary_age || 'N/A'}</span>
                                    </div>
                                    {formData?.spouse_age && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">Spouse Age:</span>
                                        <span className="font-medium text-neutral-800">{formData.spouse_age}</span>
                                      </div>
                                    )}
                                    {(formData?.dependents_count !== undefined && formData.dependents_count > 0) && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">Dependents:</span>
                                        <span className="font-medium text-neutral-800">{formData.dependents_count}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-neutral-500">State:</span>
                                      <span className="font-medium text-neutral-800">{formData?.state || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-neutral-500">ZIP Code:</span>
                                      <span className="font-medium text-neutral-800">{submission.zip_code || 'N/A'}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Coverage Preferences Section */}
                                <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3 text-neutral-800">
                                    <Shield className="h-4 w-4 text-green-600" />
                                    <span className="font-semibold text-sm">Coverage Details</span>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-neutral-500">Selected Plan:</span>
                                      <span className="font-medium text-neutral-800">{formData?.selected_plan || 'N/A'}</span>
                                    </div>
                                    {formData?.benefit_tier && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">Benefit Tier:</span>
                                        <span className="font-medium text-neutral-800 capitalize">{formData.benefit_tier}</span>
                                      </div>
                                    )}
                                    {formData?.match_percentage !== undefined && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">Match Score:</span>
                                        <span className="font-medium text-green-600">{formData.match_percentage}%</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-neutral-500">Current Insurance:</span>
                                      <span className="font-medium text-neutral-800">{submission.current_insurance || 'N/A'}</span>
                                    </div>
                                    {submission.coverage_preference && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">Preference:</span>
                                        <span className="font-medium text-neutral-800">{submission.coverage_preference}</span>
                                      </div>
                                    )}
                                    {submission.primary_concern && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">Primary Concern:</span>
                                        <span className="font-medium text-neutral-800">{submission.primary_concern}</span>
                                      </div>
                                    )}
                                    {formData?.coverage_priorities && formData.coverage_priorities.length > 0 && (
                                      <div className="pt-1">
                                        <span className="text-neutral-500 block mb-1">Coverage Priorities:</span>
                                        <div className="flex flex-wrap gap-1">
                                          {formData.coverage_priorities.map((priority, idx) => (
                                            <span 
                                              key={idx} 
                                              className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                                            >
                                              {priority}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {/* Pricing Info Section */}
                                <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3 text-neutral-800">
                                    <DollarSign className="h-4 w-4 text-emerald-600" />
                                    <span className="font-semibold text-sm">Pricing Info</span>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    {formData?.calculated_rate !== undefined && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">Calculated Rate:</span>
                                        <span className="font-bold text-emerald-600">
                                          ${formData.calculated_rate.toFixed(2)}/mo
                                        </span>
                                      </div>
                                    )}
                                    {formData?.traditional_cost !== undefined && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">Traditional Cost:</span>
                                        <span className="font-medium text-neutral-800">
                                          ${formData.traditional_cost.toFixed(2)}/mo
                                        </span>
                                      </div>
                                    )}
                                    {formData?.monthly_savings !== undefined && formData.monthly_savings > 0 && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">Monthly Savings:</span>
                                        <span className="font-bold text-green-600">
                                          ${formData.monthly_savings.toFixed(2)}/mo
                                        </span>
                                      </div>
                                    )}
                                    {submission.monthly_premium && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">Current Premium:</span>
                                        <span className="font-medium text-neutral-800">{submission.monthly_premium}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-neutral-500">Contact Pref:</span>
                                      <span className="font-medium text-neutral-800 capitalize">{submission.contact_preference || 'Phone'}</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Source & Attribution Section */}
                                <div className="bg-white rounded-lg p-4 border border-neutral-200 shadow-sm">
                                  <div className="flex items-center gap-2 mb-3 text-neutral-800">
                                    <Globe className="h-4 w-4 text-purple-600" />
                                    <span className="font-semibold text-sm">Source & Attribution</span>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-neutral-500">Source CTA:</span>
                                      <span className="font-medium text-neutral-800 text-right max-w-[150px] truncate" title={submission.source_cta || 'Direct'}>
                                        {submission.source_cta || 'Direct'}
                                      </span>
                                    </div>
                                    {submission.source_page && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">Page:</span>
                                        <span className="font-medium text-neutral-800 text-right max-w-[150px] truncate" title={submission.source_page}>
                                          {submission.source_page}
                                        </span>
                                      </div>
                                    )}
                                    {submission.utm_source && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">UTM Source:</span>
                                        <span className="font-medium text-neutral-800">{submission.utm_source}</span>
                                      </div>
                                    )}
                                    {submission.utm_medium && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">UTM Medium:</span>
                                        <span className="font-medium text-neutral-800">{submission.utm_medium}</span>
                                      </div>
                                    )}
                                    {submission.utm_campaign && (
                                      <div className="flex justify-between">
                                        <span className="text-neutral-500">UTM Campaign:</span>
                                        <span className="font-medium text-neutral-800 text-right max-w-[150px] truncate" title={submission.utm_campaign}>
                                          {submission.utm_campaign}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
