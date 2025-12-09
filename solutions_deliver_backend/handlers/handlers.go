package handlers

import (
	"fmt"
	"strconv"

	"github.com/Junior_Jurado/solutions_deliver_backend/auth"
	"github.com/aws/aws-lambda-go/events"
	// "strconv"
)

func Manejadores(path string, method string, body string, headers map[string]string, request events.APIGatewayV2HTTPRequest) (int, string) {
	fmt.Println("Voy a procesar " + path + " > " + method)

	id := request.PathParameters["id"]
	idn, _ := strconv.Atoi(id)

	isValid, statusCode, user := validateAuthorization(path, method, headers)

	if !isValid {
		return statusCode, user
	}

	fmt.Println("El path del indice 0 al 4 es: ",path[0:4])
	switch path[0:4] {
	case "user":
		return ProcesoUsers(body, path, method, user, id, request)

	case "guia":
		return ProcesoGuias(body, path, method, user, idn, request)
	}

	return 400, "Method Invalid"
}

func validateAuthorization(path string, method string, headers map[string]string) (bool, int, string) {
	if (path == "/login" && method == "POST") ||
	   (path == "/register" && method == "POST") {
		return true, 200, "OK"
	}

	token := headers["authorization"]

	if len(token) == 0 {
		return false, 401, "Token requerido"
	}

	isValid, err, message := auth.ValidarToken(token)
	
	if !isValid {
		if err != nil {
			fmt.Println("Error en el token " + err.Error())
			return false, 401, err.Error()
		}
		fmt.Println("Error en el token " + message)
		return false, 401, message
	} 

	return true, 200, message
}

func ProcesoUsers(body string, path  string, method string, user string, id string, request events.APIGatewayV2HTTPRequest) (int, string) {
	return 400, "Method Invalid"
}

func ProcesoGuias(body string, path  string, method string, user string, id int, request events.APIGatewayV2HTTPRequest) (int, string) {
	return 400, "Method Invalid"
}