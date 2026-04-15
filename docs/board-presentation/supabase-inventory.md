# Supabase Project Inventory -- Live Scan

**Scanned:** April 15, 2026
**Organization:** `tnjjorxikjhjqsiutorv`
**Total Projects:** 13 active (all ACTIVE_HEALTHY)
**Total Edge Functions:** 156+

---

## Full Project Inventory

| # | Project Name | Project ID | Region | Tables | Edge Functions | Created | SaaS Product Mapping |
|---|-------------|-----------|--------|--------|----------------|---------|---------------------|
| 1 | **MPB HEALTH WEBSITE** | `dtmnkzllidaiqyheguhl` | us-east-1 | **330** | **51** | Oct 2025 | **Core CRM Platform** (CRM + Admin + Advisor + Website) |
| 2 | **IT Ticketing Support System** | `hhikjgrttgnvojtunmla` | us-east-1 | **223** | **29** | Sep 2025 | **ITSTS** (standalone/add-on) |
| 3 | **CTO-Dashboard** | `xnijhggwgbxrtvlktviz` | us-east-2 | **155** | -- | Oct 2025 | Internal (HIPAA/Compliance module) |
| 4 | **Marketing Suite** | `tzlvhpultquonblkkpqp` | us-east-1 | **89** | -- | Aug 2025 | Internal (Marketing) |
| 5 | **Champion Ecosystem** | `gqdqranldwtpjahcqquz` | us-west-2 | **69** | 0 | Jan 2026 | **Champion EMS** (enrollment engine schema) |
| 6 | **Champion Enrollment System** | `ciowhwoapfokiiflubxs` | us-east-1 | **60** | **54** | Jun 2025 | **Champion EMS** (production enrollment + edge functions) |
| 7 | **mpb_enrollment** | `eovklvjkpfuozupmbnwv` | us-east-2 | **43** | -- | Jun 2025 | **Champion EMS** (staging/test) |
| 8 | **Orbit** | `mezijarhetclovsamhoa` | us-east-2 | **43** | 0 | Dec 2025 | **Orbit** (standalone/add-on) |
| 9 | **MPB Health APP** | `qfigouszitcddkhssqxr` | us-east-1 | **20** | **22** | Apr 2025 | **White-Label Mobile App** + **App Admin Dashboard** |
| 10 | **DH-MPB-FORMS** | `mtknofghhfurlyofseqn` | us-west-2 | **18** | 0 | Apr 2026 | **NEW** -- Forms collection system (18 form types) |
| 11 | **Plan Enrollments** | `simckkqvsfgyswxccwjh` | us-west-2 | **10** | -- | Nov 2025 | Enrollment (CarePlus/plan-specific) |
| 12 | **Advisor Landing Page** | `phbfdurbbkucjkoxxxms` | us-east-1 | **6** | -- | Oct 2025 | Minimal (recommendation engine) |
| 13 | **DH Advisor Landing Page** | `zhlqhdsiaaofgrncgumn` | us-west-2 | **2** | -- | Dec 2025 | Minimal (advisor leads) |

---

## Changes Since CTO Roadmap (March 2026)

### New Projects (not in CTO report)
- **DH-MPB-FORMS** (`mtknofghhfurlyofseqn`) -- Created April 1, 2026. Contains 18 form-type tables for healthcare operations forms (Authorization to Disclose PHI, Consent forms, Employer Group Setup, Member Updates, Cancellation Surveys, Advisor Agreements, etc.)

### Renamed Projects
- `ciowhwoapfokiiflubxs` was **"saudemax"** in CTO report, now **"Champion Enrollment System"** -- This is the production enrollment system with 60 tables and 54 edge functions
- `simckkqvsfgyswxccwjh` was **"careplus_enrollment"** in CTO report, now **"Plan Enrollments"**

