package bd

import (
	"database/sql"
	"fmt"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

func GetUserRole(userUUID string) (models.User, error) {
	fmt.Println("GetUserRole -> UserUUID: ", userUUID)

	var user models.User

	err := DbConnect()
	if err != nil {
		return user, err
	}
	defer Db.Close()

	query := `
		SELECT user_uuid, email, role
		FROM users 
		WHERE user_uuid = ?
	`

	row := Db.QueryRow(query, userUUID)
	err = row.Scan(&user.UserUUID, &user.UserEmail, &user.Role)

	if err != nil {
		if err == sql.ErrNoRows {
			return user, fmt.Errorf("Usuario no encontrado")
		}
		return user, err
	}

	return user, nil
}
