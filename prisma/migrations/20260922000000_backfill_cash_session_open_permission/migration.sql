-- Ensure existing selling roles can open a register.
INSERT INTO "permissions" ("id", "key", "group", "label")
VALUES (md5(random()::text || clock_timestamp()::text), 'CASH_SESSION_OPEN', 'Cash Register', 'Cash Session Open')
ON CONFLICT ("key") DO UPDATE
SET "group" = EXCLUDED."group", "label" = EXCLUDED."label";

INSERT INTO "role_permissions" ("id", "roleId", "permissionId")
SELECT
  md5(random()::text || clock_timestamp()::text),
  r."id",
  p."id"
FROM "roles" r
JOIN "permissions" p ON p."key" = 'CASH_SESSION_OPEN'
WHERE r."isSystem" = true
  AND r."slug" IN ('owner', 'administrator', 'manager', 'cashier')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;