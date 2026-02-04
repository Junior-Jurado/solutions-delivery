package bd

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// CreateDeliveryRating crea una nueva calificación de entrega
func CreateDeliveryRating(req models.CreateRatingRequest, clientUserID string) (models.DeliveryRating, error) {
	fmt.Printf("CreateDeliveryRating -> AssignmentID: %d, Rating: %d\n", req.AssignmentID, req.Rating)

	var rating models.DeliveryRating

	err := DbConnect()
	if err != nil {
		return rating, err
	}
	defer Db.Close()

	// Verificar que la asignación existe y está completada
	var deliveryUserID string
	var guideID int64
	checkQuery := `
		SELECT delivery_user_id, guide_id
		FROM delivery_assignments
		WHERE assignment_id = ? AND status = 'COMPLETED'
	`
	err = Db.QueryRow(checkQuery, req.AssignmentID).Scan(&deliveryUserID, &guideID)
	if err != nil {
		if err == sql.ErrNoRows {
			return rating, fmt.Errorf("asignación no encontrada o no está completada")
		}
		return rating, err
	}

	// Verificar que no exista ya una calificación para esta asignación
	var existingCount int
	existsQuery := `SELECT COUNT(*) FROM delivery_ratings WHERE assignment_id = ?`
	err = Db.QueryRow(existsQuery, req.AssignmentID).Scan(&existingCount)
	if err != nil {
		return rating, err
	}
	if existingCount > 0 {
		return rating, fmt.Errorf("ya existe una calificación para esta asignación")
	}

	// Verificar que el cliente tenga relación con la guía (sea el creador o destinatario)
	// Primero obtenemos el number_document del cliente
	var clientDocNumber sql.NullString
	docQuery := `SELECT CAST(number_document AS CHAR) FROM users WHERE user_uuid = ?`
	err = Db.QueryRow(docQuery, clientUserID).Scan(&clientDocNumber)
	if err != nil && err != sql.ErrNoRows {
		return rating, err
	}

	docNum := ""
	if clientDocNumber.Valid {
		docNum = clientDocNumber.String
	}

	var clientRelation int
	relationQuery := `
		SELECT COUNT(*) FROM shipping_guides sg
		LEFT JOIN guide_parties gp ON sg.guide_id = gp.guide_id AND gp.party_role = 'RECEIVER'
		WHERE sg.guide_id = ?
		AND (sg.created_by = ? OR (gp.document_number = ? AND ? != ''))
	`
	err = Db.QueryRow(relationQuery, guideID, clientUserID, docNum, docNum).Scan(&clientRelation)
	if err != nil {
		return rating, err
	}
	if clientRelation == 0 {
		return rating, fmt.Errorf("no tiene permiso para calificar esta entrega")
	}

	// Insertar calificación
	insertQuery := `
		INSERT INTO delivery_ratings
		(assignment_id, guide_id, delivery_user_id, client_user_id, rating, comment, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
	`
	result, err := Db.Exec(insertQuery, req.AssignmentID, guideID, deliveryUserID, clientUserID, req.Rating, req.Comment)
	if err != nil {
		return rating, err
	}

	ratingID, err := result.LastInsertId()
	if err != nil {
		return rating, err
	}

	return GetDeliveryRatingByID(ratingID)
}

