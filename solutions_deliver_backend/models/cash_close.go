package models

import "time"

// CashClose represents a cash close
type CashClose struct {
	CloseID    int64     `json:"close_id"`
	PeriodType string    `json:"period_type"` // DAILY, MONTHLY, YEARLY
	StartDate  time.Time `json:"start_date"`
	EndDate    time.Time `json:"end_date"`

	// Totals
	TotalGuides int     `json:"total_guides"`
	TotalAmount float64 `json:"total_amount"`

	// By payment method
	TotalCash   float64 `json:"total_cash"`
	TotalCOD    float64 `json:"total_cod"`
	TotalCredit float64 `json:"total_credit"`

	// Concepts
	TotalFreight   float64 `json:"total_freight"`
	TotalOther     float64 `json:"total_other"`
	TotalHandling  float64 `json:"total_handling"`
	TotalDiscounts float64 `json:"total_discounts"`

	// Physical
	TotalUnits  int     `json:"total_units"`
	TotalWeight float64 `json:"total_weight"`

	// PDF
	PDFURL   string `json:"pdf_url,omitempty"`
	PDFS3Key string `json:"pdf_s3_key,omitempty"`

	// Audit
	CreatedBy string    `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
}

// CashCloseDetail represents the detail of a guide in the close
type CashCloseDetail struct {
	DetailID int64 `json:"detail_id"`
	CloseID  int64 `json:"close_id"`
	GuideID  int64 `json:"guide_id"`

	Date        string `json:"date"`
	Sender      string `json:"sender"`
	Destination string `json:"destination"`

	Units  int     `json:"units"`
	Weight float64 `json:"weight"`

	Freight    float64 `json:"freight"`
	Other      float64 `json:"other"`
	Handling   float64 `json:"handling"`
	Discount   float64 `json:"discount"`
	TotalValue float64 `json:"total_value"`

	PaymentMethod string `json:"payment_method"`
}

// CashCloseRequest request to generate close
type CashCloseRequest struct {
	PeriodType string `json:"period_type"`
	Year       int    `json:"year"`
	Month      int    `json:"month"`
	Week       int    `json:"week"`
	Day        int    `json:"day"`
}

// CashCloseResponse response of generated close
type CashCloseResponse struct {
	Close   CashClose         `json:"close"`
	Details []CashCloseDetail `json:"details"`
	PDFURL  string            `json:"pdf_url,omitempty"`
}

// CashCloseListResponse list of closes
type CashCloseListResponse struct {
	Closes []CashClose `json:"closes"`
	Total  int         `json:"total"`
}

// CashCloseStatsResponse statistics for dashboard
type CashCloseStatsResponse struct {
	TodayTotal      float64            `json:"today_total"`
	WeekTotal       float64            `json:"week_total"`
	MonthTotal      float64            `json:"month_total"`
	YearTotal       float64            `json:"year_total"`
	ByPaymentMethod map[string]float64 `json:"by_payment_method"`
}
