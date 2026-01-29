import React, { useState } from 'react';
import { Plus, Calendar, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/button';
import { supabase } from '../../lib/supabase';

interface AnalyticsEntry {
  date: string;
  page_views: number;
  unique_visitors: number;
  bounce_rate: number;
  avg_session_duration: number;
  conversion_rate: number;
}

export const AnalyticsDataEntryPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<AnalyticsEntry>({
    date: new Date().toISOString().split('T')[0],
    page_views: 0,
    unique_visitors: 0,
    bounce_rate: 0,
    avg_session_duration: 0,
    conversion_rate: 0
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const { error: insertError } = await supabase
        .from('site_analytics')
        .upsert([formData], { onConflict: 'date' });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      // Reset form with incremented date for next entry
      const nextDate = new Date(formData.date);
      nextDate.setDate(nextDate.getDate() + 1);
      setFormData(prev => ({
        ...prev,
        date: nextDate.toISOString().split('T')[0],
        page_views: 0,
        unique_visitors: 0,
        bounce_rate: 0,
        avg_session_duration: 0,
        conversion_rate: 0
      }));
    } catch (err: any) {
      console.error('Error saving analytics:', err);
      setError(err.message || 'Failed to save analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async () => {
    // Generate sample data for the last 30 days
    setLoading(true);
    setError(null);

    try {
      const entries: AnalyticsEntry[] = [];
      const today = new Date();

      for (let i = 30; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        // Generate realistic-looking random data
        const baseViews = Math.floor(Math.random() * 500) + 200;
        const uniqueRatio = 0.6 + Math.random() * 0.2;

        entries.push({
          date: date.toISOString().split('T')[0],
          page_views: baseViews,
          unique_visitors: Math.floor(baseViews * uniqueRatio),
          bounce_rate: Math.floor(Math.random() * 30) + 35,
          avg_session_duration: Math.floor(Math.random() * 180) + 60,
          conversion_rate: Math.random() * 3 + 1
        });
      }

      const { error: insertError } = await supabase
        .from('site_analytics')
        .upsert(entries, { onConflict: 'date' });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error bulk importing:', err);
      setError(err.message || 'Failed to import analytics data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Manual Analytics Entry</h3>
            <p className="text-sm text-neutral-600">Add daily site analytics data manually</p>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={handleBulkImport}
          disabled={loading}
          className="text-sm"
        >
          Import Sample Data (30 days)
        </Button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <p className="text-sm text-green-800">Analytics data saved successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              <Calendar className="inline h-4 w-4 mr-1" />
              Date
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Page Views
            </label>
            <input
              type="number"
              name="page_views"
              value={formData.page_views}
              onChange={handleInputChange}
              min="0"
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Unique Visitors
            </label>
            <input
              type="number"
              name="unique_visitors"
              value={formData.unique_visitors}
              onChange={handleInputChange}
              min="0"
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Bounce Rate (%)
            </label>
            <input
              type="number"
              name="bounce_rate"
              value={formData.bounce_rate}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.1"
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Avg Session (sec)
            </label>
            <input
              type="number"
              name="avg_session_duration"
              value={formData.avg_session_duration}
              onChange={handleInputChange}
              min="0"
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">
              Conversion Rate (%)
            </label>
            <input
              type="number"
              name="conversion_rate"
              value={formData.conversion_rate}
              onChange={handleInputChange}
              min="0"
              max="100"
              step="0.01"
              required
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="inline-flex items-center gap-2">
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Entry
              </>
            )}
          </Button>
        </div>
      </form>
    </Card>
  );
};

