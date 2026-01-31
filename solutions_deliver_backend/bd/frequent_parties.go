package bd

import (
	"database/sql"
	"fmt"
	"strings"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// SearchFrequentPartiesByNameAndCity busca partes frecuentes por nombre y ciudad
// Retorna TODAS las direcciones de ese cliente en esa ciudad
func SearchFrequentPartiesByNameAndCity(searchTerm string, cityID int64, partyType models.PartyType) ([]models.FrequentParty, int, error) {
	fmt.Printf("SearchFrequentPartiesByNameAndCity -> Term: %s, City: %d, Type: %s\n", searchTerm, cityID, partyType)

	var parties []models.FrequentParty
	var total int

	err := DbConnect()
	if err != nil {
		return parties, 0, err
	}
	defer Db.Close()

	searchPattern := "%" + searchTerm + "%"

	// Construcción dinámica de WHERE
	var conditions []string
	var args []interface{}

	// Búsqueda por nombre
	conditions = append(conditions, "(full_name LIKE ? OR document_number LIKE ?)")
	args = append(args, searchPattern, searchPattern)

	// Filtrar por ciudad si se proporciona
	if cityID > 0 {
		conditions = append(conditions, "city_id = ?")
		args = append(args, cityID)
	}

	// Filtrar por tipo de parte si se proporciona
	if partyType != "" {
		conditions = append(conditions, "party_type = ?")
		args = append(args, partyType)
	}

	whereClause := "WHERE " + strings.Join(conditions, " AND ")

	// Contar total
	countQuery := fmt.Sprintf(`
		SELECT COUNT(*)
		FROM frequent_parties
		%s
	`, whereClause)

	err = Db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return parties, 0, err
	}

	// Obtener registros ordenados por uso
	query := fmt.Sprintf(`
		SELECT 
			fp.id,
			fp.party_type,
			fp.full_name,
			fp.document_type,
			fp.document_number,
			fp.phone,
			fp.email,
			fp.city_id,
			c.name AS city_name,
			fp.address,
			fp.first_used_at,
			fp.last_used_at,
			fp.usage_count,
			fp.user_uuid
		FROM frequent_parties fp
		LEFT JOIN cities c ON fp.city_id = c.id
		%s
		ORDER BY fp.usage_count DESC, fp.last_used_at DESC
		LIMIT 50
	`, whereClause)

	rows, err := Db.Query(query, args...)
	if err != nil {
		return parties, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var party models.FrequentParty
		var email, userUUID sql.NullString

		err := rows.Scan(
			&party.ID,
			&party.PartyType,
			&party.FullName,
			&party.DocumentType,
			&party.DocumentNumber,
			&party.Phone,
			&email,
			&party.CityID,
			&party.CityName,
			&party.Address,
			&party.FirstUsedAt,
			&party.LastUsedAt,
			&party.UsageCount,
			&userUUID,
		)

		if err != nil {
			return parties, 0, err
		}

		if email.Valid {
			party.Email = email.String
		}
		if userUUID.Valid {
			party.UserUUID = userUUID.String
		}

		parties = append(parties, party)
	}

	return parties, total, nil
}

