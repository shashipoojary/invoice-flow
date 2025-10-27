-- Add unique constraint on client email per user to prevent duplicates
-- This ensures that each user can only have one client with the same email address

-- First, remove any existing duplicate clients (keep the most recent one)
WITH duplicate_clients AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, email 
      ORDER BY created_at DESC
    ) as rn
  FROM clients
)
DELETE FROM clients 
WHERE id IN (
  SELECT id 
  FROM duplicate_clients 
  WHERE rn > 1
);

-- Add unique constraint
ALTER TABLE clients 
ADD CONSTRAINT unique_client_email_per_user 
UNIQUE (user_id, email);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_clients_user_email 
ON clients (user_id, email);
