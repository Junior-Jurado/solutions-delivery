package bd

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// Zona horaria de Colombia
var adminColombiaLoc *time.Location

func init() {
	var err error
	adminColombiaLoc, err = time.LoadLocation("America/Bogota")
	if err != nil {
		adminColombiaLoc = time.FixedZone("COT", -5*60*60)
	}
}

// GetAdminDashboardStats obtiene todas las estadísticas del dashboard admin
func GetAdminDashboardStats() (models.AdminDashboardStats, error) {
	fmt.Println("GetAdminDashboardStats")

	var stats models.AdminDashboardStats

	err := DbConnect()
	if err != nil {
		return stats, err
	}
	defer Db.Close()

	// ====================================
	// KPIs PRINCIPALES
	// ====================================

	// Guías de hoy
	err = Db.QueryRow(`
		SELECT COUNT(*) FROM shipping_guides
		WHERE DATE(created_at) = CURDATE()
	`).Scan(&stats.ShipmentsToday)
	if err != nil {
		return stats, fmt.Errorf("error obteniendo guías de hoy: %w", err)
	}

	// Guías de ayer
	err = Db.QueryRow(`
		SELECT COUNT(*) FROM shipping_guides
		WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
	`).Scan(&stats.ShipmentsYesterday)
	if err != nil {
		return stats, fmt.Errorf("error obteniendo guías de ayer: %w", err)
	}

	// Entregadas hoy
	err = Db.QueryRow(`
		SELECT COUNT(*) FROM shipping_guides
		WHERE current_status = 'DELIVERED'
		AND DATE(updated_at) = CURDATE()
	`).Scan(&stats.Delivered)
	if err != nil {
		return stats, fmt.Errorf("error obteniendo entregadas hoy: %w", err)
	}

	// Entregadas ayer
	err = Db.QueryRow(`
		SELECT COUNT(*) FROM shipping_guides
		WHERE current_status = 'DELIVERED'
		AND DATE(updated_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
	`).Scan(&stats.DeliveredYesterday)
	if err != nil {
		return stats, fmt.Errorf("error obteniendo entregadas ayer: %w", err)
	}

	// Calcular tasa de entrega
	if stats.ShipmentsToday > 0 {
		stats.DeliveryRate = float64(stats.Delivered) / float64(stats.ShipmentsToday) * 100
	}

	// Pendientes totales
	err = Db.QueryRow(`
		SELECT COUNT(*) FROM shipping_guides
		WHERE current_status NOT IN ('DELIVERED')
	`).Scan(&stats.Pending)
	if err != nil {
		return stats, fmt.Errorf("error obteniendo pendientes: %w", err)
	}

	// Pendientes en ruta
	err = Db.QueryRow(`
		SELECT COUNT(*) FROM shipping_guides
		WHERE current_status IN ('IN_ROUTE', 'OUT_FOR_DELIVERY')
	`).Scan(&stats.PendingInRoute)
	if err != nil {
		return stats, fmt.Errorf("error obteniendo pendientes en ruta: %w", err)
	}

	// Pendientes en oficina (bodega)
	err = Db.QueryRow(`
		SELECT COUNT(*) FROM shipping_guides
		WHERE current_status IN ('CREATED', 'IN_WAREHOUSE')
	`).Scan(&stats.PendingInOffice)
	if err != nil {
		return stats, fmt.Errorf("error obteniendo pendientes en oficina: %w", err)
	}

	// Ingresos de hoy
	err = Db.QueryRow(`
		SELECT COALESCE(SUM(price), 0) FROM shipping_guides
		WHERE DATE(created_at) = CURDATE()
	`).Scan(&stats.RevenueToday)
	if err != nil {
		return stats, fmt.Errorf("error obteniendo ingresos de hoy: %w", err)
	}

	// Ingresos de ayer
	err = Db.QueryRow(`
		SELECT COALESCE(SUM(price), 0) FROM shipping_guides
		WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
	`).Scan(&stats.RevenueYesterday)
	if err != nil {
		return stats, fmt.Errorf("error obteniendo ingresos de ayer: %w", err)
	}

	// ====================================
	// MÉTRICAS DE ENTREGAS
	// ====================================

	// Tiempo promedio de entrega (en horas) - últimos 30 días
	err = Db.QueryRow(`
		SELECT COALESCE(AVG(TIMESTAMPDIFF(HOUR, created_at, updated_at)), 0)
		FROM shipping_guides
		WHERE current_status = 'DELIVERED'
		AND updated_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
	`).Scan(&stats.AverageDeliveryTime)
	if err != nil {
		// No es crítico, continuamos con 0
		stats.AverageDeliveryTime = 0
	}

	// Tasa de satisfacción - promedio de calificaciones (escala 1-5 convertida a porcentaje)
	err = Db.QueryRow(`
		SELECT COALESCE(AVG(rating) * 20, 0)
		FROM delivery_ratings
		WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
	`).Scan(&stats.SatisfactionRate)
	if err != nil {
		// No es crítico, continuamos con 0
		stats.SatisfactionRate = 0
	}

	// Si no hay ratings, usar un valor basado en entregas exitosas
	if stats.SatisfactionRate == 0 && stats.Delivered > 0 {
		// Calcular basado en tasa de entregas completadas vs pendientes
		stats.SatisfactionRate = stats.DeliveryRate
	}

	// ====================================
	// DISTRIBUCIÓN POR ESTADO
	// ====================================
	statusRows, err := Db.Query(`
		SELECT current_status, COUNT(*) as count
		FROM shipping_guides
		GROUP BY current_status
	`)
	if err != nil {
		return stats, fmt.Errorf("error obteniendo distribución: %w", err)
	}
	defer statusRows.Close()

	var totalGuides int
	var statusCounts []models.StatusCount
	for statusRows.Next() {
		var sc models.StatusCount
		err := statusRows.Scan(&sc.Status, &sc.Count)
		if err != nil {
			continue
		}
		totalGuides += sc.Count
		statusCounts = append(statusCounts, sc)
	}

	// Calcular porcentajes
	for i := range statusCounts {
		if totalGuides > 0 {
			statusCounts[i].Percentage = float64(statusCounts[i].Count) / float64(totalGuides) * 100
		}
	}
	stats.StatusDistribution = statusCounts

	// ====================================
	// RENDIMIENTO DE ENTREGADORES
	// ====================================
	workerRows, err := Db.Query(`
		SELECT
			u.user_uuid,
			u.full_name,
			COALESCE(assigned.cnt, 0) as deliveries_today,
			COALESCE(completed.cnt, 0) as completed_today,
			COALESCE(ratings.avg_rating, 0) as avg_rating
		FROM users u
		LEFT JOIN (
			SELECT delivery_user_id, COUNT(*) as cnt
			FROM delivery_assignments
			WHERE DATE(assigned_at) = CURDATE()
			GROUP BY delivery_user_id
		) assigned ON u.user_uuid = assigned.delivery_user_id
		LEFT JOIN (
			SELECT delivery_user_id, COUNT(*) as cnt
			FROM delivery_assignments
			WHERE status = 'COMPLETED' AND DATE(completed_at) = CURDATE()
			GROUP BY delivery_user_id
		) completed ON u.user_uuid = completed.delivery_user_id
		LEFT JOIN (
			SELECT delivery_user_id, AVG(rating) as avg_rating
			FROM delivery_ratings
			GROUP BY delivery_user_id
		) ratings ON u.user_uuid = ratings.delivery_user_id
		WHERE u.role = 'DELIVERY'
		ORDER BY completed.cnt DESC
		LIMIT 10
	`)
	if err != nil {
		return stats, fmt.Errorf("error obteniendo rendimiento: %w", err)
	}
	defer workerRows.Close()

	for workerRows.Next() {
		var ws models.WorkerStats
		var fullName sql.NullString
		var avgRating sql.NullFloat64
		err := workerRows.Scan(&ws.UserID, &fullName, &ws.DeliveriesToday, &ws.CompletedToday, &avgRating)
		if err != nil {
			continue
		}
		if fullName.Valid {
			ws.Name = fullName.String
		}
		if avgRating.Valid {
			ws.AvgRating = avgRating.Float64
		}
		// Calcular eficiencia
		if ws.DeliveriesToday > 0 {
			ws.Efficiency = float64(ws.CompletedToday) / float64(ws.DeliveriesToday) * 100
		}
		stats.WorkerPerformance = append(stats.WorkerPerformance, ws)
	}

	// ====================================
	// ENTREGAS EN TIEMPO REAL
	// ====================================
	realtimeRows, err := Db.Query(`
		SELECT
			da.guide_id,
			COALESCE(receiver.full_name, 'Sin nombre') as customer,
			COALESCE(receiver.address, 'Sin dirección') as address,
			sg.current_status,
			COALESCE(u.full_name, 'Sin asignar') as delivery_person,
			da.assigned_at,
			sg.service_type
		FROM delivery_assignments da
		JOIN shipping_guides sg ON da.guide_id = sg.guide_id
		LEFT JOIN users u ON da.delivery_user_id = u.user_uuid
		LEFT JOIN guide_parties receiver ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'
		WHERE da.status IN ('PENDING', 'IN_PROGRESS')
		AND da.assignment_type = 'DELIVERY'
		ORDER BY da.assigned_at DESC
		LIMIT 20
	`)
	if err != nil {
		return stats, fmt.Errorf("error obteniendo entregas en tiempo real: %w", err)
	}
	defer realtimeRows.Close()

	for realtimeRows.Next() {
		var rd models.RealtimeDelivery
		var assignedAt time.Time
		err := realtimeRows.Scan(
			&rd.GuideID,
			&rd.Customer,
			&rd.Address,
			&rd.Status,
			&rd.DeliveryPerson,
			&assignedAt,
			&rd.ServiceType,
		)
		if err != nil {
			continue
		}
		rd.AssignedAt = assignedAt.Format(time.RFC3339)
		stats.RealtimeDeliveries = append(stats.RealtimeDeliveries, rd)
	}

	// ====================================
	// RUTAS ACTIVAS
	// ====================================
	routeRows, err := Db.Query(`
		SELECT
			u.user_uuid,
			u.full_name,
			COALESCE(total.cnt, 0) as packages,
			COALESCE(completed.cnt, 0) as completed,
			COALESCE(zone.city_name, 'Sin zona') as zone
		FROM users u
		LEFT JOIN (
			SELECT delivery_user_id, COUNT(*) as cnt
			FROM delivery_assignments
			WHERE DATE(assigned_at) = CURDATE() AND status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')
			GROUP BY delivery_user_id
		) total ON u.user_uuid = total.delivery_user_id
		LEFT JOIN (
			SELECT delivery_user_id, COUNT(*) as cnt
			FROM delivery_assignments
			WHERE DATE(assigned_at) = CURDATE() AND status = 'COMPLETED'
			GROUP BY delivery_user_id
		) completed ON u.user_uuid = completed.delivery_user_id
		LEFT JOIN (
			SELECT da.delivery_user_id, c.name as city_name
			FROM delivery_assignments da
			JOIN shipping_guides sg ON da.guide_id = sg.guide_id
			JOIN cities c ON sg.destination_city_id = c.id
			WHERE DATE(da.assigned_at) = CURDATE()
			GROUP BY da.delivery_user_id, c.name
			LIMIT 1
		) zone ON u.user_uuid = zone.delivery_user_id
		WHERE u.role = 'DELIVERY'
		AND total.cnt > 0
		ORDER BY total.cnt DESC
	`)
	if err != nil {
		return stats, fmt.Errorf("error obteniendo rutas activas: %w", err)
	}
	defer routeRows.Close()

	for routeRows.Next() {
		var ar models.ActiveRoute
		var fullName sql.NullString
		err := routeRows.Scan(&ar.UserID, &fullName, &ar.Packages, &ar.Completed, &ar.Zone)
		if err != nil {
			continue
		}
		if fullName.Valid {
			ar.Name = fullName.String
		}
		// Determinar estado
		if ar.Completed >= ar.Packages {
			ar.Status = "Completado"
		} else {
			ar.Status = "En ruta"
		}
		stats.ActiveRoutes = append(stats.ActiveRoutes, ar)
	}

	// ====================================
	// ALERTAS DEL SISTEMA
	// ====================================
	stats.Alerts = generateSystemAlerts()

	// Asegurar que los arrays no sean nil
	if stats.StatusDistribution == nil {
		stats.StatusDistribution = []models.StatusCount{}
	}
	if stats.WorkerPerformance == nil {
		stats.WorkerPerformance = []models.WorkerStats{}
	}
	if stats.RealtimeDeliveries == nil {
		stats.RealtimeDeliveries = []models.RealtimeDelivery{}
	}
	if stats.ActiveRoutes == nil {
		stats.ActiveRoutes = []models.ActiveRoute{}
	}
	if stats.Alerts == nil {
		stats.Alerts = []models.SystemAlert{}
	}

	return stats, nil
}

