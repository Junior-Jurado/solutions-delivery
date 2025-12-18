package models

type SecretRDSJson struct {
	Username  string `json:"username"`
	Password  string `json:"password"`
	Engine  string `json:"engine"`
	Host  string `json:"host"`
	Port  string `json:"port"`
	DBName string `json:"dbname"`
	DbClusterIdentifier  string `json:"dbClusterIdentifier"`
}

type SignUp struct {
	UserEmail string `json:"UserEmail"`
	UserUUID string `json:"UserUUID"`
}

type User struct {
	UserUUID string `json:"userUUID"`
	UserEmail string `json:"userEmail"`
	FullName string `json:"fullName"`
	Phone string `json:"phone"`
	TypeDocument string `json:"typeDocument"`
	NumberDocument string `json:"numberDocument"`
	Role string `json:"role"`
}
