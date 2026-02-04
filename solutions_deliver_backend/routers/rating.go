package routers

import (
	"encoding/json"
	"fmt"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/bd"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// CreateDeliveryRating crea una calificación para una entrega completada (CLIENT)
func CreateDeliveryRating(body string, userUUID string) (int, string) {
	fmt.Println("CreateDeliveryRating")

	if !userIsAllowed(userUUID, models.RoleClient) {
		return 403, `{"error": "No autorizado - Solo clientes pueden calificar entregas"}`
	}

	var req models.CreateRatingRequest
	err := json.Unmarshal([]byte(body), &req)
	if err != nil {
		return 400, fmt.Sprintf(`{"error": "Body inválido: %s"}`, err.Error())
	}

	// Validaciones
	if req.AssignmentID <= 0 {
		return 400, `{"error": "assignment_id es requerido"}`
	}

	if req.Rating < 1 || req.Rating > 5 {
		return 400, `{"error": "rating debe estar entre 1 y 5"}`
	}

	rating, err := bd.CreateDeliveryRating(req, userUUID)
	if err != nil {
		return 400, fmt.Sprintf(`{"error": "%s"}`, err.Error())
	}

	response := models.CreateRatingResponse{
		Success: true,
		Rating:  rating,
		Message: "Calificación registrada exitosamente",
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 201, string(jsonResponse)
}

// GetAssignmentRating obtiene la calificación de una asignación
func GetAssignmentRating(userUUID string, assignmentID int64) (int, string) {
	fmt.Printf("GetAssignmentRating -> AssignmentID: %d\n", assignmentID)

	rating, err := bd.GetRatingByAssignmentID(assignmentID)
	if err != nil {
		return 404, fmt.Sprintf(`{"error": "%s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(rating)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetDeliveryUserRatings obtiene las calificaciones de un repartidor (ADMIN, SECRETARY)
func GetDeliveryUserRatings(userUUID string, deliveryUserID string) (int, string) {
	fmt.Printf("GetDeliveryUserRatings -> DeliveryUserID: %s\n", deliveryUserID)

	if !userIsAllowed(userUUID, models.RoleAdmin, models.RoleSecretary) {
		return 403, `{"error": "No autorizado - Rol no permitido"}`
	}

	ratings, total, avgRating, err := bd.GetDeliveryUserRatings(deliveryUserID, 50)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "%s"}`, err.Error())
	}

	if ratings == nil {
		ratings = []models.DeliveryRating{}
	}

	response := models.RatingsListResponse{
		Ratings:   ratings,
		Total:     total,
		AvgRating: avgRating,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetMyPerformanceStats obtiene las estadísticas de rendimiento del repartidor actual
func GetMyPerformanceStats(userUUID string) (int, string) {
	fmt.Printf("GetMyPerformanceStats -> UserID: %s\n", userUUID)

	if !userIsAllowed(userUUID, models.RoleDelivery) {
		return 403, `{"error": "No autorizado - Rol no permitido"}`
	}

	stats, err := bd.GetDeliveryPerformanceStats(userUUID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener estadísticas: %s"}`, err.Error())
	}

	if stats.DailyPerformance == nil {
		stats.DailyPerformance = []models.DailyPerformance{}
	}
	if stats.RecentReviews == nil {
		stats.RecentReviews = []models.CustomerReview{}
	}

	jsonResponse, err := json.Marshal(stats)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetClientPendingRatings obtiene las entregas pendientes de calificar del cliente
func GetClientPendingRatings(userUUID string) (int, string) {
	fmt.Printf("GetClientPendingRatings -> UserID: %s\n", userUUID)

	if !userIsAllowed(userUUID, models.RoleClient) {
		return 403, `{"error": "No autorizado - Rol no permitido"}`
	}

	pending, err := bd.GetClientPendingRatings(userUUID)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener entregas pendientes: %s"}`, err.Error())
	}

	if pending == nil {
		pending = []models.ClientPendingRating{}
	}

	response := models.ClientPendingRatingsResponse{
		PendingRatings: pending,
		Total:          len(pending),
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}