// generateSystemAlerts genera alertas del sistema basadas en datos reales
func generateSystemAlerts() []models.SystemAlert {
	var alerts []models.SystemAlert

	err := DbConnect()
	if err != nil {
		return alerts
	}
	defer Db.Close()

	// Alerta: Guías retrasadas (más de 24 horas sin actualización)
	delayedRows, err := Db.Query(`
		SELECT guide_id, current_status, TIMESTAMPDIFF(HOUR, updated_at, NOW()) as hours_delayed
		FROM shipping_guides
		WHERE current_status NOT IN ('DELIVERED')
		AND updated_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
		LIMIT 5
	`)
	if err == nil {
		defer delayedRows.Close()
		for delayedRows.Next() {
			var guideID int64
			var status string
			var hoursDelayed int
			if err := delayedRows.Scan(&guideID, &status, &hoursDelayed); err == nil {
				alerts = append(alerts, models.SystemAlert{
					ID:          fmt.Sprintf("delayed_%d", guideID),
					Type:        "warning",
					Title:       "Entrega retrasada",
					Description: fmt.Sprintf("Guía %d - Más de %d horas sin actualización", guideID, hoursDelayed),
					Timestamp:   time.Now().In(adminColombiaLoc).Format(time.RFC3339),
					GuideID:     &guideID,
				})
			}
		}
	}

	// Alerta: Entregadores con asignaciones pendientes sin actividad
	inactiveRows, err := Db.Query(`
		SELECT u.user_uuid, u.full_name, COUNT(*) as pending_count
		FROM users u
		JOIN delivery_assignments da ON u.user_uuid = da.delivery_user_id
		WHERE da.status = 'PENDING'
		AND da.assigned_at < DATE_SUB(NOW(), INTERVAL 2 HOUR)
		GROUP BY u.user_uuid, u.full_name
		HAVING pending_count > 0
		LIMIT 5
	`)
	if err == nil {
		defer inactiveRows.Close()
		for inactiveRows.Next() {
			var userID, fullName string
			var pendingCount int
			if err := inactiveRows.Scan(&userID, &fullName, &pendingCount); err == nil {
				alerts = append(alerts, models.SystemAlert{
					ID:          fmt.Sprintf("inactive_%s", userID),
					Type:        "error",
					Title:       "Entregador inactivo",
					Description: fmt.Sprintf("%s tiene %d asignaciones pendientes sin iniciar", fullName, pendingCount),
					Timestamp:   time.Now().In(adminColombiaLoc).Format(time.RFC3339),
					UserID:      userID,
				})
			}
		}
	}

	// Alerta: Guías sin asignar
	var unassignedCount int
	err = Db.QueryRow(`
		SELECT COUNT(*)
		FROM shipping_guides sg
		WHERE sg.current_status = 'CREATED'
		AND NOT EXISTS (
			SELECT 1 FROM delivery_assignments da
			WHERE da.guide_id = sg.guide_id
			AND da.status NOT IN ('CANCELLED')
		)
	`).Scan(&unassignedCount)
	if err == nil && unassignedCount > 0 {
		alerts = append(alerts, models.SystemAlert{
			ID:          "unassigned_guides",
			Type:        "info",
			Title:       "Guías sin asignar",
			Description: fmt.Sprintf("Hay %d guías pendientes de asignar a un repartidor", unassignedCount),
			Timestamp:   time.Now().In(adminColombiaLoc).Format(time.RFC3339),
		})
	}

	return alerts
}

