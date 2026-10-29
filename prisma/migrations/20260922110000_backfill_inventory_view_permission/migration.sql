-- Ensure existing system roles can view inventory, matching the RBAC defaults.
INSERT INTO "permissions" ("id", "key", "group", "label")
VALUES (md5(random()::text || clock_timestamp()::text), 'INVENTORY_VIEW', 'Inventory', 'Inventory View')
ON CONFLICT ("key") DO UPDATE
SET "group" = EXCLUDED."group", "label" = EXCLUDED."label";

INSERT INTO "role_permissions" ("id", "roleId", "permissionId")
SELECT
  md5(random()::text || clock_timestamp()::text),
  r."id",
  p."id"
FROM "roles" r
JOIN "permissions" p ON p."key" = 'INVENTORY_VIEW'
WHERE r."isSystem" = true
  AND r."slug" IN ('owner', 'administrator', 'manager', 'inventory_manager')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;