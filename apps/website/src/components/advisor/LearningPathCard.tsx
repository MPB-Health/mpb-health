import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  Lock,
  TrendingUp,
  Award,
  Clock,
  Target,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/button';

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  totalModules: number;
  completedModules: number;
  estimatedHours: number;
  isRequired: boolean;
  isLocked: boolean;
  icon: string;
  gradient: string;
}

interface LearningPathCardProps {
  path: LearningPath;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  BookOpen,
  Award,
  Target,
  TrendingUp,
};

export function LearningPathCard({ path }: LearningPathCardProps) {
  const Icon = iconMap[path.icon] || BookOpen;
  const completionRate = path.totalModules > 0
    ? Math.round((path.completedModules / path.totalModules) * 100)
    : 0;

  const isComplete = completionRate === 100;
  const isInProgress = completionRate > 0 && completionRate < 100;

  return (
    <Card
      className={`p-6 hover:shadow-lg transition-all ${
        path.isLocked ? 'opacity-60 cursor-not-allowed' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${path.gradient}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex gap-2">
          {path.isRequired && (
            <Badge variant="default" className="bg-red-600">
              Required
            </Badge>
          )}
          {isComplete && (
            <Badge variant="default" className="bg-green-600">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Complete
            </Badge>
          )}
          {path.isLocked && (
            <Badge variant="outline">
              <Lock className="w-3 h-3 mr-1" />
              Locked
            </Badge>
          )}
        </div>
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">{path.title}</h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">{path.description}</p>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {path.completedModules} / {path.totalModules} modules
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {path.estimatedHours}h
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-semibold text-gray-900">{completionRate}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                isComplete
                  ? 'bg-green-600'
                  : isInProgress
                  ? 'bg-blue-600'
                  : 'bg-gray-400'
              }`}
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>

      <Button
        variant={isComplete ? 'outline' : 'primary'}
        className="w-full"
        disabled={path.isLocked}
        asChild={!path.isLocked}
      >
        {path.isLocked ? (
          <span>Complete prerequisites first</span>
        ) : isComplete ? (
          <Link to={`/advisor/training?category=${path.category}`}>Review Path</Link>
        ) : (
          <Link to={`/advisor/training?category=${path.category}`}>
            {isInProgress ? 'Continue Learning' : 'Start Path'}
          </Link>
        )}
      </Button>
    </Card>
  );
}
