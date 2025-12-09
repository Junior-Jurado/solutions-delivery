package bd

import (
	"fmt"

	"github.com/Junior_Jurado/solutions_deliver/models"
	"github.com/Junior_Jurado/solutions_deliver/tools"
	_ "github.com/go-sql-driver/mysql"
)

func SignUp(sig models.SignUp) error {
	fmt.Println("Comienza Registro")
	err := DbConnect()

	if err != nil {
		return nil
	}
	defer Db.Close()


	query := `
		INSERT INTO users (user_uuid, email, created_at, last_login)
		VALUES (?, ?, ?, ?)
	`
	fmt.Println(query)

	_, err = Db.Exec(query,
		sig.UserUUID,
		sig.UserEmail,
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