import DashboardClient from "./DashboardClient";
import { 
  getCommodities, 
  getTrendData, 
  getDescriptivePrices, 
  getDescriptiveActivity, 
  getLastUpdate 
} from "@/lib/services/analytics";

export default async function DashboardPage() {
  // Fetch sequentially to prevent Prisma connection pool exhaustion (connection_limit=1)
  const commodities = await getCommodities();
  const descActivity = await getDescriptiveActivity('7');
  const lastUpdate = await getLastUpdate();

  const firstId = commodities.length > 0 ? commodities[0].id.toString() : null;
  let initialPredData: any[] = [];
  let initialDescPrices = null;

  if (firstId) {
    initialPredData = await getTrendData(firstId, '7');
    initialDescPrices = await getDescriptivePrices(firstId, '7');
  }

  return (
    <DashboardClient 
      initialCommodities={commodities}
      initialDescActivity={descActivity}
      initialLastUpdate={lastUpdate}
      initialPredData={initialPredData}
      initialDescPrices={initialDescPrices}
      initialFirstId={firstId}
    />
  );
}
