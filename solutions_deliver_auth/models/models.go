package models

type CognitoEvent struct {
	Version string `json:"version"`
	TriggerSource string `json:"triggerSource"`
	Region string `json:"region"`
	UserPoolId string `json:"userPoolId"`
	UserName string `json:"userName"`
	ClientId string `json:"clientId"`
	TriggerName string `json:"triggerName"`
	Request string `json:"request"`
	Response string `json:"response"`
}

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
