package bd

import (
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// CreateAssignment crea una nueva asignación de entregador
func CreateAssignment(req models.CreateAssignmentRequest, assignedBy string) (models.DeliveryAssignment, error) {
	fmt.Printf("CreateAssignment -> GuideID: %d, DeliveryUserID: %s, Type: %s\n",
		req.GuideID, req.DeliveryUserID, req.AssignmentType)

	var assignment models.DeliveryAssignment

	err := DbConnect()
	if err != nil {
		return assignment, err
	}
	defer Db.Close()

	// Iniciar transacción
	tx, err := Db.Begin()
	if err != nil {
		return assignment, err
	}

	// Verificar que no exista una asignación activa del mismo tipo
	checkQuery := `
		SELECT COUNT(*) FROM delivery_assignments
		WHERE guide_id = ? AND assignment_type = ? AND status NOT IN ('CANCELLED', 'COMPLETED')
	`
	var count int
	err = tx.QueryRow(checkQuery, req.GuideID, req.AssignmentType).Scan(&count)
	if err != nil {
		tx.Rollback()
		return assignment, err
	}

	if count > 0 {
		tx.Rollback()
		return assignment, fmt.Errorf("ya existe una asignación activa de tipo %s para esta guía", req.AssignmentType)
	}

	// Insertar asignación
	insertQuery := `
		INSERT INTO delivery_assignments
		(guide_id, delivery_user_id, assignment_type, status, notes, assigned_by, assigned_at)
		VALUES (?, ?, ?, 'PENDING', ?, ?, NOW())
	`

	result, err := tx.Exec(insertQuery,
		req.GuideID,
		req.DeliveryUserID,
		req.AssignmentType,
		req.Notes,
		assignedBy,
	)
	if err != nil {
		tx.Rollback()
		return assignment, err
	}

	assignmentID, err := result.LastInsertId()
	if err != nil {
		tx.Rollback()
		return assignment, err
	}

	// Registrar en historial
	historyQuery := `
		INSERT INTO assignment_history
		(assignment_id, action, new_delivery_user_id, new_status, changed_by, notes)
		VALUES (?, 'CREATED', ?, 'PENDING', ?, ?)
	`
	_, err = tx.Exec(historyQuery, assignmentID, req.DeliveryUserID, assignedBy, req.Notes)
	if err != nil {
		tx.Rollback()
		return assignment, err
	}

	// Commit
	err = tx.Commit()
	if err != nil {
		return assignment, err
	}

	// Obtener la asignación creada
	return GetAssignmentByID(assignmentID)
}

// GetAssignmentByID obtiene una asignación por su ID
func GetAssignmentByID(assignmentID int64) (models.DeliveryAssignment, error) {
	fmt.Printf("GetAssignmentByID -> ID: %d\n", assignmentID)

	var assignment models.DeliveryAssignment

	err := DbConnect()
	if err != nil {
		return assignment, err
	}
	defer Db.Close()

	query := `
		SELECT
			da.assignment_id,
			da.guide_id,
			da.delivery_user_id,
			du.full_name AS delivery_user_name,
			da.assignment_type,
			da.status,
			da.notes,
			da.assigned_by,
			abu.full_name AS assigned_by_name,
			da.assigned_at,
			da.updated_at,
			da.completed_at,
			sg.service_type,
			sg.current_status,
			oc.name AS origin_city_name,
			dc.name AS destination_city_name,
			sender.full_name AS sender_name,
			sender.address AS sender_address,
			sender.phone AS sender_phone,
			receiver.full_name AS receiver_name,
			receiver.address AS receiver_address,
			receiver.phone AS receiver_phone,
			sg.created_at AS guide_created_at
		FROM delivery_assignments da
		LEFT JOIN users du ON da.delivery_user_id = du.user_uuid
		LEFT JOIN users abu ON da.assigned_by = abu.user_uuid
		LEFT JOIN shipping_guides sg ON da.guide_id = sg.guide_id
		LEFT JOIN cities oc ON sg.origin_city_id = oc.id
		LEFT JOIN cities dc ON sg.destination_city_id = dc.id
		LEFT JOIN guide_parties sender ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'
		LEFT JOIN guide_parties receiver ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'
		WHERE da.assignment_id = ?
	`

	var completedAt sql.NullTime
	var deliveryUserName, assignedByName sql.NullString
	var senderName, senderAddr, senderPhone sql.NullString
	var receiverName, receiverAddr, receiverPhone sql.NullString
	var notes sql.NullString
	var guideInfo models.GuideInfo
	var guideCreatedAt time.Time

	row := Db.QueryRow(query, assignmentID)
	err = row.Scan(
		&assignment.AssignmentID,
		&assignment.GuideID,
		&assignment.DeliveryUserID,
		&deliveryUserName,
		&assignment.AssignmentType,
		&assignment.Status,
		&notes,
		&assignment.AssignedBy,
		&assignedByName,
		&assignment.AssignedAt,
		&assignment.UpdatedAt,
		&completedAt,
		&guideInfo.ServiceType,
		&guideInfo.CurrentStatus,
		&guideInfo.OriginCityName,
		&guideInfo.DestinationCityName,
		&senderName,
		&senderAddr,
		&senderPhone,
		&receiverName,
		&receiverAddr,
		&receiverPhone,
		&guideCreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return assignment, fmt.Errorf("asignación no encontrada")
		}
		return assignment, err
	}

	if deliveryUserName.Valid {
		assignment.DeliveryUserName = deliveryUserName.String
	}
	if assignedByName.Valid {
		assignment.AssignedByName = assignedByName.String
	}
	if notes.Valid {
		assignment.Notes = notes.String
	}
	if completedAt.Valid {
		assignment.CompletedAt = &completedAt.Time
	}

	// Información de la guía
	guideInfo.GuideID = assignment.GuideID
	if senderName.Valid {
		guideInfo.SenderName = senderName.String
	}
	if senderAddr.Valid {
		guideInfo.SenderAddress = senderAddr.String
	}
	if senderPhone.Valid {
		guideInfo.SenderPhone = senderPhone.String
	}
	if receiverName.Valid {
		guideInfo.ReceiverName = receiverName.String
	}
	if receiverAddr.Valid {
		guideInfo.ReceiverAddress = receiverAddr.String
	}
	if receiverPhone.Valid {
		guideInfo.ReceiverPhone = receiverPhone.String
	}
	guideInfo.CreatedAt = guideCreatedAt.Format(time.RFC3339)

	assignment.Guide = &guideInfo

	return assignment, nil
}

