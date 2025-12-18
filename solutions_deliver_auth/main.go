package main

import (
	"context"
	"errors"
	"fmt"
	"os"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_auth/awsgo"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_auth/bd"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_auth/models"
	"github.com/aws/aws-lambda-go/events"
	lambda "github.com/aws/aws-lambda-go/lambda"
)

func main(){
	lambda.Start(AuthLambda)
}

func AuthLambda(ctx context.Context, event events.CognitoEventUserPoolsPostConfirmation) (events.CognitoEventUserPoolsPostConfirmation, error) {
// AuthLambda es la función principal que se ejecuta al inicio del programa.
// Se encarga de inicializar la función lambda que se va a ejecutar.
	awsgo.InicializoAWS()
	// Inicializa AWS

	if !ValidoParametros() {
	// Verifica que se estan enviando los parámetros necesarios
		fmt.Println("Error en los parámetros. debe enviar 'SecretName'")
		err := errors.New("Error en los parámetros debe enviar SecretName")
		return event, err
	}

	var datos models.SignUp
	// Crea un objeto para almacenar los datos del usuario

	for row, att := range event.Request.UserAttributes {
	// Recorre los atributos del usuario y los almacena en el objeto
		switch row {
		case "email":
			datos.UserEmail = att
			fmt.Println("Email = " + datos.UserEmail)
		
		case "sub": 
			datos.UserUUID = att
			fmt.Println("Sub = " + datos.UserUUID)
		
		case "phone_number":
			datos.Phone = att
			fmt.Println("Phone = " + datos.Phone)
		
		case "custom:full_name":
			datos.FullName = att
			fmt.Println("FullName = " + datos.FullName)
		
		case "custom:type_document":
			datos.TypeDocument = att
			fmt.Println("TypeDocument = " + datos.TypeDocument)
		
		case "custom:number_document":
			datos.NumberDocument = att
			fmt.Println("NumberDocument = " + datos.NumberDocument)
		}

		
	}

	err := bd.ReadSecret()
	// Lee el secreto de la base de datos

	if err != nil {
		fmt.Println("Error al leer el Secret: " + err.Error())
		return event, err
	}

	err = bd.SignUp(datos)
	// Realiza el registro del usuario en la base de datos
	return event, err
}

func ValidoParametros() bool {
	var traeParametro bool
	_, traeParametro = os.LookupEnv("SecretName")
	return traeParametro
}