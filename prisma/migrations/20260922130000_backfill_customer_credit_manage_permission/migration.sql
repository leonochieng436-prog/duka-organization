-- Ensure existing system roles can manage customer credit, matching the RBAC defaults.
INSERT INTO "permissions" ("id", "key", "group", "label")
VALUES (md5(random()::text || clock_timestamp()::text), 'CUSTOMER_CREDIT_MANAGE', 'Customers', 'Customer Credit Manage')
ON CONFLICT ("key") DO UPDATE
SET "group" = EXCLUDED."group", "label" = EXCLUDED."label";

INSERT INTO "role_permissions" ("id", "roleId", "permissionId")
SELECT
  md5(random()::text || clock_timestamp()::text),
  r."id",
  p."id"
FROM "roles" r
JOIN "permissions" p ON p."key" = 'CUSTOMER_CREDIT_MANAGE'
WHERE r."isSystem" = true
  AND r."slug" IN ('owner', 'administrator', 'manager', 'accountant')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;