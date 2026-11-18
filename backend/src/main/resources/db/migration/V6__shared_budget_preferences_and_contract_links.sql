ALTER TABLE couple_workspaces ADD COLUMN home_title VARCHAR(160) NOT NULL DEFAULT '';
ALTER TABLE couple_workspaces ADD COLUMN home_message VARCHAR(300) NOT NULL DEFAULT '';
ALTER TABLE budget_plans ADD COLUMN include_honeymoon BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE budget_plans ADD COLUMN include_gifts BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE budget_plans ADD COLUMN gift_amount DECIMAL(15,0) NOT NULL DEFAULT 0;
ALTER TABLE planning_items ADD COLUMN package_parent_id BIGINT NULL;
ALTER TABLE planning_items ADD CONSTRAINT fk_planning_package FOREIGN KEY (package_parent_id) REFERENCES planning_items(id);
ALTER TABLE payments ADD COLUMN planning_item_id BIGINT NULL;
ALTER TABLE payments ADD CONSTRAINT fk_payment_planning FOREIGN KEY (planning_item_id) REFERENCES planning_items(id);
CREATE UNIQUE INDEX ux_contract_payment_stage ON payments(workspace_id, planning_item_id, payment_type);

-- Link legacy auto-created stages only when both the selected candidate and payment are unambiguous.
UPDATE payments p
JOIN (
    SELECT workspace_id, service_group, item_name, vendor_name, MIN(id) AS item_id
    FROM planning_items
    WHERE status IN ('CONTRACTED', 'DONE')
    GROUP BY workspace_id, service_group, item_name, vendor_name
    HAVING COUNT(*) = 1
) i ON i.workspace_id = p.workspace_id AND i.service_group = p.category
JOIN (
    SELECT workspace_id, category, title, payment_type, MIN(id) AS payment_id
    FROM payments
    WHERE memo LIKE '% 업체 확정에서 연결'
    GROUP BY workspace_id, category, title, payment_type
    HAVING COUNT(*) = 1
) legacy ON legacy.payment_id = p.id
SET p.planning_item_id = i.item_id
WHERE p.planning_item_id IS NULL
  AND p.memo = CONCAT(i.item_name, ' 업체 확정에서 연결')
  AND p.title = CONCAT(CASE WHEN i.vendor_name = '' THEN i.item_name ELSE i.vendor_name END, ' ',
      CASE p.payment_type WHEN 'DEPOSIT' THEN '계약금' WHEN 'INTERIM' THEN '중도금' WHEN 'BALANCE' THEN '잔금' ELSE '' END);
