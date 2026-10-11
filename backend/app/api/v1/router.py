from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.auth import router as auth_router
from app.api.v1.verifications import router as verification_router
from app.api.v1.cases import router as cases_router
from app.api.v1.consultations import router as consultations_router
from app.api.v1.directory import router as directory_router
from app.api.v1.profiles import router as profiles_router
from app.api.v1.admin import router as admin_router
from app.api.v1.documents import router as documents_router
from app.api.v1.research import router as research_router
from app.api.v1.operations import router as operations_router
from app.api.v1.news import router as news_router


api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(verification_router)
api_router.include_router(directory_router)
api_router.include_router(consultations_router)
api_router.include_router(cases_router)
api_router.include_router(profiles_router)
api_router.include_router(admin_router)
api_router.include_router(documents_router)
api_router.include_router(research_router)
api_router.include_router(operations_router)
api_router.include_router(news_router)
