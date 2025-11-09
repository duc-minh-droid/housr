-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Budget" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "daysCompleted" INTEGER NOT NULL DEFAULT 0,
    "lastCheckedDate" DATETIME,
    "pointsAwarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Budget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Budget" ("amount", "createdAt", "id", "period", "tenantId", "updatedAt") SELECT "amount", "createdAt", "id", "period", "tenantId", "updatedAt" FROM "Budget";
DROP TABLE "Budget";
ALTER TABLE "new_Budget" RENAME TO "Budget";
CREATE UNIQUE INDEX "Budget_tenantId_period_key" ON "Budget"("tenantId", "period");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
