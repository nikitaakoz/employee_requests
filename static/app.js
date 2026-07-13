const API_BASE = '/api/requests';
const EMPLOYEES_API = '/api/employees';
const LIMIT = 50;
let skip = 0;
let loading = false;
let hasMore = true;
let currentFilters = {};
let allEmployees = [];

// Допустимые переходы статусов
const STATUS_TRANSITIONS = {
    'Новая': ['В работе', 'Выполнена'],
    'В работе': ['Выполнена'],
    'Выполнена': []
};

document.addEventListener('DOMContentLoaded', () => {
    loadEmployeesForSelect();
    loadRequests();
    
    document.getElementById('createForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await createRequest();
    });
    
    window.addEventListener('scroll', handleScroll);
});

async function loadEmployeesForSelect() {
    try {
        const response = await fetch(`${EMPLOYEES_API}/?limit=1000&t=${Date.now()}`);
        const employees = await response.json();
        
        allEmployees = employees;
        
        const authorSelect = document.getElementById('author_id');
        const assigneeSelect = document.getElementById('assignee_id');
        const filterAssigneeSelect = document.getElementById('filter_assignee');
        
        authorSelect.innerHTML = '<option value="">-- Выберите автора --</option>';
        assigneeSelect.innerHTML = '<option value="">-- Выберите исполнителя --</option>';
        filterAssigneeSelect.innerHTML = '<option value="">Все исполнители</option>';
        
        employees.forEach(emp => {
            const option1 = document.createElement('option');
            option1.value = emp.id;
            option1.textContent = `${emp.full_name} — ${emp.department}, ${emp.position}`;
            authorSelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = emp.id;
            option2.textContent = `${emp.full_name} — ${emp.department}, ${emp.position}`;
            assigneeSelect.appendChild(option2);
            
            const option3 = document.createElement('option');
            option3.value = emp.id;
            option3.textContent = emp.full_name;
            filterAssigneeSelect.appendChild(option3);
        });
        
        await loadDepartments();
    } catch (error) {
        console.error('Ошибка загрузки сотрудников:', error);
    }
}

