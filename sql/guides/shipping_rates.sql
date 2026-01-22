-- =====================================================
-- TABLA DE TARIFAS DE ENVÍO
-- =====================================================

CREATE TABLE shipping_rates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  origin_city_id BIGINT NOT NULL,
  destination_city_id BIGINT NOT NULL,
  route VARCHAR(200) NOT NULL,
  travel_frequency VARCHAR(100) NOT NULL,
  min_dispatch_kg INT NOT NULL,
  price_per_kg DECIMAL(10,2) NOT NULL,
  min_value DECIMAL(10,2) NOT NULL,
  effective_date DATE NOT NULL DEFAULT '2025-12-29',
  
  CONSTRAINT fk_origin_city 
    FOREIGN KEY (origin_city_id) 
    REFERENCES cities(id),
    
  CONSTRAINT fk_destination_city 
    FOREIGN KEY (destination_city_id) 
    REFERENCES cities(id),
    
  INDEX idx_origin_dest (origin_city_id, destination_city_id),
  INDEX idx_destination (destination_city_id)
) ENGINE=InnoDB;