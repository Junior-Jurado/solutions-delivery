package handlers

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/routers"
	"github.com/aws/aws-lambda-go/events"
	// "strconv"
)

func Manejadores(path string, method string, body string, headers map[string]string, request events.APIGatewayV2HTTPRequest) (int, string) {
	fmt.Println("Voy a procesar " + path + " > " + method)

	// NORMALIZAR PATH: Eliminar prefijo /api/v1 si existe
	path = strings.TrimPrefix(path, "/api/v1")

	id := request.PathParameters["id"]
	idn, _ := strconv.Atoi(id)

	isValid, statusCode, userUUID := validateAuthorization(path, method, request)

	if !isValid {
		return statusCode, userUUID
	}

	switch {

	case strings.HasPrefix(path, "/guides"):
		return ProcesoGuias(body, path, method, userUUID, idn, request)

	case strings.HasPrefix(path, "/auth"):
		return ProcesoAutencaciones(body, path, method, userUUID, id, request)

	case strings.HasPrefix(path, "/locations"):
		return ProcesoUbicaciones(body, path, method, userUUID, id, request)

	case strings.HasPrefix(path, "/cash-close"):
		return ProccessCashClose(body, path, method, userUUID, idn, request)

	case strings.HasPrefix(path, "/client"):
		return ProccessClient(body, path, method, userUUID, id, request)

	case strings.HasPrefix(path, "/frequent-parties"):
		return ProccessFrequentParties(body, path, method, userUUID, request)

	case strings.HasPrefix(path, "/assignments"):
		return ProccessAssignments(body, path, method, userUUID, request)

	default:
		return 400, "Method Invalid"
	}

}

func validateAuthorization(path string, method string, request events.APIGatewayV2HTTPRequest) (bool, int, string) {
	// Preflight CORS
	if method == "OPTIONS" {
		return true, 200, "OK"
	}

	if (path == "/login" && method == "POST") ||
		(path == "/register" && method == "POST") {
		return true, 200, "OK"
	}

	if request.RequestContext.Authorizer == nil ||
		request.RequestContext.Authorizer.JWT == nil ||
		request.RequestContext.Authorizer.JWT.Claims == nil {
		return false, 401, "No autorizado"
	}

	claims := request.RequestContext.Authorizer.JWT.Claims

	userUUID, ok := claims["sub"]
	if !ok {
		return false, 401, "Unauthorized"
	}

	return true, 200, userUUID
}

func ProcesoGuias(body string, path string, method string, user string, id int, request events.APIGatewayV2HTTPRequest) (int, string) {
	fmt.Printf("ProcesoGuias -> Path: %s, Mehtod: %s \n", path, method)

	switch {
	// GET /guides - Obtener lista de guías con filtros
	case path == "/guides" && method == "GET":
		return routers.GetGuides(request, user)

	// GET /guides/stats - Obtener estadísticas de guías
	case path == "/guides/stats" && method == "GET":
		return routers.GetGuidesStats(user)

	// GET /guides/search
	case path == "/guides/search" && method == "GET":
		searchTerm := ""
		if request.QueryStringParameters != nil {
			searchTerm = request.QueryStringParameters["q"]
		}

		if searchTerm == "" {
			return 400, `{"error": "Parámetro 'q' requerido para búsqueda"}`
		}
		return routers.SearchGuides(searchTerm)

	// GET /guides/{id}/pdf - Obtener URL pre-firmada para descargar PDF
	case strings.HasPrefix(path, "/guides/") && strings.HasSuffix(path, "/pdf") && method == "GET":
		if id <= 0 {
			return 400, `{"error": "ID de guía inválido"}`
		}
		return routers.GetGuidePDFURL(int64(id))

	// GET /guides/{id} - Obtener detalle de una guía específica
	case strings.HasPrefix(path, "/guides/") && !strings.Contains(path, "/status") && method == "GET":
		if id <= 0 {
			return 400, `{"error": "ID de guía inválido"}`
		}
		return routers.GetGuideByID(int64(id))

	// PUT /guides/{id}/status - Actualizar estado de una guía
	case strings.HasPrefix(path, "/guides/") && strings.HasSuffix(path, "/status") && method == "PUT":
		if id <= 0 {
			return 400, `{"error": "ID de guía inválido"}`
		}
		return routers.UpdateGuideStatus(int64(id), body, user)

	default:
		return 400, "Method Invalid"
	}

}

