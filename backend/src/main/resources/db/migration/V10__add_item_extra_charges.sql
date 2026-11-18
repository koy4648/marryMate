ALTER TABLE planning_items ADD COLUMN extra_amount DECIMAL(15,0) NOT NULL DEFAULT 0;
ALTER TABLE planning_items ADD COLUMN extra_details VARCHAR(1000) NOT NULL DEFAULT '';
ALTER TABLE planning_items ADD COLUMN extra_due_date DATE NULL;
