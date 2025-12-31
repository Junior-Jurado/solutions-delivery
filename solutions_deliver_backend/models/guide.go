package models

import "time"

// GuideStatus estados posibles de una guía
type GuideStatus string

const (
	StatusCreated GuideStatus = "CREATED"
	StatusInRoute GuideStatus = "IN_ROUTE"
	StatusInWarehouse GuideStatus = "IN_WAREHOUSE"
	StatusOutForDelivery GuideStatus = "OUT_FOR_DELIVERY"
	StatusDelivered GuideStatus = "DELIVERED"
)

// ServiceType tipos de servicio
type ServiceType string

const (
	Normal ServiceType = "NORMAL"
	Express ServiceType = "PRIORITY"
)

// PaymentMethod métodos de pago
type PaymentMethod string

const (
	PaymentCash PaymentMethod = "CONTADO"
	PaymentOnDelivery PaymentMethod = "CONTRAENTREGA"
)

// PartyRole rol de una parte (remitente/destinatario)
type PartyRole string

const (
	RoleSender PartyRole = "SENDER"
	RoleReceiver PartyRole = "RECEIVER"
)

// ShippingGuide representa una guía de envío completa
type ShippingGuide struct {
	GuideID int64 `json:"guide_id"`
	ServiceType ServiceType `json:"service_type"`
	PaymentMethod PaymentMethod `json:"payment_method"`
	DeclaredValue float64 `json:"declared_value"`
	Price float64 `json:"price"`
	CurrentStatus GuideStatus `json:"current_status"`
	OriginCityID int64 `json:"origin_city_id"`
	OriginCityName string `json:"origin_city_name, omitempty"`
	DestinationCityID int64 `json:"destination_city_id"`
	DestinationCityName string `json:"destination_city_name, omitempty"`
	PDFUrl string `json:"pdf_url, omitempty"`
	PDFS3Key string `json:"pdf_s3_key, omitempty"`
	CreatedBy string `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	
	// Relaciones
	Sender *GuideParty `json:"sender, omitempty"`
	Receiver *GuideParty `json:"receiver, omitempty"`
	Package *Package `json:"package, omitempty"`
	History []StatusHistory `json:"history, omitempty"`
}

// GuideParty representa una parte (remitente o destinatario)
type GuideParty struct {
	PartyID int64 `json:"party_id"`
	GuideID int64 `json:"guide_id"`
	PartyRole PartyRole `json:"party_role"`
	FullName string `json:"full_name"`
	DocumentType string `json:"document_type"`
	DocumentNumber string `json:"document_number"`
	Phone string `json:"phone"`
	Email string `json:"email"`
	Address string `json:"address"`
	CityID int64 `json:"city_id"`
	CityName string `json:"city_name"`
}

// Package representa el paquete asociado a una guía
type Package struct {
	PackageID int64 `json:"package_id"`
	GuideID int64 `json:"guide_id"`
	WeightKg float64 `json:"weight_kg"`
	Pieces int `json:"pieces"`
	LengthCM float64 `json:"length_cm"`
	WidthCM float64 `json:"width_cm"`
	HeightCM float64 `json:"height_cm"`
	Insured bool `json:"insured"`
	Description string `json:"description"`
	SpecialNotes string `json:"special_notes"`
}

// StatusHistory representa el historial de estados
type StatusHistory struct {
	HistoryID int64 `json:"history_id"`
	GuideID int64 `json:"guide_id"`
	Status GuideStatus `json:"status"`
	UpdatedBy string `json:"updated_by"`
	CreatedAt time.Time `json:"created_at"`
}

// --------------------------
// Request / Response Models
// --------------------------

// UpdateStatusRequest solicitud para actualizar estado
type UpdateStatusRequest struct {
	Status GuideStatus `json:"status"`
	UpdatedBy string `json:"updated_by"`
}

// GuideFilters filtros para búsqueda de guías
type GuideFilters struct {
	Status GuideStatus `json:"status"`
	OriginCityID *int64 `json:"origin_city_id, omitempty"`
	DestinationCityID *int64 `json:"destination_city_id, omitempty"`
	CreatedBy string `json:"created_by, omitempty"`
	SearchTerm string `json:"search_term, omitempty"`
	DateFrom *time.Time `json:"date_from, omitempty"`
	DateTo *time.Time `json:"date_to, omitempty"`
	Limit int `json:"limit, omitempty"`
	Offset int `json:"offset, omitempty"`
}

// GuidesListResponse respuesta para lista de guías
type GuidesListResponse struct {
	Guides []ShippingGuide `json:"guides"`
	Total int `json:"total"`
	Limit int `json:"limit"`
	Offset int `json:"offset"`
}

// GuidesListResponse respuesta para lista de guías 
type GuidesDetailResponse struct {
	Guide ShippingGuide `json:"guide"`
}

// UpdateStatusResponse respuesta al actualizar estado
type UpdateStatusResponse struct {
	Success bool `json:"success"`
	GuideID int64 `json:"guide_id"`
	NewStatus GuideStatus `json:"new_status"`
	Message string `json:"message"`
}

// GuideStatsResponse estadísticas de guías
type GuideStatsResponse struct {
	TotalToday int `json:"total_today"`
	TotalProcessed int `json:"total_processed"`
	TotalPending int `json:"total_pending"`
	ByStatus map[string]int `json:"by_status"`
}