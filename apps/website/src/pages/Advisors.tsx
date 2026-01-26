import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAdvisors } from '../hooks/useAdvisors';
import type { Advisor } from '../lib/advisorsService';

function groupByState(list: Advisor[]) {
  const map = new Map<string, Advisor[]>();
  list.forEach((a) => {
    const key = (a.state || '').toUpperCase();
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(a);
  });
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

export function Advisors() {
  const { advisors: all, loading } = useAdvisors();
  const [q, setQ] = useState('');
  const [stateFilter, setStateFilter] = useState<string>('');

  const states = useMemo(() => {
    const s = new Set<string>();
    all.forEach((a) => a.state && s.add(a.state.toUpperCase()));
    return Array.from(s).sort();
  }, [all]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return all.filter((a) => {
      const matchesQ =
        !ql ||
        [a.display_name, a.city, a.state]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(ql));
      const matchesState = !stateFilter || (a.state || '').toUpperCase() === stateFilter;
      return matchesQ && matchesState;
    });
  }, [all, q, stateFilter]);

  const grouped = useMemo(() => groupByState(filtered), [filtered]);

  return (
    <>
      <Helmet>
        <title>Find a Local Advisor | MPB Health</title>
        <meta
          name="description"
          content="Connect with licensed MPB Health advisors in your state. Get personalized guidance on health sharing plans and enrollment."
        />
      </Helmet>

      <section aria-labelledby="advisors-title" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1
                id="advisors-title"
                className="text-2xl md:text-4xl font-semibold tracking-tight text-gray-900"
              >
                Find an Advisor by State
              </h1>
              <p className="mt-2 text-gray-600">
                Search by name or city, then open the advisor's page.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col md:flex-row items-stretch gap-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or city"
              className="w-full md:w-1/2 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Search advisors"
            />
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="w-full md:w-64 rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Filter by state"
            >
              <option value="">All States</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {loading && (
            <div className="mt-10 text-center text-gray-600">Loading advisors...</div>
          )}

          {!loading && (
            <div className="mt-10 space-y-10">
              {grouped.length === 0 && (
                <p className="text-gray-600">No advisors found. Try a different search.</p>
              )}
              {grouped.map(([state, advisors]) => (
                <section key={state} aria-labelledby={`state-${state}`}>
                  <h2
                    id={`state-${state}`}
                    className="sticky top-16 z-10 bg-white/80 backdrop-blur px-2 py-2 text-lg font-semibold text-gray-900"
                  >
                    {state}
                  </h2>
                  <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-sm">
                    {advisors.map((a) => (
                      <li
                        key={a.advisor_id}
                        className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 px-4 py-4"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{a.display_name}</div>
                          <div className="text-sm text-gray-600">
                            {a.city}
                            {a.city && a.state ? ', ' : ''}
                            {a.state}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {a.phone && (
                            <a
                              href={`tel:${a.phone}`}
                              className="rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              Call
                            </a>
                          )}
                          {a.email && (
                            <a
                              href={`mailto:${a.email}`}
                              className="rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-gray-200 hover:bg-gray-50 transition-colors"
                            >
                              Email
                            </a>
                          )}
                          {a.landing_url && (
                            <a
                              href={a.landing_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              View Advisor Page
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default Advisors;
