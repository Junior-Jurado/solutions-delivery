package routers

import (
	"encoding/json"
	"fmt"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/bd"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// GetUserProfile obtiene el perfil del usuario (cualquier rol)
func GetUserProfile(userUUID string) (int, string) {
	fmt.Printf("GetUserProfile -> UserUUID: %s\n", userUUID)

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

// UpdateUserProfile actualiza solo full_name y phone del usuario (cualquier rol)
func UpdateUserProfile(body string, userUUID string) (int, string) {
	fmt.Printf("UpdateUserProfile -> UserUUID: %s\n", userUUID)

	var updateData models.UserProfileUpdate
	err := json.Unmarshal([]byte(body), &updateData)
	if err != nil {
		return 400, fmt.Sprintf(`{"error": "Body inválido: %s"}`, err.Error())
	}

	if updateData.FullName == "" && updateData.Phone == "" {
		return 400, `{"error": "Debe enviar al menos full_name o phone"}`
	}

	// Solo permitir actualizar full_name y phone
	strictUpdate := models.ClientProfileUpdate{
		FullName: updateData.FullName,
		Phone:    updateData.Phone,
	}

	updatedProfile, err := bd.UpdateUserProfile(userUUID, strictUpdate)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al actualizar perfil: %s"}`, err.Error())
	}

	jsonResponse, err := json.Marshal(updatedProfile)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

func GetRole(userUUID string) (int, string) {
	fmt.Printf("GetRole -> UserUUID: %s\n", userUUID)

	user, err := bd.GetUserRole(userUUID)

	if err != nil {
		fmt.Printf("GetRole -> Error: %s\n", err.Error())
		errorResponse, _ := json.Marshal(map[string]string{
			"error":    err.Error(),
			"userUUID": userUUID,
		})
		return 404, string(errorResponse)
	}

	// Actualizar last_login (no crítico, solo log si falla)
	if updateErr := bd.UpdateLastLogin(userUUID); updateErr != nil {
		fmt.Printf("Warning: Could not update last_login for user %s: %s\n", userUUID, updateErr.Error())
	}

	response, _ := json.Marshal(map[string]string{
		"userUUID": user.UserUUID,
		"role":     string(user.Role),
	})

	return 200, string(response)
}
