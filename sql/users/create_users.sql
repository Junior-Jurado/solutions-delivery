CREATE TABLE users (
  user_uuid   VARCHAR(255) NOT NULL,
  full_name   VARCHAR(255),
  email       VARCHAR(255) NOT NULL,
  phone       VARCHAR(50),
  type_document VARCHAR(50),
  number_document NUMERIC(20,0),
  role        ENUM('CLIENT','ADMIN','SECRETARY','DELIVERY') NOT NULL DEFAULT 'CLIENT',
  last_login  TIMESTAMP NULL,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT pk_users PRIMARY KEY (user_uuid),
  CONSTRAINT uq_users_email UNIQUE (email),
  -- CONSTRAINT uq_users_phone UNIQUE (phone),
  CONSTRAINT uq_users_number_document UNIQUE (number_document)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
