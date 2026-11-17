ALTER TABLE planning_items
    ADD COLUMN package_contract BOOLEAN NOT NULL DEFAULT FALSE AFTER actual_amount,
    ADD COLUMN package_base_amount DECIMAL(15, 0) NOT NULL DEFAULT 0 AFTER package_contract,
    ADD COLUMN package_additional_amount DECIMAL(15, 0) NOT NULL DEFAULT 0 AFTER package_base_amount,
    ADD COLUMN package_included_items VARCHAR(2000) NOT NULL DEFAULT '' AFTER package_additional_amount,
    ADD COLUMN package_additional_details VARCHAR(2000) NOT NULL DEFAULT '' AFTER package_included_items;
