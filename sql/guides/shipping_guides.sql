CREATE TABLE shipping_guides (
  guide_id BIGINT AUTO_INCREMENT,

  /* ---------------------------------
     Información del servicio
  --------------------------------- */
  service_type ENUM('NORMAL','PRIORITY','EXPRESS') NOT NULL,
  payment_method ENUM('CONTADO','CONTRAENTREGA') DEFAULT 'CONTADO',

  /* ---------------------------------
     Información financiera
  --------------------------------- */
  declared_value DECIMAL(12,2) NOT NULL,
  price DECIMAL(12,2) NOT NULL,

  /* ---------------------------------
     Estado y tracking
  --------------------------------- */
  current_status ENUM(
    'CREATED',
    'IN_ROUTE',
    'IN_WAREHOUSE',
    'DELIVERED',
    'CANCELLED'
  ) NOT NULL DEFAULT 'CREATED',

  /* ---------------------------------
     Ubicación (cities normalizada)
  --------------------------------- */
  origin_city_id BIGINT NOT NULL,
  destination_city_id BIGINT NOT NULL,

  /* ---------------------------------
     PDF
  --------------------------------- */
  pdf_url VARCHAR(500),
  pdf_s3_key VARCHAR(500),

  /* ---------------------------------
     Auditoría
  --------------------------------- */
  created_by VARCHAR(255)
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  /* ---------------------------------
     Keys & Constraints
  --------------------------------- */
  CONSTRAINT pk_shipping_guides
    PRIMARY KEY (guide_id),

  CONSTRAINT fk_guide_origin_city
    FOREIGN KEY (origin_city_id)
    REFERENCES cities(id),

  CONSTRAINT fk_guide_destination_city
    FOREIGN KEY (destination_city_id)
    REFERENCES cities(id),

  CONSTRAINT fk_guide_created_by
    FOREIGN KEY (created_by)
    REFERENCES users(user_uuid)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
