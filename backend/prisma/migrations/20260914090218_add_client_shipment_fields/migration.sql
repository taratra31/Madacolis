-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "recipientAddress" TEXT,
ADD COLUMN     "recipientName" TEXT,
ADD COLUMN     "recipientPhone" TEXT,
ADD COLUMN     "requiredDocuments" "DocumentType"[] DEFAULT ARRAY[]::"DocumentType"[],
ADD COLUMN     "senderAddress" TEXT,
ADD COLUMN     "senderName" TEXT,
ADD COLUMN     "senderPhone" TEXT;
