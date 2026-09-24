-- ==========================================================================
-- CRM Gamification System
-- XP, levels, streaks, achievements, challenges, and win feed
-- ==========================================================================

-- XP & Level Tracking
create table if not exists crm_user_xp (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  total_xp bigint not null default 0,
  level int not null default 1,
  level_name text not null default 'Rookie',
  streak_days int not null default 0,
  streak_start date,
  last_active_date date,
  daily_xp int not null default 0,
  weekly_xp int not null default 0,
  monthly_xp int not null default 0,
  calls_today int not null default 0,
  emails_today int not null default 0,
  tasks_completed_today int not null default 0,
  deals_closed_today int not null default 0,
  daily_target_calls int not null default 15,
  daily_target_emails int not null default 20,
  daily_target_tasks int not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, org_id)
);
-- Achievement Definitions
create table if not exists crm_achievements (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  description text not null,
  icon text not null default 'trophy',
  category text not null default 'general',
  xp_reward int not null default 50,
  criteria_type text not null,
  criteria_threshold int not null default 1,
  rarity text not null default 'common',
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
-- User Achievement Progress
create table if not exists crm_user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  achievement_id uuid not null references crm_achievements(id) on delete cascade,
  earned_at timestamptz not null default now(),
  progress int not null default 0,
  notified boolean not null default false,
  unique(user_id, achievement_id)
);
-- XP Ledger (audit trail for every XP earning event)
create table if not exists crm_xp_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  action text not null,
  xp_amount int not null,
  entity_type text,
  entity_id uuid,
  description text,
  created_at timestamptz not null default now()
);
-- Win Feed (team celebrations)
create table if not exists crm_win_feed (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  win_type text not null,
  title text not null,
  description text,
  value numeric,
  entity_type text,
  entity_id uuid,
  reactions jsonb not null default '{}',
  created_at timestamptz not null default now()
);
-- Challenges (daily/weekly competitions)
create table if not exists crm_challenges (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  description text,
  challenge_type text not null default 'individual',
  metric text not null,
  target int not null,
  xp_reward int not null default 100,
  period text not null default 'weekly',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists crm_challenge_entries (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references crm_challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  progress int not null default 0,
  completed boolean not null default false,
  completed_at timestamptz,
  unique(challenge_id, user_id)
);
-- Indexes
create index if not exists idx_crm_user_xp_org on crm_user_xp(org_id);
create index if not exists idx_crm_user_xp_total on crm_user_xp(org_id, total_xp desc);
create index if not exists idx_crm_user_xp_weekly on crm_user_xp(org_id, weekly_xp desc);
create index if not exists idx_crm_xp_events_user on crm_xp_events(user_id, created_at desc);
create index if not exists idx_crm_xp_events_org on crm_xp_events(org_id, created_at desc);
create index if not exists idx_crm_user_achievements_user on crm_user_achievements(user_id, org_id);
create index if not exists idx_crm_win_feed_org on crm_win_feed(org_id, created_at desc);
create index if not exists idx_crm_challenges_org on crm_challenges(org_id, is_active, ends_at);
create index if not exists idx_crm_challenge_entries_challenge on crm_challenge_entries(challenge_id);
-- RLS Policies
alter table crm_user_xp enable row level security;
alter table crm_achievements enable row level security;
alter table crm_user_achievements enable row level security;
alter table crm_xp_events enable row level security;
alter table crm_win_feed enable row level security;
alter table crm_challenges enable row level security;
alter table crm_challenge_entries enable row level security;
create policy "Org members can read XP data"
  on crm_user_xp for select using (
    org_id in (select org_id from org_memberships where user_id = auth.uid())
  );
create policy "Users can update their own XP"
  on crm_user_xp for update using (user_id = auth.uid());
create policy "Users can insert their own XP"
  on crm_user_xp for insert with check (user_id = auth.uid());
create policy "Org members can read achievements"
  on crm_achievements for select using (
    org_id is null or org_id in (select org_id from org_memberships where user_id = auth.uid())
  );
create policy "Org members can read user achievements"
  on crm_user_achievements for select using (
    org_id in (select org_id from org_memberships where user_id = auth.uid())
  );
create policy "Users can manage their own achievements"
  on crm_user_achievements for all using (user_id = auth.uid());
create policy "Org members can read XP events"
  on crm_xp_events for select using (
    org_id in (select org_id from org_memberships where user_id = auth.uid())
  );
create policy "Users can insert their own XP events"
  on crm_xp_events for insert with check (user_id = auth.uid());
create policy "Org members can read win feed"
  on crm_win_feed for select using (
    org_id in (select org_id from org_memberships where user_id = auth.uid())
  );
create policy "Users can insert wins"
  on crm_win_feed for insert with check (user_id = auth.uid());
create policy "Org members can update win reactions"
  on crm_win_feed for update using (
    org_id in (select org_id from org_memberships where user_id = auth.uid())
  );
create policy "Org members can read challenges"
  on crm_challenges for select using (
    org_id in (select org_id from org_memberships where user_id = auth.uid())
  );
create policy "Org members can read challenge entries"
  on crm_challenge_entries for select using (
    org_id in (select org_id from org_memberships where user_id = auth.uid())
  );
create policy "Users can manage their own challenge entries"
  on crm_challenge_entries for all using (user_id = auth.uid());
-- Seed default achievements (global, not org-specific)
insert into crm_achievements (name, description, icon, category, xp_reward, criteria_type, criteria_threshold, rarity, sort_order) values
  ('First Blood', 'Close your first deal', 'target', 'deals', 100, 'deals_closed', 1, 'common', 1),
  ('Closer', 'Close 10 deals', 'trophy', 'deals', 500, 'deals_closed', 10, 'rare', 2),
  ('Deal Machine', 'Close 50 deals', 'crown', 'deals', 2000, 'deals_closed', 50, 'legendary', 3),
  ('Dial Warrior', 'Make 100 calls', 'phone', 'activity', 200, 'calls_made', 100, 'uncommon', 4),
  ('Phone Phenom', 'Make 500 calls', 'phone-call', 'activity', 1000, 'calls_made', 500, 'rare', 5),
  ('Email Machine', 'Send 100 emails', 'mail', 'activity', 200, 'emails_sent', 100, 'uncommon', 6),
  ('Inbox Zero Hero', 'Send 500 emails', 'mail-check', 'activity', 1000, 'emails_sent', 500, 'rare', 7),
  ('Task Crusher', 'Complete 50 tasks', 'check-square', 'productivity', 300, 'tasks_completed', 50, 'uncommon', 8),
  ('Productivity Machine', 'Complete 200 tasks', 'list-checks', 'productivity', 1000, 'tasks_completed', 200, 'rare', 9),
  ('Perfect Day', 'Hit all daily targets in one day', 'star', 'streaks', 150, 'perfect_day', 1, 'uncommon', 10),
  ('On Fire', 'Maintain a 7-day streak', 'flame', 'streaks', 300, 'streak_days', 7, 'uncommon', 11),
  ('Unstoppable', 'Maintain a 30-day streak', 'zap', 'streaks', 1500, 'streak_days', 30, 'legendary', 12),
  ('Pipeline Builder', 'Add 50 leads to the pipeline', 'git-branch', 'leads', 250, 'leads_created', 50, 'uncommon', 13),
  ('Lead Magnet', 'Add 200 leads to the pipeline', 'magnet', 'leads', 1000, 'leads_created', 200, 'rare', 14),
  ('Speed Demon', 'Move 10 leads to won in under 7 days each', 'rocket', 'velocity', 500, 'fast_closes', 10, 'rare', 15),
  ('Team Player', 'React to 20 wins in the win feed', 'heart', 'social', 100, 'reactions_given', 20, 'common', 16),
  ('Note Taker', 'Log 100 notes or activities', 'pencil', 'activity', 200, 'notes_logged', 100, 'uncommon', 17),
  ('Meeting Master', 'Schedule 50 meetings', 'calendar', 'activity', 300, 'meetings_held', 50, 'uncommon', 18),
  ('Champion', 'Reach level 10', 'award', 'milestones', 1000, 'level_reached', 10, 'rare', 19),
  ('Legend', 'Reach level 25', 'crown', 'milestones', 5000, 'level_reached', 25, 'legendary', 20)
on conflict do nothing;
-- RPC: Get leaderboard for an org
create or replace function crm_get_leaderboard(p_org_id uuid, p_period text default 'weekly')
returns table (
  user_id uuid,
  full_name text,
  email text,
  avatar_url text,
  total_xp bigint,
  period_xp int,
  level int,
  level_name text,
  streak_days int,
  rank bigint
) language sql stable security definer as $$
  select
    x.user_id,
    coalesce(u.raw_user_meta_data->>'full_name', u.email) as full_name,
    u.email,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    x.total_xp,
    case p_period
      when 'daily' then x.daily_xp
      when 'weekly' then x.weekly_xp
      when 'monthly' then x.monthly_xp
      else x.weekly_xp
    end as period_xp,
    x.level,
    x.level_name,
    x.streak_days,
    row_number() over (
      order by case p_period
        when 'daily' then x.daily_xp
        when 'weekly' then x.weekly_xp
        when 'monthly' then x.monthly_xp
        else x.weekly_xp
      end desc
    ) as rank
  from crm_user_xp x
  join auth.users u on u.id = x.user_id
  where x.org_id = p_org_id
  order by period_xp desc;
$$;
-- RPC: Award XP and check level-ups
create or replace function crm_award_xp(
  p_user_id uuid,
  p_org_id uuid,
  p_action text,
  p_xp_amount int,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_description text default null
)
returns jsonb language plpgsql security definer as $$
declare
  v_new_total bigint;
  v_old_level int;
  v_new_level int;
  v_level_name text;
  v_result jsonb;
begin
  -- Upsert XP record
  insert into crm_user_xp (user_id, org_id, total_xp, daily_xp, weekly_xp, monthly_xp, last_active_date)
  values (p_user_id, p_org_id, p_xp_amount, p_xp_amount, p_xp_amount, p_xp_amount, current_date)
  on conflict (user_id, org_id)
  do update set
    total_xp = crm_user_xp.total_xp + p_xp_amount,
    daily_xp = case
      when crm_user_xp.last_active_date = current_date then crm_user_xp.daily_xp + p_xp_amount
      else p_xp_amount
    end,
    weekly_xp = case
      when crm_user_xp.last_active_date >= date_trunc('week', current_date)::date then crm_user_xp.weekly_xp + p_xp_amount
      else p_xp_amount
    end,
    monthly_xp = case
      when crm_user_xp.last_active_date >= date_trunc('month', current_date)::date then crm_user_xp.monthly_xp + p_xp_amount
      else p_xp_amount
    end,
    last_active_date = current_date,
    updated_at = now()
  returning total_xp, level into v_new_total, v_old_level;

  -- Calculate new level (sqrt curve: level = floor(sqrt(total_xp / 100)) + 1)
  v_new_level := greatest(1, floor(sqrt(v_new_total::float / 100.0))::int + 1);
  v_level_name := case
    when v_new_level >= 25 then 'Legend'
    when v_new_level >= 20 then 'Elite'
    when v_new_level >= 15 then 'Master'
    when v_new_level >= 10 then 'Champion'
    when v_new_level >= 7 then 'Veteran'
    when v_new_level >= 5 then 'Pro'
    when v_new_level >= 3 then 'Closer'
    else 'Rookie'
  end;

  -- Update level if changed
  if v_new_level != v_old_level then
    update crm_user_xp
    set level = v_new_level, level_name = v_level_name
    where user_id = p_user_id and org_id = p_org_id;
  end if;

  -- Log XP event
  insert into crm_xp_events (user_id, org_id, action, xp_amount, entity_type, entity_id, description)
  values (p_user_id, p_org_id, p_action, p_xp_amount, p_entity_type, p_entity_id, p_description);

  v_result := jsonb_build_object(
    'total_xp', v_new_total,
    'xp_earned', p_xp_amount,
    'level', v_new_level,
    'level_name', v_level_name,
    'leveled_up', v_new_level > v_old_level
  );

  return v_result;
end;
$$;