// GetEmployees obtiene la lista de empleados
func GetEmployees(role string) ([]models.Employee, error) {
	fmt.Printf("GetEmployees -> Role: %s\n", role)

	var employees []models.Employee

	err := DbConnect()
	if err != nil {
		return employees, err
	}
	defer Db.Close()

	query := `
		SELECT
			u.user_uuid,
			u.full_name,
			u.email,
			u.phone,
			u.role,
			u.created_at,
			u.last_login,
			COALESCE(completed.cnt, 0) as total_completed
		FROM users u
		LEFT JOIN (
			SELECT delivery_user_id, COUNT(*) as cnt
			FROM delivery_assignments
			WHERE status = 'COMPLETED'
			GROUP BY delivery_user_id
		) completed ON u.user_uuid = completed.delivery_user_id
		WHERE u.role != 'CLIENT'
	`

	if role != "" {
		query += " AND u.role = ?"
	}

	query += " ORDER BY u.full_name"

	var rows *sql.Rows
	if role != "" {
		rows, err = Db.Query(query, role)
	} else {
		rows, err = Db.Query(query)
	}
	if err != nil {
		return employees, err
	}
	defer rows.Close()

	for rows.Next() {
		var e models.Employee
		var fullName, phone sql.NullString
		var lastLogin sql.NullTime
		var createdAt time.Time

		err := rows.Scan(
			&e.UserUUID,
			&fullName,
			&e.Email,
			&phone,
			&e.Role,
			&createdAt,
			&lastLogin,
			&e.TotalCompleted,
		)
		if err != nil {
			continue
		}

		if fullName.Valid {
			e.FullName = fullName.String
		}
		if phone.Valid {
			e.Phone = phone.String
		}
		e.CreatedAt = createdAt.Format(time.RFC3339)
		if lastLogin.Valid {
			e.LastLogin = lastLogin.Time.Format(time.RFC3339)
		}

		// Determinar estado
		e.Status = "Activo"
		if e.Role == models.RoleDelivery {
			// Verificar si tiene asignaciones en progreso
			var inProgress int
			Db.QueryRow(`
				SELECT COUNT(*) FROM delivery_assignments
				WHERE delivery_user_id = ? AND status = 'IN_PROGRESS'
			`, e.UserUUID).Scan(&inProgress)
			if inProgress > 0 {
				e.Status = "En ruta"
			}
		}

		// Calcular rendimiento basado en completados
		if e.TotalCompleted >= 100 {
			e.Performance = "Excelente"
		} else if e.TotalCompleted >= 50 {
			e.Performance = "Muy bueno"
		} else if e.TotalCompleted >= 20 {
			e.Performance = "Bueno"
		} else {
			e.Performance = "Nuevo"
		}

		employees = append(employees, e)
	}

	return employees, nil
}

