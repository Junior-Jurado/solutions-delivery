package routers

import (
	"encoding/json"
	"fmt"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/bd"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
	"github.com/aws/aws-lambda-go/events"
)

// GetAdminDashboardStats obtiene todas las estadísticas del dashboard admin
func GetAdminDashboardStats(userUUID string) (int, string) {
	fmt.Println("GetAdminDashboardStats")

	// Verificar permisos
	if !userIsAllowed(userUUID, models.RoleAdmin) {
		return 403, `{"error": "No autorizado - Solo administradores"}`
	}

	stats, err := bd.GetAdminDashboardStats()
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener estadísticas: %s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(stats)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetEmployees obtiene la lista de empleados
func GetEmployees(request events.APIGatewayV2HTTPRequest, userUUID string) (int, string) {
	fmt.Println("GetEmployees")

	// Verificar permisos
	if !userIsAllowed(userUUID, models.RoleAdmin) {
		return 403, `{"error": "No autorizado - Solo administradores"}`
	}

	role := ""
	if request.QueryStringParameters != nil {
		role = request.QueryStringParameters["role"]
	}

	employees, err := bd.GetEmployees(role)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener empleados: %s"}`, err.Error())
	}

	if employees == nil {
		employees = []models.Employee{}
	}

	response := models.EmployeesListResponse{
		Employees: employees,
		Total:     len(employees),
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetEmployeeByID obtiene un empleado por ID
func GetEmployeeByID(userUUID string, employeeID string) (int, string) {
	fmt.Printf("GetEmployeeByID -> ID: %s\n", employeeID)

	// Verificar permisos
	if !userIsAllowed(userUUID, models.RoleAdmin) {
		return 403, `{"error": "No autorizado - Solo administradores"}`
	}

	employee, err := bd.GetEmployeeByID(employeeID)
	if err != nil {
		if err.Error() == "empleado no encontrado" {
			return 404, `{"error": "Empleado no encontrado"}`
		}
		return 500, fmt.Sprintf(`{"error": "Error al obtener empleado: %s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(employee)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetUserByDocument busca un usuario por número de documento
func GetUserByDocument(userUUID string, documentNumber string) (int, string) {
	fmt.Printf("GetUserByDocument -> Document: %s\n", documentNumber)

	// Verificar permisos
	if !userIsAllowed(userUUID, models.RoleAdmin) {
		return 403, `{"error": "No autorizado - Solo administradores"}`
	}

	if documentNumber == "" {
		return 400, `{"error": "Número de documento requerido"}`
	}

	user, err := bd.GetUserByDocument(documentNumber)
	if err != nil {
		if err.Error() == "usuario no encontrado" {
			return 404, `{"error": "Usuario no encontrado con ese número de documento"}`
		}
		return 500, fmt.Sprintf(`{"error": "Error al buscar usuario: %s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(user)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// UpdateEmployee actualiza un empleado
func UpdateEmployee(body string, userUUID string, employeeID string) (int, string) {
	fmt.Printf("UpdateEmployee -> ID: %s\n", employeeID)

	// Verificar permisos
	if !userIsAllowed(userUUID, models.RoleAdmin) {
		return 403, `{"error": "No autorizado - Solo administradores"}`
	}

	var req models.UpdateEmployeeRequest
	err := json.Unmarshal([]byte(body), &req)
	if err != nil {
		return 400, fmt.Sprintf(`{"error": "Body inválido: %s"}`, err.Error())
	}

	err = bd.UpdateEmployee(employeeID, req)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al actualizar empleado: %s"}`, err.Error())
	}

	// Obtener empleado actualizado
	employee, err := bd.GetEmployeeByID(employeeID)
	if err != nil {
		return 200, `{"success": true, "message": "Empleado actualizado correctamente"}`
	}

	response := map[string]interface{}{
		"success":  true,
		"message":  "Empleado actualizado correctamente",
		"employee": employee,
	}

	jsonResponse, _ := json.Marshal(response)
	return 200, string(jsonResponse)
}

// GetClientRanking obtiene el ranking de mejores clientes
func GetClientRanking(request events.APIGatewayV2HTTPRequest, userUUID string) (int, string) {
	fmt.Println("GetClientRanking")

	// Verificar permisos
	if !userIsAllowed(userUUID, models.RoleAdmin) {
		return 403, `{"error": "No autorizado - Solo administradores"}`
	}

	// Parse query parameters
	filters := models.ClientRankingFilters{
		SortBy:    "total_guides",
		Order:     "desc",
		Limit:     20,
		MinGuides: 1,
	}

	if request.QueryStringParameters != nil {
		if sortBy := request.QueryStringParameters["sort_by"]; sortBy != "" {
			filters.SortBy = sortBy
		}
		if order := request.QueryStringParameters["order"]; order != "" {
			filters.Order = order
		}
		if limit := request.QueryStringParameters["limit"]; limit != "" {
			fmt.Sscanf(limit, "%d", &filters.Limit)
		}
		if minGuides := request.QueryStringParameters["min_guides"]; minGuides != "" {
			fmt.Sscanf(minGuides, "%d", &filters.MinGuides)
		}
		if dateFrom := request.QueryStringParameters["date_from"]; dateFrom != "" {
			filters.DateFrom = dateFrom
		}
		if dateTo := request.QueryStringParameters["date_to"]; dateTo != "" {
			filters.DateTo = dateTo
		}
	}

	response, err := bd.GetClientRanking(filters)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener ranking: %s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}
