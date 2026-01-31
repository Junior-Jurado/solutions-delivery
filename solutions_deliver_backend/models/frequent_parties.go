package models

import "time"

// PartyType tipos de parte
type PartyType string

const (
	PartySender   PartyType = "SENDER"
	PartyReceiver PartyType = "RECEIVER"
)

// FrequentParty representa una parte frecuente (remitente/destinatario)
type FrequentParty struct {
	ID             int64     `json:"id"`
	PartyType      PartyType `json:"party_type"`
	FullName       string    `json:"full_name"`
	DocumentType   string    `json:"document_type"`
	DocumentNumber string    `json:"document_number"`
	Phone          string    `json:"phone"`
	Email          string    `json:"email,omitempty"`
	CityID         int64     `json:"city_id"`
	CityName       string    `json:"city_name,omitempty"`
	Address        string    `json:"address"`
	FirstUsedAt    time.Time `json:"first_used_at"`
	LastUsedAt     time.Time `json:"last_used_at"`
	UsageCount     int       `json:"usage_count"`
	UserUUID       string    `json:"user_uuid,omitempty"`
}

// FrequentPartyUnique representa un cliente único (sin ciudad ni dirección específica)
// Usado para el autocompletado inicial por nombre
type FrequentPartyUnique struct {
	FullName       string `json:"full_name"`
	DocumentType   string `json:"document_type"`
	DocumentNumber string `json:"document_number"`
	Phone          string `json:"phone"`
	Email          string `json:"email,omitempty"`
	TotalCities    int    `json:"total_cities"` // Cuántas ciudades tiene registradas
	TotalUsage     int    `json:"total_usage"`  // Total de veces usado
}

// FrequentPartySearchRequest búsqueda de partes frecuentes
type FrequentPartySearchRequest struct {
	SearchTerm string    `json:"search_term"`
	CityID     int64     `json:"city_id,omitempty"`
	PartyType  PartyType `json:"party_type,omitempty"`
}

// FrequentPartySearchResponse respuesta de búsqueda
type FrequentPartySearchResponse struct {
	Parties []FrequentParty `json:"parties"`
	Total   int             `json:"total"`
}

// FrequentPartyUniqueResponse respuesta de búsqueda de clientes únicos
type FrequentPartyUniqueResponse struct {
	Parties []FrequentPartyUnique `json:"parties"`
	Total   int                   `json:"total"`
}

// CreateFrequentPartyRequest crear/actualizar parte frecuente
type CreateFrequentPartyRequest struct {
	PartyType      PartyType `json:"party_type"`
	FullName       string    `json:"full_name"`
	DocumentType   string    `json:"document_type"`
	DocumentNumber string    `json:"document_number"`
	Phone          string    `json:"phone"`
	Email          string    `json:"email"`
	CityID         int64     `json:"city_id"`
	Address        string    `json:"address"`
	UserUUID       string    `json:"user_uuid"`
}
