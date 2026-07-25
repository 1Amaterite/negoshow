import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const b = await prisma.bulletinRecord.create({
      data: {
        fileUrl: "https://test.com/file.pdf",
        sourceOffice: "now",
        bulletinDate: "07/25/2026",
        coverage: "Pasay City",
        docType: "PDF Document",
        commodities: ["Sibuyas Pula", "Sibuyas Puti"]
      }
    });
    console.log("Success", b);
  } catch(e) {
    console.error(e);
  }
}
main();
