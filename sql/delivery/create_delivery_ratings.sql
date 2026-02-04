-- =====================================================
-- TABLA DE CALIFICACIONES DE ENTREGAS
-- =====================================================

CREATE TABLE IF NOT EXISTS delivery_ratings (
    rating_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    assignment_id BIGINT NOT NULL,
    guide_id BIGINT NOT NULL,
    delivery_user_id VARCHAR(255) NOT NULL,
    client_user_id VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Restricción: una sola calificación por asignación
    UNIQUE KEY unique_assignment_rating (assignment_id),

    -- Índices para consultas frecuentes
    INDEX idx_delivery_user (delivery_user_id),
    INDEX idx_client_user (client_user_id),
    INDEX idx_guide (guide_id),
    INDEX idx_created_at (created_at),
    INDEX idx_rating (rating),

    -- Foreign keys
    FOREIGN KEY (assignment_id) REFERENCES delivery_assignments(assignment_id) ON DELETE CASCADE,
    FOREIGN KEY (guide_id) REFERENCES shipping_guides(guide_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- COMENTARIOS DE LA TABLA
-- =====================================================
-- rating_id: ID único de la calificación
-- assignment_id: ID de la asignación (entrega) calificada
-- guide_id: ID de la guía asociada
-- delivery_user_id: UUID del repartidor calificado
-- client_user_id: UUID del cliente que califica
-- rating: Calificación de 1 a 5 estrellas
-- comment: Comentario opcional del cliente
-- created_at: Fecha de creación
-- updated_at: Fecha de última actualización
