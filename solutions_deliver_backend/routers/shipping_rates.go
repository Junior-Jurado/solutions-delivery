package routers

import (
	"encoding/json"
	"fmt"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/bd"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// CalculateShippingPrice calcula el precio de un envío
func CalculateShippingPrice(body string) (int, string) {
	fmt.Println("CalculateShippingPrice")

	var price float64
	var breakdown models.PriceBreakdown

	var request models.ShippingPriceRequest
	err := json.Unmarshal([]byte(body), &request)
	if err != nil {
		return 400, fmt.Sprintf(` {"error": "Body inválido: %s"}`, err.Error())
	}

	// Validaciones básicas
	if request.OriginCityID <= 0 {
		return 400, `{"error": "origin_city_id es requerido"}`
	}

	if request.DestinationCityID <= 0 {
		return 400, `{"error": "destination_city_id es requerido"}`
	}

	if request.WeightKg <= 0 {
		return 400, `{"error": "weight_kg debe ser mayor a 0"}`
	} else if request.WeightKg < 6 {
		price, breakdown, err = bd.CalculateShippingPriceMessaging(
			request.OriginCityID,
			request.DestinationCityID,
		)
	} else {
		price, breakdown, err = bd.CalculateShippingPricePackaging(
			request.OriginCityID,
			request.DestinationCityID,
			request.WeightKg,
			request.LengthCm,
			request.WidthCm,
			request.HeightCm,
		)
	}

	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error calculating shipping price: %s"}`, err.Error())
	}

	response := models.ShippingPriceResponse{
		Price: price,
		Breakdown: breakdown,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error serializing response: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}