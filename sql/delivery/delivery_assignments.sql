
CREATE TABLE delivery_assignments (
  assignment_id BIGINT AUTO_INCREMENT,
  guide_id BIGINT NOT NULL,

  delivery_user_id VARCHAR(255) NOT NULL,

  assignment_type ENUM('PICKUP', 'DELIVERY') NOT NULL,

  status ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
    NOT NULL DEFAULT 'PENDING',

  notes TEXT,

  assigned_by VARCHAR(255),

  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,

  CONSTRAINT pk_delivery_assignments PRIMARY KEY (assignment_id),

  CONSTRAINT fk_assignment_guide
    FOREIGN KEY (guide_id)
    REFERENCES shipping_guides(guide_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_assignment_delivery_user
    FOREIGN KEY (delivery_user_id)
    REFERENCES users(user_uuid),

  CONSTRAINT fk_assignment_assigned_by
    FOREIGN KEY (assigned_by)
    REFERENCES users(user_uuid),

  INDEX idx_assignment_guide (guide_id),
  INDEX idx_assignment_delivery_user (delivery_user_id),
  INDEX idx_assignment_status (status),
  INDEX idx_assignment_type (assignment_type)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- TABLA: assignment_history
-- Historial de cambios en asignaciones
-- =====================================================
CREATE TABLE assignment_history (
  history_id BIGINT AUTO_INCREMENT,
  assignment_id BIGINT NOT NULL,

  action ENUM('CREATED', 'REASSIGNED', 'STATUS_CHANGE', 'CANCELLED') NOT NULL,

  previous_delivery_user_id VARCHAR(255),
  new_delivery_user_id VARCHAR(255),
  previous_status VARCHAR(50),
  new_status VARCHAR(50),

  changed_by VARCHAR(255),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,

  CONSTRAINT pk_assignment_history
    PRIMARY KEY (history_id),

  CONSTRAINT fk_history_assignment
    FOREIGN KEY (assignment_id)
    REFERENCES delivery_assignments(assignment_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_history_changed_by
    FOREIGN KEY (changed_by)
    REFERENCES users(user_uuid),

  INDEX idx_history_assignment (assignment_id)
) ENGINE=InnoDB
DEFAULT CHARSET=utf8mb4
COLLATE=utf8mb4_unicode_ci;


-- =====================================================
-- VISTA: v_pending_pickups
-- Guías pendientes de recoger (origen Bogotá, sin asignación activa)
-- =====================================================

CREATE OR REPLACE VIEW v_pending_pickups AS
SELECT
  sg.guide_id,
  sg.service_type,
  sg.current_status,
  sg.origin_city_id,
  oc.name AS origin_city_name,
  sg.destination_city_id,
  dc.name AS destination_city_name,
  sg.created_at,
  sender.full_name AS sender_name,
  sender.address AS pickup_address,
  sender.phone AS sender_phone
FROM shipping_guides sg
LEFT JOIN cities oc ON sg.origin_city_id = oc.id
LEFT JOIN cities dc ON sg.destination_city_id = dc.id
LEFT JOIN guide_parties sender ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'
WHERE sg.current_status = 'CREATED'
  AND UPPER(oc.name) = 'BOGOTÁ D.C.'
  AND NOT EXISTS (
    SELECT 1 FROM delivery_assignments da
    WHERE da.guide_id = sg.guide_id
    AND da.assignment_type = 'PICKUP'
    AND da.status NOT IN ('CANCELLED')
  );

-- =====================================================
-- VISTA: v_pending_deliveries
-- Guías pendientes de entregar (destino Bogotá, en bodega, sin asignación activa)
-- =====================================================

CREATE OR REPLACE VIEW v_pending_deliveries AS
SELECT
  sg.guide_id,
  sg.service_type,
  sg.current_status,
  sg.origin_city_id,
  oc.name AS origin_city_name,
  sg.destination_city_id,
  dc.name AS destination_city_name,
  sg.created_at,
  receiver.full_name AS receiver_name,
  receiver.address AS delivery_address,
  receiver.phone AS receiver_phone
FROM shipping_guides sg
LEFT JOIN cities oc ON sg.origin_city_id = oc.id
LEFT JOIN cities dc ON sg.destination_city_id = dc.id
LEFT JOIN guide_parties receiver ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'
WHERE sg.current_status = 'IN_WAREHOUSE'
  AND UPPER(dc.name) = 'BOGOTÁ D.C.'
  AND NOT EXISTS (
    SELECT 1 FROM delivery_assignments da
    WHERE da.guide_id = sg.guide_id
    AND da.assignment_type = 'DELIVERY'
    AND da.status NOT IN ('CANCELLED')
  );
