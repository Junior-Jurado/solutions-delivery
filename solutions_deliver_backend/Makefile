.PHONY: fmt vet lint test cover build check clean

## fmt: Formatea el código Go
fmt:
	gofmt -w -s .

## vet: Analiza código en busca de errores comunes
vet:
	go vet ./...

## lint: Ejecuta fmt + vet
lint: fmt vet

## test: Ejecuta tests (con race detector si CGO está disponible)
RACE := $(shell go env CGO_ENABLED 2>/dev/null)
ifeq ($(RACE),1)
  RACE_FLAG := -race
else
  RACE_FLAG :=
endif

test:
	go test ./... -v $(RACE_FLAG) -count=1

## cover: Ejecuta tests con reporte de cobertura
cover:
	go test ./... -v $(RACE_FLAG) -count=1 -coverprofile=coverage.out
	go tool cover -func=coverage.out
	@rm -f coverage.out

## build: Compila el binario para Lambda (Linux ARM64)
build:
	GOOS=linux GOARCH=arm64 go build -tags lambda.norpc -o bootstrap main.go

## check: Ejecuta lint + test (usado por pre-commit)
check: lint test

## clean: Limpia artefactos de build
clean:
	@rm -f bootstrap coverage.out
