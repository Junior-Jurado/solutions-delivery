package models

// Department representa un departamento de Colombia
type Department struct {
	ID       int64  `json:"id"`
	DaneCode string `json:"dane_code"`
	Name     string `json:"name"`
}

// City representa una ciudad de Colombia
type City struct {
	ID             int64  `json:"id"`
	DaneCode       string `json:"dane_code"`
	Name           string `json:"name"`
	DepartmentID   int64  `json:"department_id"`
	DepartmentName string `json:"department_name,omitempty"`
	DepartmentCode string `json:"department_code,omitempty"`
	FullName       string `json:"full_name,omitempty"`
}

// DepartmentWithCities representa un departamento con sus ciudades
type DepartmentWithCities struct {
	DepartmentID   int64  `json:"department_id"`
	DepartmentName string `json:"department_name"`
	DepartmentCode string `json:"department_code"`
	Cities         []City `json:"cities"`
}

// DepartmentsResponse respuesta para lista de departamentos
type DepartmentsResponse struct {
	Departments []Department `json:"departments"`
	Total       int          `json:"total"`
}

// CitiesResponse respuesta para lista de ciudades
type CitiesResponse struct {
	Cities               []City `json:"cities"`
	Total                int    `json:"total"`
	FilteredByDepartment *int64 `json:"filtered_by_department,omitempty"`
}

// CityResponse respuesta para una ciudad específica
type CityResponse struct {
	City City `json:"city"`
}

// SearchCitiesResponse respuesta para búsqueda de ciudades
type SearchCitiesResponse struct {
	Cities     []City `json:"cities"`
	Total      int    `json:"total"`
	SearchTerm string `json:"search_term"`
}
