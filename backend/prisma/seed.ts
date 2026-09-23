import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient, Role, ServiceType, Currency, ShipmentStatus, type PaymentProvider } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Seed de démonstration MadaColis.
 * Les tarifs sont FICTIFS et servent uniquement au développement.
 * À remplacer par les vrais tarifs en production.
 */

async function main(): Promise<void> {
  console.log("🌱 Démarrage du seed MadaColis...");

  // -------------------------------------------------------------------------
  // Utilisateurs de démonstration
  // -------------------------------------------------------------------------
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const agentPassword = await bcrypt.hash("Agent@123", 10);
  const customerPassword = await bcrypt.hash("Customer@123", 10);
  const transitairePassword = await bcrypt.hash("Transitaire@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@madacolis.mg" },
    update: {},
    create: {
      name: "Admin MadaColis",
      email: "admin@madacolis.mg",
      phone: "+261340000001",
      passwordHash: adminPassword,
      role: Role.ADMIN,
      country: "Madagascar",
      city: "Antananarivo",
      address: "Immeuble MadaColis, Analakely",
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: "agent@madacolis.mg" },
    update: {},
    create: {
      name: "Agent MadaColis",
      email: "agent@madacolis.mg",
      phone: "+261340000002",
      passwordHash: agentPassword,
      role: Role.AGENT,
      country: "Madagascar",
      city: "Antananarivo",
      address: "Bureau MadaColis, Ivato",
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: "customer@madacolis.mg" },
    update: {},
    create: {
      name: "Client Démo",
      email: "customer@madacolis.mg",
      phone: "+261340000003",
      passwordHash: customerPassword,
      role: Role.CUSTOMER,
      country: "Madagascar",
      city: "Antananarivo",
      address: "Lot 123, Analamanga",
    },
  });

  const transitaire = await prisma.user.upsert({
    where: { email: "dhl@madacolis.mg" },
    update: {},
    create: {
      name: "DHL Express Madagascar",
      email: "dhl@madacolis.mg",
      phone: "+261340000004",
      passwordHash: transitairePassword,
      role: Role.TRANSITAIRE,
      carrierId: "dhl",
      country: "Madagascar",
      city: "Antananarivo",
      address: "Agence DHL, Ivato",
    },
  });

  console.log("👤 Utilisateurs :", admin.email, agent.email, customer.email, transitaire.email);

  // Attribution des transporteurs sur les colis de démo (idempotent)
  await prisma.shipment.updateMany({ where: { trackingNumber: { in: ["MC-2026-09-10-DEMOA123", "MC-2026-09-14-DEMOC789"] } }, data: { carrierId: "dhl" } });
  await prisma.shipment.updateMany({ where: { trackingNumber: "MC-2026-09-12-DEMOB456" }, data: { carrierId: "agl" } });
  await prisma.shipment.updateMany({ where: { trackingNumber: { contains: "HIST" } }, data: { carrierId: "dhl" } });

  // Adresse par défaut du client
  await prisma.address.upsert({
    where: {
      id: "00000000-0000-4000-8000-000000000001",
    },
    update: {},
    create: {
      id: "00000000-0000-4000-8000-000000000001",
      userId: customer.id,
      label: "Domicile",
      country: "Madagascar",
      city: "Antananarivo",
      region: "Analamanga",
      addressLine: "Lot 123, Amboditsiry",
      phone: "+261340000003",
      isDefault: true,
    },
  });

  // -------------------------------------------------------------------------
  // Règles tarifaires de démonstration (tarifs FICTIFS)
  //   price = basePrice + (weightKg × pricePerKg) + (distanceKm × pricePerKm)
  // -------------------------------------------------------------------------
  const pricingSeeds = [
    // Madagascar → France
    {
      name: "Mada → France (Standard)",
      originCountry: "Madagascar",
      destinationCountry: "France",
      serviceType: ServiceType.STANDARD,
      basePrice: 80,
      pricePerKg: 3,
      pricePerKm: 0.01,
      minimumPrice: 120,
      currency: Currency.EUR,
    },
    {
      name: "Mada → France (Express)",
      originCountry: "Madagascar",
      destinationCountry: "France",
      serviceType: ServiceType.EXPRESS,
      basePrice: 120,
      pricePerKg: 5,
      pricePerKm: 0.015,
      minimumPrice: 180,
      currency: Currency.EUR,
    },
    {
      name: "Mada → France (Economy)",
      originCountry: "Madagascar",
      destinationCountry: "France",
      serviceType: ServiceType.ECONOMY,
      basePrice: 50,
      pricePerKg: 2,
      pricePerKm: 0.008,
      minimumPrice: 90,
      currency: Currency.EUR,
    },
    // France → Madagascar
    {
      name: "France → Mada (Standard)",
      originCountry: "France",
      destinationCountry: "Madagascar",
      serviceType: ServiceType.STANDARD,
      basePrice: 90,
      pricePerKg: 3.5,
      pricePerKm: 0.01,
      minimumPrice: 130,
      currency: Currency.EUR,
    },
    {
      name: "France → Mada (Express)",
      originCountry: "France",
      destinationCountry: "Madagascar",
      serviceType: ServiceType.EXPRESS,
      basePrice: 135,
      pricePerKg: 5.5,
      pricePerKm: 0.015,
      minimumPrice: 200,
      currency: Currency.EUR,
    },
    {
      name: "France → Mada (Economy)",
      originCountry: "France",
      destinationCountry: "Madagascar",
      serviceType: ServiceType.ECONOMY,
      basePrice: 55,
      pricePerKg: 2.2,
      pricePerKm: 0.008,
      minimumPrice: 95,
      currency: Currency.EUR,
    },
  ] as const;

  for (const rule of pricingSeeds) {
    await prisma.pricingRule.upsert({
      where: {
        originCountry_destinationCountry_serviceType: {
          originCountry: rule.originCountry,
          destinationCountry: rule.destinationCountry,
          serviceType: rule.serviceType,
        },
      },
      update: {},
      create: {
        ...rule,
        pricePerKm: rule.pricePerKm as number | null,
      },
    });
  }
  console.log(`💰 ${pricingSeeds.length} règles tarifaires ajoutées (démo).`);

  // -------------------------------------------------------------------------
  // Distances de démonstration (km)
  // -------------------------------------------------------------------------
  const distanceSeeds = [
    {
      originCountry: "Madagascar",
      originCity: "Antananarivo",
      destinationCountry: "France",
      destinationCity: "Paris",
      distanceKm: 8575,
    },
    {
      originCountry: "France",
      originCity: "Paris",
      destinationCountry: "Madagascar",
      destinationCity: "Antananarivo",
      distanceKm: 8575,
    },
    {
      originCountry: "Madagascar",
      originCity: "Antananarivo",
      destinationCountry: "France",
      destinationCity: "Marseille",
      distanceKm: 8050,
    },
  ];

  for (const d of distanceSeeds) {
    await prisma.distanceRate.upsert({
      where: {
        originCountry_originCity_destinationCountry_destinationCity: {
          originCountry: d.originCountry,
          originCity: d.originCity,
          destinationCountry: d.destinationCountry,
          destinationCity: d.destinationCity,
        },
      },
      update: {},
      create: d,
    });
  }
  console.log("📏 Distances de démonstration ajoutées.");

  // -------------------------------------------------------------------------
  // Colis de démonstration (uniquement si la base est vide)
  // -------------------------------------------------------------------------
  const existingShipments = await prisma.shipment.count();
  if (existingShipments === 0) {
    console.log("🚚 Création de colis de démonstration...");

    const shipmentOne = await prisma.shipment.create({
      data: {
        userId: customer.id,
        trackingNumber: "MC-2026-09-10-DEMOA123",
        originCountry: "Madagascar",
        originCity: "Antananarivo",
        destinationCountry: "France",
        destinationCity: "Paris",
        serviceType: ServiceType.EXPRESS,
        status: "IN_TRANSIT",
        carrierId: "dhl",
        totalWeight: 4.5,
        totalVolume: 0.02,
        declaredValue: 250,
        currency: Currency.EUR,
        estimatedPrice: 210.5,
        finalPrice: 210.5,
        estimatedDeliveryDate: new Date("2026-09-25"),
        notes: "Effets personnels",
        items: {
          create: [
            { description: "Vêtements", quantity: 2, weight: 2.0, declaredValue: 100, isFragile: false },
            { description: "Livres", quantity: 3, weight: 2.5, declaredValue: 150, isFragile: false },
          ],
        },
        statusHistory: {
          create: [
            { status: "PENDING", comment: "Colis enregistré", location: "Antananarivo", changedBy: admin.id },
            { status: "RECEIVED", comment: "Colis réceptionné à l'agence", location: "Antananarivo", changedBy: admin.id },
            { status: "IN_TRANSIT", comment: "En route vers l'aéroport d'Ivato", location: "Antananarivo", changedBy: admin.id },
          ],
        },
        documents: {
          create: [{ userId: customer.id, type: "INVOICE", filePath: "/uploads/demo/facture-1.pdf", originalName: "facture-1.pdf", mimeType: "application/pdf", status: "VERIFIED" }],
        },
      },
    });

    const shipmentTwo = await prisma.shipment.create({
      data: {
        userId: customer.id,
        trackingNumber: "MC-2026-09-12-DEMOB456",
        originCountry: "France",
        originCity: "Paris",
        destinationCountry: "Madagascar",
        destinationCity: "Tamatave",
        serviceType: ServiceType.STANDARD,
        status: "PENDING",
        carrierId: "agl",
        totalWeight: 8.0,
        declaredValue: 400,
        currency: Currency.EUR,
        estimatedPrice: 190,
        items: {
          create: [
            { description: "Électronique", quantity: 1, weight: 3.0, declaredValue: 300, isFragile: true },
            { description: "Vêtements", quantity: 5, weight: 5.0, declaredValue: 100, isFragile: false },
          ],
        },
        statusHistory: {
          create: [{ status: "PENDING", comment: "En attente de traitement", location: "Paris", changedBy: admin.id }],
        },
      },
    });

    await prisma.payment.create({
      data: {
        shipmentId: shipmentOne.id,
        userId: customer.id,
        paymentReference: "PAY-DEMO-0001",
        provider: "MVOLA",
        method: "MOBILE_MONEY",
        amount: 210.5,
        currency: Currency.EUR,
        status: "PAID",
        transactionId: "mvola-demo-tx-0001",
        paidAt: new Date("2026-09-10"),
      },
    });

    await prisma.payment.create({
      data: {
        shipmentId: shipmentTwo.id,
        userId: customer.id,
        paymentReference: "PAY-DEMO-0002",
        provider: "ORANGE_MONEY",
        method: "MOBILE_MONEY",
        amount: 190,
        currency: Currency.EUR,
        status: "PENDING",
      },
    });

    await prisma.auditLog.createMany({
      data: [
        { userId: admin.id, action: "ADMIN.SEED", entityType: "Shipment", entityId: shipmentOne.id, newValues: { note: "Seed démo" } },
        { userId: admin.id, action: "ADMIN.SHIPMENT_STATUS", entityType: "Shipment", entityId: shipmentOne.id, oldValues: { status: "RECEIVED" }, newValues: { status: "IN_TRANSIT" } },
        { userId: customer.id, action: "AUTH.LOGIN", entityType: "User", entityId: customer.id },
      ],
    });

    console.log("🚚 Colis, paiements et logs de démonstration créés.");
  } else {
    console.log(`🚚 ${existingShipments} colis déjà présents, seed de démo ignoré.`);
  }

  // -------------------------------------------------------------------------
  // Historique de démonstration : colis répartis sur les 30 derniers jours
  // (pour des statistiques dashboard parlantes)
  // -------------------------------------------------------------------------
  const shedCount = await prisma.shipment.count();
  if (shedCount < 25) {
    console.log("📊 Ajout d'un historique de colis sur 30 jours...");
    const today = new Date();
    const statuses: ShipmentStatus[] = ["DELIVERED", "DELIVERED", "DELIVERED", "IN_TRANSIT", "IN_TRANSIT", "RECEIVED", "PENDING", "OUT_FOR_DELIVERY"];
    const serviceTypes = [ServiceType.STANDARD, ServiceType.EXPRESS, ServiceType.ECONOMY];
    const routePool = [
      { originCountry: "Madagascar", originCity: "Antananarivo", destinationCountry: "France", destinationCity: "Paris", price: 150 + Math.round(Math.random() * 100) },
      { originCountry: "Madagascar", originCity: "Toamasina", destinationCountry: "France", destinationCity: "Marseille", price: 140 + Math.round(Math.random() * 90) },
      { originCountry: "France", originCity: "Paris", destinationCountry: "Madagascar", destinationCity: "Antananarivo", price: 160 + Math.round(Math.random() * 110) },
      { originCountry: "France", originCity: "Marseille", destinationCountry: "Madagascar", destinationCity: "Toamasina", price: 150 + Math.round(Math.random() * 100) },
      { originCountry: "Madagascar", originCity: "Antananarivo", destinationCountry: "France", destinationCity: "Lyon", price: 145 + Math.round(Math.random() * 95) },
    ];

    const seedShipments: Array<{
      userId: string;
      trackingNumber: string;
      originCountry: string;
      originCity: string;
      destinationCountry: string;
      destinationCity: string;
      serviceType: ServiceType;
      status: ShipmentStatus;
      totalWeight: number;
      declaredValue: number;
      currency: Currency;
      estimatedPrice: number;
      provider: PaymentProvider;
      createdAt: Date;
    }> = [];

    for (let i = 1; i <= 24; i += 1) {
      const dayOffset = Math.floor(Math.random() * 29);
      const created = new Date(today);
      created.setUTCDate(created.getUTCDate() - dayOffset);
      created.setUTCHours(8 + (i % 10), (i * 7) % 60, 0, 0);

      const route = routePool[i % routePool.length];
      const status = statuses[i % statuses.length];
      const weight = 1 + Math.round((Math.random() * 9 + Number.EPSILON) * 10) / 10;
      const price = route.price + weight * (3 + (i % 3));
      const provider: PaymentProvider = i % 2 === 0 ? "MVOLA" : "ORANGE_MONEY";

      seedShipments.push({
        userId: customer.id,
        trackingNumber: `MC-2026-09-${String(dayOffset + 1).padStart(2, "0")}-HIST${String(i).padStart(4, "0")}`,
        originCountry: route.originCountry,
        originCity: route.originCity,
        destinationCountry: route.destinationCountry,
        destinationCity: route.destinationCity,
        serviceType: serviceTypes[i % serviceTypes.length],
        status,
        totalWeight: weight,
        declaredValue: price,
        currency: Currency.EUR,
        estimatedPrice: price,
        provider,
        createdAt: created,
      });
    }

    await prisma.$transaction(
      seedShipments.map((s) =>
        prisma.shipment.create({
          data: {
            userId: s.userId,
            trackingNumber: s.trackingNumber,
            carrierId: "dhl",
            originCountry: s.originCountry,
            originCity: s.originCity,
            destinationCountry: s.destinationCountry,
            destinationCity: s.destinationCity,
            serviceType: s.serviceType,
            status: s.status,
            totalWeight: s.totalWeight,
            declaredValue: s.declaredValue,
            currency: s.currency,
            estimatedPrice: s.estimatedPrice,
            createdAt: s.createdAt,
            statusHistory: {
              create: [{ status: s.status, comment: "Historique de démonstration", location: s.originCity, changedBy: admin.id, createdAt: s.createdAt }],
            },
            ...(s.status === "DELIVERED" || s.status === "IN_TRANSIT"
              ? { payments: { create: [{ userId: customer.id, paymentReference: `PAY-HIST-${s.trackingNumber.slice(-4)}`, provider: s.provider, method: "MOBILE_MONEY" as const, amount: s.estimatedPrice, currency: Currency.EUR, status: s.status === "DELIVERED" ? ("PAID" as const) : ("PENDING" as const), paidAt: s.status === "DELIVERED" ? s.createdAt : null }] } }
              : {}),
          },
        }),
      ),
    );

    console.log(`📊 ${seedShipments.length} colis historiques créés.`);
  } else {
    console.log(`📊 Historique déjà présent (${shedCount} colis).`);
  }

  console.log("✅ Seed terminé.");
  console.log("   Admin      → admin@madacolis.mg / Admin@123");
  console.log("   Agent      → agent@madacolis.mg / Agent@123");
  console.log("   Client     → customer@madacolis.mg / Customer@123");
  console.log("   Transitaire→ dhl@madacolis.mg / Transitaire@123");
}

main()
  .catch((err) => {
    console.error("❌ Erreur seed :", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });