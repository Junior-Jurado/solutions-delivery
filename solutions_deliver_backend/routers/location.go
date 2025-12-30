package routers

import (
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/bd"
	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// GetDepartments obtiene todos los departamentos
func GetDepartments() (int, string) {
	fmt.Println("GetDepartments")

	departments, err := bd.GetAllDepartments()
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener los departamentos: %s"}`, err.Error())
	}

	response := models.DepartmentsResponse{
		Departments: departments,
		Total:       len(departments),
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

func GetCities(deparmentIDStr  string) (int, string) {
	fmt.Println("GetCities -> DepartmentID: %s\n", deparmentIDStr)

	var cities []models.City
	var err error
	var filteredByDept *int64

	// Si viene filtro por departamento
	if deparmentIDStr != "" {
		departmentID, parseErr := strconv.ParseInt(deparmentIDStr, 10, 64)

		if parseErr != nil {
			return 400, fmt.Sprintf(`{"error": "ID de departamento inválido"}`)
		}

		// Verificar que el departamento existe
		if !bd.DepartmentExists(departmentID) {
			return 404, fmt.Sprintf(`{"error": "Departamento no encontrado"}`)
		}

		cities, err = bd.GetCitiesByDepartment(departmentID)
		filteredByDept = &departmentID
	} else {
		cities, err = bd.GetAllCities()
	}

	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al obtener las ciudades: %s"}`, err.Error())
	}

	response := models.CitiesResponse {
		Cities: cities,
		Total: len(cities),
		FilteredByDepartment: filteredByDept,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// GetCityByID obtiene una ciudad especifica
func GetCityByID(cityID int64) (int, string) {
	fmt.Println("GetCityByID -> CityID: %d\n", cityID)

	city, err := bd.GetCityByID(cityID)
	if err != nil {
		if err.Error() == "Ciudad no encontrada" {
			return 404, fmt.Sprintf(`{"error": "Ciudad no encontrada"}`)
		}
		return 500, fmt.Sprintf(`{"error": "Error al obtener la ciudad: %s"}`, err.Error())
	}

	response := models.CityResponse{
		City: city,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}

// SearchCities busca ciudades por nombre
func SearchCities(searchTerm string) (int, string) {
	fmt.Printf("SearchCities -> SearchTerm: %s\n", searchTerm)

	// Validar que el término de búsqueda tenga al menos 2 caracteres
	if len(searchTerm) < 2 {
		return 400, `{"error": "El término de búsqueda debe tener al menos 2 caracteres"}`
	}

	cities, err := bd.SearchCities(searchTerm)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al buscar ciudades: %s"}`, err.Error())
	}

	response := models.SearchCitiesResponse{
		Cities:     cities,
		Total:      len(cities),
		SearchTerm: searchTerm,
	}

	jsonResponse, err := json.Marshal(response)
	if err != nil {
		return 500, fmt.Sprintf(`{"error": "Error al serializar respuesta: %s"}`, err.Error())
	}

	return 200, string(jsonResponse)
}