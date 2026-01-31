package routers

import (
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/bd"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
	"github.com/aws/aws-lambda-go/events"
)

// ==========================================
// PROFILE
// ==========================================

// GetClientProfile obtiene el perfil del cliente actual
func GetClientProfile(userUUID string) (int, string) {
	fmt.Printf("GetClientProfile -> UserUUID: %s\n", userUUID)

	profile, err := bd.GetUserProfile(userUUID)
	if err != nil {
		if err.Error() == "Usuario no encontrado" {
			return 404, `{"error": "Usuario no encontrado"}`
		}
		return 500, fmt.Sprintf(`{"error": "Error al obtener perfil: %s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(profile)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// UpdateClientProfile actualiza el perfil del cliente
func UpdateClientProfile(body string, userUUID string) (int, string) {
	fmt.Printf("UpdateClientProfile -> UserUUID: %s\n", userUUID)

	var updateData models.ClientProfileUpdate
	err := json.Unmarshal([]byte(body), &updateData)
	if err != nil {
		return 400, fmt.Sprintf(`{"error": "Body inválido: %s"}`, err.Error())
	}

	// Actualizar perfil
	updatedProfile, err := bd.UpdateUserProfile(userUUID, updateData)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al actualizar perfil: %s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(updatedProfile)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// ==========================================
// GUIDES
// ==========================================

// GetClientActiveGuides obtiene las guías activas del cliente
func GetClientActiveGuides(userUUID string) (int, string) {
	fmt.Printf("GetClientActiveGuides -> UserUUID: %s\n", userUUID)

	guides, err := bd.GetClientActiveGuides(userUUID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener guías activas: %s"}`, err.Error())
	}

	response := models.ClientGuidesResponse{
		Guides: guides,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetClientGuideHistory obtiene el histórico de guías del cliente
func GetClientGuideHistory(request events.APIGatewayV2HTTPRequest, userUUID string) (int, string) {
	fmt.Printf("GetClientGuideHistory -> UserUUID: %s\n", userUUID)

	// Construir filtros desde query parameters
	filters := models.ClientGuideFilters{
		UserUUID: userUUID,
		Limit:    50,
		Offset:   0,
	}

	if request.QueryStringParameters != nil {
		// Filtro por estado
		if statusStr := request.QueryStringParameters["status"]; statusStr != "" {
			status := models.GuideStatus(statusStr)
			filters.Status = &status
		}

		// Filtro por fecha desde
		if dateFromStr := request.QueryStringParameters["date_from"]; dateFromStr != "" {
			dateFrom, err := time.Parse("2006-01-02", dateFromStr)
			if err == nil {
				filters.DateFrom = &dateFrom
			}
		}

		// Filtro por fecha hasta
		if dateToStr := request.QueryStringParameters["date_to"]; dateToStr != "" {
			dateTo, err := time.Parse("2006-01-02", dateToStr)
			if err == nil {
				filters.DateTo = &dateTo
			}
		}

		// Término de búsqueda
		if searchTerm := request.QueryStringParameters["search"]; searchTerm != "" {
			filters.SearchTerm = searchTerm
		}

		// Limit
		if limitStr := request.QueryStringParameters["limit"]; limitStr != "" {
			limit, err := strconv.Atoi(limitStr)
			if err == nil && limit > 0 {
				filters.Limit = limit
			}
		}

		// Offset
		if offsetStr := request.QueryStringParameters["offset"]; offsetStr != "" {
			offset, err := strconv.Atoi(offsetStr)
			if err == nil && offset >= 0 {
				filters.Offset = offset
			}
		}
	}

	guides, err := bd.GetClientGuideHistory(filters)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener histórico: %s"}`, err.Error())
	}

	response := models.ClientGuidesResponse{
		Guides: guides,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// TrackGuideByNumber rastrea una guía por su número
func TrackGuideByNumber(guideNumber string, userUUID string) (int, string) {
	fmt.Printf("TrackGuideByNumber -> GuideNumber: %s, UserUUID: %s\n", guideNumber, userUUID)

	// Convertir guideNumber a guideID
	guideID, err := strconv.ParseInt(guideNumber, 10, 64)
	if err != nil {
		return 400, `{"error": "Número de guía inválido"}`
	}

	guide, err := bd.GetGuideByID(guideID)
	if err != nil {
		if err.Error() == "Guía no encontrada" {
			return 404, `{"error": "Guía no encontrada"}`
		}
		return 500, fmt.Sprintf(`{"error": "Error al rastrear guía: %s"}`, err.Error())
	}

	// ⭐ VALIDACIÓN DE SEGURIDAD: Verificar que el usuario tiene permiso para ver esta guía
	hasAccess, err := bd.ValidateGuideAccess(guideID, userUUID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al validar acceso: %s"}`, err.Error())
	}

	if !hasAccess {
		return 403, `{"error": "No tienes permiso para ver esta guía"}`
	}

	response := models.ClientTrackGuideResponse{
		Guide: guide,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// ==========================================
// STATS
// ==========================================

// GetClientStats obtiene estadísticas del cliente
func GetClientStats(userUUID string) (int, string) {
	fmt.Printf("GetClientStats -> UserUUID: %s\n", userUUID)

	stats, err := bd.GetClientStats(userUUID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener estadísticas: %s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(stats)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}
