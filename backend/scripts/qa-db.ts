import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const userIds = (await prisma.user.findMany({ select: { id: true } })).map((u) => u.id);
  const shipIds = (await prisma.shipment.findMany({ select: { id: true } })).map((s) => s.id);

  const orphanShipments = await prisma.shipment.count({ where: { userId: { notIn: userIds } } });
  const orphanHistory = await prisma.shipmentStatusHistory.count({ where: { shipmentId: { notIn: shipIds } } });
  const orphansItems = await prisma.shipmentItem.count({ where: { shipmentId: { notIn: shipIds } } });
  const orphanPayments = await prisma.payment.count({ where: { shipmentId: { notIn: shipIds } } });
  const qaUsers = await prisma.user.count({ where: { email: { startsWith: "qa" } } });
  const qaRules = await prisma.pricingRule.count({ where: { name: { startsWith: "QA Rule" } } });

  const totals = {
    users: userIds.length,
    shipments: shipIds.length,
    payments: await prisma.payment.count(),
    documents: await prisma.document.count(),
    pricingRules: await prisma.pricingRule.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  console.log("== INTEGRITE ==");
  console.log("orchestration orphelins:", { orphanShipments, orphanHistory, orphansItems, orphanPayments });
  console.log("QA leftovers:", { qaUsers, qaRules });
  console.log("== TOTAUX ==", totals);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());