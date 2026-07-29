import prisma from '@/services/dbService';

const globalForTrend = global as unknown as { trendCache: Map<string, { timestamp: number, data: any }> };
const trendCache = globalForTrend.trendCache || new Map<string, { timestamp: number, data: any }>();
if (process.env.NODE_ENV !== 'production') globalForTrend.trendCache = trendCache;

export async function getCommodities() {
  const commodities = await prisma.commodity.findMany({
    include: {
      retailPrices: {
        where: { isVerified: true },
        orderBy: { observedDate: 'desc' },
        take: 30 // Get last 30 days to calculate baseline/30d
      },
      vendorChecks: {
        where: { isVerified: true },
        orderBy: { checkedAt: 'desc' },
        take: 50,
        include: { market: true },
      },
    }
  });

  const data = commodities.map(c => {
    // Calculate current baseline (latest price)
    const latestPrice = c.retailPrices[0]?.price || 0;
    
    // Calculate 30-day baseline average
    const prices30d = c.retailPrices.map(rp => rp.price);
    const avg30d = prices30d.length > 0 
      ? prices30d.reduce((a, b) => a + b, 0) / prices30d.length 
      : latestPrice;

    // Calculate average of recent vendor quotes (asking price)
    const vendorQuotes = c.vendorChecks.map(vc => vc.checkedPrice);
    const vendorQuoteAvg = vendorQuotes.length > 0
      ? vendorQuotes.reduce((a, b) => a + b, 0) / vendorQuotes.length
      : latestPrice; // fallback if no quotes

    // Calculate trend and change based on Vendor Quotes vs Baseline
    const changeAbs = vendorQuoteAvg - latestPrice;
    const change = latestPrice > 0 ? (changeAbs / latestPrice) * 100 : 0;
    
    let trend = "stable";
    if (change > 2) trend = "up";
    if (change < -2) trend = "down";

    let volatility = "Low";
    if (Math.abs(change) > 5) volatility = "Medium";
    if (Math.abs(change) > 10) volatility = "High";

    const sources: {name: string, price: number, distance?: string}[] = [];
    if (c.vendorChecks.length > 0) {
      const marketPrices: Record<string, number[]> = {};
      c.vendorChecks.forEach((vc: any) => {
        const mName = vc.market?.name || "General Market";
        if (!marketPrices[mName]) marketPrices[mName] = [];
        marketPrices[mName].push(vc.checkedPrice);
      });
      
      for (const [mName, prices] of Object.entries(marketPrices)) {
        const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
        
        // Generate a pseudo-random but consistent distance based on market name
        let hash = 0;
        for (let i = 0; i < mName.length; i++) {
          hash = mName.charCodeAt(i) + ((hash << 5) - hash);
        }
        const dist = (1.0 + (Math.abs(hash) % 80) / 10).toFixed(1);

        sources.push({ name: mName, price: avg, distance: `${dist} km` });
      }
      // Sort by lowest price first
      sources.sort((a, b) => a.price - b.price);
    } else {
      sources.push({name: "General Market", price: latestPrice, distance: "-"});
    }

    return {
      id: c.name.toLowerCase().replace(" ", "-"),
      dbId: c.id, // helpful for internal use
      name: c.name,
      tagalog: c.name,
      shortLabel: c.name,
      image: c.imageUrl,
      baseline: Math.round(latestPrice),
      baselineDate: c.retailPrices[0]?.observedDate || null,
      baseline30d: Math.round(avg30d),
      vendorQuoteAvg: Math.round(vendorQuoteAvg),
      trend,
      change: Math.round(change),
      changeAbs: Math.round(changeAbs),
      volatility,
      primarySource: "General Market",
      sources,
      isMock: c.retailPrices[0]?.sourceBulletinId === null
    };
  });

  return data;
}

