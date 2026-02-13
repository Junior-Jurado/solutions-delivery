package bd

import (
	"fmt"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_auth/models"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_auth/tools"
	_ "github.com/go-sql-driver/mysql"
)

func SignUp(sig models.SignUp) error {
	fmt.Println("Comienza Registro")
	err := DbConnect()

	if err != nil {
		fmt.Println("Error de conexión a BD:", err.Error())
		return err
	}
	defer Db.Close()

	query := `
		INSERT INTO users (
			user_uuid,
			full_name,
			email,
			phone,
			type_document,
			number_document,
			role,
			created_at,
			last_login
		)
		VALUES (?, ?, ?, ?, ?, ?, 'client', ?, ?)
		ON DUPLICATE KEY UPDATE last_login = VALUES(last_login)
	`

	fmt.Println(query)

	_, err = Db.Exec(query,
		sig.UserUUID,
		sig.FullName,
		sig.UserEmail,
		sig.Phone,
		sig.TypeDocument,
		sig.NumberDocument,
		tools.FechaMySQL(),
		tools.FechaMySQL(),
	)
	if err != nil {
		fmt.Println("Error al insertar usuario:", err.Error())
		return err
	}

	fmt.Println("Sign Up > Usuario registrado correctamente")
	return err
}
