package bd

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// ==========================================
// PROFILE
// ==========================================

// GetUserProfile obtiene el perfil de un usuario
func GetUserProfile(userUUID string) (models.ClientProfile, error) {
	fmt.Printf("GetUserProfile -> UserUUID: %s\n", userUUID)

	var profile models.ClientProfile

	err := DbConnect()
	if err != nil {
		return profile, err
	}
	defer Db.Close()

	query := `
		SELECT 
			user_uuid,
			full_name,
			email,
			phone,
			type_document,
			number_document,
			created_at
		FROM users
		WHERE user_uuid = ?
	`

	row := Db.QueryRow(query, userUUID)
	err = row.Scan(
		&profile.UserUUID,
		&profile.FullName,
		&profile.Email,
		&profile.Phone,
		&profile.DocumentType,
		&profile.DocumentNumber,
		&profile.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return profile, fmt.Errorf("usuario no encontrado")
		}
		return profile, err
	}

	return profile, nil
}

// UpdateUserProfile actualiza el perfil de un usuario
func UpdateUserProfile(userUUID string, updateData models.ClientProfileUpdate) (models.ClientProfile, error) {
	fmt.Printf("UpdateUserProfile -> UserUUID: %s\n", userUUID)

	err := DbConnect()
	if err != nil {
		return models.ClientProfile{}, err
	}
	defer Db.Close()

	// Construir UPDATE dinámico
	var setParts []string
	var args []interface{}

	if updateData.FullName != "" {
		setParts = append(setParts, "full_name = ?")
		args = append(args, updateData.FullName)
	}
	if updateData.Phone != "" {
		setParts = append(setParts, "phone = ?")
		args = append(args, updateData.Phone)
	}
	if updateData.DocumentType != "" {
		setParts = append(setParts, "type_document = ?")
		args = append(args, updateData.DocumentType)
	}
	if updateData.DocumentNumber != "" {
		setParts = append(setParts, "number_document = ?")
		args = append(args, updateData.DocumentNumber)
	}

	if len(setParts) == 0 {
		return GetUserProfile(userUUID)
	}

	args = append(args, userUUID)

	query := fmt.Sprintf(`
		UPDATE users
		SET %s, updated_at = CURRENT_TIMESTAMP
		WHERE user_uuid = ?
	`, strings.Join(setParts, ", "))

	_, err = Db.Exec(query, args...)
	if err != nil {
		return models.ClientProfile{}, err
	}

	// Obtener perfil actualizado
	return GetUserProfile(userUUID)
}

// ==========================================
// GUIDES
// ==========================================

// GetClientActiveGuides obtiene las guías activas de un cliente
func GetClientActiveGuides(userUUID string) ([]models.ShippingGuide, error) {
	fmt.Printf("GetClientActiveGuides -> UserUUID: %s\n", userUUID)

	var guides []models.ShippingGuide

	err := DbConnect()
	if err != nil {
		return guides, err
	}
	defer Db.Close()

	// Consulta: guías donde el usuario es remitente O destinatario Y NO están entregadas
	query := `
		SELECT DISTINCT
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
			receiver.city_id,
			p.package_id,
			p.weight_kg,
			p.pieces
		FROM shipping_guides sg
		LEFT JOIN cities oc ON sg.origin_city_id = oc.id
		LEFT JOIN cities dc ON sg.destination_city_id = dc.id
		LEFT JOIN guide_parties sender ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'
		LEFT JOIN guide_parties receiver ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'
		LEFT JOIN packages p ON sg.guide_id = p.guide_id
		WHERE (
			sg.created_by = ? OR
			sender.document_number IN (
				SELECT number_document FROM users WHERE user_uuid = ?
			) OR
			receiver.document_number IN (
				SELECT number_document FROM users WHERE user_uuid = ?
			)
		)
		AND sg.current_status != 'DELIVERED'
		ORDER BY sg.created_at DESC
	`

	rows, err := Db.Query(query, userUUID, userUUID, userUUID)
	if err != nil {
		return guides, err
	}
	defer rows.Close()

	for rows.Next() {
		var guide models.ShippingGuide
		var sender models.GuideParty
		var receiver models.GuideParty
		var pkg models.Package

		// Variables nullable
		var senderPartyID, receiverPartyID sql.NullInt64
		var senderName, senderDocType, senderDocNum, senderPhone, senderEmail, senderAddr sql.NullString
		var senderCityID sql.NullInt64
		var receiverName, receiverDocType, receiverDocNum, receiverPhone, receiverEmail, receiverAddr sql.NullString
		var receiverCityID sql.NullInt64
		var pkgID sql.NullInt64
		var pkgWeight sql.NullFloat64
		var pkgPieces sql.NullInt64

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
			// Package
			&pkgID,
			&pkgWeight,
			&pkgPieces,
		)

		if err != nil {
			return guides, err
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

		// Asignar package si existe
		if pkgID.Valid {
			pkg.PackageID = pkgID.Int64
			pkg.GuideID = guide.GuideID
			pkg.WeightKg = pkgWeight.Float64
			pkg.Pieces = int(pkgPieces.Int64)
			guide.Package = &pkg
		}

		guides = append(guides, guide)
	}

	return guides, nil
}

