import { prisma } from "../config/prisma.js";

type AuditInput = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
};

export async function createAuditLog(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        oldValues: input.oldValues === undefined ? undefined : JSON.parse(JSON.stringify(input.oldValues)),
        newValues: input.newValues === undefined ? undefined : JSON.parse(JSON.stringify(input.newValues)),
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (err) {
    // L'audit ne doit jamais faire échouer une opération métier
    console.error("Échec de l'écriture d'audit :", err);
  }
}