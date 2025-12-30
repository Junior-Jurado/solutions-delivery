# API de Ubicaciones - Colombia

API REST para gestión de departamentos y ciudades de Colombia.

## 📋 Tabla de Contenidos
- [Endpoints](#endpoints)
- [Modelos de Datos](#modelos-de-datos)
- [Ejemplos de Respuestas](#ejemplos-de-respuestas)
- [Códigos de Estado](#códigos-de-estado)
- [Instalación](#instalación)

---

## 🌐 Endpoints

### 1. Obtener Departamentos

```http
GET /locations/departments
```

**Descripción:** Obtiene la lista completa de departamentos de Colombia.

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "departments": [
    {
      "id": 1,
      "dane_code": "05",
      "name": "Antioquia"
    },
    {
      "id": 2,
      "dane_code": "08",
      "name": "Atlántico"
    }
  ],
  "total": 33
}
```

---

### 2. Obtener Ciudades

```http
GET /locations/cities
GET /locations/cities?department_id=1
```

**Descripción:** Obtiene todas las ciudades o filtradas por departamento.

**Query Parameters:**
- `department_id` (opcional): ID del departamento para filtrar

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "cities": [
    {
      "id": 1,
      "dane_code": "5001000",
      "name": "MEDELLÍN",
      "department_id": 1,
      "department_name": "Antioquia",
      "department_code": "05"
    }
  ],
  "total": 150,
  "filtered_by_department": 1
}
```

---

### 3. Obtener Ciudad por ID

```http
GET /locations/cities/{id}
```

**Descripción:** Obtiene información detallada de una ciudad específica.

**Path Parameters:**
- `id` (requerido): ID de la ciudad

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "city": {
    "id": 1,
    "dane_code": "5001000",
    "name": "MEDELLÍN",
    "department_id": 1,
    "department_name": "Antioquia",
    "department_code": "05"
  }
}
```

**Error (404):**
```json
{
  "error": "Ciudad no encontrada"
}
```

---

### 4. Buscar Ciudades

```http
GET /locations/search?q={término}
```

**Descripción:** Busca ciudades por nombre (autocompletado).

**Query Parameters:**
- `q` (requerido): Término de búsqueda (mínimo 2 caracteres)

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "cities": [
    {
      "id": 1,
      "dane_code": "5001000",
      "name": "MEDELLÍN",
      "department_id": 1,
      "department_name": "Antioquia",
      "department_code": "05",
      "full_name": "MEDELLÍN, Antioquia"
    }
  ],
  "total": 5,
  "search_term": "Med"
}
```

**Error (400):**
```json
{
  "error": "El término de búsqueda debe tener al menos 2 caracteres"
}
```

---

## 📦 Modelos de Datos

### Department
```go
type Department struct {
    ID       int64  `json:"id"`
    DaneCode string `json:"dane_code"`
    Name     string `json:"name"`
}
```

### City
```go
type City struct {
    ID             int64  `json:"id"`
    DaneCode       string `json:"dane_code"`
    Name           string `json:"name"`
    DepartmentID   int64  `json:"department_id"`
    DepartmentName string `json:"department_name,omitempty"`
    DepartmentCode string `json:"department_code,omitempty"`
    FullName       string `json:"full_name,omitempty"`
}
```

---

## 📊 Ejemplos de Respuestas

### Todas las ciudades de un departamento

**Request:**
```bash
curl -X GET \
  'https://api.example.com/locations/cities?department_id=1' \
  -H 'Authorization: Bearer {token}'
```

**Response:**
```json
{
  "cities": [
    {
      "id": 1,
      "dane_code": "5001000",
      "name": "MEDELLÍN",
      "department_id": 1,
      "department_name": "Antioquia",
      "department_code": "05"
    },
    {
      "id": 2,
      "dane_code": "5002000",
      "name": "ABEJORRAL",
      "department_id": 1,
      "department_name": "Antioquia",
      "department_code": "05"
    }
  ],
  "total": 125,
  "filtered_by_department": 1
}
```

### Búsqueda de ciudades

**Request:**
```bash
curl -X GET \
  'https://api.example.com/locations/search?q=Bogo' \
  -H 'Authorization: Bearer {token}'
```

**Response:**
```json
{
  "cities": [
    {
      "id": 150,
      "dane_code": "11001000",
      "name": "BOGOTÁ D.C.",
      "department_id": 3,
      "department_name": "Bogotá D.C.",
      "department_code": "11",
      "full_name": "BOGOTÁ D.C., Bogotá D.C."
    }
  ],
  "total": 1,
  "search_term": "Bogo"
}
```

---

## ⚠️ Códigos de Estado

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 400 | Bad Request - Parámetros inválidos |
| 401 | Unauthorized - Token inválido o ausente |
| 404 | Not Found - Recurso no encontrado |
| 500 | Internal Server Error - Error del servidor |

---

## 🚀 Instalación

### Estructura de archivos

```
solutions_deliver_backend/
├── models/
│   └── location.go          # Estructuras de datos
├── bd/
│   └── locations.go         # Consultas a la base de datos
├── routers/
│   └── locations.go         # Controladores
└── handlers/
    └── handler.go           # Router principal
```

### Dependencias

```bash
go get github.com/aws/aws-lambda-go/events
go get github.com/aws/aws-lambda-go/lambda
```

### Ejecutar tests

```bash
# Ejecutar todos los tests
go test ./routers/...

# Ejecutar test específico
go test -v -run TestGetDepartments ./routers/

# Ejecutar benchmarks
go test -bench=. ./routers/
```

---

## 🔒 Autenticación

Todos los endpoints requieren un token JWT válido en el header `Authorization`:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

El token debe ser obtenido previamente a través del endpoint de autenticación.

---

## 💡 Casos de Uso

### Frontend - Selector de Ciudad en Cascada

1. **Cargar departamentos** → `GET /locations/departments`
2. **Usuario selecciona departamento** → Guardar `department_id`
3. **Cargar ciudades del departamento** → `GET /locations/cities?department_id={id}`
4. **Usuario selecciona ciudad** → Enviar `city_id` al backend

### Frontend - Autocompletado de Búsqueda

1. **Usuario escribe en input** → Esperar 300ms (debounce)
2. **Hacer búsqueda** → `GET /locations/search?q={término}`
3. **Mostrar resultados** → Desplegar dropdown con ciudades
4. **Usuario selecciona** → Guardar `city_id`

---

## 🐛 Debugging

### Logs útiles

La aplicación imprime logs informativos en cada operación:

```
GetAllDepartments
GetCitiesByDepartment -> DepartmentID: 1
SearchCities -> SearchTerm: Med
```

### Problemas comunes

**Error: "Departamento no encontrado"**
- Verificar que el `department_id` existe en la base de datos

**Error: "El término de búsqueda debe tener al menos 2 caracteres"**
- Enviar al menos 2 caracteres en el parámetro `q`

**Error: "No autorizado"**
- Verificar que el token JWT es válido y no ha expirado

---

## 📝 Notas

- La búsqueda está limitada a 50 resultados
- Los nombres de ciudades se guardan en MAYÚSCULAS
- El campo `full_name` solo está disponible en búsquedas
- Los códigos DANE son únicos por ciudad