// GetClientGuideHistory obtiene el histórico de guías de un cliente
func GetClientGuideHistory(filters models.ClientGuideFilters) ([]models.ShippingGuide, error) {
	fmt.Printf("GetClientGuideHistory -> UserUUID: %s\n", filters.UserUUID)

	var guides []models.ShippingGuide

	err := DbConnect()
	if err != nil {
		return guides, err
	}
	defer Db.Close()

	// Construcción dinámica de WHERE
	var conditions []string
	var args []interface{}

	// SIEMPRE filtrar por usuario (creador o en parties)
	conditions = append(conditions, `(
		sg.created_by = ? OR
		sender.document_number IN (
			SELECT number_document FROM users WHERE user_uuid = ?
		) OR
		receiver.document_number IN (
			SELECT number_document FROM users WHERE user_uuid = ?
		)
	)`)
	args = append(args, filters.UserUUID, filters.UserUUID, filters.UserUUID)

	// Filtro por estado
	if filters.Status != nil {
		conditions = append(conditions, "sg.current_status = ?")
		args = append(args, *filters.Status)
	}

	// Filtro por fecha desde
	if filters.DateFrom != nil {
		conditions = append(conditions, "sg.created_at >= ?")
		args = append(args, *filters.DateFrom)
	}

	// Filtro por fecha hasta
	if filters.DateTo != nil {
		conditions = append(conditions, "sg.created_at <= ?")
		args = append(args, *filters.DateTo)
	}

	// Búsqueda
	if filters.SearchTerm != "" {
		searchPattern := "%" + filters.SearchTerm + "%"
		conditions = append(conditions, `(
			CAST(sg.guide_id AS CHAR) LIKE ? OR
			oc.name LIKE ? OR
			dc.name LIKE ?
		)`)
		args = append(args, searchPattern, searchPattern, searchPattern)
	}

	whereClause := "WHERE " + strings.Join(conditions, " AND ")

	query := fmt.Sprintf(`
		SELECT DISTINCT
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
			receiver.city_id,
			p.package_id,
			p.weight_kg,
			p.pieces
		FROM shipping_guides sg
		LEFT JOIN cities oc ON sg.origin_city_id = oc.id
		LEFT JOIN cities dc ON sg.destination_city_id = dc.id
		LEFT JOIN guide_parties sender ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'
		LEFT JOIN guide_parties receiver ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'
		LEFT JOIN packages p ON sg.guide_id = p.guide_id
		%s
		ORDER BY sg.created_at DESC
		LIMIT ? OFFSET ?
	`, whereClause)

	args = append(args, filters.Limit, filters.Offset)

	rows, err := Db.Query(query, args...)
	if err != nil {
		return guides, err
	}
	defer rows.Close()

	for rows.Next() {
		var guide models.ShippingGuide
		var sender models.GuideParty
		var receiver models.GuideParty
		var pkg models.Package

		// Variables nullable (mismo código que GetClientActiveGuides)
		var senderPartyID, receiverPartyID sql.NullInt64
		var senderName, senderDocType, senderDocNum, senderPhone, senderEmail, senderAddr sql.NullString
		var senderCityID sql.NullInt64
		var receiverName, receiverDocType, receiverDocNum, receiverPhone, receiverEmail, receiverAddr sql.NullString
		var receiverCityID sql.NullInt64
		var pkgID sql.NullInt64
		var pkgWeight sql.NullFloat64
		var pkgPieces sql.NullInt64

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
			&senderPartyID, &senderName, &senderDocType, &senderDocNum,
			&senderPhone, &senderEmail, &senderAddr, &senderCityID,
			&receiverPartyID, &receiverName, &receiverDocType, &receiverDocNum,
			&receiverPhone, &receiverEmail, &receiverAddr, &receiverCityID,
			&pkgID, &pkgWeight, &pkgPieces,
		)

		if err != nil {
			return guides, err
		}

		// Asignar relaciones
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

		if pkgID.Valid {
			pkg.PackageID = pkgID.Int64
			pkg.GuideID = guide.GuideID
			pkg.WeightKg = pkgWeight.Float64
			pkg.Pieces = int(pkgPieces.Int64)
			guide.Package = &pkg
		}

		guides = append(guides, guide)
	}

	return guides, nil
}