export async function getTrendData(commodityIdStr: string | null, daysStr: string = '30') {
  if (!commodityIdStr) {
    throw new Error("Missing commodityId");
  }

  const cacheKey = `${commodityIdStr}-${daysStr}`;
  const cached = trendCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 1000 * 3) {
    return cached.data;
  }

  const days = parseInt(daysStr, 10);
  const commodityId = parseInt(commodityIdStr, 10);
  
  let cid: number;
  let commodityName = String(commodityIdStr);
  if (isNaN(commodityId)) {
     // if they pass a string ID, try to look it up. Our frontend previously used "red-onion".
     const c = await prisma.commodity.findFirst({
       where: { name: { contains: commodityIdStr.replace('-', ' '), mode: 'insensitive' } }
     });
     if (!c) throw new Error("Commodity not found");
     cid = c.id;
     commodityName = c.name;
  } else {
     cid = commodityId;
     const c = await prisma.commodity.findUnique({ where: { id: cid } });
     if (c) commodityName = c.name;
  }

  const cutoffDate = new Date();
  cutoffDate.setHours(0, 0, 0, 0);

  const priorPrice = await prisma.retailPrice.findFirst({
    where: {
      commodityId: cid,
      isVerified: true,
      observedDate: { lt: cutoffDate }
    },
    orderBy: { observedDate: 'desc' }
  });

  let currentKnownPrice = priorPrice?.price || 0;
  let lastPriceDate = priorPrice?.observedDate || null;

  const prices = await prisma.retailPrice.findMany({
    where: {
      commodityId: cid,
      isVerified: true,
      observedDate: {
        gte: cutoffDate
      }
    },
    orderBy: { observedDate: 'asc' }
  });

  const pricesByDate: Record<string, any> = {};
  for (const p of prices) {
    const dStr = p.observedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    pricesByDate[dStr] = p;
  }

  let data = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let iterDate = new Date(cutoffDate);
  while (iterDate <= today) {
    const dStr = iterDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const p = pricesByDate[dStr];

    let aktwal: number;
    let isMock = false;
    let isCarriedOver = false;
    let carriedFrom = null;

    if (p) {
      aktwal = Math.round(p.price);
      currentKnownPrice = aktwal;
      lastPriceDate = p.observedDate;
      isMock = p.sourceBulletinId === null;
    } else {
      aktwal = Math.round(currentKnownPrice);
      isCarriedOver = true;
      if (lastPriceDate) {
        carriedFrom = lastPriceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }

    if (currentKnownPrice > 0) {
      data.push({
        timestamp: iterDate.getTime(),
        araw: dStr,
        aktwal,
        hula: null as number | null,
        hulaMin: null as number | null,
        hulaMax: null as number | null,
        insight: null as string | null,
        isPeak: false,
        isMock,
        isCarriedOver,
        carriedFrom
      });
    }

    iterDate.setDate(iterDate.getDate() + 1);
  }

  if (data.length > 0) {
    const lastPrice = data[data.length - 1].aktwal;
    const lastDate = new Date(data[data.length - 1].timestamp);
    // Connect actual to hula
    data[data.length - 1].hula = lastPrice;
    data[data.length - 1].hulaMin = lastPrice;
    data[data.length - 1].hulaMax = lastPrice;
    
    // Fetch real weather data from Open-Meteo for Manila
    let weatherMultiplier = 1.0;
    let weatherMessage = "Normal seasonal trends expected.";
    let totalRain = 0;
    try {
      const res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=14.5995&longitude=120.9842&daily=precipitation_sum&timezone=Asia%2FSingapore");
      if (res.ok) {
        const weatherData = await res.json();
        totalRain = weatherData.daily?.precipitation_sum?.reduce((a: number, b: number) => a + (b || 0), 0) || 0;
        if (totalRain > 100) {
           weatherMultiplier = 1.12; 
           weatherMessage = "Severe weather forecasted (100mm+ rain). High market volatility and scarcity expected.";
        } else if (totalRain > 50) {
           weatherMultiplier = 1.06; 
           weatherMessage = "Heavy rain forecasted. Moderate supply disruption and price increases expected.";
        } else if (totalRain > 20) {
           weatherMultiplier = 1.02;
           weatherMessage = "Light rain forecasted. Minor market fluctuations expected.";
        }
      }
    } catch (e) {
      // fallback to 1.0 if API fails
    }
    
    const baseDailyTrend = 1.0; // removed artificial inflation
    const expected7DayPrice = Math.round(lastPrice * Math.pow(baseDailyTrend, 7) * weatherMultiplier);

    if (process.env.GEMINI_API_KEY) {
      try {
        const { GoogleGenerativeAI } = await import("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const fallbackModels = [
          'gemini-3.1-flash-lite',
          'gemini-3.5-flash-lite',
          'gemini-flash-lite-latest',
          'gemini-3-flash-preview',
          'gemini-3.6-flash',
          'gemini-flash-latest'
        ];
        
        const prompt = `You are an expert agricultural market analyst for a Philippine market dashboard.
Analyze this commodity: ${commodityName}.
Current price: ₱${lastPrice}.
Weather conditions in Manila (next 7 days): ${totalRain}mm of total rainfall.
Forecast: The price is projected to reach roughly ₱${expected7DayPrice} in 7 days.
Task: Provide a SINGLE, punchy sentence (max 20 words) explaining this trend insight to a vendor. Do not use quotes. Mention the weather and the commodity name.`;

        let text = "";
        for (const modelName of fallbackModels) {
          try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            text = result.response.text();
            if (text) break;
          } catch (e) {}
        }
        
        if (text) {
          weatherMessage = text.trim().replace(/^["']|["']$/g, '');
        }
      } catch(e) {}
    }

    for (let i = 1; i <= 7; i++) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(nextDate.getDate() + i);
      
      const expectedTrend = Math.pow(baseDailyTrend, i) * weatherMultiplier;
      const predictedPrice = Math.round(lastPrice * expectedTrend);
      const uncertainty = Math.round(i * 0.015 * predictedPrice); // widens 1.5% per day
      
      data.push({
        timestamp: nextDate.getTime(),
        araw: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        aktwal: null as any,
        hula: predictedPrice,
        hulaMin: predictedPrice - uncertainty,
        hulaMax: predictedPrice + uncertainty,
        insight: weatherMessage,
        isPeak: i === 7,
        isMock: false
      });
    }
  }

  trendCache.set(cacheKey, { timestamp: Date.now(), data });
  return data;
}

