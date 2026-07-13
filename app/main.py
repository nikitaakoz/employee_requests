from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from app.api.routes import router as request_router
from app.api.employee_routes import router as employee_router

app = FastAPI(
    title="Система учёта заявок сотрудников",
    description="API для управления заявками, фильтрации и отчётности",
    version="1.0.0"
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

# Подключаем роуты
app.include_router(request_router, prefix="/api")
app.include_router(employee_router, prefix="/api")

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse(request, "index.html")

@app.get("/reports-page", response_class=HTMLResponse)
async def reports_page(request: Request):
    return templates.TemplateResponse(request, "reports.html")

@app.get("/employees-page", response_class=HTMLResponse)
async def employees_page(request: Request):
    return templates.TemplateResponse(request, "employees.html")