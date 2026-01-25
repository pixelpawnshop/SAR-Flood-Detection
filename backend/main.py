"""
FastAPI backend for SAR Flood Detection
Handles water detection requests using Google Earth Engine
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
import time
import logging

from gee_processing import initialize_gee, get_sentinel1_image, preprocess_sar, derive_features
from water_detection import detect_water, vectorize_to_geojson
from utils import calculate_aoi_area, validate_geometry

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SAR Flood Detection API",
    description="Detect surface water using Sentinel-1 SAR imagery",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://*.github.io"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class WaterDetectionRequest(BaseModel):
    """Request model for water detection"""
    geometry: Dict[str, Any] = Field(..., description="GeoJSON geometry (Polygon or MultiPolygon)")
    vv_threshold: Optional[float] = Field(None, ge=-30, le=0, description="VV polarization threshold in dB")
    vh_threshold: Optional[float] = Field(None, ge=-35, le=0, description="VH polarization threshold in dB")
    vv_vh_diff: Optional[float] = Field(None, ge=0, le=10, description="VV-VH difference threshold")
    slope_max: Optional[float] = Field(None, ge=0, le=30, description="Maximum slope in degrees")
    min_area_pixels: Optional[int] = Field(None, ge=1, le=1000, description="Minimum area in pixels")
    texture_window: Optional[int] = Field(None, ge=1, le=9, description="Texture analysis window size")


class WaterDetectionResponse(BaseModel):
    """Response model for water detection"""
    water_polygons: Dict[str, Any] = Field(..., description="GeoJSON FeatureCollection of water polygons")
    metadata: Dict[str, Any] = Field(..., description="Detection metadata")
    preview_url: Optional[str] = Field(None, description="Sentinel-1 image preview URL")
    image_bounds: Optional[Dict[str, Any]] = Field(None, description="Sentinel-1 image bounds as GeoJSON")
    tile_url: Optional[str] = Field(None, description="Tile URL for map overlay")
    tile_token: Optional[str] = Field(None, description="Token for tile URL")


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize Google Earth Engine on startup"""
    try:
        initialize_gee()
        logger.info("✅ Google Earth Engine initialized successfully")
    except Exception as e:
        logger.error(f"❌ Failed to initialize Google Earth Engine: {e}")
        raise


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for Cloud Run"""
    return {"status": "ok", "service": "sar-flood-detection-api"}


# Main water detection endpoint
@app.post("/detect-water", response_model=WaterDetectionResponse)
async def detect_water_endpoint(request: WaterDetectionRequest):
    """
    Detect water in the specified AOI using Sentinel-1 SAR imagery
    
    Args:
        request: Water detection request with geometry and optional parameters
        
    Returns:
        WaterDetectionResponse with water polygons and metadata
    """
    start_time = time.time()
    
    try:
        # Validate geometry
        logger.info("Validating AOI geometry...")
        if not validate_geometry(request.geometry):
            raise HTTPException(status_code=400, detail="Invalid geometry provided")
        
        # Calculate and validate AOI area
        area_km2 = calculate_aoi_area(request.geometry)
        logger.info(f"AOI area: {area_km2:.2f} km²")
        
        if area_km2 > 2500:
            raise HTTPException(
                status_code=400,
                detail=f"AOI too large ({area_km2:.2f} km²). Maximum allowed: 2500 km² (50×50 km)"
            )
        
        # Get Sentinel-1 imagery
        logger.info("Fetching Sentinel-1 imagery...")
        s1_image, acquisition_date = get_sentinel1_image(request.geometry)
        
        if s1_image is None:
            # No imagery found - return empty result with warning
            logger.warning("No Sentinel-1 imagery found in last 30 days")
            return WaterDetectionResponse(
                water_polygons={
                    "type": "FeatureCollection",
                    "features": []
                },
                metadata={
                    "acquisition_date": None,
                    "water_area_km2": 0,
                    "water_percentage": 0,
                    "processing_time_seconds": round(time.time() - start_time, 2),
                    "warning": "No Sentinel-1 imagery found in last 30 days for this area"
                }
            )
        
        logger.info(f"Found imagery from {acquisition_date}")
        
        # Preprocess SAR data
        logger.info("Preprocessing SAR imagery...")
        processed_image = preprocess_sar(s1_image, request.geometry)
        
        # Derive features
        logger.info("Deriving features...")
        features = derive_features(processed_image, request.geometry)
        
        # Detect water
        logger.info("Detecting water...")
        # Only include non-None parameters
        params = {}
        if request.vv_threshold is not None:
            params['vv_threshold'] = request.vv_threshold
        if request.vh_threshold is not None:
            params['vh_threshold'] = request.vh_threshold
        if request.vv_vh_diff is not None:
            params['vv_vh_diff'] = request.vv_vh_diff
        if request.slope_max is not None:
            params['slope_max'] = request.slope_max
        if request.min_area_pixels is not None:
            params['min_area_pixels'] = request.min_area_pixels
        if request.texture_window is not None:
            params['texture_window'] = request.texture_window
            
        water_mask = detect_water(features, request.geometry, params)
        
        # Vectorize to GeoJSON
        logger.info("Vectorizing results...")
        water_geojson, water_area_km2 = vectorize_to_geojson(
            water_mask,
            request.geometry,
            min_area_pixels=request.min_area_pixels or 100
        )
        
        # Calculate processing time
        processing_time = round(time.time() - start_time, 2)
        
        # Calculate water percentage
        water_percentage = round((water_area_km2 / area_km2) * 100, 2) if area_km2 > 0 else 0
        
        # Generate preview URL and bounds
        import ee
        ee_geometry = ee.Geometry(request.geometry)
        
        # Create tile URL for map overlay (using VV band in grayscale)
        tile_url = processed_image.select('VV_db').getMapId({
            'min': -25,
            'max': 0,
            'palette': ['000000', 'ffffff']  # Black to white
        })
        
        # Thumbnail for quick preview
        preview_url = processed_image.getThumbURL({
            'dimensions': 512,
            'region': ee_geometry,
            'format': 'png',
            'min': -25,
            'max': 0,
            'bands': ['VV_db']
        })
        
        image_bounds = processed_image.geometry().bounds().getInfo()
        
        logger.info(f"✅ Detection complete: {water_area_km2:.2f} km² water ({water_percentage}%)")
        logger.info(f"   Processing time: {processing_time}s")
        logger.info(f"   Tile URL: {tile_url['tile_fetcher'].url_format}")
        
        # Return response
        return WaterDetectionResponse(
            water_polygons=water_geojson,
            preview_url=preview_url,
            image_bounds=image_bounds,
            tile_url=tile_url['tile_fetcher'].url_format,
            tile_token=tile_url['token'],
            metadata={
                "acquisition_date": acquisition_date,
                "water_area_km2": round(water_area_km2, 3),
                "water_percentage": water_percentage,
                "processing_time_seconds": processing_time,
                "aoi_area_km2": round(area_km2, 2),
                "parameters_used": {
                    "vv_threshold": request.vv_threshold or "auto (Otsu)",
                    "vh_threshold": request.vh_threshold or -20,
                    "vv_vh_diff": request.vv_vh_diff or 2,
                    "slope_max": request.slope_max or 5,
                    "min_area_pixels": request.min_area_pixels or 100
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error during water detection: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "service": "SAR Flood Detection API",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "health": "/health",
            "detect_water": "/detect-water (POST)"
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
