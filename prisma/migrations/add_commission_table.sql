-- Add PIQ_Commission table for tracking platform commission
CREATE TABLE IF NOT EXISTS "PIQ_Commission" (
    "commission_id" SERIAL PRIMARY KEY,
    "booking_id" INTEGER NOT NULL,
    "payment_id" INTEGER NOT NULL,
    "service_provider_id" INTEGER NOT NULL,
    "booking_amount" DECIMAL(10,2) NOT NULL,
    "commission_percent" DECIMAL(5,2) NOT NULL DEFAULT 15.00,
    "commission_amount" DECIMAL(10,2) NOT NULL,
    "provider_amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settled_at" TIMESTAMPTZ(6),
    CONSTRAINT "fk_commission_booking" FOREIGN KEY ("booking_id") 
        REFERENCES "PIQ_Bookings"("booking_id") ON DELETE CASCADE,
    CONSTRAINT "fk_commission_payment" FOREIGN KEY ("payment_id") 
        REFERENCES "PIQ_Payments"("payment_id") ON DELETE CASCADE,
    CONSTRAINT "fk_commission_provider" FOREIGN KEY ("service_provider_id") 
        REFERENCES "PIQ_Service_Provider"("service_provider_id") ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_commission_booking" ON "PIQ_Commission"("booking_id");
CREATE INDEX IF NOT EXISTS "idx_commission_payment" ON "PIQ_Commission"("payment_id");
CREATE INDEX IF NOT EXISTS "idx_commission_provider" ON "PIQ_Commission"("service_provider_id");
CREATE INDEX IF NOT EXISTS "idx_commission_status" ON "PIQ_Commission"("status");
CREATE INDEX IF NOT EXISTS "idx_commission_created" ON "PIQ_Commission"("created_at");

-- Add unique constraint to prevent duplicate commission records
CREATE UNIQUE INDEX IF NOT EXISTS "uq_commission_payment" ON "PIQ_Commission"("payment_id");

COMMENT ON TABLE "PIQ_Commission" IS 'Tracks platform commission from completed bookings';
COMMENT ON COLUMN "PIQ_Commission"."status" IS 'pending, calculated, settled';