// SearchFrequentPartiesByNameOnly busca solo por nombre (para autocompletado inicial)
// Retorna un registro por cada cliente único (sin importar ciudad)
func SearchFrequentPartiesByNameOnly(searchTerm string, partyType models.PartyType) ([]models.FrequentPartyUnique, int, error) {
	fmt.Printf("SearchFrequentPartiesByNameOnly -> Term: %s, Type: %s\n", searchTerm, partyType)

	var parties []models.FrequentPartyUnique
	var total int

	err := DbConnect()
	if err != nil {
		return parties, 0, err
	}
	defer Db.Close()

	searchPattern := "%" + searchTerm + "%"

	// Construcción dinámica de WHERE
	whereClause := "WHERE (full_name LIKE ? OR document_number LIKE ?)"
	args := []interface{}{searchPattern, searchPattern}

	if partyType != "" {
		whereClause += " AND party_type = ?"
		args = append(args, partyType)
	}

	// Contar total de clientes únicos
	countQuery := fmt.Sprintf(`
		SELECT COUNT(DISTINCT document_number)
		FROM frequent_parties
		%s
	`, whereClause)

	err = Db.QueryRow(countQuery, args...).Scan(&total)
	if err != nil {
		return parties, 0, err
	}

	// Obtener clientes únicos con su información más reciente
	query := fmt.Sprintf(`
		SELECT 
			fp.full_name,
			fp.document_type,
			fp.document_number,
			fp.phone,
			fp.email,
			COUNT(DISTINCT fp.city_id) as total_cities,
			SUM(fp.usage_count) as total_usage
		FROM frequent_parties fp
		%s
		GROUP BY fp.document_number, fp.full_name, fp.document_type, fp.phone, fp.email
		ORDER BY total_usage DESC, fp.full_name ASC
		LIMIT 20
	`, whereClause)

	rows, err := Db.Query(query, args...)
	if err != nil {
		return parties, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var party models.FrequentPartyUnique
		var email sql.NullString

		err := rows.Scan(
			&party.FullName,
			&party.DocumentType,
			&party.DocumentNumber,
			&party.Phone,
			&email,
			&party.TotalCities,
			&party.TotalUsage,
		)

		if err != nil {
			return parties, 0, err
		}

		if email.Valid {
			party.Email = email.String
		}

		parties = append(parties, party)
	}

	return parties, total, nil
}

// GetFrequentPartiesByDocument obtiene las partes frecuentes por documento y ciudad
func GetFrequentPartiesByDocument(documentNumber string, cityID int64, partyType models.PartyType) ([]models.FrequentParty, int, error) {
	fmt.Printf("GetFrequentPartiesByDocument -> Doc: %s, City: %d, Type: %s\n", documentNumber, cityID, partyType)

	var parties []models.FrequentParty
	var total int

	err := DbConnect()
	if err != nil {
		return parties, 0, err
	}
	defer Db.Close()

	// Contar total
	countQuery := `
		SELECT COUNT(*)
		FROM frequent_parties fp
		WHERE fp.document_number = ?
		AND fp.city_id = ?
	`

	countArgs := []interface{}{documentNumber, cityID}

	// Si se especifica tipo de parte, filtrar por eso también
	if partyType != "" {
		countQuery += " AND fp.party_type = ?"
		countArgs = append(countArgs, partyType)
	}

	err = Db.QueryRow(countQuery, countArgs...).Scan(&total)
	if err != nil {
		return parties, 0, err
	}

	// Si no hay resultados, retornar vacío
	if total == 0 {
		return parties, 0, nil
	}

	// Obtener partes frecuentes
	query := `
		SELECT 
			fp.id,
			fp.party_type,
			fp.full_name,
			fp.document_type,
			fp.document_number,
			fp.phone,
			fp.email,
			fp.city_id,
			c.name AS city_name,
			fp.address,
			fp.first_used_at,
			fp.last_used_at,
			fp.usage_count,
			fp.user_uuid
		FROM frequent_parties fp
		LEFT JOIN cities c ON fp.city_id = c.id
		WHERE fp.document_number = ?
		AND fp.city_id = ?
	`

	queryArgs := []interface{}{documentNumber, cityID}

	if partyType != "" {
		query += " AND fp.party_type = ?"
		queryArgs = append(queryArgs, partyType)
	}

	query += " ORDER BY fp.usage_count DESC, fp.last_used_at DESC"

	rows, err := Db.Query(query, queryArgs...)
	if err != nil {
		return parties, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var party models.FrequentParty
		var email, userUUID sql.NullString

		err := rows.Scan(
			&party.ID,
			&party.PartyType,
			&party.FullName,
			&party.DocumentType,
			&party.DocumentNumber,
			&party.Phone,
			&email,
			&party.CityID,
			&party.CityName,
			&party.Address,
			&party.FirstUsedAt,
			&party.LastUsedAt,
			&party.UsageCount,
			&userUUID,
		)

		if err != nil {
			return parties, 0, err
		}

		if email.Valid {
			party.Email = email.String
		}
		if userUUID.Valid {
			party.UserUUID = userUUID.String
		}

		parties = append(parties, party)
	}

	return parties, total, nil
}

