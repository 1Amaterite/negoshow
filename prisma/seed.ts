import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
  const commodities = await Promise.all([
    prisma.commodity.upsert({
      where: { name: 'Red Onions' },
      update: { imageUrl: '/images/commodities/red-onion.webp' },
      create: { name: 'Red Onions', unit: 'kg', description: 'Local red onions', imageUrl: '/images/commodities/red-onion.webp' },
    }),
    prisma.commodity.upsert({
      where: { name: 'White Onions' },
      update: { imageUrl: '/images/commodities/white-onion.webp' },
      create: { name: 'White Onions', unit: 'kg', description: 'Imported white onions', imageUrl: '/images/commodities/white-onion.webp' },
    }),
    prisma.commodity.upsert({
      where: { name: 'Garlic' },
      update: { imageUrl: '/images/commodities/garlic.webp' },
      create: { name: 'Garlic', unit: 'kg', description: 'Native garlic', imageUrl: '/images/commodities/garlic.webp' },
    }),
    prisma.commodity.upsert({
      where: { name: 'Ginger' },
      update: { imageUrl: '/images/commodities/ginger.webp' },
      create: { name: 'Ginger', unit: 'kg', description: 'Fresh ginger', imageUrl: '/images/commodities/ginger.webp' },
    }),
    prisma.commodity.upsert({
      where: { name: 'Potatoes' },
      update: { imageUrl: '/images/commodities/potato.webp' },
      create: { name: 'Potatoes', unit: 'kg', description: 'Baguio potatoes', imageUrl: '/images/commodities/potato.webp' },
    }),
  ]);

  for (const commodity of commodities) {
    console.log(`Upserted Commodity: ${commodity.name}`);

    // Create 30 days of historical data for charts
    const basePrices: Record<string, number> = {
      'Red Onions': 140,
      'White Onions': 95,
      'Garlic': 220,
      'Ginger': 180,
      'Potatoes': 65,
    };

    const volatility = (Math.random() * 10) - 5;
    
    for (let i = 30; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const fluctuation = Math.floor(Math.random() * 15) - 7;
      const price = basePrices[commodity.name] + fluctuation + volatility;

      await prisma.retailPrice.create({
        data: {
          commodityId: commodity.id,
          marketId: pasayMarket.id,
          price: price > 0 ? price : 50,
          observedDate: d,
          isVerified: true,
        },
      });
    }
    console.log(`Created 30 days of baseline prices for ${commodity.name}`);

    // Mock vendor checks (Peer prices)
    for (let i = 0; i < 5; i++) {
      const vPrice = basePrices[commodity.name] + (Math.random() * 20 - 5);
      await prisma.vendorCheck.create({
        data: {
          commodityId: commodity.id,
          marketId: pasayMarket.id,
          checkedPrice: vPrice > 0 ? vPrice : 50,
          checkedAt: new Date(),
          isFlagged: false
        }
      });
    }
  }

  // Create Bulletin Records
  await prisma.bulletinRecord.create({
    data: {
      fileUrl: "https://example.com/bulletin1.pdf",
      uploadDate: new Date(),
      processedStatus: "PROCESSED"
    }
  });

  const adminPassword = 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {
      password: hashedPassword,
    },
    create: {
      username: 'admin',
      password: hashedPassword,
    },
  });
  console.log(`Upserted AdminUser: ${admin.username}`);

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