// GetDeliveryRatingByID obtiene una calificación por su ID
func GetDeliveryRatingByID(ratingID int64) (models.DeliveryRating, error) {
	fmt.Printf("GetDeliveryRatingByID -> ID: %d\n", ratingID)

	var rating models.DeliveryRating

	err := DbConnect()
	if err != nil {
		return rating, err
	}
	defer Db.Close()

	query := `
		SELECT
			dr.rating_id,
			dr.assignment_id,
			dr.guide_id,
			dr.delivery_user_id,
			du.full_name AS delivery_user_name,
			dr.client_user_id,
			cu.full_name AS client_name,
			dr.rating,
			dr.comment,
			dr.created_at,
			dr.updated_at
		FROM delivery_ratings dr
		LEFT JOIN users du ON dr.delivery_user_id = du.user_uuid
		LEFT JOIN users cu ON dr.client_user_id = cu.user_uuid
		WHERE dr.rating_id = ?
	`

	var deliveryUserName, clientName, comment sql.NullString

	err = Db.QueryRow(query, ratingID).Scan(
		&rating.RatingID,
		&rating.AssignmentID,
		&rating.GuideID,
		&rating.DeliveryUserID,
		&deliveryUserName,
		&rating.ClientUserID,
		&clientName,
		&rating.Rating,
		&comment,
		&rating.CreatedAt,
		&rating.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return rating, fmt.Errorf("calificación no encontrada")
		}
		return rating, err
	}

	if deliveryUserName.Valid {
		rating.DeliveryUserName = deliveryUserName.String
	}
	if clientName.Valid {
		rating.ClientName = clientName.String
	}
	if comment.Valid {
		rating.Comment = comment.String
	}

	return rating, nil
}

// GetRatingByAssignmentID obtiene la calificación de una asignación
func GetRatingByAssignmentID(assignmentID int64) (models.DeliveryRating, error) {
	fmt.Printf("GetRatingByAssignmentID -> AssignmentID: %d\n", assignmentID)

	var rating models.DeliveryRating

	err := DbConnect()
	if err != nil {
		return rating, err
	}
	defer Db.Close()

	query := `
		SELECT
			dr.rating_id,
			dr.assignment_id,
			dr.guide_id,
			dr.delivery_user_id,
			du.full_name AS delivery_user_name,
			dr.client_user_id,
			cu.full_name AS client_name,
			dr.rating,
			dr.comment,
			dr.created_at,
			dr.updated_at
		FROM delivery_ratings dr
		LEFT JOIN users du ON dr.delivery_user_id = du.user_uuid
		LEFT JOIN users cu ON dr.client_user_id = cu.user_uuid
		WHERE dr.assignment_id = ?
	`

	var deliveryUserName, clientName, comment sql.NullString

	err = Db.QueryRow(query, assignmentID).Scan(
		&rating.RatingID,
		&rating.AssignmentID,
		&rating.GuideID,
		&rating.DeliveryUserID,
		&deliveryUserName,
		&rating.ClientUserID,
		&clientName,
		&rating.Rating,
		&comment,
		&rating.CreatedAt,
		&rating.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return rating, fmt.Errorf("no hay calificación para esta asignación")
		}
		return rating, err
	}

	if deliveryUserName.Valid {
		rating.DeliveryUserName = deliveryUserName.String
	}
	if clientName.Valid {
		rating.ClientName = clientName.String
	}
	if comment.Valid {
		rating.Comment = comment.String
	}

	return rating, nil
}

// GetDeliveryUserRatings obtiene todas las calificaciones de un repartidor
func GetDeliveryUserRatings(deliveryUserID string, limit int) ([]models.DeliveryRating, int, float64, error) {
	fmt.Printf("GetDeliveryUserRatings -> UserID: %s\n", deliveryUserID)

	var ratings []models.DeliveryRating
	var total int
	var avgRating float64

	err := DbConnect()
	if err != nil {
		return ratings, 0, 0, err
	}
	defer Db.Close()

	// Obtener total y promedio
	statsQuery := `
		SELECT COUNT(*), COALESCE(AVG(rating), 0)
		FROM delivery_ratings
		WHERE delivery_user_id = ?
	`
	err = Db.QueryRow(statsQuery, deliveryUserID).Scan(&total, &avgRating)
	if err != nil {
		return ratings, 0, 0, err
	}

	// Obtener calificaciones
	query := `
		SELECT
			dr.rating_id,
			dr.assignment_id,
			dr.guide_id,
			dr.delivery_user_id,
			du.full_name AS delivery_user_name,
			dr.client_user_id,
			cu.full_name AS client_name,
			dr.rating,
			dr.comment,
			dr.created_at,
			dr.updated_at
		FROM delivery_ratings dr
		LEFT JOIN users du ON dr.delivery_user_id = du.user_uuid
		LEFT JOIN users cu ON dr.client_user_id = cu.user_uuid
		WHERE dr.delivery_user_id = ?
		ORDER BY dr.created_at DESC
		LIMIT ?
	`

	rows, err := Db.Query(query, deliveryUserID, limit)
	if err != nil {
		return ratings, 0, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var r models.DeliveryRating
		var deliveryUserName, clientName, comment sql.NullString

		err := rows.Scan(
			&r.RatingID,
			&r.AssignmentID,
			&r.GuideID,
			&r.DeliveryUserID,
			&deliveryUserName,
			&r.ClientUserID,
			&clientName,
			&r.Rating,
			&comment,
			&r.CreatedAt,
			&r.UpdatedAt,
		)
		if err != nil {
			return ratings, 0, 0, err
		}

		if deliveryUserName.Valid {
			r.DeliveryUserName = deliveryUserName.String
		}
		if clientName.Valid {
			r.ClientName = clientName.String
		}
		if comment.Valid {
			r.Comment = comment.String
		}

		ratings = append(ratings, r)
	}

	return ratings, total, avgRating, nil
}

