-- Create Provider_Documents table for document verification
CREATE TABLE IF NOT EXISTS "Provider_Documents" (
  document_id SERIAL PRIMARY KEY,
  provider_id INTEGER NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(512) NOT NULL,
  uploaded_by VARCHAR(255),
  upload_date TIMESTAMP DEFAULT NOW(),
  verification_status VARCHAR(20) DEFAULT 'pending',
  verified_by VARCHAR(255),
  verified_date TIMESTAMP,
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_provider
    FOREIGN KEY (provider_id) 
    REFERENCES "PIQ_Service_Provider"(service_provider_id)
    ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_provider_documents_provider_id ON "Provider_Documents"(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_status ON "Provider_Documents"(verification_status);
CREATE INDEX IF NOT EXISTS idx_provider_documents_type ON "Provider_Documents"(document_type);

-- Add comments
COMMENT ON TABLE "Provider_Documents" IS 'Stores provider document metadata for verification';
COMMENT ON COLUMN "Provider_Documents".document_type IS 'Type of document: license, certification, insurance, id, etc.';
COMMENT ON COLUMN "Provider_Documents".storage_path IS 'Path in Supabase storage bucket';
COMMENT ON COLUMN "Provider_Documents".verification_status IS 'Status: pending, approved, rejected';
