package bd

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// CreateGuide crea una nueva guía con todas sus relaciones
func CreateGuide(request models.CreateGuideRequest, userUUID string) (int64, string, error) {
	fmt.Println("CreateGuide")

	err := DbConnect()
	if err != nil {
		return 0, "", err
	}
	defer Db.Close()

	tx, err := Db.Begin()
	if err != nil {
		return 0, "", err
	}

	// 1. Insertar la guía principal
	guideQuery := `
		INSERT INTO shipping_guides (
			service_type, payment_method, declared_value, price,
			current_status, origin_city_id, destination_city_id,
			created_by, created_at, updated_at
		) VALUES (?, ?, ?, ?, 'CREATED', ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`

	result, err := tx.Exec(guideQuery,
		request.Service.ServiceType,
		request.Service.PaymentMethod,
		request.Pricing.DeclaredValue,
		request.Pricing.Price,
		request.Route.OriginCityID,
		request.Route.DestinationCityID,
		userUUID,
	)
	if err != nil {
		tx.Rollback()
		return 0, "", fmt.Errorf("error al insertar guía: %s", err.Error())
	}

	guideID, err := result.LastInsertId()
	if err != nil {
		tx.Rollback()
		return 0, "", err
	}

	guideNumber := fmt.Sprintf("%d", guideID)

	// 2. Insertar remitente
	partyQuery := `
		INSERT INTO guide_parties (
			guide_id, party_role, full_name, document_type, document_number,
			phone, email, address, city_id
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = tx.Exec(partyQuery,
		guideID, "SENDER",
		request.Sender.FullName, request.Sender.DocumentType, request.Sender.DocumentNumber,
		request.Sender.Phone, request.Sender.Email, request.Sender.Address, request.Sender.CityID,
	)
	if err != nil {
		tx.Rollback()
		return 0, "", fmt.Errorf("error al insertar remitente: %s", err.Error())
	}

	// 3. Insertar destinatario
	_, err = tx.Exec(partyQuery,
		guideID, "RECEIVER",
		request.Receiver.FullName, request.Receiver.DocumentType, request.Receiver.DocumentNumber,
		request.Receiver.Phone, request.Receiver.Email, request.Receiver.Address, request.Receiver.CityID,
	)
	if err != nil {
		tx.Rollback()
		return 0, "", fmt.Errorf("error al insertar destinatario: %s", err.Error())
	}

	// 4. Insertar paquete
	packageQuery := `
		INSERT INTO packages (
			guide_id, weight_kg, pieces, length_cm, width_cm, height_cm,
			insured, description, special_notes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = tx.Exec(packageQuery,
		guideID,
		request.Package.WeightKg, request.Package.Pieces,
		request.Package.LengthCm, request.Package.WidthCm, request.Package.HeightCm,
		request.Package.Insured, request.Package.Description, request.Package.SpecialNotes,
	)
	if err != nil {
		tx.Rollback()
		return 0, "", fmt.Errorf("error al insertar paquete: %s", err.Error())
	}

	// 5. Insertar historial inicial
	historyQuery := `
		INSERT INTO guide_status_history (guide_id, status, updated_by, updated_at)
		VALUES (?, 'CREATED', ?, CURRENT_TIMESTAMP)
	`

	_, err = tx.Exec(historyQuery, guideID, userUUID)
	if err != nil {
		tx.Rollback()
		return 0, "", fmt.Errorf("error al insertar historial: %s", err.Error())
	}

	err = tx.Commit()
	if err != nil {
		return 0, "", err
	}

	return guideID, guideNumber, nil
}

// SavePriceOverride guarda un registro de modificación de precio
func SavePriceOverride(guideID int64, override models.PriceOverride) error {
	fmt.Printf("SavePriceOverride -> GuideID: %d\n", guideID)

	err := DbConnect()
	if err != nil {
		return err
	}
	defer Db.Close()

	query := `
		INSERT INTO guide_price_overrides (
			guide_id, original_price, new_price, reason, overridden_by
		) VALUES (?, ?, ?, ?, ?)
	`

	_, err = Db.Exec(query,
		guideID,
		override.OriginalPrice,
		override.NewPrice,
		override.Reason,
		override.OverriddenBy,
	)

	return err
}

// GetGuidesByFilters obtiene guías aplicando filtros
func GetGuidesByFilters(filters models.GuideFilters) ([]models.ShippingGuide, int, error) {
	fmt.Println("GetGuidesByFilters")

	var guides []models.ShippingGuide
	var total int

	err := DbConnect()
	if err != nil {
		return guides, 0, err
	}
	defer Db.Close()

	// Construcción dinámica de WHERE
	var conditions []string
	var args []interface{}

	if filters.Status != "" {
		conditions = append(conditions, "sg.current_status = ?")
		args = append(args, filters.Status)
	}

	if filters.OriginCityID != nil {
		conditions = append(conditions, "sg.origin_city_id = ?")
		args = append(args, *filters.OriginCityID)
	}

	if filters.DestinationCityID != nil {
		conditions = append(conditions, "sg.destination_city_id = ?")
		args = append(args, *filters.DestinationCityID)
	}

	if filters.CreatedBy != "" {
		conditions = append(conditions, "sg.created_by = ?")
		args = append(args, filters.CreatedBy)
	}

	// BÚSQUEDA MEJORADA: Incluye guide_id, ciudades, nombres y documentos
	if filters.SearchTerm != "" {
		searchPattern := "%" + filters.SearchTerm + "%"
		conditions = append(conditions, `(
			CAST(sg.guide_id AS CHAR) LIKE ? OR 
			oc.name LIKE ? OR 
			dc.name LIKE ? OR
			sender.full_name LIKE ? OR
			receiver.full_name LIKE ? OR
			sender.document_number LIKE ? OR
			receiver.document_number LIKE ?
		)`)
		args = append(args, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern)
	}

	if filters.DateFrom != nil {
		conditions = append(conditions, "sg.created_at >= ?")
		args = append(args, *filters.DateFrom)
	}

	if filters.DateTo != nil {
		conditions = append(conditions, "sg.created_at <= ?")
		args = append(args, *filters.DateTo)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ")
	}

	// Contar total - AHORA CON JOINS DE LAS PARTES
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM shipping_guides sg
		LEFT JOIN cities oc ON sg.origin_city_id = oc.id
		LEFT JOIN cities dc ON sg.destination_city_id = dc.id
		LEFT JOIN guide_parties sender ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'
		LEFT JOIN guide_parties receiver ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'
		%s
	`, whereClause)

	err = Db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return guides, 0, err
	}

	// Consulta principal - AGREGAMOS CAMPOS DE SENDER Y RECEIVER
	query := fmt.Sprintf(`
		SELECT 
			sg.guide_id,
			sg.service_type,
			sg.payment_method,
			sg.declared_value,
			sg.price,
			sg.current_status,
			sg.origin_city_id,
			oc.name AS origin_city_name,
			sg.destination_city_id,
			dc.name AS destination_city_name,
			sg.pdf_url,
			sg.pdf_s3_key,
			sg.created_by,
			sg.created_at,
			sg.updated_at,
			sender.party_id,
			sender.full_name,
			sender.document_type,
			sender.document_number,
			sender.phone,
			sender.email,
			sender.address,
			sender.city_id,
			receiver.party_id,
			receiver.full_name,
			receiver.document_type,
			receiver.document_number,
			receiver.phone,
			receiver.email,
			receiver.address,
			receiver.city_id
		FROM shipping_guides sg
		LEFT JOIN cities oc ON sg.origin_city_id = oc.id
		LEFT JOIN cities dc ON sg.destination_city_id = dc.id
		LEFT JOIN guide_parties sender ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'
		LEFT JOIN guide_parties receiver ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'
		%s
		ORDER BY sg.created_at DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	args = append(args, filters.Limit, filters.Offset)

	rows, err := Db.Query(query, args...)
	if err != nil {
		return guides, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var guide models.ShippingGuide
		var sender models.GuideParty
		var receiver models.GuideParty

		// Variables nullable para el scan
		var senderPartyID, receiverPartyID sql.NullInt64
		var senderName, senderDocType, senderDocNum, senderPhone, senderEmail, senderAddr sql.NullString
		var senderCityID sql.NullInt64
		var receiverName, receiverDocType, receiverDocNum, receiverPhone, receiverEmail, receiverAddr sql.NullString
		var receiverCityID sql.NullInt64

		err := rows.Scan(
			&guide.GuideID,
			&guide.ServiceType,
			&guide.PaymentMethod,
			&guide.DeclaredValue,
			&guide.Price,
			&guide.CurrentStatus,
			&guide.OriginCityID,
			&guide.OriginCityName,
			&guide.DestinationCityID,
			&guide.DestinationCityName,
			&guide.PDFUrl,
			&guide.PDFS3Key,
			&guide.CreatedBy,
			&guide.CreatedAt,
			&guide.UpdatedAt,
			// Sender
			&senderPartyID,
			&senderName,
			&senderDocType,
			&senderDocNum,
			&senderPhone,
			&senderEmail,
			&senderAddr,
			&senderCityID,
			// Receiver
			&receiverPartyID,
			&receiverName,
			&receiverDocType,
			&receiverDocNum,
			&receiverPhone,
			&receiverEmail,
			&receiverAddr,
			&receiverCityID,
		)

		if err != nil {
			return guides, 0, err
		}

		// Asignar sender si existe
		if senderPartyID.Valid {
			sender.PartyID = senderPartyID.Int64
			sender.GuideID = guide.GuideID
			sender.PartyRole = models.RoleSender
			sender.FullName = senderName.String
			sender.DocumentType = senderDocType.String
			sender.DocumentNumber = senderDocNum.String
			sender.Phone = senderPhone.String
			sender.Email = senderEmail.String
			sender.Address = senderAddr.String
			sender.CityID = senderCityID.Int64
			guide.Sender = &sender
		}

		// Asignar receiver si existe
		if receiverPartyID.Valid {
			receiver.PartyID = receiverPartyID.Int64
			receiver.GuideID = guide.GuideID
			receiver.PartyRole = models.RoleReceiver
			receiver.FullName = receiverName.String
			receiver.DocumentType = receiverDocType.String
			receiver.DocumentNumber = receiverDocNum.String
			receiver.Phone = receiverPhone.String
			receiver.Email = receiverEmail.String
			receiver.Address = receiverAddr.String
			receiver.CityID = receiverCityID.Int64
			guide.Receiver = &receiver
		}

		guides = append(guides, guide)
	}

	return guides, total, nil
}

// GetGuideByID obtiene una guía completa con todas sus relaciones
func GetGuideByID(guideID int64) (models.ShippingGuide, error) {
	fmt.Printf("GetGuideByID -> GuideID: %d\n", guideID)

	var guide models.ShippingGuide

	err := DbConnect()
	if err != nil {
		return guide, err
	}
	defer Db.Close()

	// Consulta principal de la guía
	query := `
		SELECT 
			sg.guide_id,
			sg.service_type,
			sg.payment_method,
			sg.declared_value,
			sg.price,
			sg.current_status,
			sg.origin_city_id,
			oc.name AS origin_city_name,
			sg.destination_city_id,
			dc.name AS destination_city_name,
			sg.pdf_url,
			sg.pdf_s3_key,
			sg.created_by,
			sg.created_at,
			sg.updated_at
		FROM shipping_guides sg
		LEFT JOIN cities oc ON sg.origin_city_id = oc.id
		LEFT JOIN cities dc ON sg.destination_city_id = dc.id
		WHERE sg.guide_id = ?
	`

	row := Db.QueryRow(query, guideID)
	err = row.Scan(
		&guide.GuideID,
		&guide.ServiceType,
		&guide.PaymentMethod,
		&guide.DeclaredValue,
		&guide.Price,
		&guide.CurrentStatus,
		&guide.OriginCityID,
		&guide.OriginCityName,
		&guide.DestinationCityID,
		&guide.DestinationCityName,
		&guide.PDFUrl,
		&guide.PDFS3Key,
		&guide.CreatedBy,
		&guide.CreatedAt,
		&guide.UpdatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return guide, fmt.Errorf("guía no encontrada")
		}
		return guide, err
	}

	// Obtener partes (remitente y destinatario)
	parties, err := getGuideParties(guideID)
	if err == nil {
		for _, party := range parties {
			switch party.PartyRole {
			case models.RoleSender:
				guide.Sender = &party
			case models.RoleReceiver:
				guide.Receiver = &party
			}
		}
	}

	// Obtener paquete
	pkg, err := getGuidePackage(guideID)
	if err == nil {
		guide.Package = &pkg
	}

	// Obtener historial
	history, err := getGuideHistory(guideID)
	if err == nil {
		guide.History = history
	}

	return guide, nil
}

