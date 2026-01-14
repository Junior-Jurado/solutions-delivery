package models

import "time"

// ==========================================
// CLIENT PROFILE
// ==========================================

// ClientProfile representa el perfil de un cliente
type ClientProfile struct {
	UserUUID       string    `json:"user_id"`
	FullName       string    `json:"full_name"`
	Email          string    `json:"email"`
	Phone          string    `json:"phone"`
	DocumentType   string    `json:"document_type"`
	DocumentNumber string    `json:"document_number"`
	CreatedAt      time.Time `json:"created_at"`
}

// ClientProfileUpdate datos que se pueden actualizar del perfil
type ClientProfileUpdate struct {
	FullName       string `json:"full_name,omitempty"`
	Phone          string `json:"phone,omitempty"`
	DocumentType   string `json:"document_type,omitempty"`
	DocumentNumber string `json:"document_number,omitempty"`
}

// ==========================================
// CLIENT GUIDES
// ==========================================

// ClientGuideFilters filtros para búsqueda de guías del cliente
type ClientGuideFilters struct {
	UserUUID   string       `json:"user_uuid"`
	Status     *GuideStatus `json:"status,omitempty"`
	DateFrom   *time.Time   `json:"date_from,omitempty"`
	DateTo     *time.Time   `json:"date_to,omitempty"`
	SearchTerm string       `json:"search_term,omitempty"`
	Limit      int          `json:"limit"`
	Offset     int          `json:"offset"`
}

// ClientGuidesResponse respuesta para guías del cliente
type ClientGuidesResponse struct {
	Guides []ShippingGuide `json:"guides"`
}

// ClientTrackGuideResponse respuesta para rastrear guía
type ClientTrackGuideResponse struct {
	Guide ShippingGuide `json:"guide"`
}

// ==========================================
// CLIENT STATS
// ==========================================

// ClientStats estadísticas del cliente
type ClientStats struct {
	TotalGuides     int     `json:"total_guides"`
	ActiveGuides    int     `json:"active_guides"`
	DeliveredGuides int     `json:"delivered_guides"`
	TotalSpent      float64 `json:"total_spent"`
}