SET @wedding_date_ddl = IF(
    (SELECT COUNT(*) FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'couple_workspaces' AND column_name = 'wedding_date') = 0,
    'ALTER TABLE couple_workspaces ADD COLUMN wedding_date DATE NULL AFTER name',
    'SELECT 1'
);
PREPARE wedding_date_statement FROM @wedding_date_ddl;
EXECUTE wedding_date_statement;
DEALLOCATE PREPARE wedding_date_statement;

CREATE TABLE venue_reviews (
    id BIGINT NOT NULL AUTO_INCREMENT,
    workspace_id BIGINT NOT NULL,
    planning_item_id BIGINT NOT NULL,
    review_type VARCHAR(30) NOT NULL,
    visited_date DATE NULL,
    content TEXT NOT NULL,
    pros VARCHAR(1000) NOT NULL DEFAULT '',
    cons VARCHAR(1000) NOT NULL DEFAULT '',
    meal_price DECIMAL(15, 0) NOT NULL DEFAULT 0,
    minimum_guarantee INT NOT NULL DEFAULT 0,
    rental_fee DECIMAL(15, 0) NOT NULL DEFAULT 0,
    service_items VARCHAR(2000) NOT NULL DEFAULT '',
    same_day_benefits VARCHAR(2000) NOT NULL DEFAULT '',
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_venue_reviews_workspace FOREIGN KEY (workspace_id) REFERENCES couple_workspaces (id),
    CONSTRAINT fk_venue_reviews_planning_item FOREIGN KEY (planning_item_id) REFERENCES planning_items (id) ON DELETE CASCADE
);

CREATE INDEX idx_venue_reviews_workspace_item ON venue_reviews (workspace_id, planning_item_id, created_at);

INSERT INTO planning_items (workspace_id, service_group, item_name, vendor_name, status, quoted_amount, actual_amount, review_type, review, pros, cons, memo, created_at, updated_at)
SELECT w.id, t.service_group, t.item_name, '', 'TODO', 0, 0, 'NONE', '', '', '', '', CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)
FROM couple_workspaces w
CROSS JOIN (
    SELECT '신혼여행' AS service_group, '항공권' AS item_name UNION ALL
    SELECT '신혼여행', '숙소' UNION ALL
    SELECT '신혼여행', '투어·티켓' UNION ALL
    SELECT '신혼여행', '여권·비자' UNION ALL
    SELECT '신혼여행', '여행자보험' UNION ALL
    SELECT '신혼여행', '공항 이동' UNION ALL
    SELECT '신혼여행', '유심·eSIM' UNION ALL
    SELECT '신혼여행', '환전·결제수단' UNION ALL
    SELECT '신혼여행', '짐 싸기' UNION ALL
    SELECT '스드메', '스드메 패키지'
) t
WHERE NOT EXISTS (
    SELECT 1 FROM planning_items p
    WHERE p.workspace_id = w.id AND p.service_group = t.service_group AND p.item_name = t.item_name
);
