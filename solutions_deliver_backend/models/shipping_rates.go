package models

// ShippingPriceRequest petición de cotización
type ShippingPriceRequest struct {
	OriginCityID      int     `json:"origin_city_id"`
	DestinationCityID int     `json:"destination_city_id"`
	WeightKg          float32 `json:"weight_kg"`
	LengthCm          float32 `json:"length_cm"`
	WidthCm           float32 `json:"width_cm"`
	HeightCm          float32 `json:"height_cm"`
}

// ShippingPriceResponse respuesta de cotización
type ShippingPriceResponse struct {
	Price     float64        `json:"price"`
	Breakdown PriceBreakdown `json:"breakdown"`
}

// PriceBreakdown desglose del precio
type PriceBreakdown struct {
	BasePrice    float64 `json:"base_price"`   // Precio base según tarifa
	WeightCharge float64 `json:"weight_price"` // Cargo por peso
	Total        float64 `json:"total"`
}

// ShippingRate tarifa de envío
type ShippingRate struct {
	ID                int64   `json:"id"`
	OriginCityID      int64   `json:"origin_city_id"`
	DestinationCityID int64   `json:"destination_city_id"`
	Route             string  `json:"route"`
	TravelFrequency   string  `json:"travel_frequency"`
	MinDispatchKg     int     `json:"min_dispatch_kg"`
	PricePerKg        float32 `json:"price_per_kg"`
	MinValue          float32 `json:"min_value"`
	EffectiveDate     string  `json:"effective_date"`
}

// Price override de precio (solo admin)
type PriceOverride struct {
	OriginalPrice float64 `json:"original_price"`
	NewPrice      float64 `json:"new_price"`
	Reason        string  `json:"reason"`
	OverriddenBy  string  `json:"overridden_by"`
}
