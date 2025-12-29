CREATE TABLE guide_parties (
  party_id BIGINT AUTO_INCREMENT,
  guide_id BIGINT NOT NULL,

  party_role ENUM('SENDER','RECEIVER') NOT NULL,

  full_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50),
  document_number VARCHAR(50),

  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address VARCHAR(500) NOT NULL,

  /* ---------------------------------
     Ubicación (cities normalizada)
  --------------------------------- */
  city_id BIGINT NOT NULL,

  /* ---------------------------------
     Keys & Constraints
  --------------------------------- */
  CONSTRAINT pk_guide_parties
    PRIMARY KEY (party_id),

  CONSTRAINT uq_guide_party
    UNIQUE (guide_id, party_role),

  CONSTRAINT fk_party_guide
    FOREIGN KEY (guide_id)
    REFERENCES shipping_guides(guide_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_party_city
    FOREIGN KEY (city_id)
    REFERENCES cities(id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;
