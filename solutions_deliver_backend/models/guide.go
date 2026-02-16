// models/shipping_guide.go
package models

import "time"

// PaymentMethod tipos de pago
type PaymentMethod string

const (
	PaymentCash   PaymentMethod = "CASH"
	PaymentCOD    PaymentMethod = "COD"
	PaymentCredit PaymentMethod = "CREDIT"
)

// ServiceType tipos de servicio
type ServiceType string

const (
	ServiceNormal   ServiceType = "NORMAL"
	ServicePriority ServiceType = "PRIORITY"
	ServiceExpress  ServiceType = "EXPRESS"
)

// GuideStatus estados de la guía
type GuideStatus string

const (
	StatusCreated        GuideStatus = "CREATED"
	StatusInRoute        GuideStatus = "IN_ROUTE"
	StatusInWarehouse    GuideStatus = "IN_WAREHOUSE"
	StatusOutForDelivery GuideStatus = "OUT_FOR_DELIVERY"
	StatusDelivered      GuideStatus = "DELIVERED"
)

// PartyRole roles de las partes
type PartyRole string

const (
	RoleSender   PartyRole = "SENDER"
	RoleReceiver PartyRole = "RECEIVER"
)

// ShippingGuide representa una guía de envío completa
type ShippingGuide struct {
	GuideID             int64         `json:"guide_id"`
	ServiceType         ServiceType   `json:"service_type"`
	PaymentMethod       PaymentMethod `json:"payment_method"`
	DeclaredValue       float64       `json:"declared_value"`
	Price               float64       `json:"price"`
	CurrentStatus       GuideStatus   `json:"current_status"`
	OriginCityID        int64         `json:"origin_city_id"`
	OriginCityName      string        `json:"origin_city_name,omitempty"`
	DestinationCityID   int64         `json:"destination_city_id"`
	DestinationCityName string        `json:"destination_city_name,omitempty"`
	PDFUrl              string        `json:"pdf_url,omitempty"`
	PDFS3Key            string        `json:"pdf_s3_key,omitempty"`
	CreatedBy           string        `json:"created_by"`
	CreatedAt           time.Time     `json:"created_at"`
	UpdatedAt           time.Time     `json:"updated_at"`

	// Relaciones
	Sender   *GuideParty     `json:"sender,omitempty"`
	Receiver *GuideParty     `json:"receiver,omitempty"`
	Package  *Package        `json:"package,omitempty"`
	History  []StatusHistory `json:"history,omitempty"`
}

// GuideParty representa una parte (remitente o destinatario)
type GuideParty struct {
	PartyID        int64     `json:"party_id"`
	GuideID        int64     `json:"guide_id"`
	PartyRole      PartyRole `json:"party_role"`
	FullName       string    `json:"full_name"`
	DocumentType   string    `json:"document_type"`
	DocumentNumber string    `json:"document_number"`
	Phone          string    `json:"phone"`
	Email          string    `json:"email"`
	Address        string    `json:"address"`
	CityID         int64     `json:"city_id"`
	CityName       string    `json:"city_name,omitempty"`
}

// Package representa un paquete
type Package struct {
	PackageID    int64   `json:"package_id"`
	GuideID      int64   `json:"guide_id"`
	WeightKg     float64 `json:"weight_kg"`
	Pieces       int     `json:"pieces"`
	LengthCM     float64 `json:"length_cm"`
	WidthCM      float64 `json:"width_cm"`
	HeightCM     float64 `json:"height_cm"`
	Insured      bool    `json:"insured"`
	Description  string  `json:"description"`
	SpecialNotes string  `json:"special_notes"`
}

// StatusHistory representa el historial de estados
type StatusHistory struct {
	HistoryID int64       `json:"history_id"`
	GuideID   int64       `json:"guide_id"`
	Status    GuideStatus `json:"status"`
	UpdatedBy string      `json:"updated_by"`
	UpdatedAt time.Time   `json:"updated_at"`
}

