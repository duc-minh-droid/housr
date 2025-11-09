-- Add username column to User table
ALTER TABLE "User" ADD COLUMN "username" TEXT;

-- Generate unique usernames for existing users
-- Format: role-shortid (e.g., tenant-a1b2, landlord-c3d4)
UPDATE "User" 
SET "username" = CONCAT(
    LOWER("role"::text), 
    '-', 
    SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6)
);

-- Make username unique and not null
ALTER TABLE "User" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- Add acceptedAt column to RentPlan table
ALTER TABLE "RentPlan" ADD COLUMN "acceptedAt" TIMESTAMP(3);

