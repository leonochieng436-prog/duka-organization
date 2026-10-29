-- Ensure existing system roles can access the product catalog used by POS.
INSERT INTO "permissions" ("id", "key", "group", "label")
VALUES (md5(random()::text || clock_timestamp()::text), 'PRODUCTS_VIEW', 'Products', 'Products View')
ON CONFLICT ("key") DO UPDATE
SET "group" = EXCLUDED."group", "label" = EXCLUDED."label";

INSERT INTO "role_permissions" ("id", "roleId", "permissionId")
SELECT
  md5(random()::text || clock_timestamp()::text),
  r."id",
  p."id"
FROM "roles" r
JOIN "permissions" p ON p."key" = 'PRODUCTS_VIEW'
WHERE r."isSystem" = true
ON CONFLICT ("roleId", "permissionId") DO NOTHING;