"""
Utility functions for geometry validation and calculations
"""

from shapely.geometry import shape
from shapely.ops import transform
import pyproj
from functools import partial
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


def validate_geometry(geometry: Dict[str, Any]) -> bool:
    """
    Validate GeoJSON geometry
    
    Args:
        geometry: GeoJSON geometry dict
        
    Returns:
        True if valid, False otherwise
    """
    try:
        geom = shape(geometry)
        return geom.is_valid and not geom.is_empty
    except Exception as e:
        logger.error(f"Geometry validation error: {e}")
        return False


def calculate_aoi_area(geometry: Dict[str, Any]) -> float:
    """
    Calculate area of AOI in km²
    
    Args:
        geometry: GeoJSON geometry dict
        
    Returns:
        Area in square kilometers
    """
    try:
        # Create shapely geometry
        geom = shape(geometry)
        
        # Get the centroid for appropriate projection
        centroid = geom.centroid
        
        # Use appropriate UTM zone based on longitude
        lon = centroid.x
        lat = centroid.y
        utm_zone = int((lon + 180) / 6) + 1
        hemisphere = 'north' if lat >= 0 else 'south'
        
        # Create CRS objects using modern pyproj API
        wgs84 = pyproj.CRS('EPSG:4326')
        utm_crs = pyproj.CRS(f'+proj=utm +zone={utm_zone} +{hemisphere} +ellps=WGS84 +datum=WGS84 +units=m +no_defs')
        
        # Create transformer (always_xy=True ensures lon, lat order)
        transformer = pyproj.Transformer.from_crs(wgs84, utm_crs, always_xy=True)
        
        # Transform geometry to UTM
        geom_utm = transform(transformer.transform, geom)
        
        # Calculate area in km²
        area_m2 = geom_utm.area
        area_km2 = area_m2 / 1_000_000
        
        logger.info(f"Calculated AOI area: {area_km2:.2f} km² (UTM zone {utm_zone}{hemisphere[0].upper()})")
        
        return area_km2
        
    except Exception as e:
        logger.error(f"Error calculating area: {e}", exc_info=True)
        return 0.0
        height = abs(bounds[3] - bounds[1])
        # Rough approximation: 1 degree ≈ 111 km
        area_km2 = width * height * 111 * 111
        logger.warning(f"Using rough area approximation: {area_km2:.2f} km²")
        return area_km2
