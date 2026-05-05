import { Settings } from "@/components/settings";
import { getTeamMembers } from "@/lib/queries/team";

export default async function SettingsPage() {
  const team = await getTeamMembers();
  return <Settings team={team} />;
}
