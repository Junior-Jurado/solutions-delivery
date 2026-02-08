package main

import (
	"context"
	"os"
	"strings"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/awsgo"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/bd"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/handlers"
	"github.com/aws/aws-lambda-go/events"
	lambda "github.com/aws/aws-lambda-go/lambda"
)

// main es la función principal que se ejecuta al inicio del programa.
// Se encarga de inicializar la función lambda que se va a ejecutar.

func main() {
	awsgo.InicializoAWS()

	bucket := os.Getenv("S3_BUCKET_NAME")
	if bucket == "" {
		panic("S3_BUCKET_NAME no definido")
	}

	err := bd.InitS3Client(bucket)
	if err != nil {
		panic(err)
	}

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

	err := bd.ReadSecret()
	if err != nil {
		return &events.APIGatewayProxyResponse{
			StatusCode: 500,
			Body:       `{"error": "Error interno: no se pudo leer configuración de BD"}`,
			Headers:    map[string]string{"Content-Type": "application/json"},
		}, nil
	}

	status, message := handlers.Manejadores(path, method, body, header, request)

	headersResp := map[string]string{
		"Content-Type": "application/json",
	}
	res = &events.APIGatewayProxyResponse{
		StatusCode: status,
		Body:       string(message),
		Headers:    headersResp,
	}

	return res, nil

}

func ValidoParametros() bool {
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