func ProcesoAutencaciones(body string, path string, method string, user string, id string, request events.APIGatewayV2HTTPRequest) (int, string) {
	switch {
	case path == "/auth/role" && method == "GET":
		return routers.GetRole(user)
	}

	return 400, "Method Invalid"
}

func ProcesoUbicaciones(body string, path string, method string, user string, id string, request events.APIGatewayV2HTTPRequest) (int, string) {
	fmt.Printf("ProcesoUbicaciones -> Path: %s, Mehtod: %s \n", path, method)

	switch {
	// GET /locations/departments - Obtener todos los departamentos
	case path == "/locations/departments" && method == "GET":
		return routers.GetDepartments()

	// GET /locations/cities - Obtener ciudades (con filtro opcional por departamento)
	case path == "/locations/cities" && method == "GET":
		// Obtener parámetro de query department_id si existe
		departmentID := ""
		if request.QueryStringParameters != nil {
			departmentID = request.QueryStringParameters["department_id"]
		}
		return routers.GetCities(departmentID)

	// GET /locations/cities/{id} - Obtener una ciudad especifica
	case strings.HasPrefix(path, "/locations/cities/") && method == "GET":
		// Extraer el ID de la ciudad del path
		cityIDStr := strings.TrimPrefix(path, "/locations/cities/")
		cityID, err := strconv.ParseInt(cityIDStr, 10, 64)
		if err != nil {
			return 400, fmt.Sprintf(`{"error": "ID de ciudad inválido"}`)
		}
		return routers.GetCityByID(cityID)

	// GET /locations/search - Búsqueda de ciudades por nombre
	case path == "/locations/search" && method == "GET":
		// Obtener parámetro de query search_term si existe
		searchTerm := ""
		if request.QueryStringParameters != nil {
			searchTerm = request.QueryStringParameters["q"]
		}

		if searchTerm == "" {
			return 400, `{"error": "Parámetro 'q' requerido para búsqueda"}`
		}
		return routers.SearchCities(searchTerm)
	}

	return 400, "Method Invalid"
}

func ProccessCashClose(body string, path string, method string, user string, id int, request events.APIGatewayV2HTTPRequest) (int, string) {
	switch {
	// POST /cash-close - Generate new close
	case path == "/cash-close" && method == "POST":
		return routers.GenerateCashClose(body, user)

	// GET /cash-close - List closes
	case path == "/cash-close" && method == "GET":
		return routers.GetCashCloses(request)

	// GET /cash-close/stats - Statistics
	case path == "/cash-close/stats" && method == "GET":
		return routers.GetCashCloseStats()

	// GET /cash-close/{id}/pdf - Get specific close PDF
	case strings.HasPrefix(path, "/cash-close/") && strings.Contains(path, "/pdf") && method == "GET":
		if id <= 0 {
			return 400, `{"error": "Invalid close ID"}`
		}
		return routers.GetCashClosePDFURL(int64(id))

	// GET /cash-close/{id} - Get specific close
	case strings.HasPrefix(path, "/cash-close/") && !strings.Contains(path, "/stats") && method == "GET":
		if id <= 0 {
			return 400, `{"error": "Invalid close ID"}`
		}
		return routers.GetCashCloseByID(int64(id))

	default:
		return 400, "Method Invalid"
	}
}

