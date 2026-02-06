package routers

import (
	"encoding/json"
	"fmt"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/bd"
)

func GetRole(userUUID string) (int, string) {
	fmt.Printf("GetRole -> UserUUID: %s\n", userUUID)

	user, err := bd.GetUserRole(userUUID)

	if err != nil {
		return 404, err.Error()
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