// GuideFilters filtros para búsqueda de guías
type GuideFilters struct {
	Status            GuideStatus `json:"status,omitempty"`
	OriginCityID      *int64      `json:"origin_city_id,omitempty"`
	DestinationCityID *int64      `json:"destination_city_id,omitempty"`
	DateFrom          *time.Time  `json:"date_from,omitempty"`
	DateTo            *time.Time  `json:"date_to,omitempty"`
	CreatedBy         string      `json:"created_by,omitempty"`
	SearchTerm        string      `json:"search_term,omitempty"`
	Limit             int         `json:"limit"`
	Offset            int         `json:"offset"`
}

// GuidesListResponse respuesta para lista de guías
type GuidesListResponse struct {
	Guides []ShippingGuide `json:"guides"`
	Total  int             `json:"total"`
	Limit  int             `json:"limit"`
	Offset int             `json:"offset"`
}

// GuidesDetailResponse respuesta para una guía específica
type GuidesDetailResponse struct {
	Guide ShippingGuide `json:"guide"`
}

// GuideStatsResponse estadísticas de guías
type GuideStatsResponse struct {
	TotalToday     int            `json:"total_today"`
	TotalProcessed int            `json:"total_processed"`
	TotalPending   int            `json:"total_pending"`
	ByStatus       map[string]int `json:"by_status"`
}

// CreateGuideRequest petición para crear una guía
type CreateGuideRequest struct {
	CreatedBy string      `json:"created_by"`
	Service   ServiceInfo `json:"service"`
	Pricing   PricingInfo `json:"pricing"`
	Route     RouteInfo   `json:"route"`
	Sender    PartyInfo   `json:"sender"`
	Receiver  PartyInfo   `json:"receiver"`
	Package   PackageInfo `json:"package"`
}

type ServiceInfo struct {
	ServiceType   string `json:"service_type"`
	PaymentMethod string `json:"payment_method"`
	ShippingType  string `json:"shipping_type"`
}

type PricingInfo struct {
	DeclaredValue  float64 `json:"declared_value"`
	Price          float64 `json:"price"`
	OverrideReason string  `json:"override_reason,omitempty"`
}

type RouteInfo struct {
	OriginCityID      int `json:"origin_city_id"`
	DestinationCityID int `json:"destination_city_id"`
}

type PartyInfo struct {
	FullName       string `json:"full_name"`
	DocumentType   string `json:"document_type"`
	DocumentNumber string `json:"document_number"`
	Phone          string `json:"phone"`
	Email          string `json:"email"`
	Address        string `json:"address"`
	CityID         int    `json:"city_id"`
	CityName       string `json:"city_name"`
}

type PackageInfo struct {
	WeightKg     float64 `json:"weight_kg"`
	Pieces       int     `json:"pieces"`
	LengthCm     float64 `json:"length_cm"`
	WidthCm      float64 `json:"width_cm"`
	HeightCm     float64 `json:"height_cm"`
	Insured      bool    `json:"insured"`
	Description  string  `json:"description"`
	SpecialNotes string  `json:"special_notes"`
}

// CreateGuideResponse respuesta de creación de guía
type CreateGuideResponse struct {
	GuideID     int64  `json:"guide_id"`
	GuideNumber string `json:"guide_number"`
	PDFURL      string `json:"pdf_url"`
	S3Key       string `json:"s3_key"`
	PDFSize     int    `json:"pdf_size"`
	Message     string `json:"message"`
}

// UpdateStatusRequest petición para actualizar estado
type UpdateStatusRequest struct {
	Status GuideStatus `json:"status"`
}

// UpdateStatusResponse respuesta de actualización de estado
type UpdateStatusResponse struct {
	Success   bool        `json:"success"`
	GuideID   int64       `json:"guide_id"`
	NewStatus GuideStatus `json:"new_status"`
	Message   string      `json:"message"`
}
