package models

// UserRole roles de usuario
type UserRole string

const (
	RoleClient    UserRole = "CLIENT"
	RoleAdmin     UserRole = "ADMIN"
	RoleSecretary UserRole = "SECRETARY"
	RoleDelivery  UserRole = "DELIVERY"
)

type User struct {
	UserUUID       string   `json:"userUUID"`
	UserEmail      string   `json:"userEmail"`
	FullName       string   `json:"fullName"`
	Phone          string   `json:"phone"`
	TypeDocument   string   `json:"typeDocument"`
	NumberDocument string   `json:"numberDocument"`
	Role           UserRole `json:"role"`
}

// UserProfileUpdate campos permitidos para actualización de perfil (todos los roles)
type UserProfileUpdate struct {
	FullName string `json:"full_name,omitempty"`
	Phone    string `json:"phone,omitempty"`
}
