CREATE TABLE guide_status_history (
  history_id BIGINT AUTO_INCREMENT,
  guide_id   BIGINT NOT NULL,

  status ENUM(
    'CREATED',
    'IN_ROUTE',
    'IN_WAREHOUSE',
    'OUT_FOR_DELIVERY',
    'DELIVERED'
  ) NOT NULL,

  updated_by VARCHAR(255)
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT pk_guide_status_history PRIMARY KEY (history_id),

  CONSTRAINT fk_history_guide
    FOREIGN KEY (guide_id)
    REFERENCES shipping_guides(guide_id),

  CONSTRAINT fk_history_user
    FOREIGN KEY (updated_by)
    REFERENCES users(user_uuid)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