// UpsertFrequentParty inserta o actualiza una parte frecuente
// Si la combinación documento+ciudad+dirección existe, incrementa usage_count
// Si no existe, crea un nuevo registro
func UpsertFrequentParty(req models.CreateFrequentPartyRequest) error {
	fmt.Printf("UpsertFrequentParty -> Doc: %s, City: %d, Address: %s\n",
		req.DocumentNumber, req.CityID, req.Address)

	err := DbConnect()
	if err != nil {
		return err
	}
	defer Db.Close()

	// Verificar si ya existe la combinación documento + ciudad + dirección
	checkQuery := `
		SELECT id, usage_count
		FROM frequent_parties
		WHERE document_number = ?
		AND city_id = ?
		AND address = ?
		LIMIT 1
	`

	var existingID int64
	var usageCount int
	err = Db.QueryRow(checkQuery, req.DocumentNumber, req.CityID, req.Address).Scan(&existingID, &usageCount)

	if err == sql.ErrNoRows {
		// NO EXISTE - Insertar nuevo registro
		insertQuery := `
			INSERT INTO frequent_parties (
				party_type,
				full_name,
				document_type,
				document_number,
				phone,
				email,
				city_id,
				address,
				user_uuid,
				usage_count
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
		`

		var userUUID interface{}
		if req.UserUUID != "" {
			userUUID = req.UserUUID
		} else {
			userUUID = nil
		}

		var email interface{}
		if req.Email != "" {
			email = req.Email
		} else {
			email = nil
		}

		_, err = Db.Exec(
			insertQuery,
			req.PartyType,
			req.FullName,
			req.DocumentType,
			req.DocumentNumber,
			req.Phone,
			email,
			req.CityID,
			req.Address,
			userUUID,
		)

		if err != nil {
			return fmt.Errorf("error al insertar parte frecuente: %v", err)
		}

		fmt.Printf("✓ Nueva parte frecuente creada\n")
		return nil

	} else if err != nil {
		return fmt.Errorf("error al verificar existencia: %v", err)
	}

	// SÍ EXISTE - Actualizar usage_count y last_used_at
	updateQuery := `
		UPDATE frequent_parties
		SET 
			full_name = ?,
			phone = ?,
			email = ?,
			usage_count = usage_count + 1,
			last_used_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`

	var email interface{}
	if req.Email != "" {
		email = req.Email
	} else {
		email = nil
	}

	_, err = Db.Exec(updateQuery, req.FullName, req.Phone, email, existingID)
	if err != nil {
		return fmt.Errorf("error al actualizar parte frecuente: %v", err)
	}

	fmt.Printf("✓ Parte frecuente actualizada (uso #%d)\n", usageCount+1)
	return nil
}

// GetFrequentPartyStats obtiene estadísticas de partes frecuentes
func GetFrequentPartyStats() (map[string]interface{}, error) {
	fmt.Println("GetFrequentPartyStats")

	stats := make(map[string]interface{})

	err := DbConnect()
	if err != nil {
		return stats, err
	}
	defer Db.Close()

	// Total de partes únicas
	var totalUnique int
	err = Db.QueryRow(`
		SELECT COUNT(DISTINCT document_number)
		FROM frequent_parties
	`).Scan(&totalUnique)
	if err != nil {
		return stats, err
	}
	stats["total_unique_parties"] = totalUnique

	// Total de registros
	var totalRecords int
	err = Db.QueryRow(`
		SELECT COUNT(*)
		FROM frequent_parties
	`).Scan(&totalRecords)
	if err != nil {
		return stats, err
	}
	stats["total_records"] = totalRecords

	// Top 5 más usados
	type TopParty struct {
		FullName   string `json:"full_name"`
		UsageCount int    `json:"usage_count"`
	}

	topQuery := `
		SELECT full_name, SUM(usage_count) as total_usage
		FROM frequent_parties
		GROUP BY document_number, full_name
		ORDER BY total_usage DESC
		LIMIT 5
	`

	rows, err := Db.Query(topQuery)
	if err != nil {
		return stats, err
	}
	defer rows.Close()

	var topParties []TopParty
	for rows.Next() {
		var tp TopParty
		err := rows.Scan(&tp.FullName, &tp.UsageCount)
		if err == nil {
			topParties = append(topParties, tp)
		}
	}
	stats["top_5_most_used"] = topParties

	return stats, nil
}
