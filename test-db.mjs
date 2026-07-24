import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const bulletins = await prisma.bulletinRecord.findMany();
  console.log("Bulletins:", bulletins);
  const prices = await prisma.retailPrice.findMany();
  console.log("Prices in validation queue:", prices);
  const alerts = await prisma.adminAlert.findMany();
  console.log("Alerts:", alerts);
}
main().catch(console.error).finally(() => prisma.$disconnect());
