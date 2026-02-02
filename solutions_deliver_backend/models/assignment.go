package models

import "time"

// AssignmentType tipo de asignación
type AssignmentType string

const (
	AssignmentPickup   AssignmentType = "PICKUP"   // Recoger paquete
	AssignmentDelivery AssignmentType = "DELIVERY" // Entregar paquete
)

// AssignmentStatus estado de la asignación
type AssignmentStatus string

const (
	AssignmentPending    AssignmentStatus = "PENDING"
	AssignmentInProgress AssignmentStatus = "IN_PROGRESS"
	AssignmentCompleted  AssignmentStatus = "COMPLETED"
	AssignmentCancelled  AssignmentStatus = "CANCELLED"
)

// HistoryAction acciones en el historial
type HistoryAction string

const (
	ActionCreated      HistoryAction = "CREATED"
	ActionReassigned   HistoryAction = "REASSIGNED"
	ActionStatusChange HistoryAction = "STATUS_CHANGE"
	ActionCancelled    HistoryAction = "CANCELLED"
)

// DeliveryAssignment representa una asignación de entregador
type DeliveryAssignment struct {
	AssignmentID     int64            `json:"assignment_id"`
	GuideID          int64            `json:"guide_id"`
	DeliveryUserID   string           `json:"delivery_user_id"`
	DeliveryUserName string           `json:"delivery_user_name,omitempty"`
	AssignmentType   AssignmentType   `json:"assignment_type"`
	Status           AssignmentStatus `json:"status"`
	Notes            string           `json:"notes,omitempty"`
	AssignedBy       string           `json:"assigned_by"`
	AssignedByName   string           `json:"assigned_by_name,omitempty"`
	AssignedAt       time.Time        `json:"assigned_at"`
	UpdatedAt        time.Time        `json:"updated_at"`
	CompletedAt      *time.Time       `json:"completed_at,omitempty"`

	// Información de la guía
	Guide *GuideInfo `json:"guide,omitempty"`
}

// GuideInfo información resumida de la guía
type GuideInfo struct {
	GuideID             int64  `json:"guide_id"`
	ServiceType         string `json:"service_type"`
	CurrentStatus       string `json:"current_status"`
	OriginCityName      string `json:"origin_city_name"`
	DestinationCityName string `json:"destination_city_name"`
	SenderName          string `json:"sender_name,omitempty"`
	SenderAddress       string `json:"sender_address,omitempty"`
	SenderPhone         string `json:"sender_phone,omitempty"`
	ReceiverName        string `json:"receiver_name,omitempty"`
	ReceiverAddress     string `json:"receiver_address,omitempty"`
	ReceiverPhone       string `json:"receiver_phone,omitempty"`
	CreatedAt           string `json:"created_at"`
}

// AssignmentHistory historial de cambios en asignaciones
type AssignmentHistory struct {
	HistoryID              int64         `json:"history_id"`
	AssignmentID           int64         `json:"assignment_id"`
	Action                 HistoryAction `json:"action"`
	PreviousDeliveryUserID string        `json:"previous_delivery_user_id,omitempty"`
	NewDeliveryUserID      string        `json:"new_delivery_user_id,omitempty"`
	PreviousStatus         string        `json:"previous_status,omitempty"`
	NewStatus              string        `json:"new_status,omitempty"`
	ChangedBy               string        `json:"change_by"`
	ChangedByName           string        `json:"change_by_name,omitempty"`
	ChangedAt               time.Time     `json:"change_at"`
	Notes                  string        `json:"notes,omitempty"`
}

// DeliveryUser representa un entregador disponible
type DeliveryUser struct {
	UserID           string `json:"user_id"`
	FullName         string `json:"full_name"`
	Email            string `json:"email"`
	Phone            string `json:"phone"`
	ActivePickups    int    `json:"active_pickups"`
	ActiveDeliveries int    `json:"active_deliveries"`
	TotalCompleted   int    `json:"total_completed"`
}

// PendingGuide guía pendiente de asignación
type PendingGuide struct {
	GuideID             int64          `json:"guide_id"`
	ServiceType         string         `json:"service_type"`
	CurrentStatus       string         `json:"current_status"`
	OriginCityName      string         `json:"origin_city_name"`
	DestinationCityName string         `json:"destination_city_name"`
	ContactName         string         `json:"contact_name"`
	ContactAddress      string         `json:"contact_address"`
	ContactPhone        string         `json:"contact_phone"`
	CreatedAt           string         `json:"created_at"`
	AssignmentType      AssignmentType `json:"assignment_type"`
}

