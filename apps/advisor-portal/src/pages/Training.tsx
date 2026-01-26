import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  ChevronRight,
} from 'lucide-react';
import { trainingService, type TrainingCategory } from '@mpbhealth/advisor-core';
import { useAdvisor } from '../contexts/AdvisorContext';

export default function Training() {
  const navigate = useNavigate();
  const { trainingModules, trainingProgress, trainingStats } = useAdvisor();
  const [categories, setCategories] = useState<TrainingCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await trainingService.getCategories();
      setCategories(cats);
    };
    loadCategories();
  }, []);

  const getModuleStatus = (moduleId: string) => {
    const progress = trainingProgress.find((p) => p.module_id === moduleId);
    return progress?.status || 'not_started';
  };

  const filteredModules = trainingModules.filter((module) => {
    const matchesCategory = !selectedCategory || module.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      module.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Training</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Complete your training modules to become certified
          </p>
        </div>
      </div>

      {/* Progress overview */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100">Overall Progress</p>
            <p className="text-3xl font-bold mt-1">
              {trainingStats.completionPercentage.toFixed(0)}%
            </p>
            <p className="text-primary-200 text-sm mt-2">
              {trainingStats.completedModules} of {trainingStats.totalModules} modules
              completed
            </p>
          </div>
          <div className="w-24 h-24 relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${trainingStats.completionPercentage * 2.51} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <GraduationCap className="w-8 h-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-neutral-400" />
          <select
            value={selectedCategory || ''}
            onChange={(e) => setSelectedCategory(e.target.value || null)}
            className="px-4 py-2.5 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Modules grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModules.map((module) => {
          const status = getModuleStatus(module.id);
          const progress = trainingProgress.find((p) => p.module_id === module.id);

          return (
            <button
              key={module.id}
              onClick={() => navigate(`/training/${module.id}`)}
              className="bg-white rounded-xl border border-neutral-200 p-5 text-left hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    status === 'completed'
                      ? 'bg-green-100'
                      : status === 'in_progress'
                      ? 'bg-blue-100'
                      : 'bg-neutral-100'
                  }`}
                >
                  {status === 'completed' ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                  ) : status === 'in_progress' ? (
                    <Play className="w-6 h-6 text-blue-600" />
                  ) : (
                    <GraduationCap className="w-6 h-6 text-neutral-500" />
                  )}
                </div>
                {module.is_required && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                    Required
                  </span>
                )}
              </div>

              <h3 className="font-semibold text-neutral-900 mt-4 line-clamp-1">
                {module.title}
              </h3>
              {module.description && (
                <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                  {module.description}
                </p>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center space-x-1 text-sm text-neutral-500">
                  <Clock className="w-4 h-4" />
                  <span>{module.duration_minutes} min</span>
                </div>
                <span
                  className={`text-sm font-medium ${
                    status === 'completed'
                      ? 'text-green-600'
                      : status === 'in_progress'
                      ? 'text-blue-600'
                      : 'text-neutral-500'
                  }`}
                >
                  {status === 'completed'
                    ? 'Completed'
                    : status === 'in_progress'
                    ? `${progress?.time_spent_minutes || 0} min spent`
                    : 'Not started'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 text-neutral-300" />
          <p className="text-neutral-500">No training modules found</p>
        </div>
      )}
    </div>
  );
}
