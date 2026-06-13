-- Add sort_order to Wallet
ALTER TABLE "Wallet"
ADD COLUMN "sort_order" INTEGER NOT NULL DEFAULT 0;
