// routers/cash_close.go
package routers

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/bd"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/utils"
	"github.com/aws/aws-lambda-go/events"
)

// GenerateCashClose generates a cash close
func GenerateCashClose(body string, userUUID string) (int, string) {
	fmt.Println("GenerateCashClose")

	var request models.CashCloseRequest
	err := json.Unmarshal([]byte(body), &request)
	if err != nil {
		return 400, fmt.Sprintf(`{"error": "Error parsing request: %s"}`, err.Error())
	}

	// Validate period
	if request.PeriodType != "DAILY" && request.PeriodType != "WEEKLY" && request.PeriodType != "MONTHLY" && request.PeriodType != "YEARLY" {
		return 400, `{"error": "Invalid period type. Must be DAILY, WEEKLY, MONTHLY or YEARLY"}`
	}

	// Calculate dates
	var startDate, endDate time.Time
	switch request.PeriodType {
	case "DAILY":
		if request.Year == 0 || request.Month == 0 || request.Day == 0 {
			return 400, `{"error": "For DAILY, year, month and day are required"}`
		}
		startDate = time.Date(request.Year, time.Month(request.Month), request.Day, 0, 0, 0, 0, time.UTC)
		endDate = startDate.AddDate(0, 0, 1).Add(-time.Second)
	
	case "WEEKLY":
		if request.Year == 0 || request.Week == 0 {
			return 400, `{"error": "For WEEKLY, year and week are required"}`
		}
		// Calcular el inicio de la semana
		startDate = getStartOfWeek(request.Year, request.Week)
		endDate = startDate.AddDate(0, 0, 7).Add(-time.Second)
		
	case "MONTHLY":
		if request.Year == 0 || request.Month == 0 {
			return 400, `{"error": "For MONTHLY, year and month are required"}`
		}
		startDate = time.Date(request.Year, time.Month(request.Month), 1, 0, 0, 0, 0, time.UTC)
		endDate = startDate.AddDate(0, 1, 0).Add(-time.Second)
		
	case "YEARLY":
		if request.Year == 0 {
			return 400, `{"error": "For YEARLY, year is required"}`
		}
		startDate = time.Date(request.Year, 1, 1, 0, 0, 0, 0, time.UTC)
		endDate = startDate.AddDate(1, 0, 0).Add(-time.Second)
	}

	// Get guides for the period
	details, err := bd.GetGuidesForCashClose(startDate, endDate)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error getting guides: %s"}`, err.Error())
	}

	if len(details) == 0 {
		return 404, `{"error": "No guides found for the selected period"}`
	}

	// Calculate totals
	close := models.CashClose{
		PeriodType: request.PeriodType,
		StartDate:  startDate,
		EndDate:    endDate,
		CreatedBy:  userUUID,
	}

	for _, detail := range details {
		close.TotalGuides++
		close.TotalAmount += detail.TotalValue
		close.TotalUnits += detail.Units
		close.TotalWeight += detail.Weight
		close.TotalFreight += detail.Freight
		close.TotalOther += detail.Other
		close.TotalHandling += detail.Handling
		close.TotalDiscounts += detail.Discount

		switch detail.PaymentMethod {
		case "CASH":
			close.TotalCash += detail.TotalValue
		case "COD":
			close.TotalCOD += detail.TotalValue
		case "CREDIT":
			close.TotalCredit += detail.TotalValue
		}
	}

	// Create close in DB
	closeID, err := bd.CreateCashClose(&close)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error creating close: %s"}`, err.Error())
	}

	// Save details
	for i := range details {
		details[i].CloseID = closeID
		err = bd.CreateCashCloseDetail(&details[i])
		if err != nil {
			return 500, fmt.Sprintf(`{"error": "Error saving details: %s"}`, err.Error())
		}
	}

	close.CloseID = closeID

	// ===================================
	// GENERAR PDF CON LAMBDA DE NODE.JS
	// ===================================
	pdfURL, pdfS3Key, err := utils.GenerateCashClosePDFWithLambda(close, details)
	if err != nil {
		fmt.Printf("Error generando PDF con Lambda: %s\n", err.Error())
		// Continuar sin PDF, no es error crítico
	} else {
		// Actualizar BD con URL del PDF
		err = bd.UpdateCashClosePDF(closeID, pdfURL, pdfS3Key)
		if err != nil {
			fmt.Printf("Error actualizando PDF en BD: %s\n", err.Error())
		} else {
			close.PDFURL = pdfURL
			close.PDFS3Key = pdfS3Key
		}
	}

	response := models.CashCloseResponse{
		Close:   close,
		Details: details,
		PDFURL:  close.PDFURL,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error serializing response: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// getStartOfWeek calcula el inicio de una semana específica del año
// Semana 1 = Primera semana con al menos 4 días en el año (ISO 8601)
func getStartOfWeek(year, week int) time.Time {
	// Primer día del año
	jan1 := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
	
	// Calcular el lunes de la primera semana
	// Si el 1 de enero es lunes a jueves, está en la semana 1
	// Si es viernes a domingo, la semana 1 empieza el siguiente lunes
	weekday := int(jan1.Weekday())
	if weekday == 0 { // Domingo
		weekday = 7
	}
	
	var firstMonday time.Time
	if weekday <= 4 { // Lunes a Jueves
		// Retroceder al lunes anterior o el mismo día si es lunes
		firstMonday = jan1.AddDate(0, 0, -(weekday - 1))
	} else { // Viernes a Domingo
		// Avanzar al siguiente lunes
		firstMonday = jan1.AddDate(0, 0, 8-weekday)
	}
	
	// Calcular el lunes de la semana solicitada
	startOfWeek := firstMonday.AddDate(0, 0, (week-1)*7)
	
	return startOfWeek
}

// GetCashClosePDFURL gets the presigned URL for the PDF
func GetCashClosePDFURL(closeID int64) (int, string) {
	fmt.Printf("GetCashClosePDFURL -> CloseID: %d\n", closeID)

	close, err := bd.GetCashCloseByID(closeID)
	if err != nil {
		if err.Error() == "cash close not found" {
			return 404, `{"error": "Cash close not found"}`
		}
		return 500, fmt.Sprintf(`{"error": "Error getting close: %s"}`, err.Error())
	}

	if close.PDFS3Key == "" {
		return 404, `{"error": "PDF not available for this close"}`
	}

	// Generate new presigned URL (válida por 7 días)
	expirationMinutes := 7 * 24 * 60
	pdfURL, err := bd.GetPresignedURL(close.PDFS3Key, expirationMinutes)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error generating PDF URL: %s"}`, err.Error())
	}

	response := map[string]string{
		"pdf_url": pdfURL,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error serializing response: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetCashCloses gets list of closes
func GetCashCloses(request events.APIGatewayV2HTTPRequest) (int, string) {
	fmt.Println("GetCashCloses")

	limit := 20
	offset := 0

	if request.QueryStringParameters != nil {
		if l := request.QueryStringParameters["limit"]; l != "" {
			fmt.Sscanf(l, "%d", &limit)
		}
		if o := request.QueryStringParameters["offset"]; o != "" {
			fmt.Sscanf(o, "%d", &offset)
		}
	}

	closes, total, err := bd.GetAllCashCloses(limit, offset)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error getting closes: %s"}`, err.Error())
	}

	response := models.CashCloseListResponse{
		Closes: closes,
		Total:  total,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error serializing response: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetCashCloseByID gets a specific close with its details
func GetCashCloseByID(closeID int64) (int, string) {
	fmt.Printf("GetCashCloseByID -> CloseID: %d\n", closeID)

	close, err := bd.GetCashCloseByID(closeID)
	if err != nil {
		if err.Error() == "cash close not found" {
			return 404, `{"error": "Cash close not found"}`
		}
		return 500, fmt.Sprintf(`{"error": "Error getting close: %s"}`, err.Error())
	}

	details, err := bd.GetCashCloseDetails(closeID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error getting details: %s"}`, err.Error())
	}

	response := models.CashCloseResponse{
		Close:   close,
		Details: details,
		PDFURL:  close.PDFURL,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error serializing response: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetCashCloseStats gets statistics
func GetCashCloseStats() (int, string) {
	fmt.Println("GetCashCloseStats")

	stats, err := bd.GetCashCloseStats()
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error getting statistics: %s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(stats)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error serializing response: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}