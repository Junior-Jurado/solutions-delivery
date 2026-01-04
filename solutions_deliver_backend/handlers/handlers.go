package handlers

import (
	"fmt"
	"strconv"
	"strings"

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
	case strings.HasPrefix(path, "/user"):
		return ProcesoUsers(body, path, method, userUUID, id, request)

	case strings.HasPrefix(path, "/guides"):
		return ProcesoGuias(body, path, method, userUUID, idn, request)
	
	case strings.HasPrefix(path, "/auth"):
		return ProcesoAutencaciones(body, path, method, userUUID, id, request)
	
	case strings.HasPrefix(path, "/locations"):
		return ProcesoUbicaciones(body, path, method, userUUID, id, request)

	case strings.HasPrefix(path, "/cash-close"):
		return ProccessCashClose(body, path, method, userUUID, idn, request) 
	}

	
	

	return 400, "Method Invalid"
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

func ProcesoUsers(body string, path  string, method string, user string, id string, request events.APIGatewayV2HTTPRequest) (int, string) {
	return 400, "Method Invalid"
}

func ProcesoGuias(body string, path  string, method string, user string, id int, request events.APIGatewayV2HTTPRequest) (int, string) {
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
			if id <= 0{
				return 400, `{"error": "ID de guía inválido"}`
			}
			return routers.GetGuidePDFURL(int64(id))

		// GET /guides/{id} - Obtener detalle de una guía específica
		case strings.HasPrefix(path, "/guides/")&& !strings.Contains(path, "/status") && method == "GET":
			if id <= 0{
				return 400, `{"error": "ID de guía inválido"}`
			}
			return routers.GetGuideByID(int64(id)  )

		// PUT /guides/{id}/status - Actualizar estado de una guía
		case strings.HasPrefix(path, "/guides/")&& strings.HasSuffix(path, "/status") && method == "PUT":
			if id <= 0{
				return 400, `{"error": "ID de guía inválido"}`
			}
			return routers.UpdateGuideStatus(int64(id), body, user)
		

		
		
		default:
			return 400, "Method Invalid"
	}
	
}

func ProcesoAutencaciones(body string, path  string, method string, user string, id string, request events.APIGatewayV2HTTPRequest) (int, string) {
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
			if id <= 0{
				return 400, `{"error": "Invalid close ID"}`
			}
			return routers.GetCashClosePDFURL(int64(id))
		
		// GET /cash-close/{id} - Get specific close
		case strings.HasPrefix(path, "/cash-close/") && !strings.Contains(path, "/stats") && method == "GET":
			if id <= 0{
				return 400, `{"error": "Invalid close ID"}`
			}
			return routers.GetCashCloseByID(int64(id))
		
		default:
			return 400, "Method Invalid"
	}
}