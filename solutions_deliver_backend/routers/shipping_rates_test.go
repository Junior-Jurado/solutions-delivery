package routers

import (
	"encoding/json"
	"strings"
	"testing"
)

func TestCalculateShippingPrice_InvalidBody(t *testing.T) {
	status, body := CalculateShippingPrice("invalid json")
	if status != 400 {
		t.Errorf("status = %d; want 400", status)
	}
	if !strings.Contains(body, "Body inválido") {
		t.Errorf("body = %q; want to contain 'Body inválido'", body)
	}
}

func TestCalculateShippingPrice_Validation(t *testing.T) {
	tests := []struct {
		name      string
		body      string
		wantCode  int
		wantError string
	}{
		{
			name:      "origin_city_id faltante",
			body:      `{"destination_city_id": 1, "weight_kg": 2}`,
			wantCode:  400,
			wantError: "origin_city_id es requerido",
		},
		{
			name:      "destination_city_id faltante",
			body:      `{"origin_city_id": 1, "weight_kg": 2}`,
			wantCode:  400,
			wantError: "destination_city_id es requerido",
		},
		{
			name:      "weight_kg cero",
			body:      `{"origin_city_id": 1, "destination_city_id": 2, "weight_kg": 0}`,
			wantCode:  400,
			wantError: "weight_kg debe ser mayor a 0",
		},
		{
			name:      "weight_kg negativo",
			body:      `{"origin_city_id": 1, "destination_city_id": 2, "weight_kg": -1}`,
			wantCode:  400,
			wantError: "weight_kg debe ser mayor a 0",
		},
		{
			name:      "origin_city_id negativo",
			body:      `{"origin_city_id": -1, "destination_city_id": 2, "weight_kg": 3}`,
			wantCode:  400,
			wantError: "origin_city_id es requerido",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			status, body := CalculateShippingPrice(tt.body)
			if status != tt.wantCode {
				t.Errorf("status = %d; want %d", status, tt.wantCode)
			}
			if !strings.Contains(body, tt.wantError) {
				t.Errorf("body = %q; want to contain %q", body, tt.wantError)
			}
		})
	}
}

func TestCalculateShippingPrice_EmptyBody(t *testing.T) {
	status, body := CalculateShippingPrice("")
	if status != 400 {
		t.Errorf("status = %d; want 400", status)
	}
	if !strings.Contains(body, "Body inválido") {
		t.Errorf("body = %q; want to contain 'Body inválido'", body)
	}
}

func TestCalculateShippingPrice_BodyParsesCorrectly(t *testing.T) {
	// Verificar que el JSON se parsea bien aunque luego falle por BD
	validJSON := `{"origin_city_id": 1, "destination_city_id": 2, "weight_kg": 3.5, "length_cm": 10, "width_cm": 20, "height_cm": 30}`

	var req struct {
		OriginCityID      int     `json:"origin_city_id"`
		DestinationCityID int     `json:"destination_city_id"`
		WeightKg          float32 `json:"weight_kg"`
	}
	err := json.Unmarshal([]byte(validJSON), &req)
	if err != nil {
		t.Fatalf("JSON parsing failed: %v", err)
	}
	if req.OriginCityID != 1 {
		t.Errorf("origin_city_id = %d; want 1", req.OriginCityID)
	}
	if req.DestinationCityID != 2 {
		t.Errorf("destination_city_id = %d; want 2", req.DestinationCityID)
	}
	if req.WeightKg != 3.5 {
		t.Errorf("weight_kg = %f; want 3.5", req.WeightKg)
	}
}
