import prisma from './dbService';

/**
 * Fetches the most recently observed baseline retail price for a given commodity and market.
 * 
 * @param commodityId The ID of the commodity
 * @param commodityId The ID of the commodity
 * @returns The latest RetailPrice record, or null if none exist
 */
export async function getLatestBaseline(commodityId: number) {
  return await prisma.retailPrice.findFirst({
    where: {
      commodityId,
      isVerified: true,
    },
    orderBy: {
      observedDate: 'desc',
    },
    include: {
      commodity: true,
    }
  });
}

/**
 * Saves a new vendor quote (VendorCheck) for a commodity.
 * Automatically flags the quote if it exceeds the latest baseline price.
 * 
 * @param commodityId The ID of the commodity
 * @param marketId The ID of the market
 * @param checkedPrice The price quoted by the vendor
 * @returns The newly created VendorCheck record
 */
export async function saveVendorQuote(commodityId: number, marketId: number, checkedPrice: number) {
  // Fetch the latest baseline to determine if this quote should be flagged
  const baseline = await getLatestBaseline(commodityId);
  
  // Basic flagging logic: flag if the checked price is strictly greater than the baseline price
  const isFlagged = baseline ? checkedPrice > baseline.price : false;
  const flagReason = isFlagged ? `Price is higher than baseline (₱${baseline?.price.toFixed(2)})` : null;

  return await prisma.vendorCheck.create({
    data: {
      commodityId,
      marketId,
      checkedPrice,
      isFlagged,
      flagReason,
      checkedAt: new Date(),
    },
  });
}
