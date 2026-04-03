ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';

-- Set your account to admin (run once):
-- UPDATE "User" SET role = 'admin' WHERE email = 'kyle.reid@marginpilot.co';
