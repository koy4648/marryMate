CREATE TABLE users
(
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname      VARCHAR(50)  NOT NULL,
    status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE couple_workspaces
(
    id                 BIGINT       NOT NULL AUTO_INCREMENT,
    name               VARCHAR(100) NOT NULL,
    created_by_user_id BIGINT       NOT NULL,
    created_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at         DATETIME(6)  NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_couple_workspaces PRIMARY KEY (id),
    CONSTRAINT fk_couple_workspaces_created_by
        FOREIGN KEY (created_by_user_id) REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE workspace_members
(
    id           BIGINT      NOT NULL AUTO_INCREMENT,
    workspace_id BIGINT      NOT NULL,
    user_id      BIGINT      NOT NULL,
    role         VARCHAR(20) NOT NULL,
    joined_at    DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_workspace_members PRIMARY KEY (id),
    CONSTRAINT uk_workspace_members_workspace_user
        UNIQUE (workspace_id, user_id),
    CONSTRAINT fk_workspace_members_workspace
        FOREIGN KEY (workspace_id)
            REFERENCES couple_workspaces (id)
            ON DELETE CASCADE,
    CONSTRAINT fk_workspace_members_user
        FOREIGN KEY (user_id)
            REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;


CREATE TABLE workspace_invites
(
    id                 BIGINT      NOT NULL AUTO_INCREMENT,
    workspace_id       BIGINT      NOT NULL,
    invite_code_hash   CHAR(64)    NOT NULL,
    created_by_user_id BIGINT      NOT NULL,
    used_by_user_id    BIGINT      NULL,
    expires_at         DATETIME(6) NOT NULL,
    used_at            DATETIME(6) NULL,
    created_at         DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),

    CONSTRAINT pk_workspace_invites PRIMARY KEY (id),
    CONSTRAINT uk_workspace_invites_code_hash
        UNIQUE (invite_code_hash),
    CONSTRAINT fk_workspace_invites_workspace
        FOREIGN KEY (workspace_id)
            REFERENCES couple_workspaces (id)
            ON DELETE CASCADE,
    CONSTRAINT fk_workspace_invites_created_by
        FOREIGN KEY (created_by_user_id)
            REFERENCES users (id),
    CONSTRAINT fk_workspace_invites_used_by
        FOREIGN KEY (used_by_user_id)
            REFERENCES users (id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;