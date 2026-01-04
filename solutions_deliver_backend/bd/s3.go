package bd

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"time"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/awsgo"
	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

var (
	s3Client     *s3.Client
	s3BucketName string
)

// InitS3Client inicializa el cliente de S3 UNA SOLA VEZ
func InitS3Client(bucketName string) error {
	if s3Client != nil {
		fmt.Printf("Cliente S3 ya inicializado (warm start), bucket: %s\n", s3BucketName)
		return nil
	}

	if bucketName == "" {
		return fmt.Errorf("bucket S3 no definido")
	}

	s3BucketName = bucketName
	s3Client = s3.NewFromConfig(awsgo.Cfg)

	fmt.Printf("Cliente S3 inicializado exitosamente, bucket: %s\n", s3BucketName)
	return nil
}

// GetS3BucketName retorna el nombre del bucket configurado
func GetS3BucketName() string {
	return s3BucketName
}

// GetPresignedURL genera una URL pre-firmada para descargar un archivo de S3
func GetPresignedURL(s3Key string, expirationMinutes int) (string, error) {
	fmt.Printf("GetPresignedURL -> Bucket: %s, Key: %s, Expiration: %d min\n", s3BucketName, s3Key, expirationMinutes)

	if s3Client == nil {
		return "", fmt.Errorf("cliente S3 no inicializado")
	}

	if s3Key == "" {
		return "", fmt.Errorf("s3Key vacío")
	}

	// IMPORTANTE: Crear un nuevo PresignClient cada vez
	presignClient := s3.NewPresignClient(s3Client)

	ctx := context.Background()

	result, err := presignClient.PresignGetObject(
		ctx,
		&s3.GetObjectInput{
			Bucket: aws.String(s3BucketName),
			Key:    aws.String(s3Key),
		},
		func(opts *s3.PresignOptions) {
			opts.Expires = time.Duration(expirationMinutes) * time.Minute
		},
	)

	if err != nil {
		return "", fmt.Errorf("error al generar URL pre-firmada: %v", err)
	}

	fmt.Printf("URL pre-firmada generada exitosamente\n")
	fmt.Printf("URL (primeros 100 chars): %s...\n", result.URL[:min(100, len(result.URL))])

	return result.URL, nil
}

// DownloadFileFromS3 descarga un archivo de S3 y retorna los bytes
func DownloadFileFromS3(s3Key string) ([]byte, string, error) {
	fmt.Printf("DownloadFileFromS3 -> Bucket: %s, Key: %s\n", s3BucketName, s3Key)

	if s3Client == nil {
		return nil, "", fmt.Errorf("cliente S3 no inicializado")
	}

	if s3Key == "" {
		return nil, "", fmt.Errorf("s3Key vacío")
	}

	ctx := context.Background()

	result, err := s3Client.GetObject(
		ctx,
		&s3.GetObjectInput{
			Bucket: aws.String(s3BucketName),
			Key:    aws.String(s3Key),
		},
	)
	if err != nil {
		return nil, "", fmt.Errorf("error al descargar archivo de S3: %v", err)
	}
	defer result.Body.Close()

	data, err := io.ReadAll(result.Body)
	if err != nil {
		return nil, "", fmt.Errorf("error leyendo archivo S3: %v", err)
	}

	contentType := "application/pdf"
	if result.ContentType != nil {
		contentType = *result.ContentType
	}

	fmt.Printf("Archivo descargado exitosamente, tamaño: %d bytes, tipo: %s\n", len(data), contentType)

	return data, contentType, nil
}

// UploadFileToS3 sube un archivo a S3
func UploadFileToS3(s3Key string, data []byte, contentType string) error {
	fmt.Printf("UploadFileToS3 -> Bucket: %s, Key: %s, Size: %d bytes\n", s3BucketName, s3Key, len(data))

	if s3Client == nil {
		return fmt.Errorf("cliente S3 no inicializado")
	}

	if s3Key == "" {
		return fmt.Errorf("s3Key vacío")
	}

	ctx := context.Background()

	_, err := s3Client.PutObject(
		ctx,
		&s3.PutObjectInput{
			Bucket:      aws.String(s3BucketName),
			Key:         aws.String(s3Key),
			Body:        bytes.NewReader(data),
			ContentType: aws.String(contentType),
		},
	)

	if err != nil {
		return fmt.Errorf("error al subir archivo a S3: %v", err)
	}

	fmt.Printf("Archivo subido exitosamente a S3: %s\n", s3Key)
	return nil
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}