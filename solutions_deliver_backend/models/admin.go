package models

// AdminDashboardStats estadísticas completas del dashboard admin
type AdminDashboardStats struct {
	// KPIs principales
	ShipmentsToday     int     `json:"shipments_today"`
	ShipmentsYesterday int     `json:"shipments_yesterday"`
	Delivered          int     `json:"delivered"`
	DeliveredYesterday int     `json:"delivered_yesterday"`
	DeliveryRate       float64 `json:"delivery_rate"`
	Pending            int     `json:"pending"`
	PendingInRoute     int     `json:"pending_in_route"`
	PendingInOffice    int     `json:"pending_in_office"`
	RevenueToday       float64 `json:"revenue_today"`
	RevenueYesterday   float64 `json:"revenue_yesterday"`

	// Métricas de entregas
	AverageDeliveryTime float64 `json:"average_delivery_time"` // Tiempo promedio en horas
	SatisfactionRate    float64 `json:"satisfaction_rate"`     // Porcentaje de satisfacción

	// Distribución por estado
	StatusDistribution []StatusCount `json:"status_distribution"`

	// Rendimiento de entregadores
	WorkerPerformance []WorkerStats `json:"worker_performance"`

	// Entregas en tiempo real
	RealtimeDeliveries []RealtimeDelivery `json:"realtime_deliveries"`

	// Rutas activas
	ActiveRoutes []ActiveRoute `json:"active_routes"`

	// Alertas del sistema
	Alerts []SystemAlert `json:"alerts"`
}

// StatusCount conteo por estado
type StatusCount struct {
	Status     string  `json:"status"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

// WorkerStats estadísticas de un entregador
type WorkerStats struct {
	UserID          string  `json:"user_id"`
	Name            string  `json:"name"`
	DeliveriesToday int     `json:"deliveries_today"`
	CompletedToday  int     `json:"completed_today"`
	Efficiency      float64 `json:"efficiency"`
	AvgRating       float64 `json:"avg_rating"`
}

// RealtimeDelivery entrega en tiempo real
type RealtimeDelivery struct {
	GuideID        int64  `json:"guide_id"`
	Customer       string `json:"customer"`
	Address        string `json:"address"`
	Status         string `json:"status"`
	DeliveryPerson string `json:"delivery_person"`
	AssignedAt     string `json:"assigned_at"`
	ServiceType    string `json:"service_type"`
}

// ActiveRoute ruta activa de un entregador
type ActiveRoute struct {
	UserID    string `json:"user_id"`
	Name      string `json:"name"`
	Packages  int    `json:"packages"`
	Completed int    `json:"completed"`
	Zone      string `json:"zone"`
	Status    string `json:"status"`
}

// SystemAlert alerta del sistema
type SystemAlert struct {
	ID          string `json:"id"`
	Type        string `json:"type"` // warning, error, info
	Title       string `json:"title"`
	Description string `json:"description"`
	Timestamp   string `json:"timestamp"`
	GuideID     *int64 `json:"guide_id,omitempty"`
	UserID      string `json:"user_id,omitempty"`
}

// Employee representa un empleado
type Employee struct {
	UserUUID       string   `json:"user_uuid"`
	FullName       string   `json:"full_name"`
	Email          string   `json:"email"`
	Phone          string   `json:"phone"`
	Role           UserRole `json:"role"`
	Status         string   `json:"status"` // Activo, Inactivo, En ruta
	Performance    string   `json:"performance,omitempty"`
	CreatedAt      string   `json:"created_at"`
	LastLogin      string   `json:"last_login,omitempty"`
	TotalCompleted int      `json:"total_completed,omitempty"`
	TypeDocument   string   `json:"type_document,omitempty"`
	NumberDocument string   `json:"number_document,omitempty"`
}

// EmployeesListResponse respuesta de lista de empleados
type EmployeesListResponse struct {
	Employees []Employee `json:"employees"`
	Total     int        `json:"total"`
}

// CreateEmployeeRequest petición para crear empleado
type CreateEmployeeRequest struct {
	FullName       string   `json:"full_name"`
	Email          string   `json:"email"`
	Phone          string   `json:"phone"`
	Role           UserRole `json:"role"`
	TypeDocument   string   `json:"type_document"`
	NumberDocument string   `json:"number_document"`
}

// UpdateEmployeeRequest petición para actualizar empleado
type UpdateEmployeeRequest struct {
	FullName string   `json:"full_name,omitempty"`
	Phone    string   `json:"phone,omitempty"`
	Role     UserRole `json:"role,omitempty"`
}

// ClientRanking representa un cliente en el ranking
type ClientRanking struct {
	UserUUID     string  `json:"user_uuid"`
	FullName     string  `json:"full_name"`
	Email        string  `json:"email"`
	Phone        string  `json:"phone,omitempty"`
	TotalGuides  int     `json:"total_guides"`
	TotalSpent   float64 `json:"total_spent"`
	AvgValue     float64 `json:"avg_value"`
	LastActivity string  `json:"last_activity"`
}

// ClientRankingFilters filtros para el ranking de clientes
type ClientRankingFilters struct {
	SortBy    string `json:"sort_by"`    // total_guides, total_spent, avg_value, last_activity
	Order     string `json:"order"`      // asc, desc
	Limit     int    `json:"limit"`      // número máximo de resultados
	MinGuides int    `json:"min_guides"` // mínimo de guías
	DateFrom  string `json:"date_from"`  // fecha desde
	DateTo    string `json:"date_to"`    // fecha hasta
}

// ClientRankingResponse respuesta del ranking de clientes
type ClientRankingResponse struct {
	Clients []ClientRanking `json:"clients"`
	Total   int             `json:"total"`
}
