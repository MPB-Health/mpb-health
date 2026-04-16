import { supabase } from "./supabase";

export type UserRole = "guest" | "member" | "advisor" | "admin" | "staff" | "superadmin";

export interface UserProfile {
  id: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function getCurrentUserRole(): Promise<UserRole> {
  const user = await getCurrentUser();

  if (!user) {
    return "guest";
  }

  const profile = await getUserProfile(user.id);

  return profile?.role || "guest";
}

export async function ensureProfile(userId: string, defaultRole: UserRole = "member") {
  const existing = await getUserProfile(userId);

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from("profiles")
    .insert({ id: userId, role: defaultRole })
    .select()
    .single();

  if (error) {
    console.error("Error creating profile:", error);
    return null;
  }

  return data;
}

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function canAccessRoute(userRole: UserRole, path: string): boolean {
  if (path.startsWith("/member")) {
    return hasRole(userRole, ["member", "advisor", "admin", "staff"]);
  }

  if (path.startsWith("/advisor")) {
    return hasRole(userRole, ["advisor", "admin", "staff"]);
  }

  if (path.startsWith("/admin")) {
    return hasRole(userRole, ["admin", "staff"]);
  }

  return true;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  if (data.user) {
    await ensureProfile(data.user.id);
  }

  return data;
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
