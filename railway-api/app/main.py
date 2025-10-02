"""
FastAPI application for church service automation
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import configuration
from app.core import config

# Import routers
from app.routers import (
    hymn_slides, 
    scripture_slides, 
    call_to_worship_slides
)

# Create FastAPI app
app = FastAPI(title="Church Service API", version="1.0.0")

# Configure CORS
origins = config.ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(hymn_slides.router, prefix="/api", tags=["hymn-slides"])
app.include_router(scripture_slides.router, prefix="/api", tags=["scripture-slides"])
app.include_router(call_to_worship_slides.router, prefix="/api", tags=["call-to-worship-slides"])

@app.get("/")
async def root():
    return {"message": "Church Service API", "version": "1.0.0"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}