// ==========================================
// STATS
// ==========================================

// GetClientStats obtiene estadísticas de un cliente
func GetClientStats(userUUID string) (models.ClientStats, error) {
	fmt.Printf("GetClientStats -> UserUUID: %s\n", userUUID)

	var stats models.ClientStats

	err := DbConnect()
	if err != nil {
		return stats, err
	}
	defer Db.Close()

	// Total de guías del cliente
	totalQuery := `
		SELECT COUNT(DISTINCT sg.guide_id)
		FROM shipping_guides sg
		LEFT JOIN guide_parties sender ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'
		LEFT JOIN guide_parties receiver ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'
		WHERE (
			sg.created_by = ? OR
			sender.document_number IN (
				SELECT number_document FROM users WHERE user_uuid = ?
			) OR
			receiver.document_number IN (
				SELECT number_document FROM users WHERE user_uuid = ?
			)
		)
	`

	err = Db.QueryRow(totalQuery, userUUID, userUUID, userUUID).Scan(&stats.TotalGuides)
	if err != nil {
		return stats, err
	}

	// Guías activas (no entregadas)
	activeQuery := `
		SELECT COUNT(DISTINCT sg.guide_id)
		FROM shipping_guides sg
		LEFT JOIN guide_parties sender ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'
		LEFT JOIN guide_parties receiver ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'
		WHERE (
			sg.created_by = ? OR
			sender.document_number IN (
				SELECT number_document FROM users WHERE user_uuid = ?
			) OR
			receiver.document_number IN (
				SELECT number_document FROM users WHERE user_uuid = ?
			)
		)
		AND sg.current_status != 'DELIVERED'
	`

	err = Db.QueryRow(activeQuery, userUUID, userUUID, userUUID).Scan(&stats.ActiveGuides)
	if err != nil {
		return stats, err
	}

	// Guías entregadas
	deliveredQuery := `
		SELECT COUNT(DISTINCT sg.guide_id)
		FROM shipping_guides sg
		LEFT JOIN guide_parties sender ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'
		LEFT JOIN guide_parties receiver ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'
		WHERE (
			sg.created_by = ? OR
			sender.document_number IN (
				SELECT number_document FROM users WHERE user_uuid = ?
			) OR
			receiver.document_number IN (
				SELECT number_document FROM users WHERE user_uuid = ?
			)
		)
		AND sg.current_status = 'DELIVERED'
	`

	err = Db.QueryRow(deliveredQuery, userUUID, userUUID, userUUID).Scan(&stats.DeliveredGuides)
	if err != nil {
		return stats, err
	}

	// Total gastado (solo como creador)
	spentQuery := `
		SELECT COALESCE(SUM(price), 0)
		FROM shipping_guides
		WHERE created_by = ?
	`

	err = Db.QueryRow(spentQuery, userUUID).Scan(&stats.TotalSpent)
	if err != nil {
		return stats, err
	}

	return stats, nil
}

// ==========================================
// SECURITY VALIDATION
// ==========================================

// ValidateGuideAccess valida si un usuario tiene acceso a una guía
func ValidateGuideAccess(guideID int64, userUUID string) (bool, error) {
	fmt.Printf("ValidateGuideAccess -> GuideID: %d, UserUUID: %s \n", guideID, userUUID)

	err := DbConnect()
	if err != nil {
		return false, err
	}
	defer Db.Close()

	// El usuario puede ver la guía si:
	// 1. Es el creador
	// 2. Su document_number coincide con el del remitente
	// 3. Su document_number coincide con el del destinatario
	query := `
		SELECT COUNT(*) 
		FROM shipping_guides sg
		LEFT JOIN guide_parties sender ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'
		LEFT JOIN guide_parties receiver ON sg.guide_id = receiver.guide_id AND receiver.party_role = 'RECEIVER'
		WHERE sg.guide_id = ?
		AND (
			sg.created_by = ? OR
			sender.document_number IN (
				SELECT number_document FROM users WHERE user_uuid = ?
			) OR
			receiver.document_number IN (
				SELECT number_document FROM users WHERE user_uuid = ?
			)
		)
	`

	var count int
	err = Db.QueryRow(query, guideID, userUUID, userUUID, userUUID).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}