// ReassignDelivery reasigna una entrega a otro entregador (solo ADMIN)
func ReassignDelivery(assignmentID int64, newDeliveryUserID string, notes string, changedBy string) (models.DeliveryAssignment, error) {
	fmt.Printf("ReassignDelivery -> ID: %d, NewUser: %s\n", assignmentID, newDeliveryUserID)

	var assignment models.DeliveryAssignment

	err := DbConnect()
	if err != nil {
		return assignment, err
	}
	defer Db.Close()

	tx, err := Db.Begin()
	if err != nil {
		return assignment, err
	}

	// Obtener asignación actual
	var currentDeliveryUserID string
	var currentStatus string
	query := `SELECT delivery_user_id, status FROM delivery_assignments WHERE assignment_id = ?`
	err = tx.QueryRow(query, assignmentID).Scan(&currentDeliveryUserID, &currentStatus)
	if err != nil {
		tx.Rollback()
		return assignment, fmt.Errorf("asignación no encontrada")
	}

	// Solo se puede reasignar si está PENDING o IN_PROGRESS
	if currentStatus != "PENDING" && currentStatus != "IN_PROGRESS" {
		tx.Rollback()
		return assignment, fmt.Errorf("solo se pueden reasignar asignaciones pendientes o en progreso")
	}

	// Actualizar asignación
	updateQuery := `
		UPDATE delivery_assignments
		SET delivery_user_id = ?, updated_at = NOW()
		WHERE assignment_id = ?
	`
	_, err = tx.Exec(updateQuery, newDeliveryUserID, assignmentID)
	if err != nil {
		tx.Rollback()
		return assignment, err
	}

	// Registrar en historial
	historyQuery := `
		INSERT INTO assignment_history
		(assignment_id, action, previous_delivery_user_id, new_delivery_user_id,
		 previous_status, new_status, changed_by, notes)
		VALUES (?, 'REASSIGNED', ?, ?, ?, ?, ?, ?)
	`
	_, err = tx.Exec(historyQuery, assignmentID, currentDeliveryUserID, newDeliveryUserID,
		currentStatus, currentStatus, changedBy, notes)
	if err != nil {
		tx.Rollback()
		return assignment, err
	}

	err = tx.Commit()
	if err != nil {
		return assignment, err
	}

	return GetAssignmentByID(assignmentID)
}

