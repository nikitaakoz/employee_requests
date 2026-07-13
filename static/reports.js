document.addEventListener('DOMContentLoaded', () => {
    showStructure();
    loadReports();
});

function showStructure() {
    document.getElementById('statusReport').innerHTML = `
        <div class="report-item">
            <span class="report-label">Новая:</span>
            <span class="report-value" id="status-new">—</span>
        </div>
        <div class="report-item">
            <span class="report-label">В работе:</span>
            <span class="report-value" id="status-in-progress">—</span>
        </div>
        <div class="report-item">
            <span class="report-label">Выполнена:</span>
            <span class="report-value" id="status-completed">—</span>
        </div>
    `;
    
    document.getElementById('overdueReport').innerHTML = `
        <div class="report-item">
            <span class="report-label">Всего просрочено:</span>
            <span class="report-value" id="overdue-count">—</span>
        </div>
    `;
    
    const tbody = document.querySelector('#assigneeReport tbody');
    tbody.innerHTML = `
        <tr id="no-data-row">
            <td colspan="2" style="text-align: center; color: #9ca3af;">
                Загрузка данных...
            </td>
        </tr>
    `;
}

async function loadReports() {
    try {
        const response = await fetch('/api/requests/reports');
        const data = await response.json();
        
        const statuses = {
            'Новая': 0,
            'В работе': 0,
            'Выполнена': 0
        };
        
        Object.entries(data.by_status).forEach(([status, count]) => {
            statuses[status] = count;
        });
        
        // Мгновенная подстановка значений
        document.getElementById('status-new').textContent = statuses['Новая'];
        document.getElementById('status-in-progress').textContent = statuses['В работе'];
        document.getElementById('status-completed').textContent = statuses['Выполнена'];
        document.getElementById('overdue-count').textContent = data.overdue_total;
        
        // Таблица исполнителей
        const tbody = document.querySelector('#assigneeReport tbody');
        const noDataRow = document.getElementById('no-data-row');
        if (noDataRow) {
            noDataRow.remove();
        }
        
        if (data.completed_by_assignee.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="2" style="text-align: center; color: #9ca3af;">
                        Нет выполненных заявок
                    </td>
                </tr>
            `;
        } else {
            tbody.innerHTML = data.completed_by_assignee
                .sort((a, b) => b.count - a.count)
                .map(item => `
                    <tr>
                        <td>${item.name}</td>
                        <td><strong>${item.count}</strong></td>
                    </tr>
                `).join('');
        }
        
    } catch (error) {
        console.error('Ошибка:', error);
        document.getElementById('statusReport').innerHTML = 
            '<p style="color: #ef4444;">Ошибка при загрузке отчётов</p>';
        document.getElementById('overdueReport').innerHTML = 
            '<p style="color: #ef4444;">Ошибка при загрузке</p>';
    }
}

function fadeInValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
        element.classList.add('fade-in');
    }
}