package utils

import (
	"context"
	"encoding/json"
	"fmt"
	"os"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/lambda"
	"github.com/aws/aws-sdk-go-v2/service/lambda/types"
)

// LambdaResponse representa la respuesta de la Lambda de Node.js
type LambdaResponse struct {
	StatusCode int                 `json:"statusCode"`
	Headers    map[string]string   `json:"headers"`
	Body       string              `json:"body"` // El body viene como string JSON
}

// PDFGenerationResponse representa el body parseado
type PDFGenerationResponse struct {
	CloseID int64  `json:"close_id"`
	PDFURL  string `json:"pdf_url"`
	S3Key   string `json:"s3_key"`
	PDFSize int    `json:"pdf_size"`
	Message string `json:"message"`
	Error   string `json:"error,omitempty"`
}

func GenerateCashClosePDFWithLambda(close models.CashClose, details []models.CashCloseDetail) (string, string, error) {
	fmt.Println("GenerateCashClosePDFWithLambda - Llamando a Lambda de Node.js")

	lambdaFunctionName := os.Getenv("PDF_LAMBDA_FUNCTION")
	if lambdaFunctionName == "" {
		return "", "", fmt.Errorf("PDF_LAMBDA_FUNCTION environment variable not set")
	}

	// Cargar configuración de AWS
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		return "", "", fmt.Errorf("error loading AWS config: %w", err)
	}

	lambdaClient := lambda.NewFromConfig(cfg)

	// Preparar payload
	payload := map[string]interface{}{
		"type":       "CASH_CLOSE",
		"close_data": close,
		"details":    details,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return "", "", fmt.Errorf("error marshaling payload: %w", err)
	}

	fmt.Printf("Payload para Lambda: %s\n", string(payloadBytes))

	// Invocar Lambda de forma SINCRÓNICA
	result, err := lambdaClient.Invoke(context.TODO(), &lambda.InvokeInput{
		FunctionName:   &lambdaFunctionName,
		Payload:        payloadBytes,
		InvocationType: types.InvocationTypeRequestResponse, // Sincrónico
	})

	if err != nil {
		return "", "", fmt.Errorf("error invoking Lambda: %w", err)
	}

	// Parsear la respuesta de Lambda
	var lambdaResp LambdaResponse
	if err := json.Unmarshal(result.Payload, &lambdaResp); err != nil {
		return "", "", fmt.Errorf("error parsing Lambda response: %w", err)
	}

	fmt.Printf("Respuesta de Lambda (status: %d): %s\n", lambdaResp.StatusCode, lambdaResp.Body)

	// Verificar si hubo error en la Lambda
	if lambdaResp.StatusCode != 200 {
		return "", "", fmt.Errorf("Lambda retornó status %d: %s", lambdaResp.StatusCode, lambdaResp.Body)
	}

	// Parsear el body (que viene como string JSON)
	var pdfResp PDFGenerationResponse
	if err := json.Unmarshal([]byte(lambdaResp.Body), &pdfResp); err != nil {
		return "", "", fmt.Errorf("error parsing PDF response body: %w", err)
	}

	// Verificar que tengamos los datos necesarios
	if pdfResp.PDFURL == "" || pdfResp.S3Key == "" {
		return "", "", fmt.Errorf("PDF URL or S3 Key missing in response")
	}

	fmt.Printf("PDF generado exitosamente - URL: %s, S3 Key: %s\n", pdfResp.PDFURL, pdfResp.S3Key)

	return pdfResp.PDFURL, pdfResp.S3Key, nil
}