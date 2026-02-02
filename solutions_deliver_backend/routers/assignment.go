package routers

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/bd"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
	"github.com/aws/aws-lambda-go/events"
)

// CreateAssignment crea una nueva asignación (SECRETARY, ADMIN)
func CreateAssignment(body string, userUUID string) (int, string) {
	fmt.Println("CreateAssignment")

	if !userIsAllowed(userUUID, models.RoleAdmin, models.RoleSecretary) {
		return 403, `{"error": "No autorizado - Rol no permitido"}`
	}

	var req models.CreateAssignmentRequest
	err := json.Unmarshal([]byte(body), &req)
	if err != nil {
		return 400, fmt.Sprintf(`{"error": "Body inválido: %s"}`, err.Error())
	}

	// Validaciones
	if req.GuideID <= 0 {
		return 400, `{"error": "guide_id es requerido"}`
	}

	if req.DeliveryUserID == "" {
		return 400, `{"error": "delivery_user_id es requerido"}`
	}

	if req.AssignmentType != models.AssignmentPickup && req.AssignmentType != models.AssignmentDelivery {
		return 400, `{"error": "assignment_type debe ser PICKUP o DELIVERY"}`
	}

	assignment, err := bd.CreateAssignment(req, userUUID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al crear asignación de entregador: %s"}`, err.Error())
	}

	response := models.CreateAssignmentResponse{
		Success:      true,
		AssignmentID: assignment.AssignmentID,
		Assignment:   assignment,
		Message:      "Asignación realizada correctamente",
	}

	jsonResponse, err := json.Marshal(response)

	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 201, string(jsonResponse)
}

// GetAssignmentByID obtiene una asignación por su ID
func GetAssignmentByID(userUUID string, path string) (int, string) {
	fmt.Printf("GetAssignmentByID empieza")

	assignmentID := extractIDFromPath(path, "/assignments/")
	if assignmentID == 0 {
		return 400, `{"error": "ID de asignación inválido"}`
	}

	if !userIsAllowed(userUUID, models.RoleAdmin, models.RoleSecretary) {
		return 403, `{"error": "No autorizado - Rol no permitido"}`
	}

	assignment, err := bd.GetAssignmentByID(assignmentID)
	if err != nil {
		return 404, fmt.Sprintf(`{"error": "%s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(assignment)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// ReassingnDelivery reasigna una entrega a otro entregador
func ReassignDelivery(body string, userUUID string, path string) (int, string) {
	fmt.Println("ReassignDelivery")

	if !userIsAllowed(userUUID, models.RoleAdmin) {
		return 403, `{"error": "No autorizado - Rol no permitido"}`
	}

	assignmentID := extractIDFromPathWithSuffix(path, "/assignments/", "/reassign")
	if assignmentID == 0 {
		return 400, `{"error": "ID de asignación inválido"}`
	}

	var req models.ReassignRequest
	err := json.Unmarshal([]byte(body), &req)
	if err != nil {
		return 400, fmt.Sprintf(`{"error": "Body inválido: %s"}`, err.Error())
	}

	if req.NewDeliveryUserID == "" {
		return 400, `{"error": "new_delivery_user_id es requerido"}`
	}

	assignment, err := bd.ReassignDelivery(assignmentID, req.NewDeliveryUserID, req.Notes, userUUID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "%s"}`, err.Error())
	}

	response := models.ReassignResponse{
		Success:      true,
		AssignmentID: assignment.AssignmentID,
		Assignment:   assignment,
		Message:      "Reasignación realizada correctamente",
	}

	jsonResponse, err := json.Marshal(response)

	return 200, string(jsonResponse)
}

