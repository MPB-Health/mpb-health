import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/Tooltip';

interface GlossaryTooltipProps {
  term: string;
  definition: string;
}

const GlossaryTooltip: React.FC<GlossaryTooltipProps> = ({ term, definition }) => {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger
          className="underline decoration-dotted underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          aria-label={`${term} definition`}
        >
          {term}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-sm leading-snug">
          <p className="font-semibold text-neutral-900 mb-1">{term}</p>
          <p className="text-neutral-600">{definition}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { GlossaryTooltip };