// GetEmployeeByID obtiene un empleado por su ID
func GetEmployeeByID(userUUID string) (models.Employee, error) {
	fmt.Printf("GetEmployeeByID -> ID: %s\n", userUUID)

	var e models.Employee

	err := DbConnect()
	if err != nil {
		return e, err
	}
	defer Db.Close()

	query := `
		SELECT
			u.user_uuid,
			u.full_name,
			u.email,
			u.phone,
			u.role,
			u.created_at,
			u.last_login,
			COALESCE(completed.cnt, 0) as total_completed
		FROM users u
		LEFT JOIN (
			SELECT delivery_user_id, COUNT(*) as cnt
			FROM delivery_assignments
			WHERE status = 'COMPLETED'
			GROUP BY delivery_user_id
		) completed ON u.user_uuid = completed.delivery_user_id
		WHERE u.user_uuid = ?
	`

	var fullName, phone sql.NullString
	var lastLogin sql.NullTime
	var createdAt time.Time

	err = Db.QueryRow(query, userUUID).Scan(
		&e.UserUUID,
		&fullName,
		&e.Email,
		&phone,
		&e.Role,
		&createdAt,
		&lastLogin,
		&e.TotalCompleted,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return e, fmt.Errorf("empleado no encontrado")
		}
		return e, err
	}

	if fullName.Valid {
		e.FullName = fullName.String
	}
	if phone.Valid {
		e.Phone = phone.String
	}
	e.CreatedAt = createdAt.Format(time.RFC3339)
	if lastLogin.Valid {
		e.LastLogin = lastLogin.Time.Format(time.RFC3339)
	}

	e.Status = "Activo"

	return e, nil
}

