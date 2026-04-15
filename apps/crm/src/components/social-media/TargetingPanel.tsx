import { HEALTH_INTEREST_TAGS, US_STATES_FOCUS } from './socialMediaTypes';

export interface TargetingPanelProps {
  ageMin: number;
  ageMax: number;
  gender: 'all' | 'women' | 'men';
  states: string[];
  interests: string[];
  audienceName: string;
  onAgeMinChange: (n: number) => void;
  onAgeMaxChange: (n: number) => void;
  onGenderChange: (g: 'all' | 'women' | 'men') => void;
  onStatesChange: (states: string[]) => void;
  onInterestsChange: (tags: string[]) => void;
  onAudienceNameChange: (v: string) => void;
}

function toggle<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];
}

export function TargetingPanel({
  ageMin,
  ageMax,
  gender,
  states,
  interests,
  audienceName,
  onAgeMinChange,
  onAgeMaxChange,
  onGenderChange,
  onStatesChange,
  onInterestsChange,
  onAudienceNameChange,
}: TargetingPanelProps) {
  const reachEst =
    120_000 +
    states.length * 45_000 +
    interests.length * 28_000 +
    Math.max(0, 65 - ageMin) * 1_200 +
    Math.max(0, ageMax - 25) * 900;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-th-text-primary">Audience name</label>
        <input
          type="text"
          value={audienceName}
          onChange={(e) => onAudienceNameChange(e.target.value)}
          className="w-full rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
          placeholder="e.g. FL families — Q2 quote push"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-3 sm:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-sm font-medium text-th-text-primary">Age range</label>
            <span className="text-sm tabular-nums text-th-text-secondary">
              {ageMin} – {ageMax}
            </span>
          </div>
          <div className="space-y-2 rounded-lg border border-th-border bg-surface-tertiary px-3 py-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase text-th-text-tertiary w-8">Min</span>
              <input
                type="range"
                min={18}
                max={65}
                value={ageMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onAgeMinChange(v);
                  if (v > ageMax) onAgeMaxChange(v);
                }}
                className="flex-1 accent-th-accent-600"
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] uppercase text-th-text-tertiary w-8">Max</span>
              <input
                type="range"
                min={18}
                max={65}
                value={ageMax}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onAgeMaxChange(v);
                  if (v < ageMin) onAgeMinChange(v);
                }}
                className="flex-1 accent-th-accent-600"
              />
            </div>
          </div>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label className="text-sm font-medium text-th-text-primary">Gender</label>
          <select
            value={gender}
            onChange={(e) => onGenderChange(e.target.value as 'all' | 'women' | 'men')}
            className="w-full max-w-xs rounded-lg border border-th-border bg-surface-primary px-3 py-2 text-sm"
          >
            <option value="all">All</option>
            <option value="women">Women</option>
            <option value="men">Men</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-th-text-primary">Locations (states)</label>
        <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto rounded-lg border border-th-border p-2 bg-surface-tertiary">
          {US_STATES_FOCUS.map((st) => {
            const on = states.includes(st);
            return (
              <button
                key={st}
                type="button"
                onClick={() => onStatesChange(toggle(states, st))}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  on ? 'bg-th-accent-600 text-white' : 'bg-surface-primary text-th-text-secondary border border-th-border'
                }`}
              >
                {st}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-th-text-primary">Interests</label>
        <div className="flex flex-wrap gap-2">
          {HEALTH_INTEREST_TAGS.map((tag) => {
            const on = interests.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onInterestsChange(toggle(interests, tag))}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  on ? 'bg-violet-600 text-white' : 'bg-surface-tertiary text-th-text-secondary border border-th-border'
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-th-border bg-gradient-to-r from-violet-500/10 to-cyan-500/10 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-th-text-tertiary">Estimated audience</p>
        <p className="mt-1 text-2xl font-bold text-th-text-primary tabular-nums">
          {(reachEst / 1000).toFixed(0)}k–{((reachEst * 1.35) / 1000).toFixed(0)}k
        </p>
        <p className="mt-1 text-xs text-th-text-secondary">
          Illustrative range based on selections (not connected to ad networks).
        </p>
      </div>
    </div>
  );
}