// UpdateAssignmentStatus actualiza el estado de una asignación
func UpdateAssignmentStatus(assignmentID int64, newStatus models.AssignmentStatus, notes string, changedBy string) (models.DeliveryAssignment, error) {
	fmt.Printf("UpdateAssignmentStatus -> ID: %d, Status: %s\n", assignmentID, newStatus)

	var assignment models.DeliveryAssignment

	err := DbConnect()
	if err != nil {
		return assignment, err
	}
	defer Db.Close()

	tx, err := Db.Begin()
	if err != nil {
		return assignment, err
	}

	// Obtener estado actual
	var currentStatus string
	query := `SELECT status FROM delivery_assignments WHERE assignment_id = ?`
	err = tx.QueryRow(query, assignmentID).Scan(&currentStatus)
	if err != nil {
		tx.Rollback()
		return assignment, fmt.Errorf("asignación no encontrada")
	}

	// Actualizar estado
	var updateQuery string
	if newStatus == models.AssignmentCompleted {
		updateQuery = `
			UPDATE delivery_assignments
			SET status = ?, updated_at = NOW(), completed_at = NOW()
			WHERE assignment_id = ?
		`
	} else {
		updateQuery = `
			UPDATE delivery_assignments
			SET status = ?, updated_at = NOW()
			WHERE assignment_id = ?
		`
	}
	_, err = tx.Exec(updateQuery, newStatus, assignmentID)
	if err != nil {
		tx.Rollback()
		return assignment, err
	}

	// Registrar en historial
	historyQuery := `
		INSERT INTO assignment_history
		(assignment_id, action, previous_status, new_status, changed_by, notes)
		VALUES (?, 'STATUS_CHANGE', ?, ?, ?, ?)
	`
	_, err = tx.Exec(historyQuery, assignmentID, currentStatus, newStatus, changedBy, notes)
	if err != nil {
		tx.Rollback()
		return assignment, err
	}

	err = tx.Commit()
	if err != nil {
		return assignment, err
	}

	return GetAssignmentByID(assignmentID)
}