// GetDeliveryPerformanceStats obtiene estadísticas de rendimiento de un repartidor
func GetDeliveryPerformanceStats(deliveryUserID string) (models.DeliveryPerformanceStats, error) {
	fmt.Printf("GetDeliveryPerformanceStats -> UserID: %s\n", deliveryUserID)

	var stats models.DeliveryPerformanceStats

	err := DbConnect()
	if err != nil {
		return stats, err
	}
	defer Db.Close()

	// Zona horaria de Colombia
	loc, err := time.LoadLocation("America/Bogota")
	if err != nil {
		loc = time.FixedZone("COT", -5*60*60)
	}
	now := time.Now().In(loc)

	// Calcular fechas
	weekStart := now.AddDate(0, 0, -int(now.Weekday()))
	weekStartStr := weekStart.Format("2006-01-02")
	lastWeekStart := weekStart.AddDate(0, 0, -7)
	lastWeekStartStr := lastWeekStart.Format("2006-01-02")
	lastWeekEndStr := weekStart.AddDate(0, 0, -1).Format("2006-01-02")
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, loc)
	lastMonthStart := monthStart.AddDate(0, -1, 0)
	lastMonthStartStr := lastMonthStart.Format("2006-01-02")
	lastMonthEndStr := monthStart.AddDate(0, 0, -1).Format("2006-01-02")

	// Entregas esta semana
	weekQuery := `
		SELECT COUNT(*)
		FROM delivery_assignments
		WHERE delivery_user_id = ?
		AND status = 'COMPLETED'
		AND DATE(completed_at) >= ?
	`
	err = Db.QueryRow(weekQuery, deliveryUserID, weekStartStr).Scan(&stats.DeliveriesThisWeek)
	if err != nil {
		stats.DeliveriesThisWeek = 0
	}

	// Entregas semana pasada
	lastWeekQuery := `
		SELECT COUNT(*)
		FROM delivery_assignments
		WHERE delivery_user_id = ?
		AND status = 'COMPLETED'
		AND DATE(completed_at) >= ? AND DATE(completed_at) <= ?
	`
	err = Db.QueryRow(lastWeekQuery, deliveryUserID, lastWeekStartStr, lastWeekEndStr).Scan(&stats.DeliveriesLastWeek)
	if err != nil {
		stats.DeliveriesLastWeek = 0
	}

	// Calcular porcentaje de cambio en entregas
	if stats.DeliveriesLastWeek > 0 {
		stats.DeliveriesChangePercent = ((float64(stats.DeliveriesThisWeek) - float64(stats.DeliveriesLastWeek)) / float64(stats.DeliveriesLastWeek)) * 100
	} else if stats.DeliveriesThisWeek > 0 {
		stats.DeliveriesChangePercent = 100
	} else {
		stats.DeliveriesChangePercent = 0
	}

	// Tasa de éxito (completadas vs total)
	var totalAssignments, completedAssignments int
	successQuery := `
		SELECT
			COUNT(*) as total,
			SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed
		FROM delivery_assignments
		WHERE delivery_user_id = ?
	`
	err = Db.QueryRow(successQuery, deliveryUserID).Scan(&totalAssignments, &completedAssignments)
	if err != nil || totalAssignments == 0 {
		stats.SuccessRate = 100
	} else {
		stats.SuccessRate = float64(completedAssignments) / float64(totalAssignments) * 100
	}

	// Tiempo promedio esta semana (en minutos, entre assigned_at y completed_at)
	avgTimeQuery := `
		SELECT COALESCE(AVG(TIMESTAMPDIFF(MINUTE, assigned_at, completed_at)), 0)
		FROM delivery_assignments
		WHERE delivery_user_id = ?
		AND status = 'COMPLETED'
		AND DATE(completed_at) >= ?
		AND assigned_at IS NOT NULL
	`
	err = Db.QueryRow(avgTimeQuery, deliveryUserID, weekStartStr).Scan(&stats.AvgTimeMinutes)
	if err != nil {
		stats.AvgTimeMinutes = 0
	}

	// Tiempo promedio semana pasada
	avgTimeLastWeekQuery := `
		SELECT COALESCE(AVG(TIMESTAMPDIFF(MINUTE, assigned_at, completed_at)), 0)
		FROM delivery_assignments
		WHERE delivery_user_id = ?
		AND status = 'COMPLETED'
		AND DATE(completed_at) >= ? AND DATE(completed_at) <= ?
		AND assigned_at IS NOT NULL
	`
	err = Db.QueryRow(avgTimeLastWeekQuery, deliveryUserID, lastWeekStartStr, lastWeekEndStr).Scan(&stats.AvgTimeLastWeek)
	if err != nil {
		stats.AvgTimeLastWeek = 0
	}

	// Cambio en tiempo (negativo es mejor)
	stats.AvgTimeChange = stats.AvgTimeMinutes - stats.AvgTimeLastWeek

	// Promedio de calificaciones (este mes)
	ratingQuery := `
		SELECT COALESCE(AVG(rating), 0), COUNT(*)
		FROM delivery_ratings
		WHERE delivery_user_id = ?
	`
	err = Db.QueryRow(ratingQuery, deliveryUserID).Scan(&stats.AvgRating, &stats.TotalRatings)
	if err != nil {
		stats.AvgRating = 0
		stats.TotalRatings = 0
	}

	// Promedio de calificaciones mes pasado
	ratingLastMonthQuery := `
		SELECT COALESCE(AVG(rating), 0)
		FROM delivery_ratings
		WHERE delivery_user_id = ?
		AND DATE(created_at) >= ? AND DATE(created_at) <= ?
	`
	err = Db.QueryRow(ratingLastMonthQuery, deliveryUserID, lastMonthStartStr, lastMonthEndStr).Scan(&stats.AvgRatingLastMonth)
	if err != nil {
		stats.AvgRatingLastMonth = 0
	}

	// Cambio en calificación
	stats.AvgRatingChange = stats.AvgRating - stats.AvgRatingLastMonth

	// Rendimiento diario (últimos 7 días)
	stats.DailyPerformance = make([]models.DailyPerformance, 0)
	dayNames := []string{"Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"}

	for i := 6; i >= 0; i-- {
		day := now.AddDate(0, 0, -i)
		dayStr := day.Format("2006-01-02")

		var deliveries int
		dayQuery := `
			SELECT COUNT(*)
			FROM delivery_assignments
			WHERE delivery_user_id = ?
			AND status = 'COMPLETED'
			AND DATE(completed_at) = ?
		`
		Db.QueryRow(dayQuery, deliveryUserID, dayStr).Scan(&deliveries)

		target := 10 // Meta diaria por defecto
		efficiency := 0
		if target > 0 {
			efficiency = int(float64(deliveries) / float64(target) * 100)
		}

		stats.DailyPerformance = append(stats.DailyPerformance, models.DailyPerformance{
			Day:        dayNames[int(day.Weekday())],
			Deliveries: deliveries,
			Target:     target,
			Efficiency: efficiency,
		})
	}

	// Últimas reseñas
	stats.RecentReviews = make([]models.CustomerReview, 0)
	reviewsQuery := `
		SELECT
			dr.rating_id,
			dr.rating,
			dr.comment,
			cu.full_name,
			dr.created_at,
			dr.guide_id
		FROM delivery_ratings dr
		LEFT JOIN users cu ON dr.client_user_id = cu.user_uuid
		WHERE dr.delivery_user_id = ?
		ORDER BY dr.created_at DESC
		LIMIT 5
	`
	rows, err := Db.Query(reviewsQuery, deliveryUserID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var review models.CustomerReview
			var clientName, comment sql.NullString
			var createdAt time.Time

			err := rows.Scan(&review.RatingID, &review.Rating, &comment, &clientName, &createdAt, &review.GuideID)
			if err != nil {
				continue
			}

			if clientName.Valid {
				review.ClientName = clientName.String
			} else {
				review.ClientName = "Cliente"
			}
			if comment.Valid {
				review.Comment = comment.String
			} else {
				review.Comment = "Sin comentario"
			}
			review.Date = createdAt.Format("02/01/2006")

			stats.RecentReviews = append(stats.RecentReviews, review)
		}
	}

	return stats, nil
}

