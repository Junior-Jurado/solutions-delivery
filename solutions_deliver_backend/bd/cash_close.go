// bd/cash_close.go
package bd

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// Zona horaria de Colombia (UTC-5)
var colombiaLoc *time.Location

func init() {
	var err error
	colombiaLoc, err = time.LoadLocation("America/Bogota")
	if err != nil {
		// Fallback: crear zona horaria fija UTC-5
		colombiaLoc = time.FixedZone("COT", -5*60*60)
	}
}

// CreateCashClose creates a new cash close
func CreateCashClose(close *models.CashClose) (int64, error) {
	fmt.Println("CreateCashClose")

	err := DbConnect()
	if err != nil {
		return 0, err
	}
	defer Db.Close()

	query := `
		INSERT INTO cash_closes (
			period_type, start_date, end_date,
			total_guides, total_amount,
			total_cash, total_cod, total_credit,
			total_freight, total_other, total_handling, total_discounts,
			total_units, total_weight,
			created_by
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	result, err := Db.Exec(
		query,
		close.PeriodType, close.StartDate, close.EndDate,
		close.TotalGuides, close.TotalAmount,
		close.TotalCash, close.TotalCOD, close.TotalCredit,
		close.TotalFreight, close.TotalOther, close.TotalHandling, close.TotalDiscounts,
		close.TotalUnits, close.TotalWeight,
		close.CreatedBy,
	)

	if err != nil {
		return 0, err
	}

	closeID, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return closeID, nil
}

// CreateCashCloseDetail creates a close detail
func CreateCashCloseDetail(detail *models.CashCloseDetail) error {
	fmt.Println("CreateCashCloseDetail")

	err := DbConnect()
	if err != nil {
		return err
	}
	defer Db.Close()

	query := `
		INSERT INTO cash_close_details (
			close_id, guide_id, date, sender, destination,
			units, weight,
			freight, other, handling, discount, total_value,
			payment_method
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`

	_, err = Db.Exec(
		query,
		detail.CloseID, detail.GuideID, detail.Date, detail.Sender, detail.Destination,
		detail.Units, detail.Weight,
		detail.Freight, detail.Other, detail.Handling, detail.Discount, detail.TotalValue,
		detail.PaymentMethod,
	)

	return err
}

// GetGuidesForCashClose gets guides for cash close
func GetGuidesForCashClose(startDate, endDate time.Time) ([]models.CashCloseDetail, error) {
	fmt.Printf("GetGuidesForCashClose -> StartDate: %s, EndDate: %s\n", startDate, endDate)

	var details []models.CashCloseDetail

	err := DbConnect()
	if err != nil {
		return details, err
	}
	defer Db.Close()

	query := `
		SELECT 
			sg.guide_id,
			DATE(sg.created_at) as date,
			sender.full_name as sender,
			dest_city.name as destination,
			COALESCE(p.pieces, 1) as units,
			COALESCE(p.weight_kg, 0) as weight,
			sg.price as freight,
			0 as other,
			0 as handling,
			0 as discount,
			sg.price as total_value,
			sg.payment_method
		FROM shipping_guides sg
		LEFT JOIN guide_parties sender ON sg.guide_id = sender.guide_id AND sender.party_role = 'SENDER'
		LEFT JOIN cities dest_city ON sg.destination_city_id = dest_city.id
		LEFT JOIN packages p ON sg.guide_id = p.guide_id
		WHERE DATE(sg.created_at) BETWEEN ? AND ?
		AND sg.current_status = 'DELIVERED'
		ORDER BY sg.created_at ASC
	`

	rows, err := Db.Query(query, startDate, endDate)
	if err != nil {
		return details, err
	}
	defer rows.Close()

	for rows.Next() {
		var detail models.CashCloseDetail
		var paymentMethod string

		err := rows.Scan(
			&detail.GuideID,
			&detail.Date,
			&detail.Sender,
			&detail.Destination,
			&detail.Units,
			&detail.Weight,
			&detail.Freight,
			&detail.Other,
			&detail.Handling,
			&detail.Discount,
			&detail.TotalValue,
			&paymentMethod,
		)
		if err != nil {
			return details, err
		}

		// Store payment method in uppercase for consistency
		detail.PaymentMethod = paymentMethod

		details = append(details, detail)
	}

	return details, nil
}

// UpdateCashClosePDF updates the PDF URL
func UpdateCashClosePDF(closeID int64, pdfURL, pdfS3Key string) error {
	fmt.Printf("UpdateCashClosePDF -> CloseID: %d\n", closeID)

	err := DbConnect()
	if err != nil {
		return err
	}
	defer Db.Close()

	query := `
		UPDATE cash_closes
		SET pdf_url = ?, pdf_s3_key = ?
		WHERE close_id = ?
	`

	_, err = Db.Exec(query, pdfURL, pdfS3Key, closeID)
	return err
}

// GetCashCloseByID gets a close by ID
func GetCashCloseByID(closeID int64) (models.CashClose, error) {
	fmt.Printf("GetCashCloseByID -> CloseID: %d\n", closeID)

	var close models.CashClose

	err := DbConnect()
	if err != nil {
		return close, err
	}
	defer Db.Close()

	query := `
		SELECT 
			close_id, period_type, start_date, end_date,
			total_guides, total_amount,
			total_cash, total_cod, total_credit,
			total_freight, total_other, total_handling, total_discounts,
			total_units, total_weight,
			COALESCE(pdf_url, '') as pdf_url,
			COALESCE(pdf_s3_key, '') as pdf_s3_key,
			created_by, created_at
		FROM cash_closes
		WHERE close_id = ?
	`

	row := Db.QueryRow(query, closeID)
	err = row.Scan(
		&close.CloseID, &close.PeriodType, &close.StartDate, &close.EndDate,
		&close.TotalGuides, &close.TotalAmount,
		&close.TotalCash, &close.TotalCOD, &close.TotalCredit,
		&close.TotalFreight, &close.TotalOther, &close.TotalHandling, &close.TotalDiscounts,
		&close.TotalUnits, &close.TotalWeight,
		&close.PDFURL, &close.PDFS3Key,
		&close.CreatedBy, &close.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return close, fmt.Errorf("cash close not found")
		}
		return close, err
	}

	return close, nil
}

// GetCashCloseDetails gets the details of a close
func GetCashCloseDetails(closeID int64) ([]models.CashCloseDetail, error) {
	fmt.Printf("GetCashCloseDetails -> CloseID: %d\n", closeID)

	var details []models.CashCloseDetail

	err := DbConnect()
	if err != nil {
		return details, err
	}
	defer Db.Close()

	query := `
		SELECT 
			detail_id, close_id, guide_id,
			date, sender, destination,
			units, weight,
			freight, other, handling, discount, total_value,
			payment_method
		FROM cash_close_details
		WHERE close_id = ?
		ORDER BY date ASC, guide_id ASC
	`

	rows, err := Db.Query(query, closeID)
	if err != nil {
		return details, err
	}
	defer rows.Close()

	for rows.Next() {
		var detail models.CashCloseDetail
		err := rows.Scan(
			&detail.DetailID, &detail.CloseID, &detail.GuideID,
			&detail.Date, &detail.Sender, &detail.Destination,
			&detail.Units, &detail.Weight,
			&detail.Freight, &detail.Other, &detail.Handling, &detail.Discount, &detail.TotalValue,
			&detail.PaymentMethod,
		)
		if err != nil {
			return details, err
		}
		details = append(details, detail)
	}

	return details, nil
}

// GetAllCashCloses gets all cash closes
func GetAllCashCloses(limit, offset int) ([]models.CashClose, int, error) {
	fmt.Printf("GetAllCashCloses -> Limit: %d, Offset: %d\n", limit, offset)

	var closes []models.CashClose
	var total int

	err := DbConnect()
	if err != nil {
		return closes, 0, err
	}
	defer Db.Close()

	// Get total
	countQuery := `SELECT COUNT(*) FROM cash_closes`
	err = Db.QueryRow(countQuery).Scan(&total)
	if err != nil {
		return closes, 0, err
	}

	// Get paginated data
	query := `
		SELECT 
			close_id, period_type, start_date, end_date,
			total_guides, total_amount,
			total_cash, total_cod, total_credit,
			total_freight, total_other, total_handling, total_discounts,
			total_units, total_weight,
			COALESCE(pdf_url, '') as pdf_url,
			COALESCE(pdf_s3_key, '') as pdf_s3_key,
			created_by, created_at
		FROM cash_closes
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`

	rows, err := Db.Query(query, limit, offset)
	if err != nil {
		return closes, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var close models.CashClose
		err := rows.Scan(
			&close.CloseID, &close.PeriodType, &close.StartDate, &close.EndDate,
			&close.TotalGuides, &close.TotalAmount,
			&close.TotalCash, &close.TotalCOD, &close.TotalCredit,
			&close.TotalFreight, &close.TotalOther, &close.TotalHandling, &close.TotalDiscounts,
			&close.TotalUnits, &close.TotalWeight,
			&close.PDFURL, &close.PDFS3Key,
			&close.CreatedBy, &close.CreatedAt,
		)
		if err != nil {
			return closes, 0, err
		}
		closes = append(closes, close)
	}

	return closes, total, nil
}

// GetCashCloseStats gets close statistics
func GetCashCloseStats() (models.CashCloseStatsResponse, error) {
	fmt.Println("Bd: GetCashCloseStats")

	var stats models.CashCloseStatsResponse
	stats.ByPaymentMethod = make(map[string]float64)

	err := DbConnect()
	if err != nil {
		return stats, err
	}
	defer Db.Close()

	// Usar zona horaria de Colombia
	now := time.Now().In(colombiaLoc)
	today := now.Format("2006-01-02")
	monthStart := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, colombiaLoc).Format("2006-01-02")
	yearStart := time.Date(now.Year(), 1, 1, 0, 0, 0, 0, colombiaLoc).Format("2006-01-02")

	// Week calculation
	weekday := int(now.Weekday())
	if weekday == 0 { // domingo
		weekday = 7
	}
	weekStart := time.Date(now.Year(), now.Month(), now.Day()-weekday+1, 0, 0, 0, 0, colombiaLoc).Format("2006-01-02")

	// ===================================
	// SUMAR DESDE LAS GUÍAS, NO LOS CIERRES
	// ===================================

	// Today's total - Sumar guías DELIVERED del día de hoy
	err = Db.QueryRow(`
		SELECT COALESCE(SUM(price), 0)
		FROM shipping_guides
		WHERE DATE(created_at) = ?
		AND current_status = 'DELIVERED'
	`, today).Scan(&stats.TodayTotal)

	if err != nil && err != sql.ErrNoRows {
		return stats, err
	}

	// Week's total - Sumar guías DELIVERED de esta semana
	err = Db.QueryRow(`
		SELECT COALESCE(SUM(price), 0)
		FROM shipping_guides
		WHERE DATE(created_at) >= ?
		AND current_status = 'DELIVERED'
	`, weekStart).Scan(&stats.WeekTotal)

	if err != nil && err != sql.ErrNoRows {
		return stats, err
	}

	// Month's total - Sumar guías DELIVERED de este mes
	err = Db.QueryRow(`
		SELECT COALESCE(SUM(price), 0)
		FROM shipping_guides
		WHERE DATE(created_at) >= ?
		AND current_status = 'DELIVERED'
	`, monthStart).Scan(&stats.MonthTotal)

	if err != nil && err != sql.ErrNoRows {
		return stats, err
	}

	// Year's total - Sumar guías DELIVERED de este año
	err = Db.QueryRow(`
		SELECT COALESCE(SUM(price), 0)
		FROM shipping_guides
		WHERE DATE(created_at) >= ?
		AND current_status = 'DELIVERED'
	`, yearStart).Scan(&stats.YearTotal)

	if err != nil && err != sql.ErrNoRows {
		return stats, err
	}

	// By payment method (current month) - Sumar por método de pago
	rows, err := Db.Query(`
		SELECT 
			payment_method,
			COALESCE(SUM(price), 0) as total
		FROM shipping_guides
		WHERE DATE(created_at) >= ?
		AND current_status = 'DELIVERED'
		GROUP BY payment_method
	`, monthStart)

	if err != nil && err != sql.ErrNoRows {
		return stats, err
	}

	if rows != nil {
		defer rows.Close()
		for rows.Next() {
			var method string
			var total float64
			if err := rows.Scan(&method, &total); err == nil {
				stats.ByPaymentMethod[method] = total
			}
		}
	}

	return stats, nil
}
