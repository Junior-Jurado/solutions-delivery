package auth

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

type TokenJson struct {
	Sub       string
	Event_id  string
	Token_use string
	Scope     string
	Auth_time int
	Iss       string
	Exp       int
	Iat       int
	Client_id string
	Username  string
}

func ValidarToken(token string) (bool, string, error) {
	parts := strings.Split(token, ".")

	if len(parts) != 3 {
		fmt.Println("El token no es válido")
		return false, "El token no es válido", nil
	}

	userInfo, err := base64.StdEncoding.DecodeString(parts[1])
	if err != nil {
		fmt.Println("Error al decodificar el token ", err.Error())
		return false, err.Error(), err
	}

	var tokenJson TokenJson
	err = json.Unmarshal(userInfo, &tokenJson)
	if err != nil {
		fmt.Println("Error al decodificar a la estructura JSON ", err.Error())
		return false, err.Error(), err
	}

	hora_actual := time.Now()
	hora_expiracion := time.Unix(int64(tokenJson.Exp), 0)

	if hora_expiracion.Before(hora_actual) {
		fmt.Println("El token ha expirado, fecha de expiracion: ", hora_expiracion.String())
		return false, "El token ha expirado", nil
	}

	return true, string(tokenJson.Username), nil
}