export async function getDescriptivePrices(commodityIdStr: string | null, daysStr: string = '30') {
  if (!commodityIdStr) {
    throw new Error("Missing commodityId");
  }

  let commodityId = parseInt(commodityIdStr, 10);
  if (isNaN(commodityId)) {
    const c = await prisma.commodity.findFirst({
      where: { name: { contains: commodityIdStr.replace(/-/g, ' '), mode: 'insensitive' } }
    });
    if (!c) throw new Error("Commodity not found");
    commodityId = c.id;
  }

  const days = parseInt(daysStr, 10);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const whereClause: any = {
    commodityId,
    isVerified: true,
    observedDate: { gte: cutoffDate }
  };

  const prices = await prisma.retailPrice.findMany({
    where: whereClause,
    orderBy: { observedDate: 'asc' },
    include: { sourceBulletin: true }
  });

  const vendorWhereClause: any = {
    commodityId,
    isVerified: true,
    checkedAt: { gte: cutoffDate }
  };

  const vendorChecks = await prisma.vendorCheck.findMany({
    where: vendorWhereClause,
    orderBy: { checkedAt: 'asc' },
    include: { market: true }
  });

  // Fetch the most recent baseline price prior to the cutoff date to use as a fallback
  const priorPriceRecord = await prisma.retailPrice.findFirst({
    where: {
      commodityId,
      isVerified: true,
      observedDate: { lt: cutoffDate }
    },
    orderBy: { observedDate: 'desc' }
  });

  let lastKnownBaseline = priorPriceRecord?.price || null;
  let lastPriceDate = priorPriceRecord?.observedDate || null;

  if (prices.length === 0 && vendorChecks.length === 0 && lastKnownBaseline === null) {
    return { chartData: [], kpi: { median: 0, highest: 0, lowest: 0 } };
  }

  // Group by date
  const dailyData: Record<string, { baseline: number[], asking: number[] }> = {};
  
  for (const p of prices) {
    const dStr = p.observedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
    if (!dailyData[dStr]) dailyData[dStr] = { baseline: [], asking: [] };
    dailyData[dStr].baseline.push(p.price);
  }

  for (const v of vendorChecks) {
    const dStr = v.checkedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
    if (!dailyData[dStr]) dailyData[dStr] = { baseline: [], asking: [] };
    dailyData[dStr].asking.push(v.checkedPrice);
  }

  // Generate array of all days in the timeframe
  const allDays = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(cutoffDate);
    d.setDate(d.getDate() + i + 1);
    allDays.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }));
  }

  const chartData = allDays.map(date => {
    const vals = dailyData[date] || { baseline: [], asking: [] };
    
    let isCarriedOver = false;
    let carriedFrom = null;

    const avgBaseline = vals.baseline.length > 0 ? vals.baseline.reduce((a, b) => a + b, 0) / vals.baseline.length : null;
    if (avgBaseline !== null) {
      lastKnownBaseline = avgBaseline;
      lastPriceDate = new Date(date);
    } else if (lastKnownBaseline !== null) {
      isCarriedOver = true;
      if (lastPriceDate) {
         carriedFrom = lastPriceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }
    
    const avgAsking = vals.asking.length > 0 ? vals.asking.reduce((a, b) => a + b, 0) / vals.asking.length : null;
    
    return { 
      date, 
      price: lastKnownBaseline !== null ? Math.round(lastKnownBaseline) : null,
      askingPrice: avgAsking !== null ? Math.round(avgAsking) : null,
      isCarriedOver,
      carriedFrom
    };
  });

  const allPrices = prices.map(p => p.price).sort((a, b) => a - b);
  const lowest = allPrices[0] || 0;
  const highest = allPrices[allPrices.length - 1] || 0;
  
  let median = 0;
  if (allPrices.length > 0) {
    const mid = Math.floor(allPrices.length / 2);
    if (allPrices.length % 2 === 0) {
      median = (allPrices[mid - 1] + allPrices[mid]) / 2;
    } else {
      median = allPrices[mid];
    }
  }

  return {
    chartData,
    kpi: {
      median: Math.round(median),
      highest: Math.round(highest),
      lowest: Math.round(lowest)
    }
  };
}

