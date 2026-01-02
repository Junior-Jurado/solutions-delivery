package awsgo

import (
	"context"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
)

var (
	Ctx context.Context
	Cfg aws.Config
)

func InicializoAWS() {
	Ctx = context.Background()

	cfg, err := config.LoadDefaultConfig(
		Ctx,
		config.WithRegion("us-east-1"),
	)
	if err != nil {
		panic("Error AWS config: " + err.Error())
	}

	Cfg = cfg
}
