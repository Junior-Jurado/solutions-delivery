package bd

import (
	"database/sql"
	"fmt"
	"os"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/secretm"
	_ "github.com/go-sql-driver/mysql"
)

var SecretModel models.SecretRDSJson
var err error
var Db *sql.DB

func ReadSecret() error {
	SecretModel, err = secretm.GetSecret(os.Getenv("SecretName"))
	return err
}

func DbConnect() error {
	Db, err = sql.Open("mysql", ConnStr(SecretModel))
	if err != nil {
		fmt.Println(err.Error())
		return err
	}

	err = Db.Ping()
	if err != nil {
		fmt.Println(err.Error())
		return err
	}
	fmt.Println("Conexión exitosa de la BD")
	return err
}

func ConnStr(claves models.SecretRDSJson) string {
	var dbUser, authToken, dbEndpoint, dbName string
	dbUser = claves.Username
	authToken = claves.Password
	dbEndpoint = claves.Host
	dbName = claves.DBName

	// CAMBIO IMPORTANTE: Agregar zona horaria de Colombia
	return fmt.Sprintf(
		"%s:%s@tcp(%s)/%s?allowCleartextPasswords=true&parseTime=true&loc=America%%2FBogota",
		dbUser, authToken, dbEndpoint, dbName,
	)
}

func UserExists(UserUUID string) (bool, error) {
	fmt.Println("Comienza UserExists " + UserUUID)

	err := DbConnect()
	if err != nil {
		return false, err
	}
	defer Db.Close()

	query := "SELECT UserUUID FROM users WHERE UserUUID = ?"

	rows, err := Db.Query(query, UserUUID)
	if err != nil {
		return false, err
	}
	var valor string
	rows.Next()
	rows.Scan(&valor)

	fmt.Println("UserExists > Ejecución exitosa - valor devuelto " + valor)

	if valor == "1" {
		return true, nil
	}
	return false, nil
}