### Removed/Paused Projects (were in CTO report, no longer active)
- **Agent System** (`wndaswxzvammnccbedbq`) -- was 23 tables, 7 affiliates
- **HealthShare-Traditional** (`kyeiqnoxgmgudysozged`) -- was 1 table
- **bolt-native-database** (`ckwknswhgfuziiwjxoww`) -- was 1 table

### Edge Function Growth
- CTO report (March 2026): 86 total edge functions
- Live scan (April 2026): **156+ total edge functions** (82% increase in 3 weeks)
  - MPB HEALTH WEBSITE: 44 -> **51** (+7)
  - MPB Health APP: 16 -> **22** (+6)
  - Champion Enrollment System: unknown -> **54** (newly tracked)
  - ITSTS: 26 -> **29** (+3)

---

## Product-to-Project Mapping (Final)

### Core CRM Platform (THE CORE)
| Component | Supabase Project | Tables | Functions |
|-----------|-----------------|--------|-----------|
| CRM + Admin + Advisor + Website | `dtmnkzllidaiqyheguhl` | 330 | 51 |
| **Total** | **1 project** | **330** | **51** |

### Champion EMS (Add-on / Standalone)
| Component | Supabase Project | Tables | Functions |
|-----------|-----------------|--------|-----------|
| Production enrollment + billing | `ciowhwoapfokiiflubxs` | 60 | 54 |
| Enrollment engine schema | `gqdqranldwtpjahcqquz` | 69 | 0 |
| Staging/test | `eovklvjkpfuozupmbnwv` | 43 | 0 |
| Plan-specific enrollments | `simckkqvsfgyswxccwjh` | 10 | 0 |
| **Total** | **4 projects** | **182** | **54** |
| **Consolidation target** | **1-2 projects** | | |

### ITSTS (Add-on / Standalone)
| Component | Supabase Project | Tables | Functions |
|-----------|-----------------|--------|-----------|
| Full ITSM platform | `hhikjgrttgnvojtunmla` | 223 | 29 |
| **Total** | **1 project** | **223** | **29** |

### Orbit (Add-on / Standalone)
| Component | Supabase Project | Tables | Functions |
|-----------|-----------------|--------|-----------|
| Work management | `mezijarhetclovsamhoa` | 43 | 0 |
| **Total** | **1 project** | **43** | **0** |

### White-Label Mobile App + App Admin (Add-on)
| Component | Supabase Project | Tables | Functions |
|-----------|-----------------|--------|-----------|
| Member app + admin | `qfigouszitcddkhssqxr` | 20 | 22 |
| **Total** | **1 project** | **20** | **22** |

### Internal / Non-Licensable
| Component | Supabase Project | Tables | Functions |
|-----------|-----------------|--------|-----------|
| CTO Dashboard / HIPAA | `xnijhggwgbxrtvlktviz` | 155 | -- |
| Marketing Suite | `tzlvhpultquonblkkpqp` | 89 | -- |
| DH-MPB-FORMS | `mtknofghhfurlyofseqn` | 18 | -- |
| Advisor Landing Page | `phbfdurbbkucjkoxxxms` | 6 | -- |
| DH Advisor Landing Page | `zhlqhdsiaaofgrncgumn` | 2 | -- |
| **Total** | **5 projects** | **270** | **--** |

---

## Consolidation Recommendations for SaaS

| Current | Target | Action |
|---------|--------|--------|
| 4 Champion EMS projects | 1-2 projects | Merge staging into production; consolidate plan-specific enrollments |
| 2 Advisor Landing Pages (8 tables total) | 0 standalone | Absorb into Core CRM project |
| CTO Dashboard (155 tables) | Keep separate | Internal tooling, not customer-facing |
| Marketing Suite (89 tables) | Evaluate | Could become a licensable add-on in the future |
| DH-MPB-FORMS (18 tables) | Evaluate | Forms engine could be part of Core CRM or standalone |

**Net result:** 13 projects down to **7-8 projects** for SaaS operations.