async function loadDepartments() {
    try {
        const response = await fetch(`${EMPLOYEES_API}/departments?t=${Date.now()}`);
        const departments = await response.json();
        
        const departmentSelect = document.getElementById('filter_department');
        departmentSelect.innerHTML = '<option value="">Все подразделения</option>';
        
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

async function refreshEmployees() {
    await loadEmployeesForSelect();
    alert('Список сотрудников обновлён!');
}

// Функция генерации select со статусами
function getStatusSelectHTML(currentStatus, requestId) {
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
    
    if (allowedTransitions.length === 0) {
        // Для "Выполнена" - select disabled
        return `<select disabled>
            <option value="">${currentStatus}</option>
        </select>`;
    }
    
    let options = '<option value="">--</option>';
    allowedTransitions.forEach(status => {
        options += `<option value="${status}">${status}</option>`;
    });
    
    return `<select onchange="updateStatus(${requestId}, this.value)">
        ${options}
    </select>`;
}

async function loadRequests(reset = false) {
    if (loading || !hasMore) return;
    
    if (reset) {
        skip = 0;
        hasMore = true;
        document.getElementById('requestsBody').innerHTML = '';
    }
    
    if (skip > 0 && !reset) {
        loadMoreWithCurrentFilters();
        return;
    }
    
    loading = true;
    showLoadingIndicator();
    
    const status = document.getElementById('filter_status').value;
    const assignee_id = document.getElementById('filter_assignee').value;
    const department = document.getElementById('filter_department').value;
    const is_overdue = document.getElementById('filter_overdue').checked;

    currentFilters = { status, assignee_id, department, is_overdue };

    let url = `${API_BASE}/?skip=${skip}&limit=${LIMIT}`;
    if (status) url += `&status=${encodeURIComponent(status)}`;
    if (assignee_id) url += `&assignee_id=${assignee_id}`;
    if (department) url += `&department=${encodeURIComponent(department)}`;
    if (is_overdue) url += `&is_overdue=true`;

    try {
        const response = await fetch(url);
        const requests = await response.json();
        
        const tbody = document.getElementById('requestsBody');
        
        if (skip === 0) {
            tbody.innerHTML = '';
        }
        
        const noDataRow = document.getElementById('no-data-row');
        if (noDataRow) noDataRow.remove();
        
        if (requests.length === 0) {
            hasMore = false;
            hideLoadingIndicator();
            if (skip === 0) {
                tbody.innerHTML = `
                    <tr id="no-data-row">
                        <td colspan="7" style="text-align: center; padding: 20px; color: #9ca3af;">
                            Заявки не найдены
                        </td>
                    </tr>
                `;
            }
            return;
        }
        
        requests.forEach(req => {
            const row = document.createElement('tr');
            
            const displayDesc = req.description.length > 150 
                ? req.description.substring(0, 150) + '...' 
                : req.description;

            row.innerHTML = `
                <td>${req.number}</td>
                <td>${req.author_name}</td>
                <td>${req.assignee_name}</td>
                <td title="${req.description}" style="white-space: normal !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.4;">
                    ${displayDesc}
                </td>
                <td>${new Date(req.due_date).toLocaleString('ru-RU')}</td>
                <td class="status-${req.status.toLowerCase().replace(' ', '-')}">${req.status}</td>
                <td>
                    <div class="actions">
                        ${getStatusSelectHTML(req.status, req.id)}
                        <select id="assignee-select-${req.id}">
                            <option value="">Исполнитель</option>
                            ${allEmployees.map(emp => `<option value="${emp.id}">${emp.full_name}</option>`).join('')}
                        </select>
                        <button class="btn btn-success" onclick="updateAssignee(${req.id})">OK</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
        
        skip += requests.length;
        
        if (requests.length < LIMIT) {
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

function loadMoreWithCurrentFilters() {
    loading = true;
    showLoadingIndicator();
    
    let url = `${API_BASE}/?skip=${skip}&limit=${LIMIT}`;
    if (currentFilters.status) url += `&status=${encodeURIComponent(currentFilters.status)}`;
    if (currentFilters.assignee_id) url += `&assignee_id=${currentFilters.assignee_id}`;
    if (currentFilters.department) url += `&department=${encodeURIComponent(currentFilters.department)}`;
    if (currentFilters.is_overdue) url += `&is_overdue=true`;

    fetch(url)
        .then(response => response.json())
        .then(requests => {
            const tbody = document.getElementById('requestsBody');
            
            if (requests.length === 0) {
                hasMore = false;
                hideLoadingIndicator();
                return;
            }
            
            requests.forEach(req => {
                const row = document.createElement('tr');
                const displayDesc = req.description.length > 150 
                    ? req.description.substring(0, 150) + '...' 
                    : req.description;

                row.innerHTML = `
                    <td>${req.number}</td>
                    <td>${req.author_name}</td>
                    <td>${req.assignee_name}</td>
                    <td title="${req.description}" style="white-space: normal !important; word-wrap: break-word !important; overflow-wrap: break-word !important; line-height: 1.4;">
                        ${displayDesc}
                    </td>
                    <td>${new Date(req.due_date).toLocaleString('ru-RU')}</td>
                    <td class="status-${req.status.toLowerCase().replace(' ', '-')}">${req.status}</td>
                    <td>
                        <div class="actions">
                            ${getStatusSelectHTML(req.status, req.id)}
                            <select id="assignee-select-${req.id}">
                                <option value="">Исполнитель</option>
                                ${allEmployees.map(emp => `<option value="${emp.id}">${emp.full_name}</option>`).join('')}
                            </select>
                            <button class="btn btn-success" onclick="updateAssignee(${req.id})">OK</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            });
            
            skip += requests.length;
            
            if (requests.length < LIMIT) {
                hasMore = false;
            }
            
            hideLoadingIndicator();
        })
        .catch(error => {
            console.error('Ошибка загрузки:', error);
            hideLoadingIndicator();
        })
        .finally(() => {
            loading = false;
        });
}

function handleScroll() {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.offsetHeight;
    
    if (scrollPosition >= documentHeight - 300) {
        if (skip === 0) {
            loadRequests();
        } else {
            loadMoreWithCurrentFilters();
        }
    }
}

function showLoadingIndicator() {
    const tbody = document.getElementById('requestsBody');
    if (!document.getElementById('loading-row')) {
        const row = document.createElement('tr');
        row.id = 'loading-row';
        row.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 20px; color: #9ca3af;">
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

async function createRequest() {
    const data = {
        author_id: parseInt(document.getElementById('author_id').value),
        assignee_id: parseInt(document.getElementById('assignee_id').value),
        description: document.getElementById('description').value,
        due_date: document.getElementById('due_date').value
    };

    try {
        const response = await fetch(API_BASE + '/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            alert('Заявка создана!');
            document.getElementById('createForm').reset();
            skip = 0;
            hasMore = true;
            loadRequests(true);
        } else {
            const error = await response.json();
            alert('Ошибка: ' + error.detail);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при создании заявки');
    }
}

async function updateStatus(requestId, newStatus) {
    if (!newStatus) return;
    
    try {
        const response = await fetch(`${API_BASE}/${requestId}/status?new_status=${encodeURIComponent(newStatus)}`, {
            method: 'PATCH'
        });
        
        if (response.ok) {
            skip = 0;
            hasMore = true;
            loadRequests(true);
        } else {
            const error = await response.json();
            alert('Ошибка: ' + error.detail);
            loadRequests(true);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при обновлении статуса');
    }
}

async function updateAssignee(requestId) {
    const newAssigneeId = document.getElementById(`assignee-select-${requestId}`).value;
    if (!newAssigneeId) return;
    
    try {
        const response = await fetch(`${API_BASE}/${requestId}/assignee?new_assignee_id=${newAssigneeId}`, {
            method: 'PATCH'
        });
        
        if (response.ok) {
            skip = 0;
            hasMore = true;
            loadRequests(true);
        } else {
            const error = await response.json();
            alert('Ошибка: ' + error.detail);
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при смене исполнителя');
    }
}