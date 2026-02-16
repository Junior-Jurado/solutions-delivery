package handlers

import (
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

// helper para construir un request autenticado con JWT claims
func authenticatedRequest(pathParams map[string]string) events.APIGatewayV2HTTPRequest {
	req := events.APIGatewayV2HTTPRequest{
		PathParameters: pathParams,
		RequestContext: events.APIGatewayV2HTTPRequestContext{
			Authorizer: &events.APIGatewayV2HTTPRequestContextAuthorizerDescription{
				JWT: &events.APIGatewayV2HTTPRequestContextAuthorizerJWTDescription{
					Claims: map[string]string{
						"sub": "test-user-uuid",
					},
				},
			},
		},
	}
	return req
}

func TestValidateAuthorization(t *testing.T) {
	tests := []struct {
		name       string
		path       string
		method     string
		request    events.APIGatewayV2HTTPRequest
		wantValid  bool
		wantStatus int
	}{
		{
			name:       "OPTIONS siempre pasa",
			path:       "/any-path",
			method:     "OPTIONS",
			request:    events.APIGatewayV2HTTPRequest{},
			wantValid:  true,
			wantStatus: 200,
		},
		{
			name:       "POST /login no requiere auth",
			path:       "/login",
			method:     "POST",
			request:    events.APIGatewayV2HTTPRequest{},
			wantValid:  true,
			wantStatus: 200,
		},
		{
			name:       "POST /register no requiere auth",
			path:       "/register",
			method:     "POST",
			request:    events.APIGatewayV2HTTPRequest{},
			wantValid:  true,
			wantStatus: 200,
		},
		{
			name:       "Sin authorizer retorna 401",
			path:       "/guides",
			method:     "GET",
			request:    events.APIGatewayV2HTTPRequest{},
			wantValid:  false,
			wantStatus: 401,
		},
		{
			name:   "Sin JWT claims retorna 401",
			path:   "/guides",
			method: "GET",
			request: events.APIGatewayV2HTTPRequest{
				RequestContext: events.APIGatewayV2HTTPRequestContext{
					Authorizer: &events.APIGatewayV2HTTPRequestContextAuthorizerDescription{},
				},
			},
			wantValid:  false,
			wantStatus: 401,
		},
		{
			name:   "Sin sub claim retorna 401",
			path:   "/guides",
			method: "GET",
			request: events.APIGatewayV2HTTPRequest{
				RequestContext: events.APIGatewayV2HTTPRequestContext{
					Authorizer: &events.APIGatewayV2HTTPRequestContextAuthorizerDescription{
						JWT: &events.APIGatewayV2HTTPRequestContextAuthorizerJWTDescription{
							Claims: map[string]string{"email": "test@test.com"},
						},
					},
				},
			},
			wantValid:  false,
			wantStatus: 401,
		},
		{
			name:       "Con JWT válido retorna userUUID",
			path:       "/guides",
			method:     "GET",
			request:    authenticatedRequest(nil),
			wantValid:  true,
			wantStatus: 200,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			isValid, statusCode, _ := validateAuthorization(tt.path, tt.method, tt.request)
			if isValid != tt.wantValid {
				t.Errorf("validateAuthorization() isValid = %v, want %v", isValid, tt.wantValid)
			}
			if statusCode != tt.wantStatus {
				t.Errorf("validateAuthorization() statusCode = %v, want %v", statusCode, tt.wantStatus)
			}
		})
	}
}

func TestManejadoresRouting(t *testing.T) {
	// Estos tests validan que el router despacha correctamente cada prefijo.
	// Las funciones downstream llamarán a BD y fallarán, pero NO deben retornar
	// "Method Invalid" (400) para rutas válidas con auth.
	// Nota: algunos sub-routers retornan 404 en vez de 400 para rutas no encontradas.

	tests := []struct {
		name           string
		path           string
		method         string
		dontWantStatus int
		dontWantBody   string
	}{
		{"admin route", "/admin/stats", "GET", 400, "Method Invalid"},
		{"guides route", "/guides", "GET", 400, "Method Invalid"},
		{"auth route", "/auth/role", "GET", 400, "Method Invalid"},
		{"locations route", "/locations/departments", "GET", 400, "Method Invalid"},
		{"cash-close route", "/cash-close", "GET", 400, "Method Invalid"},
		{"client route", "/client/profile", "GET", 400, "Method Invalid"},
		{"frequent-parties route", "/frequent-parties/stats", "GET", 400, "Method Invalid"},
		{"assignments route", "/assignments", "GET", 400, "Method Invalid"},
		{"shipping route", "/shipping/calculate", "POST", 400, "Method Invalid"},
		{"user route", "/user/profile", "GET", 400, "Method Invalid"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := authenticatedRequest(map[string]string{})
			status, body := Manejadores(tt.path, tt.method, "", map[string]string{}, req)

			// La ruta debe ser reconocida (no retornar "Method Invalid" del switch default)
			if status == tt.dontWantStatus && body == tt.dontWantBody {
				t.Errorf("Manejadores(%q, %q) = (%d, %q); ruta no reconocida por el router",
					tt.path, tt.method, status, body)
			}
		})
	}
}

func TestManejadoresUnknownPath(t *testing.T) {
	req := authenticatedRequest(map[string]string{})
	status, body := Manejadores("/unknown-path", "GET", "", map[string]string{}, req)

	if status != 400 || body != "Method Invalid" {
		t.Errorf("Manejadores('/unknown-path', 'GET') = (%d, %q); want (400, 'Method Invalid')",
			status, body)
	}
}

func TestManejadoresStripApiV1Prefix(t *testing.T) {
	// Verifica que /api/v1 se elimina correctamente del path
	req := authenticatedRequest(map[string]string{})
	status, body := Manejadores("/api/v1/user/profile", "GET", "", map[string]string{}, req)

	// No debe retornar "Method Invalid" ya que /user/profile es una ruta válida
	if status == 400 && body == "Method Invalid" {
		t.Error("Manejadores no eliminó correctamente el prefijo /api/v1")
	}
}

func TestManejadoresUnauthenticated(t *testing.T) {
	req := events.APIGatewayV2HTTPRequest{}
	status, _ := Manejadores("/guides", "GET", "", map[string]string{}, req)

	if status != 401 {
		t.Errorf("Manejadores sin auth = %d; want 401", status)
	}
}

func TestExtractAssignmentIDFromPath(t *testing.T) {
	tests := []struct {
		path   string
		suffix string
		want   int64
	}{
		{"/assignments/123/rating", "/rating", 123},
		{"/assignments/456/history", "/history", 456},
		{"/assignments/abc/rating", "/rating", 0},
		{"/assignments//rating", "/rating", 0},
	}

	for _, tt := range tests {
		t.Run(tt.path, func(t *testing.T) {
			got := extractAssignmentIDFromPath(tt.path, tt.suffix)
			if got != tt.want {
				t.Errorf("extractAssignmentIDFromPath(%q, %q) = %d, want %d",
					tt.path, tt.suffix, got, tt.want)
			}
		})
	}
}