// GetAssignmentsByFilters obtiene asignaciones con filtros
func GetAssignmentsByFilters(filters models.AssignmentFilters) ([]models.DeliveryAssignment, int, error) {
	fmt.Println("GetAssignmentsByFilters")

	var assignments []models.DeliveryAssignment
	var total int

	err := DbConnect()
	if err != nil {
		return assignments, 0, err
	}
	defer Db.Close()

	// Construcción dinámica de WHERE
	var conditions []string
	var args []interface{}

	if filters.Status != "" {
		conditions = append(conditions, "da.status = ?")
		args = append(args, filters.Status)
	}

	if filters.AssignmentType != "" {
		conditions = append(conditions, "da.assignment_type = ?")
		args = append(args, filters.AssignmentType)
	}

	if filters.DeliveryUserID != "" {
		conditions = append(conditions, "da.delivery_user_id = ?")
		args = append(args, filters.DeliveryUserID)
	}

	if filters.GuideID != nil {
		conditions = append(conditions, "da.guide_id = ?")
		args = append(args, *filters.GuideID)
	}

	if filters.DateFrom != nil {
		conditions = append(conditions, "da.assigned_at >= ?")
		args = append(args, *filters.DateFrom)
	}

	if filters.DateTo != nil {
		conditions = append(conditions, "da.assigned_at <= ?")
		args = append(args, *filters.DateTo)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Contar total
	countQuery := fmt.Sprintf(`SELECT COUNT(*) FROM delivery_assignments da %s`, whereClause)
	err = Db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return assignments, 0, err
	}

	// Consulta principal - incluye datos de sender y receiver
	query := fmt.Sprintf(`
		SELECT
			da.assignment_id,
			da.guide_id,
			da.delivery_user_id,
			du.full_name AS delivery_user_name,
			da.assignment_type,
			da.status,
			da.notes,
			da.assigned_by,
			abu.full_name AS assigned_by_name,
			da.assigned_at,
			da.updated_at,
			da.completed_at,
			sg.service_type,
			sg.current_status,
			oc.name AS origin_city_name,
			dc.name AS destination_city_name,
			sender.full_name AS sender_name,
			sender.address AS sender_address,
			sender.phone AS sender_phone,
			receiver.full_name AS receiver_name,
			receiver.address AS receiver_address,
			receiver.phone AS receiver_phone,
			sg.created_at AS guide_created_at
		FROM delivery_assignments da
		LEFT JOIN users du ON da.delivery_user_id = du.user_uuid
		LEFT JOIN users abu ON da.assigned_by = abu.user_uuid
		LEFT JOIN shipping_guides sg ON da.guide_id = sg.guide_id
		LEFT JOIN cities oc ON sg.origin_city_id = oc.id
		LEFT JOIN cities dc ON sg.destination_city_id = dc.id
		LEFT JOIN guide_parties sender ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'
		LEFT JOIN guide_parties receiver ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'
		%s
		ORDER BY da.assigned_at DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	args = append(args, filters.Limit, filters.Offset)

	rows, err := Db.Query(query, args...)
	if err != nil {
		return assignments, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var a models.DeliveryAssignment
		var guideInfo models.GuideInfo
		var completedAt sql.NullTime
		var deliveryUserName, assignedByName, notes sql.NullString
		var senderName, senderAddr, senderPhone sql.NullString
		var receiverName, receiverAddr, receiverPhone sql.NullString
		var guideCreatedAt sql.NullTime

		err := rows.Scan(
			&a.AssignmentID,
			&a.GuideID,
			&a.DeliveryUserID,
			&deliveryUserName,
			&a.AssignmentType,
			&a.Status,
			&notes,
			&a.AssignedBy,
			&assignedByName,
			&a.AssignedAt,
			&a.UpdatedAt,
			&completedAt,
			&guideInfo.ServiceType,
			&guideInfo.CurrentStatus,
			&guideInfo.OriginCityName,
			&guideInfo.DestinationCityName,
			&senderName,
			&senderAddr,
			&senderPhone,
			&receiverName,
			&receiverAddr,
			&receiverPhone,
			&guideCreatedAt,
		)
		if err != nil {
			return assignments, 0, err
		}

		if deliveryUserName.Valid {
			a.DeliveryUserName = deliveryUserName.String
		}
		if assignedByName.Valid {
			a.AssignedByName = assignedByName.String
		}
		if notes.Valid {
			a.Notes = notes.String
		}
		if completedAt.Valid {
			a.CompletedAt = &completedAt.Time
		}

		// Asignar datos del sender
		if senderName.Valid {
			guideInfo.SenderName = senderName.String
		}
		if senderAddr.Valid {
			guideInfo.SenderAddress = senderAddr.String
		}
		if senderPhone.Valid {
			guideInfo.SenderPhone = senderPhone.String
		}

		// Asignar datos del receiver
		if receiverName.Valid {
			guideInfo.ReceiverName = receiverName.String
		}
		if receiverAddr.Valid {
			guideInfo.ReceiverAddress = receiverAddr.String
		}
		if receiverPhone.Valid {
			guideInfo.ReceiverPhone = receiverPhone.String
		}

		// Asignar fecha de creación
		if guideCreatedAt.Valid {
			guideInfo.CreatedAt = guideCreatedAt.Time.Format("2006-01-02T15:04:05Z07:00")
		}

		guideInfo.GuideID = a.GuideID
		a.Guide = &guideInfo

		assignments = append(assignments, a)
	}

	return assignments, total, nil
}

// GetDeliveryUsers obtiene la lista de entregadores disponibles
func GetDeliveryUsers() ([]models.DeliveryUser, error) {
	fmt.Println("GetDeliveryUsers")

	var users []models.DeliveryUser

	err := DbConnect()
	if err != nil {
		return users, err
	}
	defer Db.Close()

	query := `
		SELECT
			u.user_uuid,
			u.full_name,
			u.email,
			u.phone,
			COALESCE(pickups.cnt, 0) AS active_pickups,
			COALESCE(deliveries.cnt, 0) AS active_deliveries,
			COALESCE(completed.cnt, 0) AS total_completed
		FROM users u
		LEFT JOIN (
			SELECT delivery_user_id, COUNT(*) as cnt
			FROM delivery_assignments
			WHERE assignment_type = 'PICKUP' AND status IN ('PENDING', 'IN_PROGRESS')
			GROUP BY delivery_user_id
		) pickups ON u.user_uuid = pickups.delivery_user_id
		LEFT JOIN (
			SELECT delivery_user_id, COUNT(*) as cnt
			FROM delivery_assignments
			WHERE assignment_type = 'DELIVERY' AND status IN ('PENDING', 'IN_PROGRESS')
			GROUP BY delivery_user_id
		) deliveries ON u.user_uuid = deliveries.delivery_user_id
		LEFT JOIN (
			SELECT delivery_user_id, COUNT(*) as cnt
			FROM delivery_assignments
			WHERE status = 'COMPLETED'
			GROUP BY delivery_user_id
		) completed ON u.user_uuid = completed.delivery_user_id
		WHERE u.role = 'DELIVERY'
		ORDER BY u.full_name
	`

	rows, err := Db.Query(query)
	if err != nil {
		return users, err
	}
	defer rows.Close()

	for rows.Next() {
		var u models.DeliveryUser
		var fullName, phone sql.NullString

		err := rows.Scan(
			&u.UserID,
			&fullName,
			&u.Email,
			&phone,
			&u.ActivePickups,
			&u.ActiveDeliveries,
			&u.TotalCompleted,
		)
		if err != nil {
			return users, err
		}

		if fullName.Valid {
			u.FullName = fullName.String
		}
		if phone.Valid {
			u.Phone = phone.String
		}

		users = append(users, u)
	}

	return users, nil
}

// GetPendingPickups obtiene guías pendientes de recoger (origen Bogotá)
func GetPendingPickups() ([]models.PendingGuide, error) {
	fmt.Println("GetPendingPickups - Buscando guías con estado CREATED y origen BOGOTÁ D.C.")

	var guides []models.PendingGuide

	err := DbConnect()
	if err != nil {
		return guides, err
	}
	defer Db.Close()

	query := `
		SELECT
			sg.guide_id,
			sg.service_type,
			sg.current_status,
			oc.name AS origin_city_name,
			dc.name AS destination_city_name,
			sender.full_name AS contact_name,
			sender.address AS contact_address,
			sender.phone AS contact_phone,
			sg.created_at
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
			AND da.status IN ('PENDING', 'IN_PROGRESS')
		)
		ORDER BY sg.created_at ASC
	`

	rows, err := Db.Query(query)
	if err != nil {
		fmt.Printf("GetPendingPickups - Error en query: %v\n", err)
		return guides, err
	}
	defer rows.Close()

	for rows.Next() {
		var g models.PendingGuide
		var contactName, contactAddr, contactPhone sql.NullString
		var createdAt time.Time

		err := rows.Scan(
			&g.GuideID,
			&g.ServiceType,
			&g.CurrentStatus,
			&g.OriginCityName,
			&g.DestinationCityName,
			&contactName,
			&contactAddr,
			&contactPhone,
			&createdAt,
		)
		if err != nil {
			fmt.Printf("GetPendingPickups - Error en scan: %v\n", err)
			return guides, err
		}

		if contactName.Valid {
			g.ContactName = contactName.String
		}
		if contactAddr.Valid {
			g.ContactAddress = contactAddr.String
		}
		if contactPhone.Valid {
			g.ContactPhone = contactPhone.String
		}
		g.CreatedAt = createdAt.Format(time.RFC3339)
		g.AssignmentType = models.AssignmentPickup

		guides = append(guides, g)
	}

	fmt.Printf("GetPendingPickups - Guías encontradas: %d\n", len(guides))
	return guides, nil
}

// GetPendingDeliveries obtiene guías pendientes de entregar (destino Bogotá, en bodega)
func GetPendingDeliveries() ([]models.PendingGuide, error) {
	fmt.Println("GetPendingDeliveries - Buscando guías con estado IN_WAREHOUSE y destino BOGOTÁ D.C.")

	var guides []models.PendingGuide

	err := DbConnect()
	if err != nil {
		return guides, err
	}
	defer Db.Close()

	query := `
		SELECT
			sg.guide_id,
			sg.service_type,
			sg.current_status,
			oc.name AS origin_city_name,
			dc.name AS destination_city_name,
			receiver.full_name AS contact_name,
			receiver.address AS contact_address,
			receiver.phone AS contact_phone,
			sg.created_at
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
			AND da.status IN ('PENDING', 'IN_PROGRESS')
		)
		ORDER BY sg.created_at ASC
	`

	rows, err := Db.Query(query)
	if err != nil {
		fmt.Printf("GetPendingDeliveries - Error en query: %v\n", err)
		return guides, err
	}
	defer rows.Close()

	for rows.Next() {
		var g models.PendingGuide
		var contactName, contactAddr, contactPhone sql.NullString
		var createdAt time.Time

		err := rows.Scan(
			&g.GuideID,
			&g.ServiceType,
			&g.CurrentStatus,
			&g.OriginCityName,
			&g.DestinationCityName,
			&contactName,
			&contactAddr,
			&contactPhone,
			&createdAt,
		)
		if err != nil {
			fmt.Printf("GetPendingDeliveries - Error en scan: %v\n", err)
			return guides, err
		}

		if contactName.Valid {
			g.ContactName = contactName.String
		}
		if contactAddr.Valid {
			g.ContactAddress = contactAddr.String
		}
		if contactPhone.Valid {
			g.ContactPhone = contactPhone.String
		}
		g.CreatedAt = createdAt.Format(time.RFC3339)
		g.AssignmentType = models.AssignmentDelivery

		guides = append(guides, g)
	}

	fmt.Printf("GetPendingDeliveries - Guías encontradas: %d\n", len(guides))
	return guides, nil
}

// GetMyAssignments obtiene las asignaciones de un entregador
func GetMyAssignments(deliveryUserID string) (models.MyAssignmentsResponse, error) {
	fmt.Printf("GetMyAssignments -> UserID: %s\n", deliveryUserID)

	var response models.MyAssignmentsResponse

	err := DbConnect()
	if err != nil {
		return response, err
	}
	defer Db.Close()

	// Obtener asignaciones de PICKUP
	pickupFilters := models.AssignmentFilters{
		DeliveryUserID: deliveryUserID,
		AssignmentType: models.AssignmentPickup,
		Limit:          100,
		Offset:         0,
	}
	// Reconectar para evitar problemas de conexión cerrada
	Db.Close()
	pickups, _, err := GetAssignmentsByFilters(pickupFilters)
	if err != nil {
		return response, err
	}
	response.Pickups = pickups

	// Obtener asignaciones de DELIVERY
	deliveryFilters := models.AssignmentFilters{
		DeliveryUserID: deliveryUserID,
		AssignmentType: models.AssignmentDelivery,
		Limit:          100,
		Offset:         0,
	}
	deliveries, _, err := GetAssignmentsByFilters(deliveryFilters)
	if err != nil {
		return response, err
	}
	response.Deliveries = deliveries

	// Calcular estadísticas
	err = DbConnect()
	if err != nil {
		return response, err
	}
	defer Db.Close()

	// Stats
	statsQuery := `
		SELECT
			SUM(CASE WHEN assignment_type = 'PICKUP' AND status = 'PENDING' THEN 1 ELSE 0 END) as pending_pickups,
			SUM(CASE WHEN assignment_type = 'DELIVERY' AND status = 'PENDING' THEN 1 ELSE 0 END) as pending_deliveries,
			SUM(CASE WHEN assignment_type = 'PICKUP' AND status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_pickups,
			SUM(CASE WHEN assignment_type = 'DELIVERY' AND status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress_deliveries,
			SUM(CASE WHEN status = 'COMPLETED' AND DATE(completed_at) = CURDATE() THEN 1 ELSE 0 END) as completed_today,
			SUM(CASE WHEN status = 'COMPLETED' AND completed_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as completed_this_week
		FROM delivery_assignments
		WHERE delivery_user_id = ?
	`

	err = Db.QueryRow(statsQuery, deliveryUserID).Scan(
		&response.Stats.PendingPickups,
		&response.Stats.PendingDeliveries,
		&response.Stats.InProgressPickups,
		&response.Stats.InProgressDeliveries,
		&response.Stats.CompletedToday,
		&response.Stats.CompletedThisWeek,
	)
	if err != nil {
		// Si no hay datos, las estadísticas son 0
		response.Stats = models.MyAssignmentStats{}
	}

	return response, nil
}

// GetAssignmentStats obtiene estadísticas generales de asignaciones
func GetAssignmentStats() (models.AssignmentStatsResponse, error) {
	fmt.Println("GetAssignmentStats")

	var stats models.AssignmentStatsResponse
	stats.ByDeliveryUser = make(map[string]int)

	err := DbConnect()
	if err != nil {
		return stats, err
	}
	defer Db.Close()

	// Total asignaciones
	err = Db.QueryRow(`SELECT COUNT(*) FROM delivery_assignments`).Scan(&stats.TotalAssignments)
	if err != nil {
		return stats, err
	}

	// Pickups pendientes
	err = Db.QueryRow(`
		SELECT COUNT(*) FROM delivery_assignments
		WHERE assignment_type = 'PICKUP' AND status = 'PENDING'
	`).Scan(&stats.PendingPickups)
	if err != nil {
		return stats, err
	}

	// Deliveries pendientes
	err = Db.QueryRow(`
		SELECT COUNT(*) FROM delivery_assignments
		WHERE assignment_type = 'DELIVERY' AND status = 'PENDING'
	`).Scan(&stats.PendingDeliveries)
	if err != nil {
		return stats, err
	}

	// Pickups en progreso
	err = Db.QueryRow(`
		SELECT COUNT(*) FROM delivery_assignments
		WHERE assignment_type = 'PICKUP' AND status = 'IN_PROGRESS'
	`).Scan(&stats.InProgressPickups)
	if err != nil {
		return stats, err
	}

	// Deliveries en progreso
	err = Db.QueryRow(`
		SELECT COUNT(*) FROM delivery_assignments
		WHERE assignment_type = 'DELIVERY' AND status = 'IN_PROGRESS'
	`).Scan(&stats.InProgressDeliveries)
	if err != nil {
		return stats, err
	}

	// Completadas hoy
	err = Db.QueryRow(`
		SELECT COUNT(*) FROM delivery_assignments
		WHERE status = 'COMPLETED' AND DATE(completed_at) = CURDATE()
	`).Scan(&stats.CompletedToday)
	if err != nil {
		return stats, err
	}

	// Por entregador
	rows, err := Db.Query(`
		SELECT u.full_name, COUNT(*) as cnt
		FROM delivery_assignments da
		JOIN users u ON da.delivery_user_id = u.user_uuid
		WHERE da.status IN ('PENDING', 'IN_PROGRESS')
		GROUP BY da.delivery_user_id, u.full_name
	`)
	if err != nil {
		return stats, err
	}
	defer rows.Close()

	for rows.Next() {
		var name string
		var count int
		err := rows.Scan(&name, &count)
		if err != nil {
			continue
		}
		stats.ByDeliveryUser[name] = count
	}

	return stats, nil
}

// GetAssignmentHistory obtiene el historial de una asignación
func GetAssignmentHistory(assignmentID int64) ([]models.AssignmentHistory, error) {
	fmt.Printf("GetAssignmentHistory -> ID: %d\n", assignmentID)

	var history []models.AssignmentHistory

	err := DbConnect()
	if err != nil {
		return history, err
	}
	defer Db.Close()

	query := `
		SELECT
			ah.history_id,
			ah.assignment_id,
			ah.action,
			ah.previous_delivery_user_id,
			ah.new_delivery_user_id,
			ah.previous_status,
			ah.new_status,
			ah.changed_by,
			u.full_name AS changed_by_name,
			ah.changed_at,
			ah.notes
		FROM assignment_history ah
		LEFT JOIN users u ON ah.changed_by = u.user_uuid
		WHERE ah.assignment_id = ?
		ORDER BY ah.changed_at DESC
	`

	rows, err := Db.Query(query, assignmentID)
	if err != nil {
		return history, err
	}
	defer rows.Close()

	for rows.Next() {
		var h models.AssignmentHistory
		var prevUserID, newUserID, prevStatus, newStatus, notes, changedByName sql.NullString

		err := rows.Scan(
			&h.HistoryID,
			&h.AssignmentID,
			&h.Action,
			&prevUserID,
			&newUserID,
			&prevStatus,
			&newStatus,
			&h.ChangedBy,
			&changedByName,
			&h.ChangedAt,
			&notes,
		)
		if err != nil {
			return history, err
		}

		if prevUserID.Valid {
			h.PreviousDeliveryUserID = prevUserID.String
		}
		if newUserID.Valid {
			h.NewDeliveryUserID = newUserID.String
		}
		if prevStatus.Valid {
			h.PreviousStatus = prevStatus.String
		}
		if newStatus.Valid {
			h.NewStatus = newStatus.String
		}
		if notes.Valid {
			h.Notes = notes.String
		}
		if changedByName.Valid {
			h.ChangedByName = changedByName.String
		}

		history = append(history, h)
	}

	return history, nil
}
