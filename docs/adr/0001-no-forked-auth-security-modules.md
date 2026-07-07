# No forked auth/security modules in apps

`apps/website` historically carried line-for-line forks of security-critical
modules (login, MFA, rate limiting, password policy, sanitization) whose
canonical versions live in `packages/auth` and `packages/utils`. The forks
drifted in both directions, so security fixes to the packages silently never
reached the client-facing website login. Decided 2026-07-07: the packages are
the single implementation; apps must import them rather than copy them. When
an app genuinely needs different behavior, it gets an explicit option on the
package interface or a small app-side adapter — never a fork. During
consolidation, the package version wins by default; app-only deltas are
individually reviewed and either ported into the package or dropped.

Considered alternative: keeping "mostly converged" app copies with small local
patches — rejected because it recreates the silent-drift problem this decision
exists to end.
