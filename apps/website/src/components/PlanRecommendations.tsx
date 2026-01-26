import React from 'react';
import { CheckCircle, Star, TrendingUp, Info } from 'lucide-react';
import { PlanRecommendation } from '../lib/membershipPriorities';
import { cn } from '../lib/utils';

interface PlanRecommendationsProps {
  recommendations: PlanRecommendation[];
  selectedPlan: string | null;
  onSelectPlan: (planId: string) => void;
  className?: string;
}

export const PlanRecommendations: React.FC<PlanRecommendationsProps> = ({
  recommendations,
  selectedPlan,
  onSelectPlan,
  className,
}) => {
  if (recommendations.length === 0) {
    return null;
  }

  const topRecommendations = recommendations.slice(0, 2);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-blue-600" />
        <h4 className="text-sm font-bold text-gray-900">Recommended for You</h4>
      </div>

      <div className="space-y-2">
        {topRecommendations.map((recommendation, index) => (
          <RecommendationCard
            key={recommendation.planId}
            recommendation={recommendation}
            isTopPick={index === 0}
            isSelected={selectedPlan === recommendation.planId}
            onSelect={() => onSelectPlan(recommendation.planId)}
          />
        ))}
      </div>

      {recommendations.length > 2 && (
        <button
          type="button"
          className="w-full text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors py-2 flex items-center justify-center gap-1"
          onClick={() => {
            // Could expand to show all recommendations
          }}
        >
          <Info className="h-3 w-3" />
          View all {recommendations.length} compatible plans
        </button>
      )}
    </div>
  );
};

interface RecommendationCardProps {
  recommendation: PlanRecommendation;
  isTopPick: boolean;
  isSelected: boolean;
  onSelect: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  isTopPick,
  isSelected,
  onSelect,
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
      className={cn(
        'relative w-full p-3 rounded-lg border-2 transition-all text-left group',
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50'
      )}
    >
      {isTopPick && (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
          <Star className="h-2.5 w-2.5 fill-current" />
          BEST MATCH
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {isSelected && <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0" />}
            <h5 className={cn('text-sm font-bold', isSelected ? 'text-blue-900' : 'text-gray-900')}>
              {recommendation.planName}
            </h5>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  recommendation.matchPercentage >= 80
                    ? 'bg-gradient-to-r from-green-500 to-green-600'
                    : recommendation.matchPercentage >= 60
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                    : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                )}
                style={{ width: `${recommendation.matchPercentage}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap">
              {recommendation.matchPercentage}% Match
            </span>
          </div>

          {recommendation.reasons.length > 0 && (
            <div className="space-y-0.5">
              {recommendation.reasons.slice(0, 2).map((reason, idx) => (
                <div key={idx} className="flex items-start gap-1.5">
                  <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-[10px] text-gray-700 leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDetails && recommendation.bestFor.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="text-[9px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Best For:
          </p>
          <div className="flex flex-wrap gap-1">
            {recommendation.bestFor.map((feature, idx) => (
              <span
                key={idx}
                className="inline-flex items-center text-[9px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}
    </button>
  );
};
