import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // I'm not yet sure if we do need seed.ts lmk! it's basically a starter for creating data to be put in the database to avoid null values. 

  // Create Pasay City Market
  const pasayMarket = await prisma.market.upsert({
    where: { id: 1 },
    update: { name: 'Pasay City Talipapa' },
    create: {
      id: 1,
      name: 'Pasay City Talipapa',
    },
  });
  console.log(`Upserted Market: ${pasayMarket.name}`);

  // Create Commodities
  const commoditiesData = [
    { name: 'Red Onions', unit: 'kg', description: 'Local red onions', imageUrl: '/images/red-onion.png' },
    { name: 'White Onions', unit: 'kg', description: 'Imported white onions', imageUrl: '/images/white-onion.png' },
    { name: 'Garlic', unit: 'kg', description: 'Native garlic', imageUrl: '/images/garlic.png' },
    { name: 'Ginger', unit: 'kg', description: 'Fresh ginger', imageUrl: '/images/ginger.png' },
    { name: 'Potatoes', unit: 'kg', description: 'Baguio potatoes', imageUrl: '/images/potato.png' },
  ];

  for (const c of commoditiesData) {
    const commodity = await prisma.commodity.upsert({
      where: { name: c.name },
      update: c,
      create: c,
    });
    console.log(`Upserted Commodity: ${commodity.name}`);

    // Create a dummy RetailPrice (Baseline) for each commodity
    const basePrices: Record<string, number> = {
      'Red Onions': 150,
      'White Onions': 140,
      'Garlic': 300,
      'Ginger': 200,
      'Potatoes': 120,
    };

    await prisma.retailPrice.create({
      data: {
        commodityId: commodity.id,
        marketId: pasayMarket.id,
        price: basePrices[commodity.name],
        observedDate: new Date(),
        isVerified: true,
      },
    });
    console.log(`Created baseline price for ${commodity.name}`);
  }

  console.log('Database seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
