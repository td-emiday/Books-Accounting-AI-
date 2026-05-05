// Live team-members loader. Pulls workspace_members joined with profiles
// for the currently-active workspace. Falls back to the mock list for the
// anonymous preview path so the Settings UI is never empty on stage.

import { createClient } from "@/lib/supabase/server";
import {
  TEAM_MEMBERS as MOCK_TEAM,
  type TeamMember,
} from "@/lib/data/settings";

type Row = {
  role: string;
  profile: { full_name: string | null; email: string | null } | null;
};

const ROLE_LABEL: Record<string, TeamMember["role"]> = {
  OWNER: "Owner",
  ADMIN: "Finance lead",
  MEMBER: "Bookkeeper",
  VIEWER: "External accountant",
};

const AVATAR_PALETTE = ["#d8d2c4", "#c4d8d2", "#d2c4d8", "#d8c4c4", "#c4cad8"];

export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return MOCK_TEAM;

  // Find the user's primary workspace, then list members of it.
  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership?.workspace_id) return MOCK_TEAM;

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, profile:profiles (full_name, email)")
    .eq("workspace_id", membership.workspace_id)
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) return MOCK_TEAM;

  return (data as unknown as Row[]).map((row, i) => {
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    const name = profile?.full_name ?? profile?.email ?? "Teammate";
    const email = profile?.email ?? "—";
    return {
      name,
      email,
      role: ROLE_LABEL[row.role] ?? "Bookkeeper",
      avatarColor: AVATAR_PALETTE[i % AVATAR_PALETTE.length],
    };
  });
}
