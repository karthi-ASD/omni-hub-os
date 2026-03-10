
-- Add extra columns to clients for import fields
ALTER TABLE clients ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS mobile text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website text;