func ProccessClient(body string, path string, method string, user string, id string, request events.APIGatewayV2HTTPRequest) (int, string) {
	fmt.Printf("ProccessClient -> Path:%s, Method: %s\n", path, method)

	switch {

	// GET /client/profile - Obtener perfil del cliente
	case path == "/client/profile" && method == "GET":
		return routers.GetClientProfile(user)

	// PUT /client/profile
	case path == "/client/profile" && method == "PUT":
		return routers.UpdateClientProfile(body, user)

	// GET /client/guides/active - Obtener guías activas del cliente
	case path == "/client/guides/active" && method == "GET":
		return routers.GetClientActiveGuides(user)

	// GET /client/guides/history - Obtener histórico de guías del cliente
	case path == "/client/guides/history" && method == "GET":
		return routers.GetClientGuideHistory(request, user)

	// GET /client/guides/track/{guideNumber} - Rastrear guía por número
	case strings.HasPrefix(path, "/client/guides/track/") && method == "GET":
		guideNumber := strings.TrimPrefix(path, "/client/guides/track/")
		if guideNumber == "" {
			return 400, `{"error": "Number of guide required"}`
		}
		return routers.TrackGuideByNumber(guideNumber, user)

	// GET client/stats - Obtener estadísticas del cliente
	case path == "/client/stats" && method == "GET":
		return routers.GetClientStats(user)

	// GET /client/ratings/pending - Obtener entregas pendientes de calificar
	case path == "/client/ratings/pending" && method == "GET":
		return routers.GetClientPendingRatings(user)

	// POST /client/ratings - Crear calificación (alternativa)
	case path == "/client/ratings" && method == "POST":
		return routers.CreateDeliveryRating(body, user)

	default:
		return 400, "Method Invalid"
	}
}

// ProccessFrequentParties maneja las peticiones de partes frecuentes
func ProccessFrequentParties(body string, path string, method string, user string, request events.APIGatewayV2HTTPRequest) (int, string) {
	fmt.Printf("ProccessFrequentParties -> Path:%s, Method: %s\n", path, method)

	switch {

	// GET /frequent-parties/search-by-name - Buscar SOLO por nombre (autocompletado inicial)
	// Retorna clientes únicos sin importar la ciudad
	case path == "/frequent-parties/search-by-name" && method == "GET":
		searchTerm := ""
		partyTypeStr := ""

		if request.QueryStringParameters != nil {
			searchTerm = request.QueryStringParameters["q"]
			partyTypeStr = request.QueryStringParameters["party_type"]
		}

		if searchTerm == "" {
			return 400, `{"error": "Parámetro 'q' requerido para búsqueda"}`
		}

		var partyType models.PartyType
		if partyTypeStr == "SENDER" {
			partyType = models.PartySender
		} else if partyTypeStr == "RECEIVER" {
			partyType = models.PartyReceiver
		}

		return routers.SearchFrequentPartiesByNameOnly(searchTerm, partyType)

	// GET /frequent-parties/search-by-name-and-city - Buscar por nombre Y ciudad
	// Retorna TODAS las direcciones de ese cliente en esa ciudad
	case path == "/frequent-parties/search-by-name-and-city" && method == "GET":
		searchTerm := ""
		cityIDStr := ""
		partyTypeStr := ""

		if request.QueryStringParameters != nil {
			searchTerm = request.QueryStringParameters["q"]
			cityIDStr = request.QueryStringParameters["city_id"]
			partyTypeStr = request.QueryStringParameters["party_type"]
		}

		if searchTerm == "" {
			return 400, `{"error": "Parámetro 'q' requerido para búsqueda"}`
		}

		if cityIDStr == "" {
			return 400, `{"error": "Parámetro 'city_id' requerido"}`
		}

		cityID, err := strconv.ParseInt(cityIDStr, 10, 64)
		if err != nil {
			return 400, `{"error": "city_id debe ser un número válido"}`
		}

		var partyType models.PartyType
		if partyTypeStr == "SENDER" {
			partyType = models.PartySender
		} else if partyTypeStr == "RECEIVER" {
			partyType = models.PartyReceiver
		}

		return routers.SearchFrequentPartiesByNameAndCity(searchTerm, cityID, partyType)

	// GET /frequent-parties/by-document - Obtener direcciones por documento y ciudad
	case path == "/frequent-parties/by-document" && method == "GET":
		documentNumber := ""
		cityIDStr := ""
		partyTypeStr := ""

		if request.QueryStringParameters != nil {
			documentNumber = request.QueryStringParameters["document_number"]
			cityIDStr = request.QueryStringParameters["city_id"]
			partyTypeStr = request.QueryStringParameters["party_type"]
		}

		if documentNumber == "" {
			return 400, `{"error": "Parámetro 'document_number' requerido"}`
		}

		if cityIDStr == "" {
			return 400, `{"error": "Parámetro 'city_id' requerido"}`
		}

		cityID, err := strconv.ParseInt(cityIDStr, 10, 64)
		if err != nil {
			return 400, `{"error": "city_id debe ser un número válido"}`
		}

		var partyType models.PartyType
		if partyTypeStr == "SENDER" {
			partyType = models.PartySender
		} else if partyTypeStr == "RECEIVER" {
			partyType = models.PartyReceiver
		}

		return routers.GetFrequentPartiesByDocument(documentNumber, cityID, partyType)

	// POST /frequent-parties - Registrar nueva parte frecuente
	case path == "/frequent-parties" && method == "POST":
		return routers.UpsertFrequentParty(body)

	// GET /frequent-parties/stats - Obtener estadísticas
	case path == "/frequent-parties/stats" && method == "GET":
		return routers.GetFrequentPartyStats()

	default:
		return 400, "Method Invalid"
	}
}