// getGuideParties obtiene las partes de una guía (remitente/destinatario)
func getGuideParties(guideID int64) ([]models.GuideParty, error) {
	var parties []models.GuideParty

	query := `
		SELECT 
			gp.party_id,
			gp.guide_id,
			gp.party_role,
			gp.full_name,
			gp.document_type,
			gp.document_number,
			gp.phone,
			gp.email,
			gp.address,
			gp.city_id,
			c.name AS city_name
		FROM guide_parties gp
		LEFT JOIN cities c ON gp.city_id = c.id
		WHERE gp.guide_id = ?
	`

	rows, err := Db.Query(query, guideID)
	if err != nil {
		return parties, err
	}
	defer rows.Close()

	for rows.Next() {
		var party models.GuideParty

		err := rows.Scan(
			&party.PartyID,
			&party.GuideID,
			&party.PartyRole,
			&party.FullName,
			&party.DocumentType,
			&party.DocumentNumber,
			&party.Phone,
			&party.Email,
			&party.Address,
			&party.CityID,
			&party.CityName,
		)

		if err != nil {
			return parties, err
		}

		parties = append(parties, party)
	}

	return parties, nil
}

// getGuidePackage obtiene el paquete de una guía
func getGuidePackage(guideID int64) (models.Package, error) {
	var pkg models.Package

	query := `
		SELECT 
			package_id,
			guide_id,
			weight_kg,
			pieces,
			length_cm,
			width_cm,
			height_cm,
			insured,
			description,
			special_notes
		FROM packages
		WHERE guide_id = ?
	`

	row := Db.QueryRow(query, guideID)
	err := row.Scan(
		&pkg.PackageID,
		&pkg.GuideID,
		&pkg.WeightKg,
		&pkg.Pieces,
		&pkg.LengthCM,
		&pkg.WidthCM,
		&pkg.HeightCM,
		&pkg.Insured,
		&pkg.Description,
		&pkg.SpecialNotes,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return pkg, fmt.Errorf("paquete no encontrado")
		}
		return pkg, err
	}

	return pkg, nil
}