// UpdateAssignmentStatus actualiza el estado de una asignación
func UpdateAssignmentStatus(body string, userUUID string, path string) (int, string) {
	fmt.Println("UpdateAssignmentStatus")

	if !userIsAllowed(userUUID, models.RoleAdmin, models.RoleDelivery, models.RoleSecretary) {
		return 403, `{"error": "No autorizado - Rol no permitido"}`
	}

	assignmentID := extractIDFromPathWithSuffix(path, "/assignments/", "/status")
	if assignmentID == 0 {
		return 400, `{"error": "ID de asignación inválido"}`
	}

	var req models.UpdateAssignmentStatusRequest
	err := json.Unmarshal([]byte(body), &req)
	if err != nil {
		return 400, fmt.Sprintf(`{"error": "Body inválido: %s"}`, err.Error())
	}

	// Verificar que DELIVERY solo pueda actualizar sus propias asignaciones
	userRole, err := bd.GetUserRole(userUUID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener rol: %s"}`, err.Error())
	}

	if userRole.Role == models.RoleDelivery {
		// Verificar que la asignación pertenezca al usuario
		currentAssignment, err := bd.GetAssignmentByID(assignmentID)
		if err != nil {
			return 404, fmt.Sprintf(`{"error": "%s"}`, err.Error())
		}
		if currentAssignment.DeliveryUserID != userUUID {
			return 403, `{"error": "No autorizado - Solo puedes actualizar tus propias asignaciones"}`
		}
	}

	validStatuses := []models.AssignmentStatus{
		models.AssignmentPending,
		models.AssignmentInProgress,
		models.AssignmentCompleted,
		models.AssignmentCancelled,
	}

	isValid := false

	for _, s := range validStatuses {
		if req.Status == s {
			isValid = true
			break
		}
	}

	if !isValid {
		return 400, `{"error": "status inválido. Valores permitidos: PENDING, IN_PROGRESS, COMPLETED, CANCELLED"}`
	}

	assignment, err := bd.UpdateAssignmentStatus(assignmentID, req.Status, req.Notes, userUUID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "%s"}`, err.Error())
	}

	// Actualizar automáticamente el estado de la guía según el tipo de asignación y nuevo estado
	var newGuideStatus models.GuideStatus
	shouldUpdateGuide := false
	guideStatusMessage := ""

	if assignment.AssignmentType == models.AssignmentPickup && req.Status == models.AssignmentCompleted {
		// PICKUP completado -> Guía pasa a EN RUTA
		newGuideStatus = models.StatusInRoute
		shouldUpdateGuide = true
		guideStatusMessage = "Guía actualizada a 'En ruta'"
	} else if assignment.AssignmentType == models.AssignmentDelivery {
		if req.Status == models.AssignmentInProgress {
			// DELIVERY iniciado -> Guía pasa a EN REPARTO
			newGuideStatus = models.StatusOutForDelivery
			shouldUpdateGuide = true
			guideStatusMessage = "Guía actualizada a 'En reparto'"
		} else if req.Status == models.AssignmentCompleted {
			// DELIVERY completado -> Guía pasa a ENTREGADA
			newGuideStatus = models.StatusDelivered
			shouldUpdateGuide = true
			guideStatusMessage = "Guía actualizada a 'Entregada'"
		}
	}

	if shouldUpdateGuide {
		err = bd.UpdateGuideStatus(assignment.GuideID, newGuideStatus, userUUID)
		if err != nil {
			fmt.Printf("Error al actualizar estado de guía %d: %s\n", assignment.GuideID, err.Error())
			// No retornamos error porque la asignación ya se actualizó correctamente
		} else {
			fmt.Printf("Guía %d actualizada a estado %s\n", assignment.GuideID, newGuideStatus)
		}
	}

	message := "Estado de asignación actualizado correctamente"
	if guideStatusMessage != "" {
		message = message + ". " + guideStatusMessage
	}

	response := models.UpdateAssignmentStatusResponse{
		Success:    true,
		Assignment: assignment,
		Message:    message,
	}

	jsonResponse, err := json.Marshal(response)
	return 200, string(jsonResponse)
}

// GetAssignments obtiene lista de asignaciones con filtros
func GetAssignments(request events.APIGatewayV2HTTPRequest) (int, string) {
	fmt.Println("GetAssignments")

	filters := models.AssignmentFilters{
		Limit:  50,
		Offset: 0,
	}

	// Parsear query params
	if request.QueryStringParameters != nil {
		if status := request.QueryStringParameters["status"]; status != "" {
			filters.Status = models.AssignmentStatus(status)
		}

		if assignmentType := request.QueryStringParameters["assignment_type"]; assignmentType != "" {
			filters.AssignmentType = models.AssignmentType(assignmentType)
		}

		if deliveryUserID := request.QueryStringParameters["delivery_user_id"]; deliveryUserID != "" {
			filters.DeliveryUserID = deliveryUserID
		}

		if guideIDStr := request.QueryStringParameters["guide_id"]; guideIDStr != "" {
			guideID, err := strconv.ParseInt(guideIDStr, 10, 64)
			if err == nil {
				filters.GuideID = &guideID
			}
		}

		if limitStr := request.QueryStringParameters["limit"]; limitStr != "" {
			limit, _ := strconv.Atoi(limitStr)
			if limit > 0 && limit <= 100 {
				filters.Limit = limit
			}
		}

		if offsetStr := request.QueryStringParameters["offset"]; offsetStr != "" {
			offset, _ := strconv.Atoi(offsetStr)
			if offset >= 0 {
				filters.Offset = offset
			}
		}
	}

	assignments, total, err := bd.GetAssignmentsByFilters(filters)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "%s"}`, err.Error())
	}

	response := models.AssignmentsListResponse{
		Assignments: assignments,
		Total:       total,
		Limit:       filters.Limit,
		Offset:      filters.Offset,
	}

	if response.Assignments == nil {
		response.Assignments = []models.DeliveryAssignment{}
	}

	jsonResponse, err := json.Marshal(response)
	return 200, string(jsonResponse)
}

