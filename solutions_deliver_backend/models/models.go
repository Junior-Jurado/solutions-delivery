package models

type SecretRDSJson struct {
	Username  string `json:"username"`
	Password  string `json:"password"`
	Engine  string `json:"engine"`
	Host  string `json:"host"`
	Port  string `json:"port"`
	DbClusterIdentifier  string `json:"dbClusterIdentifier"`
}

type SignUp struct {
	UserEmail string `json:"UserEmail"`
	UserUUID string `json:"UserUUID"`
}