// GetUserByDocument busca un usuario por número de documento
func GetUserByDocument(documentNumber string) (models.Employee, error) {
	fmt.Printf("GetUserByDocument -> Document: %s\n", documentNumber)

	var e models.Employee

	err := DbConnect()
	if err != nil {
		return e, err
	}
	defer Db.Close()

	query := `
		SELECT
			u.user_uuid,
			u.full_name,
			u.email,
			u.phone,
			u.role,
			u.type_document,
			u.number_document,
			u.created_at,
			u.last_login,
			COALESCE(completed.cnt, 0) as total_completed
		FROM users u
		LEFT JOIN (
			SELECT delivery_user_id, COUNT(*) as cnt
			FROM delivery_assignments
			WHERE status = 'COMPLETED'
			GROUP BY delivery_user_id
		) completed ON u.user_uuid = completed.delivery_user_id
		WHERE u.number_document = ?
	`

	var fullName, phone, typeDoc, numberDoc sql.NullString
	var lastLogin sql.NullTime
	var createdAt time.Time

	err = Db.QueryRow(query, documentNumber).Scan(
		&e.UserUUID,
		&fullName,
		&e.Email,
		&phone,
		&e.Role,
		&typeDoc,
		&numberDoc,
		&createdAt,
		&lastLogin,
		&e.TotalCompleted,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return e, fmt.Errorf("usuario no encontrado")
		}
		return e, err
	}

	if fullName.Valid {
		e.FullName = fullName.String
	}
	if phone.Valid {
		e.Phone = phone.String
	}
	if typeDoc.Valid {
		e.TypeDocument = typeDoc.String
	}
	if numberDoc.Valid {
		e.NumberDocument = numberDoc.String
	}
	e.CreatedAt = createdAt.Format(time.RFC3339)
	if lastLogin.Valid {
		e.LastLogin = lastLogin.Time.Format(time.RFC3339)
	}

	e.Status = "Activo"
	if e.Role == models.RoleDelivery {
		var inProgress int
		Db.QueryRow(`
			SELECT COUNT(*) FROM delivery_assignments
			WHERE delivery_user_id = ? AND status = 'IN_PROGRESS'
		`, e.UserUUID).Scan(&inProgress)
		if inProgress > 0 {
			e.Status = "En ruta"
		}
	}

	// Calcular rendimiento
	if e.TotalCompleted >= 100 {
		e.Performance = "Excelente"
	} else if e.TotalCompleted >= 50 {
		e.Performance = "Muy bueno"
	} else if e.TotalCompleted >= 20 {
		e.Performance = "Bueno"
	} else {
		e.Performance = "Nuevo"
	}

	return e, nil
}

