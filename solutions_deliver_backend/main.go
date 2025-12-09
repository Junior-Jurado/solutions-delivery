package main

import (
	"context"
	"os"
	"strings"

	"github.com/Junior_Jurado/solutions_deliver_backend/awsgo"
	"github.com/Junior_Jurado/solutions_deliver_backend/bd"
	"github.com/Junior_Jurado/solutions_deliver_backend/handlers"
	"github.com/aws/aws-lambda-go/events"
	lambda "github.com/aws/aws-lambda-go/lambda"
)

// main es la función principal que se ejecuta al inicio del programa.
// Se encarga de inicializar la función lambda que se va a ejecutar.

func main() {
	lambda.Start(EjecutarLambda)
}

func EjecutarLambda(ctx context.Context, request events.APIGatewayV2HTTPRequest) (*events.APIGatewayProxyResponse, error) {
	awsgo.InicializoAWS()

	if !ValidoParametros() {
		panic("Error en los parámetros. Debe enviar 'SecretName', 'UrlPrefix'")
	}

	var res *events.APIGatewayProxyResponse
	prefix := os.Getenv("UrlPrefix")
	
	path := strings.Replace(request.RawPath, prefix, "", -1)
	method := request.RequestContext.HTTP.Method
	body := request.Body
	header := request.Headers

	bd.ReadSecret()

	status, message := handlers.Manejadores(path, method, body, header, request)

	headersResp := map[string] string {
		"Content-Type": "application/json",
	}
	res = &events.APIGatewayProxyResponse{
		StatusCode: status,
		Body: string(message),
		Headers: headersResp,
	}

	return res, nil

}

func ValidoParametros() bool{
	_, traeParametros := os.LookupEnv("SecretName")
	if !traeParametros {
		return traeParametros
	}

	_, traeParametros = os.LookupEnv("UrlPrefix")
	if !traeParametros {
		return traeParametros
	}

	return traeParametros
}