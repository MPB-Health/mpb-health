import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Filter,
  Search,
  CheckCircle2,
  Circle,
  PlayCircle,
  Video,
  FileText,
  CheckSquare,
  ExternalLink,
  GraduationCap,
  Library,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  advisorAuthService,
  TrainingModule,
  TrainingProgress,
} from '../../lib/advisorAuthService';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

export default function AdvisorTraining() {
  const { user } = useAuth();
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [progress, setProgress] = useState<Map<string, TrainingProgress>>(new Map());
  const [filteredModules, setFilteredModules] = useState<TrainingModule[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTab, setSelectedTab] = useState<'modules' | 'live' | 'library'>('modules');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrainingData();
  }, [user]);

  useEffect(() => {
    filterModules();
  }, [modules, selectedCategory, selectedTab, searchTerm]);

  const loadTrainingData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const [modulesData, progressData] = await Promise.all([
        advisorAuthService.getTrainingModules(),
        advisorAuthService.getTrainingProgress(user.id),
      ]);

      setModules(modulesData);

      const progressMap = new Map(progressData.map(p => [p.module_id, p]));
      setProgress(progressMap);
    } catch (error) {
      console.error('Error loading training data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterModules = () => {
    let filtered = modules;

    // Filter by tab type
    switch (selectedTab) {
      case 'modules':
        // Training modules: quiz, document content
        filtered = filtered.filter(m =>
          ['quiz', 'document'].includes(m.content_type) || m.is_required
        );
        break;
      case 'live':
        // Live training: video and external links (webinars, live sessions)
        filtered = filtered.filter(m =>
          ['video', 'external_link'].includes(m.content_type)
        );
        break;
      case 'library':
        // Library: all resources (documents, PDFs, reference materials)
        // Show all content in library view
        break;
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(m => m.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.title.toLowerCase().includes(term) ||
          m.description?.toLowerCase().includes(term)
      );
    }

    setFilteredModules(filtered);
  };

  const categories = Array.from(new Set(modules.map(m => m.category)));

  const getModuleIcon = (contentType: string) => {
    switch (contentType) {
      case 'video':
        return Video;
      case 'document':
        return FileText;
      case 'quiz':
        return CheckSquare;
      case 'external_link':
        return ExternalLink;
      default:
        return BookOpen;
    }
  };

  const getStatusBadge = (moduleId: string) => {
    const prog = progress.get(moduleId);
    if (!prog || prog.status === 'not_started') {
      return <Badge variant="outline">Not Started</Badge>;
    }
    if (prog.status === 'in_progress') {
      return <Badge variant="default" className="bg-blue-600">In Progress</Badge>;
    }
    return <Badge variant="default" className="bg-green-600">Completed</Badge>;
  };

  const getStatusIcon = (moduleId: string) => {
    const prog = progress.get(moduleId);
    if (!prog || prog.status === 'not_started') {
      return <Circle className="w-5 h-5 text-gray-400" />;
    }
    if (prog.status === 'in_progress') {
      return <PlayCircle className="w-5 h-5 text-blue-600" />;
    }
    return <CheckCircle2 className="w-5 h-5 text-green-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading training modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Library</h1>
          <p className="text-gray-600">
            Access all training modules and track your progress
          </p>
        </div>

        {/* Training Type Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setSelectedTab('modules')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              selectedTab === 'modules'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <GraduationCap className="w-5 h-5" />
            Modules
          </button>
          <button
            onClick={() => setSelectedTab('live')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              selectedTab === 'live'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Video className="w-5 h-5" />
            Live Training
          </button>
          <button
            onClick={() => setSelectedTab('library')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              selectedTab === 'library'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Library className="w-5 h-5" />
            Library
          </button>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search training modules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {filteredModules.length === 0 ? (
          <Card className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No modules found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredModules.map(module => {
              const Icon = getModuleIcon(module.content_type);
              const prog = progress.get(module.id);
              return (
                <Link
                  key={module.id}
                  to={`/advisor/training/module/${module.id}`}
                  className="block"
                >
                  <Card className="p-4 hover:shadow-md hover:bg-gray-50 transition-all">
                    <div className="flex items-center gap-4">
                      {/* Status Icon */}
                      <div className="flex-shrink-0">
                        {getStatusIcon(module.id)}
                      </div>

                      {/* Content Type Icon */}
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>

                      {/* Module Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 truncate">
                            {module.title}
                          </h3>
                          {module.is_required && (
                            <Badge variant="default" className="bg-red-600 text-xs py-0">Required</Badge>
                          )}
                        </div>
                        {module.description && (
                          <p className="text-sm text-gray-500 truncate mt-0.5">
                            {module.description}
                          </p>
                        )}
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {module.duration_minutes}m
                        </span>
                        <Badge variant="outline" className="capitalize text-xs">
                          {module.content_type.replace(/_/g, ' ')}
                        </Badge>
                        <Button
                          variant={prog?.status === 'completed' ? 'outline' : 'primary'}
                          size="sm"
                          className="w-24"
                        >
                          {prog?.status === 'completed'
                            ? 'Review'
                            : prog?.status === 'in_progress'
                            ? 'Continue'
                            : 'Start'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
