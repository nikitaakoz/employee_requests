const API_BASE = '/api/employees';
const LIMIT = 100;
let skip = 0;
let loading = false;
let hasMore = true;

document.addEventListener('DOMContentLoaded', () => {
    loadDepartmentsForSelect();
    loadPositionsForSelect();
    loadEmployees();
    
    document.getElementById('employeeForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createEmployee();
    });
    
    window.addEventListener('scroll', handleScroll);
});

async function loadDepartmentsForSelect() {
    try {
        const response = await fetch(`${API_BASE}/departments`);
        const departments = await response.json();
        
        const departmentSelect = document.getElementById('department');
        
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            departmentSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка загрузки подразделений:', error);
    }
}

async function loadPositionsForSelect() {
    try {
        const response = await fetch(`${API_BASE}/positions`);
        const positions = await response.json();
        
        const positionSelect = document.getElementById('position');
        
        positions.forEach(pos => {
            const option = document.createElement('option');
            option.value = pos;
            option.textContent = pos;
            positionSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка загрузки должностей:', error);
    }
}

async function loadEmployees() {
    if (loading || !hasMore) return;
    
    loading = true;
    showLoadingIndicator();
    
    try {
        const response = await fetch(`${API_BASE}/?skip=${skip}&limit=${LIMIT}`);
        const employees = await response.json();
        
        const tbody = document.getElementById('employeesBody');
        const noDataRow = document.getElementById('no-data-row');
        if (noDataRow) noDataRow.remove();
        
        if (employees.length === 0) {
            hasMore = false;
            hideLoadingIndicator();
            return;
        }
        
        employees.forEach(emp => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${emp.id}</td>
                <td>${emp.full_name}</td>
                <td>${emp.department}</td>
                <td>${emp.position}</td>
            `;
            tbody.appendChild(row);
        });
        
        skip += employees.length;
        
        if (employees.length < LIMIT) {
            hasMore = false;
        }
        
        hideLoadingIndicator();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        hideLoadingIndicator();
    } finally {
        loading = false;
    }
}

function handleScroll() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.offsetHeight;
    
    if (scrollPosition >= documentHeight - 200) {
        loadEmployees();
    }
}

function showLoadingIndicator() {
    const tbody = document.getElementById('employeesBody');
    if (!document.getElementById('loading-row')) {
        const row = document.createElement('tr');
        row.id = 'loading-row';
        row.innerHTML = `
            <td colspan="4" style="text-align: center; padding: 20px; color: #9ca3af;">
                Загрузка...
            </td>
        `;
        tbody.appendChild(row);
    }
}

function hideLoadingIndicator() {
    const loadingRow = document.getElementById('loading-row');
    if (loadingRow) loadingRow.remove();
}

async function createEmployee() {
    const data = {
        full_name: document.getElementById('full_name').value,
        department: document.getElementById('department').value,
        position: document.getElementById('position').value
    };

    if (!data.department) {
        alert('Пожалуйста, выберите подразделение');
        return;
    }

    if (!data.position) {
        alert('Пожалуйста, выберите должность');
        return;
    }

    try {
        const response = await fetch(API_BASE + '/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('Сотрудник добавлен!');
            document.getElementById('employeeForm').reset();
            
            skip = 0;
            hasMore = true;
            document.getElementById('employeesBody').innerHTML = '';
            loadEmployees();
        } else {
            const error = await response.json();
            alert('Ошибка: ' + error.detail);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при добавлении сотрудника');
    }
}