-- Tabla para registrar modificaciones de precio
CREATE TABLE guide_price_overrides (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  guide_id BIGINT NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  new_price DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  overridden_by VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_guide_override 
    FOREIGN KEY (guide_id) 
    REFERENCES shipping_guides(guide_id)
    ON DELETE CASCADE,
    
  INDEX idx_guide_id (guide_id),
  INDEX idx_overridden_by (overridden_by)
) ENGINE=InnoDB;