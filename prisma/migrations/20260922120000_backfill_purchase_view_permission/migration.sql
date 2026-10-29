-- Ensure existing system roles can view purchases, matching the RBAC defaults.
INSERT INTO "permissions" ("id", "key", "group", "label")
VALUES (md5(random()::text || clock_timestamp()::text), 'PURCHASE_VIEW', 'Procurement', 'Purchase View')
ON CONFLICT ("key") DO UPDATE
SET "group" = EXCLUDED."group", "label" = EXCLUDED."label";

INSERT INTO "role_permissions" ("id", "roleId", "permissionId")
SELECT
  md5(random()::text || clock_timestamp()::text),
  r."id",
  p."id"
FROM "roles" r
JOIN "permissions" p ON p."key" = 'PURCHASE_VIEW'
WHERE r."isSystem" = true
  AND r."slug" IN ('owner', 'administrator', 'manager', 'procurement_officer', 'accountant')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;