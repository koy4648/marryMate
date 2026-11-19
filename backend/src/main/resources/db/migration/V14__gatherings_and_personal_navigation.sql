ALTER TABLE planning_items ADD COLUMN expected_attendees INT NOT NULL DEFAULT 0;

CREATE TABLE gathering_attendees (
    planning_item_id BIGINT NOT NULL,
    attendee_order INT NOT NULL,
    name VARCHAR(80) NOT NULL,
    side VARCHAR(10) NOT NULL,
    PRIMARY KEY (planning_item_id, attendee_order),
    CONSTRAINT fk_gathering_attendees_item FOREIGN KEY (planning_item_id) REFERENCES planning_items(id) ON DELETE CASCADE
);

CREATE TABLE user_navigation_preferences (
    user_id BIGINT NOT NULL,
    visible_menus VARCHAR(160) NOT NULL,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_navigation_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Keep original IDs so existing payments and calendar dates stay linked.
UPDATE planning_items SET service_group='상견례' WHERE service_group='식사' AND item_name LIKE '상견례%';
UPDATE planning_items SET service_group='청모' WHERE service_group='식사';
UPDATE payments p JOIN planning_items i ON p.planning_item_id=i.id
SET p.category=i.service_group WHERE p.category='식사' AND i.service_group IN ('상견례','청모');

INSERT INTO planning_items (workspace_id,service_group,item_name,vendor_name,status,quoted_amount,actual_amount,review_type,review,pros,cons,memo,created_at,updated_at)
SELECT w.id,'상견례',t.item_name,'','TODO',0,0,'NONE','','','','',CURRENT_TIMESTAMP(6),CURRENT_TIMESTAMP(6)
FROM couple_workspaces w
CROSS JOIN (SELECT '상견례 식사' AS item_name UNION ALL SELECT '상견례 선물') t
WHERE NOT EXISTS (SELECT 1 FROM planning_items p WHERE p.workspace_id=w.id AND p.service_group='상견례' AND p.item_name=t.item_name);
