package bd

import (
	"database/sql"
	"fmt"
	"math"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// CalculateShippingPriceMessaging calcula el precio de un envio de mensajeria
func CalculateShippingPriceMessaging(originCityID, destinationCityID int) (float64, models.PriceBreakdown, error) {
	var breakdown models.PriceBreakdown

	err := DbConnect()
	if err != nil {
		return 0, breakdown, err
	}
	defer Db.Close()

	// 1. Obtener tarifa base
	rate, err := getShippingRate(originCityID, destinationCityID)
	if err != nil {
		return 0, breakdown, err
	}

	breakdown.BasePrice = float64(rate.PricePerKg)
	breakdown.WeightCharge = 0
	breakdown.Total = float64(rate.MinValue)

	return float64(rate.MinValue), breakdown, nil
}

// CalculateShippingPricePackaging calcula el precio de un envio de embalaje
func CalculateShippingPricePackaging(
	originCityID int, 
	destinationCityID int, 
	weightKg float32, 
	lengthCm float32, 
	widthCm float32, 
	heightCm float32,
) (float64, models.PriceBreakdown, error) {
	var price float64
	var breakdown models.PriceBreakdown

	err := DbConnect()
	if err != nil {
		return 0, breakdown, err
	}
	defer Db.Close()

	// 1. Obtener tarifa base
	rate, err := getShippingRate(originCityID, destinationCityID)
	if err != nil {
		return 0, breakdown, err
	}

	// 2. Calcular precio base por peso
	dimensions := float64(lengthCm) * float64(widthCm) * float64(heightCm)

	// 3. Elegir el mayor entre peso real y volumétrico
	billableWeight := math.Max(float64(weightKg), dimensions)

	// 4. Calcular precio usando el peso facturable
	price = billableWeight * 400 * float64(rate.PricePerKg)

	breakdown.BasePrice = float64(rate.PricePerKg)
	breakdown.WeightCharge = billableWeight
	breakdown.Total = price

	return price, breakdown, nil
}

// getShippingRate obtiene la tarifa para una ruta específica
func getShippingRate(originCityID, destinationCityID int) (models.ShippingRate, error) {
	var rate models.ShippingRate

	query := `
		SELECT 
			id,
			origin_city_id,
			destination_city_id,
			route,
			travel_frequency,
			min_dispatch_kg,
			price_per_kg,
			min_value,
			effective_date
		FROM shipping_rates
		WHERE origin_city_id = ? 
		AND destination_city_id = ?
		LIMIT 1
	`

	err := Db.QueryRow(query, originCityID, destinationCityID).Scan(
		&rate.ID,
		&rate.OriginCityID,
		&rate.DestinationCityID,
		&rate.Route,
		&rate.TravelFrequency,
		&rate.MinDispatchKg,
		&rate.PricePerKg,
		&rate.MinValue,
		&rate.EffectiveDate,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return rate, fmt.Errorf("no shipping rate found")
		}
		return rate, err
	}
	return rate, nil
}