// GetMyAssignments obtiene las asignaciones del entregador actual
func GetMyAssignments(userUUID string) (int, string) {
	fmt.Printf("GetMyAssignments -> UserID: %s\n", userUUID)

	if !userIsAllowed(userUUID, models.RoleDelivery) {
		return 403, `{"error": "No autorizado - Rol no permitido"}`
	}

	response, err := bd.GetMyAssignments(userUUID)
	if err != nil {
		return 500, fmt.Sprintf(`{"Error al obtener mis asignaciones": "%s"}`, err.Error())
	}

	if response.Pickups == nil {
		response.Pickups = []models.DeliveryAssignment{}
	}

	if response.Deliveries == nil {
		response.Deliveries = []models.DeliveryAssignment{}
	}

	jsonResponse, err := json.Marshal(response)
	return 200, string(jsonResponse)
}

// GetDeliveryUsers obtiene la lista de entregadores disponibles
func GetDeliveryUsers() (int, string) {
	fmt.Println("GetDeliveryUsers")

	users, err := bd.GetDeliveryUsers()
	if err != nil {
		return 500, fmt.Sprintf(`{"Error al obtener repartidores": "%s"}`, err.Error())
	}

	response := models.DeliveryUsersListResponse{
		DeliveryUsers: users,
		Total:         len(users),
	}

	if response.DeliveryUsers == nil {
		response.DeliveryUsers = []models.DeliveryUser{}
	}

	jsonResponse, err := json.Marshal(users)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetPendingGuides obtiene la lista de guías pendientes
func GetPendingGuides(userUUID string) (int, string) {
	fmt.Println("GetPendingGuides")

	if !userIsAllowed(userUUID, models.RoleAdmin, models.RoleSecretary) {
		return 403, `{"error": "No autorizado - Rol no permitido"}`
	}

	pickups, err := bd.GetPendingPickups()
	if err != nil {
		return 500, fmt.Sprintf(`{"Error": "Error al obtener guías por recoger: %s"}`, err.Error())
	}

	deliveries, err := bd.GetPendingDeliveries()
	if err != nil {
		return 500, fmt.Sprintf(`{"Error": "Error al obtener guías por entregar: %s"}`, err.Error())
	}

	response := models.PendingGuidesResponse{
		Pickups:    pickups,
		Deliveries: deliveries,
	}

	if response.Pickups == nil {
		response.Pickups = []models.PendingGuide{}
	}

	if response.Deliveries == nil {
		response.Deliveries = []models.PendingGuide{}
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetMyAssigmentStats obtiene estadisticas de asignaciones
func GetAssignmentStats(userUUID string) (int, string) {
	fmt.Printf("GetMyAssigmentStats")

	if !userIsAllowed(userUUID, models.RoleAdmin, models.RoleSecretary) {
		return 403, `{"error": "No autorizado - Rol no permitido"}`
	}

	stats, err := bd.GetAssignmentStats()
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener estadisticas de los entregadores: %s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(stats)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetAssignmentHistory obtiene el historial de una asignación
func GetAssignmentHistory(userUUID string, path string) (int, string) {
	fmt.Printf("GetAssignmentHistory empieza")

	if !userIsAllowed(userUUID, models.RoleAdmin, models.RoleSecretary) {
		return 403, `{"error": "No autorizado - Rol no permitido"}`
	}

	assignmentID := extractIDFromPathWithSuffix(path, "/assignments/", "/history")
	if assignmentID == 0 {
		return 400, `{"error": "ID de asignación inválido"}`
	}

	history, err := bd.GetAssignmentHistory(assignmentID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener el historial de la asignación %d: %s"}`, assignmentID, err.Error())
	}

	if history == nil {
		history = []models.AssignmentHistory{}
	}

	jsonResponse, err := json.Marshal(history)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// extractIDFromPath extrae el ID númerico de una ruta
func extractIDFromPath(path, prefix string) int64 {
	idStr := strings.TrimPrefix(path, prefix)
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return 0
	}
	return id
}

// hasRole verifica si el usuario tiene alguno de los roles permitidos
func hasRole(userRole models.UserRole, allowedRoles ...models.UserRole) bool {
	for _, role := range allowedRoles {
		if userRole == role {
			return true
		}
	}
	return false
}

func userIsAllowed(userUUID string, allowedRoles ...models.UserRole) bool {
	userRole, err := bd.GetUserRole(userUUID)
	if err != nil {
		fmt.Printf("Error obteniendo rol: %s\n", err.Error())
		return false
	}

	if !hasRole(userRole.Role, allowedRoles...) {
		return false
	}

	return true
}

// extractIDFromPathWithSuffix extrae el ID de una ruta con sufijo
func extractIDFromPathWithSuffix(path, prefix, suffix string) int64 {
	// Ejemplo: "assignments/123/reassign" -> 123
	path = strings.TrimPrefix(path, prefix)
	path = strings.TrimSuffix(path, suffix)
	id, err := strconv.ParseInt(path, 10, 64)
	if err != nil {
		return 0
	}
	return id
}
