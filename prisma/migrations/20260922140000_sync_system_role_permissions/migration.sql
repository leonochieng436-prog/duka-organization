-- Synchronize the permission catalog and existing system roles with the RBAC defaults.
INSERT INTO "permissions" ("id", "key", "group", "label")
VALUES
  (md5(random()::text || clock_timestamp()::text), 'SALES_VIEW', 'Sales', 'Sales View'),
  (md5(random()::text || clock_timestamp()::text), 'SALES_CREATE', 'Sales', 'Sales Create'),
  (md5(random()::text || clock_timestamp()::text), 'SALES_VOID', 'Sales', 'Sales Void'),
  (md5(random()::text || clock_timestamp()::text), 'SALES_REFUND', 'Sales', 'Sales Refund'),
  (md5(random()::text || clock_timestamp()::text), 'SALES_DISCOUNT_OVERRIDE', 'Sales', 'Sales Discount Override'),
  (md5(random()::text || clock_timestamp()::text), 'SALES_PRICE_OVERRIDE', 'Sales', 'Sales Price Override'),
  (md5(random()::text || clock_timestamp()::text), 'CASH_SESSION_OPEN', 'Cash Register', 'Cash Session Open'),
  (md5(random()::text || clock_timestamp()::text), 'CASH_SESSION_CLOSE', 'Cash Register', 'Cash Session Close'),
  (md5(random()::text || clock_timestamp()::text), 'CASH_SESSION_VIEW_ALL', 'Cash Register', 'Cash Session View All'),
  (md5(random()::text || clock_timestamp()::text), 'PRODUCTS_VIEW', 'Products', 'Products View'),
  (md5(random()::text || clock_timestamp()::text), 'PRODUCTS_CREATE', 'Products', 'Products Create'),
  (md5(random()::text || clock_timestamp()::text), 'PRODUCTS_UPDATE', 'Products', 'Products Update'),
  (md5(random()::text || clock_timestamp()::text), 'PRODUCTS_DELETE', 'Products', 'Products Delete'),
  (md5(random()::text || clock_timestamp()::text), 'INVENTORY_VIEW', 'Inventory', 'Inventory View'),
  (md5(random()::text || clock_timestamp()::text), 'INVENTORY_ADJUST', 'Inventory', 'Inventory Adjust'),
  (md5(random()::text || clock_timestamp()::text), 'INVENTORY_TRANSFER', 'Inventory', 'Inventory Transfer'),
  (md5(random()::text || clock_timestamp()::text), 'INVENTORY_STOCK_COUNT', 'Inventory', 'Inventory Stock Count'),
  (md5(random()::text || clock_timestamp()::text), 'SUPPLIERS_VIEW', 'Procurement', 'Suppliers View'),
  (md5(random()::text || clock_timestamp()::text), 'SUPPLIERS_MANAGE', 'Procurement', 'Suppliers Manage'),
  (md5(random()::text || clock_timestamp()::text), 'PURCHASE_VIEW', 'Procurement', 'Purchase View'),
  (md5(random()::text || clock_timestamp()::text), 'PURCHASE_CREATE', 'Procurement', 'Purchase Create'),
  (md5(random()::text || clock_timestamp()::text), 'PURCHASE_APPROVE', 'Procurement', 'Purchase Approve'),
  (md5(random()::text || clock_timestamp()::text), 'PURCHASE_RECEIVE', 'Procurement', 'Purchase Receive'),
  (md5(random()::text || clock_timestamp()::text), 'CUSTOMERS_VIEW', 'Customers', 'Customers View'),
  (md5(random()::text || clock_timestamp()::text), 'CUSTOMERS_MANAGE', 'Customers', 'Customers Manage'),
  (md5(random()::text || clock_timestamp()::text), 'CUSTOMER_CREDIT_MANAGE', 'Customers', 'Customer Credit Manage'),
  (md5(random()::text || clock_timestamp()::text), 'INVOICES_VIEW', 'Invoicing', 'Invoices View'),
  (md5(random()::text || clock_timestamp()::text), 'INVOICES_MANAGE', 'Invoicing', 'Invoices Manage'),
  (md5(random()::text || clock_timestamp()::text), 'EXPENSE_VIEW', 'Expenses', 'Expense View'),
  (md5(random()::text || clock_timestamp()::text), 'EXPENSE_CREATE', 'Expenses', 'Expense Create'),
  (md5(random()::text || clock_timestamp()::text), 'EXPENSE_DELETE', 'Expenses', 'Expense Delete'),
  (md5(random()::text || clock_timestamp()::text), 'REPORTS_VIEW', 'Reports & Analytics', 'Reports View'),
  (md5(random()::text || clock_timestamp()::text), 'REPORTS_EXPORT', 'Reports & Analytics', 'Reports Export'),
  (md5(random()::text || clock_timestamp()::text), 'ANALYTICS_VIEW', 'Reports & Analytics', 'Analytics View'),
  (md5(random()::text || clock_timestamp()::text), 'USERS_MANAGE', 'Administration', 'Users Manage'),
  (md5(random()::text || clock_timestamp()::text), 'ROLES_MANAGE', 'Administration', 'Roles Manage'),
  (md5(random()::text || clock_timestamp()::text), 'BRANCHES_MANAGE', 'Administration', 'Branches Manage'),
  (md5(random()::text || clock_timestamp()::text), 'SETTINGS_MANAGE', 'Administration', 'Settings Manage'),
  (md5(random()::text || clock_timestamp()::text), 'AUDIT_LOG_VIEW', 'Administration', 'Audit Log View'),
  (md5(random()::text || clock_timestamp()::text), 'BILLING_MANAGE', 'Administration', 'Billing Manage')
