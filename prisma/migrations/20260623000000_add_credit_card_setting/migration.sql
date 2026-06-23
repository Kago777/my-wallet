-- CreateTable
CREATE TABLE "CreditCardSetting" (
    "id" TEXT NOT NULL,
    "billing_day" INTEGER NOT NULL,
    "closing_day" INTEGER,
    "billing_month_offset" INTEGER NOT NULL DEFAULT 1,
    "wallet_id" TEXT NOT NULL,
    "settlement_wallet_id" TEXT NOT NULL,

    CONSTRAINT "CreditCardSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditCardSetting_wallet_id_key" ON "CreditCardSetting"("wallet_id");

-- AddForeignKey
ALTER TABLE "CreditCardSetting" ADD CONSTRAINT "CreditCardSetting_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditCardSetting" ADD CONSTRAINT "CreditCardSetting_settlement_wallet_id_fkey" FOREIGN KEY ("settlement_wallet_id") REFERENCES "Wallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- settlement_wallet_idがbankタイプのみを参照することを保証
CREATE OR REPLACE FUNCTION check_settlement_wallet_is_bank()
RETURNS TRIGGER AS $$
DECLARE wallet_type TEXT;
BEGIN
  SELECT type::text INTO wallet_type FROM "Wallet" WHERE id = NEW.settlement_wallet_id;
  IF wallet_type IS NULL THEN
    RAISE EXCEPTION 'settlement_wallet_id: wallet not found';
  END IF;
  IF wallet_type != 'bank' THEN
    RAISE EXCEPTION 'settlement_wallet_id must be a bank wallet (got: %)', wallet_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_settlement_wallet_must_be_bank
BEFORE INSERT OR UPDATE OF settlement_wallet_id
ON "CreditCardSetting"
FOR EACH ROW EXECUTE FUNCTION check_settlement_wallet_is_bank();

-- 引き落とし口座として使用中のbankウォレットのtype変更を阻止
CREATE OR REPLACE FUNCTION guard_settlement_wallet_type_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.type = 'bank' AND NEW.type != 'bank' THEN
    IF EXISTS (SELECT 1 FROM "CreditCardSetting" WHERE settlement_wallet_id = NEW.id) THEN
      RAISE EXCEPTION 'Cannot change wallet type: wallet % is in use as a settlement wallet', NEW.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_guard_settlement_wallet_type_change
BEFORE UPDATE OF type ON "Wallet"
FOR EACH ROW EXECUTE FUNCTION guard_settlement_wallet_type_change();
