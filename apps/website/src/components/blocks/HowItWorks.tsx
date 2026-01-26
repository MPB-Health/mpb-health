import { useHowItWorks } from '../../hooks/useHowItWorks';
import { TimelineRail } from './TimelineRail';
import { StepPanel } from './StepPanel';
import { MobileJourney } from './MobileJourney';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { Button } from '../ui/Button';

export function HowItWorks() {
  const {
    currentIndex,
    currentStep,
    totalSteps,
    progress,
    isPlaying,
    reduceMotion,
    goNext,
    goPrev,
    selectStep,
    togglePlayPause,
    trackCTA,
    steps,
  } = useHowItWorks();

  return (
    <section
      aria-labelledby="how-mpb-works"
      className="relative w-full"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[#F8FBFF] via-white to-white -z-10" aria-hidden="true" />

      <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
        <header className="mb-6 md:mb-10 text-center md:text-left">
          <h2 id="how-mpb-works" className="text-3xl md:text-4xl font-bold text-neutral-900 mb-3">
            How MPB Health Works
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl">
            Follow the steps to see how community medical cost sharing operates.
          </p>
        </header>

        <div className="hidden md:block">
          <div className="grid grid-cols-12 gap-8 lg:gap-10">
            <div className="col-span-12 md:col-span-4 xl:col-span-3">
              <div className="sticky top-24">
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-sm font-semibold text-neutral-700">
                    Step {currentIndex + 1} of {totalSteps}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Previous step"
                      onClick={goPrev}
                      className="w-8 h-8 p-0 rounded-lg"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label={isPlaying ? "Pause autoplay" : "Play autoplay"}
                      onClick={togglePlayPause}
                      className="w-8 h-8 p-0 rounded-lg"
                    >
                      {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Next step"
                      onClick={goNext}
                      className="w-8 h-8 p-0 rounded-lg"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 transition-all duration-500 ease-out"
                      style={{ width: `${progress * 100}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>

                <TimelineRail
                  steps={steps}
                  currentIndex={currentIndex}
                  onSelectStep={selectStep}
                  reduceMotion={reduceMotion}
                />
              </div>
            </div>

            <div className="col-span-12 md:col-span-8 xl:col-span-9">
              <div
                className="rounded-2xl p-6 md:p-8 bg-white/60 backdrop-blur-sm shadow-lg border border-neutral-200 min-h-[480px]"
                role="tabpanel"
                aria-labelledby={`step-${currentStep.id}`}
                aria-live="polite"
              >
                <StepPanel
                  step={currentStep}
                  stepIndex={currentIndex}
                  reduceMotion={reduceMotion}
                  onCTAClick={trackCTA}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:hidden">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold text-neutral-700">
                Step {currentIndex + 1} of {totalSteps}
              </div>
            </div>

            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 transition-all duration-500 ease-out"
                style={{ width: `${progress * 100}%` }}
                aria-hidden="true"
              />
            </div>
          </div>

          <MobileJourney
            steps={steps}
            currentIndex={currentIndex}
            isPlaying={isPlaying}
            reduceMotion={reduceMotion}
            onSelectStep={selectStep}
            onNext={goNext}
            onPrev={goPrev}
            onTogglePlayPause={togglePlayPause}
            onCTAClick={trackCTA}
          />
        </div>
      </div>
    </section>
  );
}