// REQUEST/RESPONSE MODELS

// CreateAssignmentRequest peticion de creación de una asignación
type CreateAssignmentRequest struct {
	GuideID        int64          `json:"guide_id"`
	DeliveryUserID string         `json:"delivery_user_id"`
	AssignmentType AssignmentType `json:"assignment_type"`
	Notes          string         `json:"notes,omitempty"`
}

// CancelAssignmentResponse respuesta de creación asignación
type CreateAssignmentResponse struct {
	Success      bool               `json:"success"`
	AssignmentID int64              `json:"assignment_id"`
	Assignment   DeliveryAssignment `json:"assignment"`
	Message      string             `json:"message"`
}

// ReassignRequest petición para reasignar
type ReassignRequest struct {
	NewDeliveryUserID string `json:"new_delivery_user_id"`
	Notes             string `json:"notes,omitempty"`
}

// ReassignResponse respuesta de reasignación
type ReassignResponse struct {
	Success      bool               `json:"success"`
	AssignmentID int64              `json:"assignment_id"`
	Assignment   DeliveryAssignment `json:"assignment"`
	Message      string             `json:"message"`
}

// UpdateStatusRequest petición para actualizar estado
type UpdateAssignmentStatusRequest struct {
	Status AssignmentStatus `json:"status"`
	Notes  string           `json:"notes,omitempty"`
}

// UpdateStatusResponse respuesta de actualización
type UpdateAssignmentStatusResponse struct {
	Success    bool               `json:"success"`
	Assignment DeliveryAssignment `json:"assignment"`
	Message    string             `json:"message"`
}

// AssignmentFilters filtros para búsqueda
type AssignmentFilters struct {
	Status         AssignmentStatus `json:"status,omitempty"`
	AssignmentType AssignmentType   `json:"assignment_type,omitempty"`
	DeliveryUserID string           `json:"delivery_user_id,omitempty"`
	GuideID        *int64           `json:"guide_id,omitempty"`
	DateFrom       *time.Time       `json:"date_from,omitempty"`
	DateTo         *time.Time       `json:"date_to,omitempty"`
	Limit          int              `json:"limit"`
	Offset         int              `json:"offset"`
}

// AssignmentsListResponse respuesta de lista de asignaciones
type AssignmentsListResponse struct {
	Assignments []DeliveryAssignment `json:"assignments"`
	Total       int                  `json:"total"`
	Limit       int                  `json:"limit"`
	Offset      int                  `json:"offset"`
}

// DeliveryUsersListResponse respuesta de la lista de entregadores
type DeliveryUsersListResponse struct {
	DeliveryUsers []DeliveryUser `json:"delivery_users"`
	Total         int            `json:"total"`
}

// PendingGuidesResponse respuesta de guías pendientes
type PendingGuidesResponse struct {
	Pickups    []PendingGuide `json:"pickups"`
	Deliveries []PendingGuide `json:"deliveries"`
}

// AssignmentStatsResponse estadísticas de asignaciones
type AssignmentStatsResponse struct {
	TotalAssignments     int            `json:"total_assignments"`
	PendingPickups       int            `json:"pending_pickups"`
	PendingDeliveries    int            `json:"pending_deliveries"`
	InProgressPickups    int            `json:"in_progress_pickups"`
	InProgressDeliveries int            `json:"in_progress_deliveries"`
	CompletedToday       int            `json:"completed_today"`
	ByDeliveryUser       map[string]int `json:"by_delivery_user"`
}

// MyAssignmentsResponse respuesta de mis asignaciones (para DELIVERY)
type MyAssignmentsResponse struct {
	Pickups    []DeliveryAssignment `json:"pickups"`
	Deliveries []DeliveryAssignment `json:"deliveries"`
	Stats      MyAssignmentStats    `json:"stats"`
}

// MyAssignmentStats estadísticas personales
type MyAssignmentStats struct {
	PendingPickups       int `json:"pending_pickups"`
	PendingDeliveries    int `json:"pending_deliveries"`
	InProgressPickups    int `json:"in_progress_pickups"`
	InProgressDeliveries int `json:"in_progress_deliveries"`
	CompletedToday       int `json:"completed_today"`
	CompletedThisWeek    int `json:"completed_this_week"`
}
