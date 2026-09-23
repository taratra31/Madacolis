-- Migration: add_transitaire_role_and_carrier
-- Ajoute le rôle TRANSITAIRE et le champ carrierId (User + Shipment)
ALTER TYPE "Role" ADD VALUE 'TRANSITAIRE';

-- User.carrierId
ALTER TABLE "User" ADD COLUMN "carrierId" TEXT;
CREATE INDEX "User_carrierId_idx" ON "User"("carrierId");

-- Shipment.carrierId
ALTER TABLE "Shipment" ADD COLUMN "carrierId" TEXT;
CREATE INDEX "Shipment_carrierId_idx" ON "Shipment"("carrierId");