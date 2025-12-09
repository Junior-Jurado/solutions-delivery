CREATE TABLE users (
  user_uuid   VARCHAR(255) NOT NULL,
  full_name   VARCHAR(255),
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(50),
  role        ENUM('client','admin','secretary','delivery') NOT NULL DEFAULT 'client',
  last_login  TIMESTAMP NULL,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_users PRIMARY KEY (user_uuid),
  CONSTRAINT uq_users_email UNIQUE (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
;