// getGuideHistory obtiene el historial de estados de una guía
func getGuideHistory(guideID int64) ([]models.StatusHistory, error) {
	var history []models.StatusHistory

	query := `
		SELECT 
			history_id,
			guide_id,
			status,
			updated_by,
			updated_at
		FROM guide_status_history
		WHERE guide_id = ?
		ORDER BY created_at DESC
	`

	rows, err := Db.Query(query, guideID)
	if err != nil {
		return history, err
	}
	defer rows.Close()

	for rows.Next() {
		var h models.StatusHistory

		err := rows.Scan(
			&h.HistoryID,
			&h.GuideID,
			&h.Status,
			&h.UpdatedBy,
			&h.UpdatedAt,
		)

		if err != nil {
			return history, err
		}

		history = append(history, h)
	}

	return history, nil
}

// UpdateGuideStatus actualiza el estado de una guía y registra en el historial
func UpdateGuideStatus(guideID int64, status models.GuideStatus, userUUID string) error {
	fmt.Printf("UpdateGuideStatus -> GuideID: %d, Status: %s\n", guideID, status)

	err := DbConnect()
	if err != nil {
		return err
	}
	defer Db.Close()

	// Iniciar transacción
	tx, err := Db.Begin()
	if err != nil {
		return err
	}

	// Actualizar estado en shipping_guides
	updateQuery := `
		UPDATE shipping_guides
		SET current_status = ?, updated_at = CURRENT_TIMESTAMP
		WHERE guide_id = ?
	`

	_, err = tx.Exec(updateQuery, status, guideID)
	if err != nil {
		tx.Rollback()
		return err
	}

	// Insertar en historial
	historyQuery := `
		INSERT INTO guide_status_history (guide_id, status, updated_by, updated_at)
		VALUES (?, ?, ?, CURRENT_TIMESTAMP)
	`

	_, err = tx.Exec(historyQuery, guideID, status, userUUID)
	if err != nil {
		tx.Rollback()
		return err
	}

	// Commit de la transacción
	err = tx.Commit()
	if err != nil {
		return err
	}

	return nil
}

