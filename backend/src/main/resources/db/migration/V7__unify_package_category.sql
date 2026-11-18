-- Keep existing record IDs, package contents and payment links while consolidating the category.
UPDATE planning_items SET service_group = '패키지'
WHERE package_contract = TRUE OR service_group = '스드메';

UPDATE payments SET category = '패키지' WHERE category = '스드메';
UPDATE payments p JOIN planning_items i ON i.id = p.planning_item_id AND i.workspace_id = p.workspace_id
SET p.category = '패키지' WHERE i.package_contract = TRUE;