// UpdateEmployee actualiza un empleado
func UpdateEmployee(userUUID string, req models.UpdateEmployeeRequest) error {
	fmt.Printf("UpdateEmployee -> ID: %s\n", userUUID)

	err := DbConnect()
	if err != nil {
		return err
	}
	defer Db.Close()

	query := `UPDATE users SET `
	var args []interface{}
	var updates []string

	if req.FullName != "" {
		updates = append(updates, "full_name = ?")
		args = append(args, req.FullName)
	}
	if req.Phone != "" {
		updates = append(updates, "phone = ?")
		args = append(args, req.Phone)
	}
	if req.Role != "" {
		updates = append(updates, "role = ?")
		args = append(args, req.Role)
	}

	if len(updates) == 0 {
		return fmt.Errorf("no hay campos para actualizar")
	}

	query += updates[0]
	for i := 1; i < len(updates); i++ {
		query += ", " + updates[i]
	}
	query += " WHERE user_uuid = ?"
	args = append(args, userUUID)

	_, err = Db.Exec(query, args...)
	return err
}

// GetClientRanking obtiene el ranking de mejores clientes
func GetClientRanking(filters models.ClientRankingFilters) (models.ClientRankingResponse, error) {
	fmt.Printf("GetClientRanking -> Filters: %+v\n", filters)

	var response models.ClientRankingResponse

	err := DbConnect()
	if err != nil {
		return response, err
	}
	defer Db.Close()

	// Construir la consulta base
	query := `
		SELECT
			u.user_uuid,
			u.full_name,
			u.email,
			u.phone,
			COUNT(sg.guide_id) as total_guides,
			COALESCE(SUM(sg.price), 0) as total_spent,
			COALESCE(AVG(sg.price), 0) as avg_value,
			MAX(sg.created_at) as last_activity
		FROM users u
		JOIN shipping_guides sg ON u.user_uuid = sg.created_by
		WHERE u.role = 'CLIENT'
	`

	var args []interface{}

	// Filtro de fecha desde
	if filters.DateFrom != "" {
		query += " AND DATE(sg.created_at) >= ?"
		args = append(args, filters.DateFrom)
	}

	// Filtro de fecha hasta
	if filters.DateTo != "" {
		query += " AND DATE(sg.created_at) <= ?"
		args = append(args, filters.DateTo)
	}

	query += " GROUP BY u.user_uuid, u.full_name, u.email, u.phone"

	// Filtro de mínimo de guías
	if filters.MinGuides > 0 {
		query += fmt.Sprintf(" HAVING COUNT(sg.guide_id) >= %d", filters.MinGuides)
	}

	// Ordenamiento
	orderColumn := "total_guides"
	switch filters.SortBy {
	case "total_spent":
		orderColumn = "total_spent"
	case "avg_value":
		orderColumn = "avg_value"
	case "last_activity":
		orderColumn = "last_activity"
	}

	orderDir := "DESC"
	if filters.Order == "asc" {
		orderDir = "ASC"
	}

	query += fmt.Sprintf(" ORDER BY %s %s", orderColumn, orderDir)

	// Límite
	limit := 20
	if filters.Limit > 0 && filters.Limit <= 100 {
		limit = filters.Limit
	}
	query += fmt.Sprintf(" LIMIT %d", limit)

	rows, err := Db.Query(query, args...)
	if err != nil {
		return response, fmt.Errorf("error ejecutando query: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var c models.ClientRanking
		var fullName, phone sql.NullString
		var lastActivity sql.NullTime

		err := rows.Scan(
			&c.UserUUID,
			&fullName,
			&c.Email,
			&phone,
			&c.TotalGuides,
			&c.TotalSpent,
			&c.AvgValue,
			&lastActivity,
		)
		if err != nil {
			continue
		}

		if fullName.Valid {
			c.FullName = fullName.String
		}
		if phone.Valid {
			c.Phone = phone.String
		}
		if lastActivity.Valid {
			c.LastActivity = lastActivity.Time.Format(time.RFC3339)
		}

		response.Clients = append(response.Clients, c)
	}

	response.Total = len(response.Clients)

	// Asegurar que el array no sea nil
	if response.Clients == nil {
		response.Clients = []models.ClientRanking{}
	}

	return response, nil
}
