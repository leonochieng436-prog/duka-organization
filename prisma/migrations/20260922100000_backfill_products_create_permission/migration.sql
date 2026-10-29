-- Ensure existing system roles can create products, matching the RBAC defaults.
INSERT INTO "permissions" ("id", "key", "group", "label")
VALUES (md5(random()::text || clock_timestamp()::text), 'PRODUCTS_CREATE', 'Products', 'Products Create')
ON CONFLICT ("key") DO UPDATE
SET "group" = EXCLUDED."group", "label" = EXCLUDED."label";

INSERT INTO "role_permissions" ("id", "roleId", "permissionId")
SELECT
  md5(random()::text || clock_timestamp()::text),
  r."id",
  p."id"
FROM "roles" r
JOIN "permissions" p ON p."key" = 'PRODUCTS_CREATE'
WHERE r."isSystem" = true
  AND r."slug" IN ('owner', 'administrator', 'manager', 'inventory_manager', 'procurement_officer')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;