ON CONFLICT ("key") DO UPDATE
SET "group" = EXCLUDED."group", "label" = EXCLUDED."label";

WITH role_permission_keys ("slug", "key") AS (
  SELECT r."slug", p."key"
  FROM "roles" r CROSS JOIN "permissions" p
  WHERE r."isSystem" = true AND r."slug" = 'owner'
  UNION ALL
  SELECT r."slug", p."key"
  FROM "roles" r CROSS JOIN "permissions" p
  WHERE r."isSystem" = true AND r."slug" = 'administrator' AND p."key" <> 'BILLING_MANAGE'
  UNION ALL
  SELECT r."slug", p."key" FROM "roles" r CROSS JOIN (VALUES
    ('SALES_VIEW'), ('SALES_CREATE'), ('SALES_VOID'), ('SALES_REFUND'),
    ('CASH_SESSION_OPEN'), ('CASH_SESSION_CLOSE'), ('CASH_SESSION_VIEW_ALL'),
    ('PRODUCTS_VIEW'), ('PRODUCTS_CREATE'), ('PRODUCTS_UPDATE'),
    ('INVENTORY_VIEW'), ('INVENTORY_ADJUST'), ('INVENTORY_TRANSFER'), ('INVENTORY_STOCK_COUNT'),
    ('SUPPLIERS_VIEW'), ('PURCHASE_VIEW'), ('PURCHASE_CREATE'), ('PURCHASE_RECEIVE'),
    ('CUSTOMERS_VIEW'), ('CUSTOMERS_MANAGE'), ('CUSTOMER_CREDIT_MANAGE'),
    ('INVOICES_VIEW'), ('INVOICES_MANAGE'), ('EXPENSE_VIEW'), ('EXPENSE_CREATE'),
    ('REPORTS_VIEW'), ('REPORTS_EXPORT'), ('ANALYTICS_VIEW')
  ) AS p("key") WHERE r."isSystem" = true AND r."slug" = 'manager'
  UNION ALL
  SELECT r."slug", p."key" FROM "roles" r CROSS JOIN (VALUES
    ('SALES_VIEW'), ('SALES_CREATE'), ('CASH_SESSION_OPEN'), ('CASH_SESSION_CLOSE'),
    ('PRODUCTS_VIEW'), ('CUSTOMERS_VIEW'), ('CUSTOMERS_MANAGE'), ('INVOICES_VIEW'), ('INVOICES_MANAGE')
  ) AS p("key") WHERE r."isSystem" = true AND r."slug" = 'cashier'
  UNION ALL
  SELECT r."slug", p."key" FROM "roles" r CROSS JOIN (VALUES
    ('PRODUCTS_VIEW'), ('PRODUCTS_CREATE'), ('PRODUCTS_UPDATE'), ('INVENTORY_VIEW'),
    ('INVENTORY_ADJUST'), ('INVENTORY_TRANSFER'), ('INVENTORY_STOCK_COUNT'), ('SUPPLIERS_VIEW'), ('REPORTS_VIEW')
  ) AS p("key") WHERE r."isSystem" = true AND r."slug" = 'inventory_manager'
  UNION ALL
  SELECT r."slug", p."key" FROM "roles" r CROSS JOIN (VALUES
    ('SUPPLIERS_VIEW'), ('SUPPLIERS_MANAGE'), ('PURCHASE_VIEW'), ('PURCHASE_CREATE'),
    ('PURCHASE_APPROVE'), ('PURCHASE_RECEIVE'), ('PRODUCTS_VIEW'), ('REPORTS_VIEW')
  ) AS p("key") WHERE r."isSystem" = true AND r."slug" = 'procurement_officer'
  UNION ALL
  SELECT r."slug", p."key" FROM "roles" r CROSS JOIN (VALUES
    ('SALES_VIEW'), ('EXPENSE_VIEW'), ('EXPENSE_CREATE'), ('CUSTOMERS_VIEW'),
    ('CUSTOMER_CREDIT_MANAGE'), ('SUPPLIERS_VIEW'), ('PURCHASE_VIEW'),
    ('REPORTS_VIEW'), ('REPORTS_EXPORT'), ('ANALYTICS_VIEW'), ('AUDIT_LOG_VIEW')
  ) AS p("key") WHERE r."isSystem" = true AND r."slug" = 'accountant'
)
INSERT INTO "role_permissions" ("id", "roleId", "permissionId")
SELECT md5(random()::text || clock_timestamp()::text), r."id", p."id"
FROM role_permission_keys keys
JOIN "roles" r ON r."slug" = keys."slug" AND r."isSystem" = true
JOIN "permissions" p ON p."key" = keys."key"
ON CONFLICT ("roleId", "permissionId") DO NOTHING;