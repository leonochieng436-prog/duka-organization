-- Backfill the eTIMS permission catalog and system-role assignments for organizations
-- created before the eTIMS module was introduced.
INSERT INTO "permissions" ("id", "key", "group", "label")
VALUES
  (md5(random()::text || clock_timestamp()::text), 'ETIMS_VIEW', 'Invoicing', 'eTIMS View'),
  (md5(random()::text || clock_timestamp()::text), 'ETIMS_CONFIGURE', 'Invoicing', 'eTIMS Configure'),
  (md5(random()::text || clock_timestamp()::text), 'ETIMS_SUBMIT', 'Invoicing', 'eTIMS Submit'),
  (md5(random()::text || clock_timestamp()::text), 'ETIMS_RETRY', 'Invoicing', 'eTIMS Retry'),
  (md5(random()::text || clock_timestamp()::text), 'ETIMS_CANCEL', 'Invoicing', 'eTIMS Cancel'),
  (md5(random()::text || clock_timestamp()::text), 'ETIMS_EXPORT', 'Invoicing', 'eTIMS Export')
ON CONFLICT ("key") DO UPDATE
SET "group" = EXCLUDED."group", "label" = EXCLUDED."label";

WITH role_permission_keys ("slug", "key") AS (
  SELECT r."slug", p."key"
  FROM "roles" r CROSS JOIN "permissions" p
  WHERE r."isSystem" = true AND r."slug" = 'owner'
    AND p."key" IN ('ETIMS_VIEW', 'ETIMS_CONFIGURE', 'ETIMS_SUBMIT', 'ETIMS_RETRY', 'ETIMS_CANCEL', 'ETIMS_EXPORT')
  UNION ALL
  SELECT r."slug", p."key"
  FROM "roles" r CROSS JOIN "permissions" p
  WHERE r."isSystem" = true AND r."slug" = 'administrator'
    AND p."key" IN ('ETIMS_VIEW', 'ETIMS_CONFIGURE', 'ETIMS_SUBMIT', 'ETIMS_RETRY', 'ETIMS_CANCEL', 'ETIMS_EXPORT')
  UNION ALL
  SELECT r."slug", p."key"
  FROM "roles" r CROSS JOIN (VALUES
    ('ETIMS_VIEW'), ('ETIMS_CONFIGURE'), ('ETIMS_SUBMIT'), ('ETIMS_RETRY'), ('ETIMS_CANCEL'), ('ETIMS_EXPORT')
  ) AS p("key")
  WHERE r."isSystem" = true AND r."slug" = 'manager'
  UNION ALL
  SELECT r."slug", p."key"
  FROM "roles" r CROSS JOIN (VALUES
    ('ETIMS_VIEW'), ('ETIMS_RETRY')
  ) AS p("key")
  WHERE r."isSystem" = true AND r."slug" = 'cashier'
)
INSERT INTO "role_permissions" ("id", "roleId", "permissionId")
SELECT md5(random()::text || clock_timestamp()::text), r."id", p."id"
FROM role_permission_keys keys
JOIN "roles" r ON r."slug" = keys."slug" AND r."isSystem" = true
JOIN "permissions" p ON p."key" = keys."key"
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
