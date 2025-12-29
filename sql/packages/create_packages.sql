CREATE TABLE packages (
  package_id     BIGINT AUTO_INCREMENT,
  guide_id       BIGINT NOT NULL,

  weight_kg      DECIMAL(8,2) NOT NULL,
  pieces         INT NOT NULL DEFAULT 1,

  length_cm      DECIMAL(8,2) NOT NULL,
  width_cm       DECIMAL(8,2) NOT NULL,
  height_cm      DECIMAL(8,2) NOT NULL,

  insured        BOOLEAN DEFAULT FALSE,
  description    TEXT,
  special_notes  TEXT,

  CONSTRAINT pk_packages PRIMARY KEY (package_id),
  CONSTRAINT fk_package_guide FOREIGN KEY (guide_id) REFERENCES shipping_guides(guide_id)
) ENGINE=InnoDB;