// GetGuideStats obtiene estadísticas de guías
func GetGuideStats(userUUID string) (models.GuideStatsResponse, error) {
	fmt.Println("GetGuideStats")

	var stats models.GuideStatsResponse
	stats.ByStatus = make(map[string]int)

	err := DbConnect()
	if err != nil {
		return stats, err
	}
	defer Db.Close()

	// Total del día
	todayQuery := `
		SELECT COUNT(*)
		FROM shipping_guides
		WHERE DATE(created_at) = CURDATE()
	`
	err = Db.QueryRow(todayQuery).Scan(&stats.TotalToday)
	if err != nil {
		return stats, err
	}

	// Total procesados (entregados)
	processedQuery := `
		SELECT COUNT(*)
		FROM shipping_guides
		WHERE current_status = 'DELIVERED'
	`
	err = Db.QueryRow(processedQuery).Scan(&stats.TotalProcessed)
	if err != nil {
		return stats, err
	}

	// Total pendientes (no entregados)
	pendingQuery := `
		SELECT COUNT(*)
		FROM shipping_guides
		WHERE current_status != 'DELIVERED' 
	`
	err = Db.QueryRow(pendingQuery).Scan(&stats.TotalPending)
	if err != nil {
		return stats, err
	}

	// Por estado
	statusQuery := `
		SELECT current_status, COUNT(*) as count
		FROM shipping_guides
		GROUP BY current_status
	`

	rows, err := Db.Query(statusQuery)
	if err != nil {
		return stats, err
	}
	defer rows.Close()

	for rows.Next() {
		var status string
		var count int

		err := rows.Scan(&status, &count)
		if err != nil {
			return stats, err
		}

		stats.ByStatus[status] = count
	}

	return stats, nil
}

// GuideExists verifica si existe una guía
func GuideExists(guideID int64) bool {
	fmt.Printf("GuideExists -> GuideID: %d\n", guideID)

	err := DbConnect()
	if err != nil {
		return false
	}
	defer Db.Close()

	query := `SELECT COUNT(*) FROM shipping_guides WHERE guide_id = ?`

	var count int
	err = Db.QueryRow(query, guideID).Scan(&count)
	if err != nil {
		return false
	}

	return count > 0
}

// GetGuidePDFInfo obtiene la información del PDF de una guía
func GetGuidePDFInfo(guideID int64) (string, error) {
	fmt.Printf("GetGuidePDFInfo -> GuideID: %d\n", guideID)

	var pdfS3Key string

	err := DbConnect()
	if err != nil {
		return "", err
	}
	defer Db.Close()

	query := `
		SELECT pdf_s3_key
		FROM shipping_guides
		WHERE guide_id = ?
	`

	err = Db.QueryRow(query, guideID).Scan(&pdfS3Key)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("guía no encontrada")
		}
		return "", err
	}

	if pdfS3Key == "" {
		return "", fmt.Errorf("la guía no tiene PDF asociado")
	}

	return pdfS3Key, nil
}
