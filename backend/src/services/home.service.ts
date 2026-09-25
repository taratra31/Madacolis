import { prisma } from "../config/prisma.js";

/**
 * Données publiques de la page d'accueil : services tarifaires actifs
 * issus de la base, statistiques de colis (pour la démo), top destinations
 * et villes desservies.
 */
export async function getHomePageData() {
  const [services, userCount, shipmentCount, paymentCount, pricingRuleCount, pending, inTransit, delivered, paidRevenue, shipmentsByService, shipmentsByStatus, topRoutes] =
    await Promise.all([
      prisma.pricingRule.findMany({
        where: { isActive: true },
        orderBy: [{ originCountry: "asc" }, { destinationCountry: "asc" }, { serviceType: "asc" }],
      }),
      prisma.user.count(),
      prisma.shipment.count(),
      prisma.payment.count(),
      prisma.pricingRule.count(),
      prisma.shipment.count({ where: { status: "PENDING" } }),
      prisma.shipment.count({ where: { status: "IN_TRANSIT" } }),
      prisma.shipment.count({ where: { status: "DELIVERED" } }),
      prisma.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      prisma.shipment.groupBy({ by: ["serviceType"], _count: { _all: true } }),
      prisma.shipment.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.shipment.groupBy({
        by: ["originCountry", "originCity", "destinationCountry", "destinationCity"],
        _count: { _all: true },
      }),
    ]);

  const routeRows = topRoutes.sort((a, b) => b._count._all - a._count._all).slice(0, 5);

  const cities = await prisma.$queryRaw<Array<{ city: string; country: string }>>`
    SELECT DISTINCT city, country FROM (
      SELECT "originCity" AS city, "originCountry" AS country FROM "Shipment"
      UNION
      SELECT "destinationCity" AS city, "destinationCountry" AS country FROM "Shipment"
    ) AS c
    ORDER BY country ASC, city ASC
  `;

  return {
    services: services.map((r) => ({
      id: r.id,
      name: r.name,
      originCountry: r.originCountry,
      destinationCountry: r.destinationCountry,
      serviceType: r.serviceType,
      basePrice: Number(r.basePrice),
      pricePerKg: Number(r.pricePerKg),
      pricePerKm: r.pricePerKm === null ? null : Number(r.pricePerKm),
      minimumPrice: Number(r.minimumPrice),
      currency: r.currency,
    })),
    stats: {
      users: userCount,
      shipments: shipmentCount,
      payments: paymentCount,
      pricingRules: pricingRuleCount,
      pending,
      inTransit,
      delivered,
      revenuePaid: paidRevenue._sum.amount,
    },
    shipmentsByService: shipmentsByService.map((s) => ({ serviceType: s.serviceType, count: s._count._all })),
    shipmentsByStatus: shipmentsByStatus.map((s) => ({ status: s.status, count: s._count._all })),
    topRoutes: routeRows.map((r) => ({
      originCountry: r.originCountry,
      originCity: r.originCity,
      destinationCountry: r.destinationCountry,
      destinationCity: r.destinationCity,
      count: r._count._all,
    })),
    cities: cities.map((c) => ({ city: c.city, country: c.country })),
    generatedAt: new Date().toISOString(),
  };
}