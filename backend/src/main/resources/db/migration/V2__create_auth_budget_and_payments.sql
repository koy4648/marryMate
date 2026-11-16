CREATE TABLE auth_sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    token_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_auth_sessions_token_hash UNIQUE (token_hash),
    CONSTRAINT fk_auth_sessions_user FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE INDEX idx_auth_sessions_user ON auth_sessions (user_id);

CREATE TABLE workspace_invites (
    id BIGINT NOT NULL AUTO_INCREMENT,
    workspace_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL,
    code_hash CHAR(64) NOT NULL,
    expires_at TIMESTAMP(6) NOT NULL,
    used_at TIMESTAMP(6) NULL,
    created_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_workspace_invites_code_hash UNIQUE (code_hash),
    CONSTRAINT fk_workspace_invites_workspace FOREIGN KEY (workspace_id) REFERENCES couple_workspaces (id),
    CONSTRAINT fk_workspace_invites_user FOREIGN KEY (created_by) REFERENCES users (id)
);

CREATE TABLE budget_plans (
    id BIGINT NOT NULL AUTO_INCREMENT,
    workspace_id BIGINT NOT NULL,
    target_amount DECIMAL(15, 0) NOT NULL DEFAULT 0,
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_budget_plans_workspace UNIQUE (workspace_id),
    CONSTRAINT fk_budget_plans_workspace FOREIGN KEY (workspace_id) REFERENCES couple_workspaces (id)
);

CREATE TABLE payments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    workspace_id BIGINT NOT NULL,
    category VARCHAR(80) NOT NULL,
    title VARCHAR(160) NOT NULL,
    payment_type VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    scheduled_amount DECIMAL(15, 0) NOT NULL,
    actual_amount DECIMAL(15, 0) NOT NULL DEFAULT 0,
    due_date DATE NOT NULL,
    paid_date DATE NULL,
    payer VARCHAR(80) NOT NULL,
    memo VARCHAR(1000) NOT NULL DEFAULT '',
    created_at TIMESTAMP(6) NOT NULL,
    updated_at TIMESTAMP(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_payments_workspace FOREIGN KEY (workspace_id) REFERENCES couple_workspaces (id)
);

CREATE INDEX idx_payments_workspace_due_date ON payments (workspace_id, due_date);

