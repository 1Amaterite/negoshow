import { prisma } from './dbService';

export async function checkDataDrought() {
  console.log('[DroughtService] Checking for data drought...');
  
  // Find the latest official (non-proxy) RetailPrice
  const latestPrice = await prisma.retailPrice.findFirst({
    where: { isProxy: false },
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
    
    await triggerProxyIngestion();
    
    // Create alert
    const message = `🚨 Data Drought Alert: Walang natanggap na opisyal na presyo sa loob ng mahigit 2 araw (${daysAgo} days). Proxy baselines ay in-activate.`;
    await prisma.adminAlert.create({
      data: { message }
    });

    return { drought: true, message: "Drought detected, proxy ingestion triggered." };
  }

  console.log('[DroughtService] Data is fresh. No drought detected.');
  return { drought: false, message: "Data is fresh." };
}

export async function triggerProxyIngestion() {
  console.log('[DroughtService] Triggering Broad Source Scanning (Proxy Baseline Ingestion)...');
  
  // Get all active commodities and their latest prices
  const latestPrices = await prisma.retailPrice.groupBy({
    by: ['commodityId', 'marketId'],
    _max: { observedDate: true }
  });

  // For each commodity/market pair, insert a synthetic proxy price
  const proxyRecordsToCreate = [];
  const now = new Date();

  for (const record of latestPrices) {
    if (!record._max.observedDate) continue;

    const oldPrice = await prisma.retailPrice.findFirst({
      where: {
        commodityId: record.commodityId,
        marketId: record.marketId,
        observedDate: record._max.observedDate
      }
    });

    if (oldPrice) {
      // Create synthetic fluctuation (-2% to +2%)
      const variance = (Math.random() * 0.04 - 0.02); 
      const syntheticPrice = Math.round(oldPrice.price * (1 + variance) * 100) / 100;

      proxyRecordsToCreate.push({
        commodityId: oldPrice.commodityId,
        marketId: oldPrice.marketId,
        price: syntheticPrice,
        observedDate: now,
        isProxy: true
      });
    }
  }

  if (proxyRecordsToCreate.length > 0) {
    await prisma.retailPrice.createMany({
      data: proxyRecordsToCreate
    });
    console.log(`[DroughtService] Inserted ${proxyRecordsToCreate.length} proxy prices.`);
  }
}
