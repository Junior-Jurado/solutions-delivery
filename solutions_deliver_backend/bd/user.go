package bd

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// Zona horaria de Colombia
var userColombiaLoc *time.Location

func init() {
	var err error
	userColombiaLoc, err = time.LoadLocation("America/Bogota")
	if err != nil {
		userColombiaLoc = time.FixedZone("COT", -5*60*60)
	}
}

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

// UpdateLastLogin actualiza la fecha de último login del usuario
func UpdateLastLogin(userUUID string) error {
	fmt.Printf("UpdateLastLogin -> UserUUID: %s\n", userUUID)

	err := DbConnect()
	if err != nil {
		return err
	}
	defer Db.Close()

	now := time.Now().In(userColombiaLoc)

	query := `UPDATE users SET last_login = ? WHERE user_uuid = ?`
	_, err = Db.Exec(query, now, userUUID)
	if err != nil {
		fmt.Printf("Error updating last_login: %s\n", err.Error())
		return err
	}

	fmt.Printf("Last login updated for user %s at %s\n", userUUID, now.Format(time.RFC3339))
	return nil
}
