package routers

import (
	"encoding/json"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/bd"
)

func GetRole(userUUID string) (int, string) {

	user, err := bd.GetUserRole(userUUID)

	if err != nil {
		return 404, err.Error()
	}

	response, _ := json.Marshal(map[string]string{
		"userUUID": user.UserUUID,
		"role":     string(user.Role),
	})

	return 200, string(response)
}
