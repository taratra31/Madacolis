-- AlterTable
ALTER TABLE "DistanceRate" ADD COLUMN     "destinationLatitude" DECIMAL(10,7),
ADD COLUMN     "destinationLongitude" DECIMAL(10,7),
ADD COLUMN     "originLatitude" DECIMAL(10,7),
ADD COLUMN     "originLongitude" DECIMAL(10,7);
