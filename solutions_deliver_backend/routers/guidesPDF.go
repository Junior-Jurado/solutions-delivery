package routers

import (
	"encoding/json"
	"fmt"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/bd"
)

// DownloadGuidePDFResponse respuesta para descarga de PDF
type DownloadGuidePDFResponse struct {
	URL       string `json:"url"`
	ExpiresIn int    `json:"expires_in"` // minutos
	Message   string `json:"message"`
}

// GetGuidePDFURL genera una URL pre-firmada para descargar el PDF de una guía
func GetGuidePDFURL(guideID int64) (int, string) {
	fmt.Printf("GetGuidePDFURL -> GuideID: %d\n", guideID)

	// Verificar que la guía existe
	if !bd.GuideExists(guideID) {
		fmt.Printf("ERROR: Guía %d no encontrada\n", guideID)
		return 404, `{"error": "Guía no encontrada"}`
	}

	// Obtener información del PDF - AHORA SOLO RETORNA S3_KEY
	s3Key, err := bd.GetGuidePDFInfo(guideID)
	if err != nil {
		fmt.Printf("ERROR al obtener PDF info: %v\n", err)
		return 404, fmt.Sprintf(`{"error": "PDF no encontrado: %s"}`, err.Error())
	}

	fmt.Printf("S3 Key obtenido: %s\n", s3Key)

	// GENERAR URL PRE-FIRMADA FRESCA cada vez
	presignedURL, err := bd.GetPresignedURL(s3Key, 30) // 30 minutos
	if err != nil {
		fmt.Printf("ERROR al generar URL pre-firmada: %v\n", err)
		return 500, fmt.Sprintf(`{"error": "Error al generar URL de descarga: %s"}`, err.Error())
	}

	response := DownloadGuidePDFResponse{
		URL:       presignedURL,
		ExpiresIn: 30,
		Message:   "URL generada exitosamente",
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		fmt.Printf("ERROR al serializar respuesta: %v\n", err)
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	fmt.Printf("URL pre-firmada generada y enviada exitosamente\n")
	return 200, string(jsonResponse)
}

// DownloadGuidePDFDirect descarga directamente el PDF y lo retorna como bytes
func DownloadGuidePDFDirect(guideID int64) (int, []byte, string, error) {
	fmt.Printf("DownloadGuidePDFDirect -> GuideID: %d\n", guideID)

	// Verificar que la guía existe
	if !bd.GuideExists(guideID) {
		return 404, nil, "", fmt.Errorf("Guía no encontrada")
	}

	// Obtener información del PDF
	s3Key, err := bd.GetGuidePDFInfo(guideID)
	if err != nil {
		return 404, nil, "", fmt.Errorf("PDF no encontrado: %s", err.Error())
	}

	// Descargar archivo de S3
	fileData, contentType, err := bd.DownloadFileFromS3(s3Key)
	if err != nil {
		return 500, nil, "", fmt.Errorf("Error al descargar PDF: %s", err.Error())
	}

	return 200, fileData, contentType, nil
}