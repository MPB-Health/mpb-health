# MPB Health Platform

Health benefits management platform: a client-facing website plus staff- and
advisor-facing portals, sharing one Supabase backend. Mid-flight white-label
pivot to the multi-tenant ARYX platform, with MPB Health as the first tenant.

## Language

**Website**:
The client-facing app (`apps/website`): marketing site, Member Portal, and
Embedded CMS in one deployment at mpb.health.
_Avoid_: marketing site (it's more than that), main app

**Portal**:
A staff- or advisor-facing app — advisor-portal, admin-portal,
concierge-portal, staff-hub. Distinct from the Website: portals are internal
audiences; the Website is clients.
_Avoid_: dashboard, app (ambiguous)

**Member**:
An end user enrolled in (or shopping for) a health benefits plan. Members log
in through the Website's Member Portal.
_Avoid_: customer, client, user (ambiguous with staff)

**Member Portal**:
The authenticated member area inside the Website — not a separate app.

**Embedded CMS**:
The staff content-editing area mounted inside the Website under `/admin`.
Duplicates parts of admin-portal; whether staff still use it is an open
question.
_Avoid_: admin site (confusable with admin-portal)

**ITSTS**:
The separate support-ticketing system backed by its own Supabase project.
Users are synced to it; advisors reach it via SSO magic links; `ticket-proxy`
is the bridge.
_Avoid_: support portal (names the UI, not the system)

**ARYX**:
The white-label multi-tenant platform this monorepo is becoming. MPB Health is
its first tenant. The external `aryx-crm` repo is the system of record for CRM.
