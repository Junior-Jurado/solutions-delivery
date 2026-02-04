package models

import "time"

// DeliveryRating representa una calificación de entrega
type DeliveryRating struct {
	RatingID       int64     `json:"rating_id"`
	AssignmentID   int64     `json:"assignment_id"`
	GuideID        int64     `json:"guide_id"`
	DeliveryUserID string    `json:"delivery_user_id"`
	DeliveryUserName string  `json:"delivery_user_name,omitempty"`
	ClientUserID   string    `json:"client_user_id"`
	ClientName     string    `json:"client_name,omitempty"`
	Rating         int       `json:"rating"` // 1-5
	Comment        string    `json:"comment,omitempty"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// CreateRatingRequest petición para crear una calificación
type CreateRatingRequest struct {
	AssignmentID int64  `json:"assignment_id"`
	GuideID      int64  `json:"guide_id"`
	Rating       int    `json:"rating"` // 1-5
	Comment      string `json:"comment,omitempty"`
}

// CreateRatingResponse respuesta de creación de calificación
type CreateRatingResponse struct {
	Success bool           `json:"success"`
	Rating  DeliveryRating `json:"rating"`
	Message string         `json:"message"`
}

// DeliveryPerformanceStats estadísticas de rendimiento del repartidor
type DeliveryPerformanceStats struct {
	DeliveriesThisWeek    int                `json:"deliveries_this_week"`
	DeliveriesLastWeek    int                `json:"deliveries_last_week"`
	DeliveriesChangePercent float64          `json:"deliveries_change_percent"`
	SuccessRate           float64            `json:"success_rate"`
	AvgTimeMinutes        int                `json:"avg_time_minutes"`
	AvgTimeLastWeek       int                `json:"avg_time_last_week"`
	AvgTimeChange         int                `json:"avg_time_change"`
	AvgRating             float64            `json:"avg_rating"`
	AvgRatingLastMonth    float64            `json:"avg_rating_last_month"`
	AvgRatingChange       float64            `json:"avg_rating_change"`
	TotalRatings          int                `json:"total_ratings"`
	DailyPerformance      []DailyPerformance `json:"daily_performance"`
	RecentReviews         []CustomerReview   `json:"recent_reviews"`
}

// DailyPerformance rendimiento diario
type DailyPerformance struct {
	Day        string `json:"day"`
	Deliveries int    `json:"deliveries"`
	Target     int    `json:"target"`
	Efficiency int    `json:"efficiency"`
}

// CustomerReview reseña de cliente
type CustomerReview struct {
	RatingID   int64  `json:"rating_id"`
	Rating     int    `json:"rating"`
	Comment    string `json:"comment"`
	ClientName string `json:"client"`
	Date       string `json:"date"`
	GuideID    int64  `json:"guide_id,omitempty"`
}

// RatingsListResponse respuesta de lista de calificaciones
type RatingsListResponse struct {
	Ratings []DeliveryRating `json:"ratings"`
	Total   int              `json:"total"`
	AvgRating float64        `json:"avg_rating"`
}

// ClientPendingRating guía pendiente de calificar por el cliente
type ClientPendingRating struct {
	AssignmentID     int64  `json:"assignment_id"`
	GuideID          int64  `json:"guide_id"`
	DeliveryUserID   string `json:"delivery_user_id"`
	DeliveryUserName string `json:"delivery_user_name"`
	CompletedAt      string `json:"completed_at"`
	ServiceType      string `json:"service_type"`
}

// ClientPendingRatingsResponse respuesta de guías pendientes de calificar
type ClientPendingRatingsResponse struct {
	PendingRatings []ClientPendingRating `json:"pending_ratings"`
	Total          int                   `json:"total"`
}