// GetClientPendingRatings obtiene las entregas completadas que el cliente puede calificar
func GetClientPendingRatings(clientUserID string) ([]models.ClientPendingRating, error) {
	fmt.Printf("GetClientPendingRatings -> ClientID: %s\n", clientUserID)

	var pending []models.ClientPendingRating

	err := DbConnect()
	if err != nil {
		return pending, err
	}
	defer Db.Close()

	// Primero obtenemos el number_document del cliente
	var clientDocNumber sql.NullString
	docQuery := `SELECT CAST(number_document AS CHAR) FROM users WHERE user_uuid = ?`
	err = Db.QueryRow(docQuery, clientUserID).Scan(&clientDocNumber)
	if err != nil && err != sql.ErrNoRows {
		return pending, err
	}

	// Obtener entregas completadas donde el cliente es:
	// 1. El creador de la guía (created_by)
	// 2. El destinatario de la guía (RECEIVER en guide_parties)
	query := `
		SELECT DISTINCT
			da.assignment_id,
			da.guide_id,
			da.delivery_user_id,
			du.full_name AS delivery_user_name,
			da.completed_at,
			sg.service_type
		FROM delivery_assignments da
		JOIN shipping_guides sg ON da.guide_id = sg.guide_id
		LEFT JOIN users du ON da.delivery_user_id = du.user_uuid
		LEFT JOIN guide_parties gp ON sg.guide_id = gp.guide_id AND gp.party_role = 'RECEIVER'
		WHERE da.assignment_type = 'DELIVERY'
		AND da.status = 'COMPLETED'
		AND (
			sg.created_by = ?
			OR (gp.document_number = ? AND ? != '')
		)
		AND NOT EXISTS (
			SELECT 1 FROM delivery_ratings dr
			WHERE dr.assignment_id = da.assignment_id
		)
		ORDER BY da.completed_at DESC
		LIMIT 10
	`

	docNum := ""
	if clientDocNumber.Valid {
		docNum = clientDocNumber.String
	}

	rows, err := Db.Query(query, clientUserID, docNum, docNum)
	if err != nil {
		return pending, err
	}
	defer rows.Close()

	for rows.Next() {
		var p models.ClientPendingRating
		var deliveryUserName sql.NullString
		var completedAt sql.NullTime

		err := rows.Scan(
			&p.AssignmentID,
			&p.GuideID,
			&p.DeliveryUserID,
			&deliveryUserName,
			&completedAt,
			&p.ServiceType,
		)
		if err != nil {
			continue
		}

		if deliveryUserName.Valid {
			p.DeliveryUserName = deliveryUserName.String
		}
		if completedAt.Valid {
			p.CompletedAt = completedAt.Time.Format("2006-01-02 15:04")
		}

		pending = append(pending, p)
	}

	return pending, nil
}