func ProccessAssignments(body string, path string, method string, user string, request events.APIGatewayV2HTTPRequest) (int, string) {
	fmt.Printf("ProccessAssignments -> Path:%s, Method: %s\n", path, method)

	switch {
	// ==========================================
	// RUTAS EXACTAS
	// ==========================================

	// POST /assignments - Crear asignación
	case path == "/assignments" && method == "POST":
		return routers.CreateAssignment(body, user)

	// GET /assignments - Listar asignaciones
	case path == "/assignments" && method == "GET":
		return routers.GetAssignments(request)

	// GET /assignments/my - Listar mis asignaciones (DELIVERY)
	case path == "/assignments/my" && method == "GET":
		return routers.GetMyAssignments(user)

	// GET /assignments/my/performance - Estadísticas de rendimiento (DELIVERY)
	case path == "/assignments/my/performance" && method == "GET":
		return routers.GetMyPerformanceStats(user)

	// GET /assignments/delivery-users - Listar repartidores
	case path == "/assignments/delivery-users" && method == "GET":
		return routers.GetDeliveryUsers()

	// GET /assignments/pending-guides - Listar guías pendientes
	case path == "/assignments/pending-guides" && method == "GET":
		return routers.GetPendingGuides(user)

	// GET /assignments/stats - Obtener estadísticas (ADMIN, SECRETARY)
	case path == "/assignments/stats" && method == "GET":
		return routers.GetAssignmentStats(user)

	// ==========================================
	// RUTAS CON PARÁMETROS
	// ==========================================

	// PUT /assignments/{id}/reassign
	case strings.Contains(path, "/reassign") && method == "PUT":
		return routers.ReassignDelivery(body, user, path)

	// PUT /assignments/{id}/status
	case strings.Contains(path, "/status") && method == "PUT":
		return routers.UpdateAssignmentStatus(body, user, path)

	// GET /assignments/{id}/history
	case strings.Contains(path, "/history") && method == "GET":
		return routers.GetAssignmentHistory(user, path)

	// POST /assignments/{id}/rate - Crear calificación (CLIENT)
	case strings.Contains(path, "/rate") && method == "POST":
		return routers.CreateDeliveryRating(body, user)

	// GET /assignments/{id}/rating - Obtener calificación
	case strings.Contains(path, "/rating") && method == "GET":
		assignmentID := extractAssignmentIDFromPath(path, "/rating")
		if assignmentID == 0 {
			return 400, `{"error": "ID de asignación inválido"}`
		}
		return routers.GetAssignmentRating(user, assignmentID)

	// GET /assignments/{id} - obtener asignación (debe ser la última ruta con prefijo)
	case strings.HasPrefix(path, "/assignments/") && method == "GET":
		return routers.GetAssignmentByID(user, path)

	default:
		return 404, `{"error": "Ruta no encontrada"}`
	}

}

// extractAssignmentIDFromPath extrae el ID de asignación del path
func extractAssignmentIDFromPath(path string, suffix string) int64 {
	path = strings.TrimPrefix(path, "/assignments/")
	path = strings.TrimSuffix(path, suffix)
	id, err := strconv.ParseInt(path, 10, 64)
	if err != nil {
		return 0
	}
	return id
}
