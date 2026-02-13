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

// Zona horaria de Colombia (UTC-5)
var guideColombiaLoc *time.Location

func init() {
	var err error
	guideColombiaLoc, err = time.LoadLocation("America/Bogota")
	if err != nil {
		// Fallback: crear zona horaria fija UTC-5
		guideColombiaLoc = time.FixedZone("COT", -5*60*60)
	}
}

// NOTE: POST /guides (CreateGuide) is handled by the Node.js Lambda in guides/guideHandler.js
// The price override security logic lives there. Do NOT duplicate it here.

// GetGuides obtiene la lista de guías con filtros
func GetGuides(request events.APIGatewayV2HTTPRequest, userUUID string) (int, string) {
	fmt.Println("GetGuides")

	// Construir filtros desde query parameters
	filters := models.GuideFilters{
		Limit:  20,
		Offset: 0,
	}

	if request.QueryStringParameters != nil {
		// Filtro por estado
		if statusStr := request.QueryStringParameters["status"]; statusStr != "" {
			status := models.GuideStatus(statusStr)
			filters.Status = status
		}

		// Filtro por ciudad origen
		if originCityStr := request.QueryStringParameters["origin_city_id"]; originCityStr != "" {
			originCityID, err := strconv.ParseInt(originCityStr, 10, 64)
			if err == nil {
				filters.OriginCityID = &originCityID
			}
		}

		// Filtro por ciudad destino
		if destCityStr := request.QueryStringParameters["destination_city_id"]; destCityStr != "" {
			destCityID, err := strconv.ParseInt(destCityStr, 10, 64)
			if err == nil {
				filters.DestinationCityID = &destCityID
			}
		}

		// Término de búsqueda
		if searchTerm := request.QueryStringParameters["search"]; searchTerm != "" {
			filters.SearchTerm = searchTerm
		}

		// Filtro por fecha desde (con zona horaria de Colombia)
		if dateFromStr := request.QueryStringParameters["date_from"]; dateFromStr != "" {
			dateFrom, err := time.ParseInLocation("2006-01-02", dateFromStr, guideColombiaLoc)
			if err == nil {
				filters.DateFrom = &dateFrom
			}
		}

		// Filtro por fecha hasta (con zona horaria de Colombia)
		if dateToStr := request.QueryStringParameters["date_to"]; dateToStr != "" {
			dateTo, err := time.ParseInLocation("2006-01-02", dateToStr, guideColombiaLoc)
			if err == nil {
				// Agregar 23:59:59 para incluir todo el día
				dateTo = dateTo.Add(23*time.Hour + 59*time.Minute + 59*time.Second)
				filters.DateTo = &dateTo
			}
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

		// Filtro por usuario creador (opcional para admins)
		if createdBy := request.QueryStringParameters["created_by"]; createdBy != "" {
			filters.CreatedBy = createdBy
		}
	}

	// Obtener guías
	guides, total, err := bd.GetGuidesByFilters(filters)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener las guías: %s"}`, err.Error())
	}

	response := models.GuidesListResponse{
		Guides: guides,
		Total:  total,
		Limit:  filters.Limit,
		Offset: filters.Offset,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetGuideByID obtiene el detalle completo de una guía
func GetGuideByID(guideID int64) (int, string) {
	fmt.Printf("GetGuideByID -> GuideID: %d\n", guideID)

	guide, err := bd.GetGuideByID(guideID)
	if err != nil {
		if err.Error() == "Guía no encontrada" {
			return 404, fmt.Sprintf(`{"error": "Guía no encontrada"}`)
		}
		return 500, fmt.Sprintf(`{"error": "Error al obtener la guía: %s"}`, err.Error())
	}

	response := models.GuidesDetailResponse{
		Guide: guide,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// UpdateGuide actualiza el estado de una guía
func UpdateGuideStatus(guideID int64, body string, userUUID string) (int, string) {
	fmt.Printf("UpdateGuideStatus -> GuideID: %d\n", guideID)

	// Obtener rol del usuario
	userRole, err := bd.GetUserRole(userUUID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener rol del usuario: %s"}`, err.Error())
	}

	// Verificar que la guía existe
	if !bd.GuideExists(guideID) {
		return 404, fmt.Sprintf(`{"error": "Guía no encontrada"}`)
	}

	// Parsear body
	var request models.UpdateStatusRequest
	err = json.Unmarshal([]byte(body), &request)
	if err != nil {
		return 400, fmt.Sprintf(`{"error": "Body inválido: %s"}`, err.Error())
	}

	// Validar estado
	validStatuses := []models.GuideStatus{
		models.StatusCreated,
		models.StatusInRoute,
		models.StatusInWarehouse,
		models.StatusOutForDelivery,
		models.StatusDelivered,
	}

	isValid := false

	for _, s := range validStatuses {
		if request.Status == s {
			isValid = true
			break
		}
	}

	if !isValid {
		return 400, fmt.Sprintf(`{"error": "Estado inválido"}`)
	}

	// Validar permisos según rol
	switch userRole.Role {
	case models.RoleAdmin:
		// Admin puede cambiar a cualquier estado
	case models.RoleSecretary:
		// Secretary solo puede cambiar a IN_WAREHOUSE
		if request.Status != models.StatusInWarehouse {
			return 403, `{"error": "Solo puedes cambiar el estado a 'En bodega'"}`
		}
	default:
		return 403, `{"error": "No tienes permisos para cambiar el estado de la guía"}`
	}

	// Actualizar estado
	err = bd.UpdateGuideStatus(guideID, request.Status, userUUID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al actualizar el estado de la guía: %s"}`, err.Error())
	}

	response := models.UpdateStatusResponse{
		Success:   true,
		GuideID:   guideID,
		NewStatus: request.Status,
		Message:   "Estado actualizado correctamente",
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetGuidesStats obtiene estadísticas de guías
func GetGuidesStats(userUUID string) (int, string) {
	fmt.Println("GetGuidesStats")

	stats, err := bd.GetGuideStats(userUUID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener estadísticas: %s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(stats)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// SearchGuides búsqueda rápida de guías
func SearchGuides(searchTerm string) (int, string) {
	fmt.Printf("SearchGuides -> SearchTerm: %s\n", searchTerm)

	// Validar término de búsqueda
	if len(searchTerm) < 3 {
		return 400, `{"error": "El término de búsqueda debe tener al menos 3 caracteres"}`
	}

	// Construir filtros solo con término de búsqueda
	filters := models.GuideFilters{
		SearchTerm: searchTerm,
		Limit:      50,
		Offset:     0,
	}

	guides, total, err := bd.GetGuidesByFilters(filters)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al buscar guías: %s"}`, err.Error())
	}

	response := models.GuidesListResponse{
		Guides: guides,
		Total:  total,
		Limit:  filters.Limit,
		Offset: filters.Offset,
	}

	jsonResponse, err := json.Marshal(response)

	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}
