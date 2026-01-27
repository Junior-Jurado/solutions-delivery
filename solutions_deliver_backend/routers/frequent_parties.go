package routers

import (
	"encoding/json"
	"fmt"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/bd"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// SearchFrequentPartiesByNameOnly busca clientes únicos por nombre
// NO incluye ciudad - retorna un registro por cada cliente
// Usado para el autocompletado inicial cuando el usuario escribe el nombre
func SearchFrequentPartiesByNameOnly(searchTerm string, partyType models.PartyType) (int, string) {
	fmt.Printf("SearchFrequentPartiesByNameOnly -> Term: %s\n", searchTerm)

	// Validar término de búsqueda
	if len(searchTerm) < 2 {
		return 400, `{"error": "El término de búsqueda debe tener al menos 2 caracteres"}`
	}

	// Buscar clientes únicos
	parties, total, err := bd.SearchFrequentPartiesByNameOnly(searchTerm, partyType)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al buscar partes frecuentes: %s"}`, err.Error())
	}

	response := models.FrequentPartyUniqueResponse{
		Parties: parties,
		Total:   total,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// SearchFrequentPartiesByNameAndCity busca direcciones de un cliente en una ciudad
// Usado cuando el usuario ya seleccionó el cliente Y la ciudad
func SearchFrequentPartiesByNameAndCity(searchTerm string, cityID int64, partyType models.PartyType) (int, string) {
	fmt.Printf("SearchFrequentPartiesByNameAndCity -> Term: %s, City: %d\n", searchTerm, cityID)

	// Validar parámetros
	if len(searchTerm) < 2 {
		return 400, `{"error": "El término de búsqueda debe tener al menos 2 caracteres"}`
	}

	// Buscar direcciones del cliente en esa ciudad
	parties, total, err := bd.SearchFrequentPartiesByNameAndCity(searchTerm, cityID, partyType)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al buscar partes frecuentes: %s"}`, err.Error())
	}

	response := models.FrequentPartySearchResponse{
		Parties: parties,
		Total:   total,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetFrequentPartiesByDocument obtiene direcciones previas de un documento en una ciudad
func GetFrequentPartiesByDocument(documentNumber string, cityID int64, partyType models.PartyType) (int, string) {
	fmt.Printf("GetFrequentPartiesByDocument -> Doc: %s, City: %d\n", documentNumber, cityID)

	// Validar parámetros
	if documentNumber == "" {
		return 400, `{"error": "document_number es requerido"}`
	}

	if cityID <= 0 {
		return 400, `{"error": "city_id es requerido y debe ser mayor a 0"}`
	}

	// Obtener partes frecuentes
	parties, total, err := bd.GetFrequentPartiesByDocument(documentNumber, cityID, partyType)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener partes frecuentes: %s"}`, err.Error())
	}

	response := models.FrequentPartySearchResponse{
		Parties: parties,
		Total:   total,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// UpsertFrequentParty registra o actualiza una parte frecuente
// Esta función se llama automáticamente al crear una guía
func UpsertFrequentParty(body string) (int, string) {
	fmt.Println("UpsertFrequentParty")

	// Parsear body
	var request models.CreateFrequentPartyRequest
	err := json.Unmarshal([]byte(body), &request)
	if err != nil {
		return 400, fmt.Sprintf(`{"error": "Body inválido: %s"}`, err.Error())
	}

	// Validar campos requeridos
	if request.DocumentNumber == "" {
		return 400, `{"error": "document_number es requerido"}`
	}

	if request.CityID <= 0 {
		return 400, `{"error": "city_id es requerido y debe ser mayor a 0"}`
	}

	if request.Address == "" {
		return 400, `{"error": "address es requerido"}`
	}

	if request.FullName == "" {
		return 400, `{"error": "full_name es requerido"}`
	}

	if request.Phone == "" {
		return 400, `{"error": "phone es requerido"}`
	}

	// Insertar o actualizar
	err = bd.UpsertFrequentParty(request)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al registrar parte frecuente: %s"}`, err.Error())
	}

	return 200, `{"success": true, "message": "Parte frecuente registrada correctamente"}`
}

// GetFrequentPartyStats obtiene estadísticas de partes frecuentes
func GetFrequentPartyStats() (int, string) {
	fmt.Println("GetFrequentPartyStats")

	stats, err := bd.GetFrequentPartyStats()
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener estadísticas: %s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(stats)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}