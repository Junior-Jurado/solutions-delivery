package handlers

import (
	"fmt"
	"strconv"
	"strings"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/routers"
	"github.com/aws/aws-lambda-go/events"
	// "strconv"
)

func Manejadores(path string, method string, body string, headers map[string]string, request events.APIGatewayV2HTTPRequest) (int, string) {
	fmt.Println("Voy a procesar " + path + " > " + method)

	id := request.PathParameters["id"]
	idn, _ := strconv.Atoi(id)

	isValid, statusCode, userUUID := validateAuthorization(path, method, request)

	if !isValid {
		return statusCode, userUUID
	}
	
	switch {
	case strings.HasPrefix(path, "/user"):
		return ProcesoUsers(body, path, method, userUUID, id, request)

	case strings.HasPrefix(path, "/guide"):
		return ProcesoGuias(body, path, method, userUUID, idn, request)
	
	case strings.HasPrefix(path, "/auth"):
		return ProcesoAutencaciones(body, path, method, userUUID, id, request)
	}
	

	return 400, "Method Invalid"
}

func validateAuthorization(path string, method string, request events.APIGatewayV2HTTPRequest) (bool, int, string) {
	// Preflight CORS
	if method == "OPTIONS" {
		return true, 200, "OK"
	}

	if (path == "/login" && method == "POST") ||
	   (path == "/register" && method == "POST") {
		return true, 200, "OK"
	}

	if request.RequestContext.Authorizer == nil ||
		request.RequestContext.Authorizer.JWT == nil ||
		request.RequestContext.Authorizer.JWT.Claims == nil {
		return false, 401, "No autorizado"
	}

	claims := request.RequestContext.Authorizer.JWT.Claims
	
	userUUID, ok := claims["sub"]
	if !ok {
		return false, 401, "Unauthorized"
	}

	return true, 200, userUUID
}

func ProcesoUsers(body string, path  string, method string, user string, id string, request events.APIGatewayV2HTTPRequest) (int, string) {
	return 400, "Method Invalid"
}

func ProcesoGuias(body string, path  string, method string, user string, id int, request events.APIGatewayV2HTTPRequest) (int, string) {
	return 400, "Method Invalid"
}

func ProcesoAutencaciones(body string, path  string, method string, user string, id string, request events.APIGatewayV2HTTPRequest) (int, string) {
	switch {
		case path == "/auth/role" && method == "GET":
			return routers.GetRole(user)
	}
	
	return 400, "Method Invalid"
}