-- =====================================================
-- TABLA DE PARTES FRECUENTES (Remitentes/Destinatarios)
-- =====================================================
-- Esta tabla almacena un registro cada vez que se usa
-- un remitente o destinatario en una guía.
-- Permite autocompletar direcciones basándose en
-- combinaciones de documento + ciudad previamente usadas.
-- =====================================================

CREATE TABLE frequent_parties (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  
  -- Tipo de parte (remitente o destinatario)
  party_type ENUM('SENDER', 'RECEIVER') NOT NULL,
  
  -- Información personal
  full_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  document_number VARCHAR(50) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  
  -- Ubicación
  city_id BIGINT NOT NULL,
  address VARCHAR(500) NOT NULL,
  
  -- Auditoría
  first_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  usage_count INT DEFAULT 1,
  
  -- Relación con usuario registrado (opcional)
  user_uuid VARCHAR(255),
  
  -- Constraints
  CONSTRAINT fk_frequent_party_city
    FOREIGN KEY (city_id)
    REFERENCES cities(id),
  
  CONSTRAINT fk_frequent_party_user
    FOREIGN KEY (user_uuid)
    REFERENCES users(user_uuid)
    ON DELETE SET NULL,
  
  -- Índices para búsquedas rápidas
  INDEX idx_document_city (document_number, city_id),
  INDEX idx_document_type (document_type, document_number),
  INDEX idx_full_name (full_name),
  INDEX idx_party_type (party_type),
  
  -- Índice único para evitar duplicados exactos
  UNIQUE KEY uq_party_location (document_number, city_id, address(255))
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;