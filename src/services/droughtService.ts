import { prisma } from './dbService';

export async function checkDataDrought() {
  console.log('[DroughtService] Checking for data drought...');
  
  // Find the latest official (non-proxy) RetailPrice
  const latestPrice = await prisma.retailPrice.findFirst({
    where: { isProxy: false, isVerified: true },
    orderBy: { observedDate: 'desc' }
  });

  if (!latestPrice) {
    console.log('[DroughtService] No official retail prices found. Cannot determine drought.');
    return { drought: false, message: "No baseline data." };
  }

  const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;
  const now = new Date();
  const timeSinceLastUpdate = now.getTime() - latestPrice.observedDate.getTime();
  
  const isDrought = timeSinceLastUpdate > TWO_DAYS_MS;

  if (isDrought) {
    const daysAgo = (timeSinceLastUpdate / (1000 * 60 * 60 * 24)).toFixed(1);
    console.warn(`[DroughtService] Drought detected! Last update was ${daysAgo} days ago.`);
    
    // Create alert
    const message = `Data Drought Alert: Walang natanggap na opisyal na presyo sa loob ng mahigit 2 araw (${daysAgo} days).`;
    await prisma.adminAlert.create({
      data: { message }
    });

    return { drought: true, message: "Drought detected, alert created." };
  }

  console.log('[DroughtService] Data is fresh. No drought detected.');
  return { drought: false, message: "Data is fresh." };
}
