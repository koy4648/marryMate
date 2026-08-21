CREATE TABLE auth_sessions
(
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    token_hash CHAR(64)    NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_auth_sessions PRIMARY KEY (id),
    CONSTRAINT uk_auth_sessions_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_auth_sessions_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX idx_auth_sessions_user_id ON auth_sessions (user_id);
CREATE INDEX idx_auth_sessions_expires_at ON auth_sessions (expires_at);

CREATE TABLE venues
(
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    name       VARCHAR(150) NOT NULL,
    address    VARCHAR(500) NULL,
    created_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_venues PRIMARY KEY (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE venue_plans
(
    id               BIGINT      NOT NULL AUTO_INCREMENT,
    workspace_id     BIGINT      NOT NULL,
    venue_id          BIGINT      NOT NULL,
    candidate_status VARCHAR(30) NOT NULL,
    private_memo     TEXT        NULL,
    created_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at       DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_venue_plans PRIMARY KEY (id),
    CONSTRAINT fk_venue_plans_workspace
        FOREIGN KEY (workspace_id) REFERENCES couple_workspaces (id) ON DELETE CASCADE,
    CONSTRAINT fk_venue_plans_venue
        FOREIGN KEY (venue_id) REFERENCES venues (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX idx_venue_plans_workspace_id ON venue_plans (workspace_id);

CREATE TABLE venue_visits
(
    id             BIGINT      NOT NULL AUTO_INCREMENT,
    venue_plan_id  BIGINT      NOT NULL,
    visit_type     VARCHAR(30) NOT NULL,
    visit_date     DATE        NOT NULL,
    visit_time     TIME        NOT NULL,
    payload        JSON        NOT NULL,
    completed      BOOLEAN     NOT NULL DEFAULT FALSE,
    created_by     BIGINT      NOT NULL,
    last_modified_by BIGINT    NOT NULL,
    version        BIGINT      NOT NULL DEFAULT 0,
    created_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at     DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_venue_visits PRIMARY KEY (id),
    CONSTRAINT fk_venue_visits_plan
        FOREIGN KEY (venue_plan_id) REFERENCES venue_plans (id) ON DELETE CASCADE,
    CONSTRAINT fk_venue_visits_created_by
        FOREIGN KEY (created_by) REFERENCES users (id),
    CONSTRAINT fk_venue_visits_modified_by
        FOREIGN KEY (last_modified_by) REFERENCES users (id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE INDEX idx_venue_visits_plan_id ON venue_visits (venue_plan_id);
