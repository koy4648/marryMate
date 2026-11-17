CREATE TABLE planning_items (
    id BIGINT NOT NULL AUTO_INCREMENT,
    workspace_id BIGINT NOT NULL,
    service_group VARCHAR(80) NOT NULL,
    item_name VARCHAR(120) NOT NULL,
    vendor_name VARCHAR(160) NOT NULL DEFAULT '',
    status VARCHAR(30) NOT NULL,
    schedule_date DATE NULL,
    quoted_amount DECIMAL(15, 0) NOT NULL DEFAULT 0,
    actual_amount DECIMAL(15, 0) NOT NULL DEFAULT 0,
    rating INT NULL,
    review_type VARCHAR(30) NOT NULL DEFAULT 'NONE',
    review TEXT NOT NULL,
    pros VARCHAR(1000) NOT NULL DEFAULT '',
    cons VARCHAR(1000) NOT NULL DEFAULT '',
    memo VARCHAR(1000) NOT NULL DEFAULT '',
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_planning_items_workspace FOREIGN KEY (workspace_id) REFERENCES couple_workspaces (id)
);

CREATE INDEX idx_planning_items_workspace_group ON planning_items (workspace_id, service_group, item_name);
CREATE INDEX idx_planning_items_workspace_date ON planning_items (workspace_id, schedule_date);
