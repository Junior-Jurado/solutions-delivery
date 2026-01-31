package bd

import (
	"database/sql"
	"fmt"

	"github.com/Junior_Jurado/solutions_delivery/solutions_deliver_backend/models"
)

// GetAllDepartments obtiene todos los departamentos
func GetAllDepartments() ([]models.Department, error) {
	fmt.Println("GetAllDepartments")

	var departments []models.Department

	err := DbConnect()
	if err != nil {
		return departments, err
	}
	defer Db.Close()

	query := `
		SELECT id, dane_code, name
		FROM departments
		ORDER BY name ASC
	`

	rows, err := Db.Query(query)
	if err != nil {
		return departments, err
	}
	defer rows.Close()

	for rows.Next() {
		var dept models.Department
		err := rows.Scan(&dept.ID, &dept.DaneCode, &dept.Name)
		if err != nil {
			return departments, err
		}
		departments = append(departments, dept)
	}

	return departments, nil
}

// GetAllCities obtiene todas las ciudades con información del departamento
func GetAllCities() ([]models.City, error) {
	fmt.Println("GetAllCities")

	var cities []models.City

	err := DbConnect()
	if err != nil {
		return cities, err
	}
	defer Db.Close()

	query := `
		SELECT 
			c.id,
			c.dane_code,
			c.name,
			c.department_id,
			d.name AS department_name,
			d.dane_code AS department_code
		FROM cities c
		INNER JOIN departments d ON c.department_id = d.id
		ORDER BY c.name ASC
	`

	rows, err := Db.Query(query)
	if err != nil {
		return cities, err
	}
	defer rows.Close()

	for rows.Next() {
		var city models.City
		err := rows.Scan(
			&city.ID,
			&city.DaneCode,
			&city.Name,
			&city.DepartmentID,
			&city.DepartmentName,
			&city.DepartmentCode,
		)

		if err != nil {
			return cities, err
		}

		cities = append(cities, city)
	}

	return cities, nil
}

// GetCitiesByDepartment obtiene ciudades filtradas por departamento
func GetCitiesByDepartment(departmentID int64) ([]models.City, error) {
	fmt.Printf("GetCitiesByDepartment -> DepartmentID: %d\n", departmentID)

	var cities []models.City

	err := DbConnect()
	if err != nil {
		return cities, err
	}
	defer Db.Close()

	query := `
		SELECT 
			c.id,
			c.dane_code,
			c.name,
			c.department_id,
			d.name AS department_name,
			d.dane_code AS department_code
		FROM cities c
		INNER JOIN departments d ON c.department_id = d.id
		WHERE c.department_id = ?
		ORDER BY c.name ASC
	`

	rows, err := Db.Query(query, departmentID)
	if err != nil {
		return cities, err
	}
	defer rows.Close()

	for rows.Next() {
		var city models.City

		err := rows.Scan(
			&city.ID,
			&city.DaneCode,
			&city.Name,
			&city.DepartmentID,
			&city.DepartmentName,
			&city.DepartmentCode,
		)
		if err != nil {
			return cities, err
		}

		cities = append(cities, city)
	}
	return cities, nil
}

// GetCityByID obtiene una ciudad por ID
func GetCityByID(cityID int64) (models.City, error) {
	fmt.Printf("GetCityByID -> CityID: %d\n", cityID)

	var city models.City

	err := DbConnect()
	if err != nil {
		return city, err
	}
	defer Db.Close()

	query := `
		SELECT 
			c.id,
			c.dane_code,
			c.name,
			c.department_id,
			d.name AS department_name,
			d.dane_code AS department_code
		FROM cities c
		INNER JOIN departments d ON c.department_id = d.id
		WHERE c.id = ?
	`

	row := Db.QueryRow(query, cityID)
	err = row.Scan(
		&city.ID,
		&city.DaneCode,
		&city.Name,
		&city.DepartmentID,
		&city.DepartmentName,
		&city.DepartmentCode,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return city, fmt.Errorf("Ciudad no encontrada")
		}
		return city, err
	}

	return city, nil
}

// SearchCities busca ciudades por nombre (LIKE)
func SearchCities(searchTerm string) ([]models.City, error) {
	fmt.Printf("SearchCities -> SearchTerm: %s\n", searchTerm)

	var cities []models.City

	err := DbConnect()
	if err != nil {
		return cities, err
	}
	defer Db.Close()

	searchPattern := "%" + searchTerm + "%"
	query := `
		SELECT 
			c.id,
			c.dane_code,
			c.name,
			c.department_id,
			d.name AS department_name,
			d.dane_code AS department_code,
			CONCAT(c.name, ', ', d.name) AS full_name
		FROM cities c
		INNER JOIN departments d ON c.department_id = d.id
		WHERE c.name LIKE ?
		ORDER BY c.name ASC
		LIMIT 50
	`
	rows, err := Db.Query(query, searchPattern)
	if err != nil {
		return cities, err
	}
	defer rows.Close()

	for rows.Next() {
		var city models.City

		err := rows.Scan(
			&city.ID,
			&city.DaneCode,
			&city.Name,
			&city.DepartmentID,
			&city.DepartmentName,
			&city.DepartmentCode,
			&city.FullName,
		)

		if err != nil {
			return cities, err
		}

		cities = append(cities, city)
	}

	return cities, nil
}

// DepartmentExists verifica si existe un departamento
func DepartmentExists(departmentID int64) bool {
	fmt.Printf("DepartmentExists -> DepartmentID: %d\n", departmentID)

	err := DbConnect()
	if err != nil {
		return false
	}
	defer Db.Close()

	query := `SELECT COUNT(*) FROM departments WHERE id = ?`

	var count int
	err = Db.QueryRow(query, departmentID).Scan(&count)
	if err != nil {
		return false
	}

	return count > 0
}

// CityExists verifica si existe una ciudad
func CityExists(cityID int64) bool {
	fmt.Printf("CityExists -> CityID: %d\n", cityID)

	err := DbConnect()
	if err != nil {
		return false
	}
	defer Db.Close()

	query := `SELECT COUNT(*) FROM cities WHERE id = ?`

	var count int
	err = Db.QueryRow(query, cityID).Scan(&count)
	if err != nil {
		return false
	}

	return count > 0

}
