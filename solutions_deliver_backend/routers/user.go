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
	
	response, _ := json.Marshal(map[string] string {
		"userUUID": user.UserUUID,
		"role": user.Role,
	})

	return 200, string(response)
}

// func UpdateUser(body string, UserUUID string) (int, string) {
// 	var user models.User
// 	err := json.Unmarshal([]byte(body), &user)

// 	if err != nil {
// 		return 400, "Error en los datos recibidos " + err.Error()
// 	}

// 	if len(user.FullName) == 0 {
// 		return 400, "Debe especificar el nombre del usuario"
// 	}

// 	_, encontrado := bd.UserExists(UserUUID)
// 	if !encontrado {
// 		return 400, "No existe un usuario con ese UUID " + userUUID
// 	}

// 	err = bd.UpdateUser(user, UserUUID)
// 	if err != nil {
// 		return 400, "Error al actualizar el usuario " + UserUUID + " >" + err.Error()
// 	}

// 	return 200, "Update user OK"

// } 
