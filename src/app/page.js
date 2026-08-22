import LeagueDashboard from "@/components/LeagueDashboard";
import { getLeagueData } from "@/lib/sleeper";

export default async function Home() {
  const data = await getLeagueData();
  return <LeagueDashboard {...data} />;
}
