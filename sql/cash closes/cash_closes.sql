-- Table to register cash closes
CREATE TABLE cash_closes (
  close_id BIGINT AUTO_INCREMENT,
  
  -- Close period
  period_type ENUM('DAILY', 'WEEKLY','MONTHLY','YEARLY') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- General totals
  total_guides INT NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Totals by payment method
  total_cash DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cod DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_credit DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Concept breakdown
  total_freight DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_other DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_handling DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_discounts DECIMAL(12,2) NOT NULL DEFAULT 0,
  
  -- Physical totals
  total_units INT NOT NULL DEFAULT 0,
  total_weight DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Generated PDF
  pdf_url VARCHAR(500),
  pdf_s3_key VARCHAR(500),
  
  -- Audit
  created_by VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT pk_cash_closes PRIMARY KEY (close_id),
  
  CONSTRAINT fk_close_created_by
    FOREIGN KEY (created_by)
    REFERENCES users(user_uuid),
    
  INDEX idx_cash_close_period (period_type, start_date, end_date),
  INDEX idx_cash_close_dates (start_date, end_date)
  
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- Table for detail of each guide in the close
CREATE TABLE cash_close_details (
  detail_id BIGINT AUTO_INCREMENT,
  close_id BIGINT NOT NULL,
  guide_id BIGINT NOT NULL,
  
  -- Information captured at close time
  date DATE NOT NULL,
  sender VARCHAR(255) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  
  -- Quantities
  units INT NOT NULL DEFAULT 1,
  weight DECIMAL(8,2) NOT NULL,
  
  -- Amounts
  freight DECIMAL(12,2) NOT NULL,
  other DECIMAL(12,2) NOT NULL DEFAULT 0,
  handling DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_value DECIMAL(12,2) NOT NULL,
  
  -- Payment method
  payment_method ENUM('CASH','COD','CREDIT') NOT NULL,
  
  CONSTRAINT pk_cash_close_details PRIMARY KEY (detail_id),
  
  CONSTRAINT fk_detail_close
    FOREIGN KEY (close_id)
    REFERENCES cash_closes(close_id)
    ON DELETE CASCADE,
    
  CONSTRAINT fk_detail_guide
    FOREIGN KEY (guide_id)
    REFERENCES shipping_guides(guide_id),
    
  INDEX idx_detail_close (close_id),
  INDEX idx_detail_payment (payment_method)
  
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