export async function getDescriptiveActivity(daysStr: string | null = '7') {
  const days = parseInt(daysStr || '7', 10);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const checks = await prisma.vendorCheck.findMany({
    where: {
      checkedAt: { gte: cutoffDate }
    },
    include: {
      commodity: true,
      market: true
    },
    orderBy: { checkedAt: 'asc' }
  });

  const retailPrices = await prisma.retailPrice.findMany({
    where: {
      observedDate: { gte: cutoffDate },
      isVerified: true
    }
  });

  // Compute average baseline per commodity
  const baselineMap: Record<number, { sum: number, count: number }> = {};
  for (const rp of retailPrices) {
    if (!baselineMap[rp.commodityId]) baselineMap[rp.commodityId] = { sum: 0, count: 0 };
    baselineMap[rp.commodityId].sum += rp.price;
    baselineMap[rp.commodityId].count += 1;
  }
  const avgBaselineMap: Record<number, number> = {};
  for (const [cId, stats] of Object.entries(baselineMap)) {
    avgBaselineMap[parseInt(cId)] = stats.sum / stats.count;
  }

  // 1. Bar chart data (checks per market)
  const marketCounts: Record<string, number> = {};
  const commodityCounts: Record<string, number> = {};
  const timelineCounts: Record<string, number> = {};
  const overBaselineCounts: Record<string, number> = {};
  
  let checksToday = 0;
  const todayStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });

  for (const check of checks) {
    const mName = check.market?.name || 'Unknown Market';
    const cName = check.commodity?.name || 'Unknown Commodity';
    const dStr = check.checkedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' });
    
    marketCounts[mName] = (marketCounts[mName] || 0) + 1;
    commodityCounts[cName] = (commodityCounts[cName] || 0) + 1;
    timelineCounts[dStr] = (timelineCounts[dStr] || 0) + 1;
    
    if (dStr === todayStr) {
      checksToday++;
    }

    const baseline = avgBaselineMap[check.commodityId];
    if (baseline && check.checkedPrice > baseline) {
      overBaselineCounts[mName] = (overBaselineCounts[mName] || 0) + 1;
    }
  }

  const marketBarData = Object.keys(marketCounts).map(name => ({
    name,
    checks: marketCounts[name]
  })).sort((a, b) => b.checks - a.checks).slice(0, 5); // top 5 markets

  const timelineData = Object.keys(timelineCounts).map(date => ({
    date,
    checks: timelineCounts[date]
  }));

  // Find most checked commodity
  let mostCheckedCommodity = "N/A";
  let maxC = 0;
  for (const [c, count] of Object.entries(commodityCounts)) {
    if (count > maxC) {
      maxC = count;
      mostCheckedCommodity = c;
    }
  }

  // Find market with most checks
  let topMarket = "N/A";
  let maxM = 0;
  for (const [m, count] of Object.entries(marketCounts)) {
    if (count > maxM) {
      maxM = count;
      topMarket = m;
    }
  }

  const overBaselineData = Object.keys(overBaselineCounts).map(name => ({
    name,
    overCount: overBaselineCounts[name]
  })).sort((a, b) => b.overCount - a.overCount);

  return {
    marketBarData,
    timelineData,
    overBaselineData,
    kpi: {
      checksToday,
      mostCheckedCommodity,
      topMarket
    }
  };
}

export async function getLastUpdate() {
  const latestBulletin = await prisma.bulletinRecord.findFirst({
    where: { processedStatus: 'PROCESSED' },
    orderBy: { uploadDate: 'desc' }
  });
  
  if (latestBulletin) {
    return { lastUpdate: latestBulletin.uploadDate.toISOString() };
  }
  
  // Fallback if no bulletins yet
  const latestRetail = await prisma.retailPrice.findFirst({
    where: { isVerified: true },
    orderBy: { observedDate: 'desc' }
  });
  
  if (latestRetail) {
    return { lastUpdate: latestRetail.observedDate.toISOString() };
  }
  
  return { lastUpdate: new Date().toISOString() };
}
