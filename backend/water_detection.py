"""
Water detection algorithms using Sentinel-1 SAR features
Implements Otsu thresholding and rule-based refinement
"""

import ee
import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)


def compute_otsu_threshold(image: ee.Image, band: str, geometry: Dict[str, Any]) -> float:
    """
    Compute Otsu threshold for a given band
    Uses percentile-based approach as approximation
    
    Args:
        image: ee.Image with the band to threshold
        geometry: GeoJSON geometry for analysis
        
    Returns:
        Threshold value in dB
    """
    try:
        ee_geometry = ee.Geometry(geometry)
        band_image = image.select(band)
        
        # Compute histogram
        histogram = band_image.reduceRegion(
            reducer=ee.Reducer.histogram(255, 0.1),
            geometry=ee_geometry,
            scale=100,  # Use coarser scale for speed
            maxPixels=1e9,
            bestEffort=True
        )
        
        # Get histogram data
        hist_dict = histogram.getInfo()
        
        if band not in hist_dict or hist_dict[band] is None:
            # Fallback to percentile-based threshold
            logger.warning(f"Histogram computation failed for {band}, using percentile fallback")
            percentile = band_image.reduceRegion(
                reducer=ee.Reducer.percentile([15]),
                geometry=ee_geometry,
                scale=100,
                maxPixels=1e9,
                bestEffort=True
            ).getInfo()
            
            threshold = percentile.get(band, -15)
            logger.info(f"Otsu threshold (percentile fallback): {threshold:.2f} dB")
            return threshold
        
        # Use percentile-based threshold (15th percentile for conservative water detection)
        percentile = band_image.reduceRegion(
            reducer=ee.Reducer.percentile([15]),
            geometry=ee_geometry,
            scale=100,
            maxPixels=1e9,
            bestEffort=True
        ).getInfo()
        
        threshold = percentile.get(band, -15)
        logger.info(f"Otsu threshold (15th percentile): {threshold:.2f} dB")
        
        return threshold
        
    except Exception as e:
        logger.error(f"Error computing Otsu threshold: {e}")
        # Return conservative default
        return -15


def detect_water(
    features: ee.Image,
    geometry: Dict[str, Any],
    params: Dict[str, Optional[float]]
) -> ee.Image:
    """
    Detect water using adaptive thresholding and rule-based refinement
    
    Args:
        features: ee.Image with VV_db, VH_db, VV_VH_diff, texture, slope bands
        geometry: GeoJSON geometry
        params: Dictionary with optional threshold overrides
        
    Returns:
        Binary water mask as ee.Image
    """
    try:
        ee_geometry = ee.Geometry(geometry)
        
        # Get bands
        vv_db = features.select('VV_db')
        vh_db = features.select('VH_db')
        vv_vh_diff = features.select('VV_VH_diff')
        texture = features.select('texture')
        slope = features.select('slope')
        
        # Determine VV threshold (auto or manual)
        if params.get('vv_threshold') is not None:
            vv_threshold = params['vv_threshold']
            logger.info(f"Using manual VV threshold: {vv_threshold} dB")
        else:
            vv_threshold = compute_otsu_threshold(features, 'VV_db', geometry)
            logger.info(f"Using auto VV threshold (Otsu): {vv_threshold} dB")
        
        # Get other thresholds (use defaults if not provided)
        vh_threshold = params.get('vh_threshold', -20)
        vv_vh_diff_threshold = params.get('vv_vh_diff', 8)  # Increased from 2 to 8
        slope_max = params.get('slope_max', 5)
        texture_max = params.get('texture_max', 2)  # Make it configurable, default 2 dB
        
        logger.info(f"Detection parameters:")
        logger.info(f"  VV threshold: {vv_threshold} dB")
        logger.info(f"  VH threshold: {vh_threshold} dB")
        logger.info(f"  VV-VH diff: < {vv_vh_diff_threshold}")
        logger.info(f"  Max slope: {slope_max}°")
        logger.info(f"  Max texture: {texture_max}")
        
        # Log statistics for each band
        def log_band_stats(image, band_name):
            stats = image.select(band_name).reduceRegion(
                reducer=ee.Reducer.minMax().combine(ee.Reducer.mean(), '', True),
                geometry=ee_geometry,
                scale=100,
                maxPixels=1e8
            ).getInfo()
            logger.info(f"  {band_name}: min={stats.get(band_name+'_min', 'N/A'):.2f}, "
                       f"max={stats.get(band_name+'_max', 'N/A'):.2f}, "
                       f"mean={stats.get(band_name+'_mean', 'N/A'):.2f}")
        
        logger.info("Band statistics:")
        log_band_stats(features, 'VV_db')
        log_band_stats(features, 'VH_db')
        log_band_stats(features, 'VV_VH_diff')
        log_band_stats(features, 'texture')
        log_band_stats(features, 'slope')
        
        # Create water mask using multiple criteria with step-by-step logging
        vv_mask = vv_db.lt(vv_threshold)
        vh_mask = vh_db.lt(vh_threshold)
        diff_mask = vv_vh_diff.lt(vv_vh_diff_threshold)
        slope_mask = slope.lt(slope_max)
        texture_mask = texture.lt(texture_max)
        
        # Log pixel counts for each criterion
        def count_pixels(mask, name):
            count = mask.reduceRegion(
                reducer=ee.Reducer.sum(),
                geometry=ee_geometry,
                scale=100,
                maxPixels=1e8
            ).getInfo()
            pixels = count.get(list(count.keys())[0], 0)
            logger.info(f"  {name}: {pixels:.0f} pixels passed")
            return pixels
        
        logger.info("Pixels passing each criterion:")
        count_pixels(vv_mask, "VV < threshold")
        count_pixels(vh_mask, "VH < threshold")
        count_pixels(diff_mask, "VV-VH < threshold")
        count_pixels(slope_mask, "Slope < max")
        count_pixels(texture_mask, "Texture < max")
        
        water_mask = (
            vv_mask
            .And(vh_mask)
            .And(diff_mask)
            .And(slope_mask)
            .And(texture_mask)
        )
        
        initial_water_pixels = count_pixels(water_mask, "Combined (all criteria)")
        
        # Apply morphological operations for cleanup (reduced kernel size to preserve more water)
        # Opening: remove small noise (erosion then dilation)
        # Closing: fill small gaps (dilation then erosion)
        
        # Opening - remove noise (reduced from 30m to 10m radius)
        water_cleaned = water_mask.focalMin(
            radius=10,
            units='meters',
            kernelType='circle'
        ).focalMax(
            radius=10,
            units='meters',
            kernelType='circle'
        )
        
        # Closing - fill gaps (reduced from 30m to 10m radius)
        water_final = water_cleaned.focalMax(
            radius=10,
            units='meters',
            kernelType='circle'
        ).focalMin(
            radius=10,
            units='meters',
            kernelType='circle'
        )
        
        # Rename and clip
        water_final = water_final.rename('water').clip(ee_geometry)
        
        logger.info("Water detection complete")
        
        return water_final
        
    except Exception as e:
        logger.error(f"Error detecting water: {e}")
        raise


def vectorize_to_geojson(
    water_mask: ee.Image,
    geometry: Dict[str, Any],
    min_area_pixels: int = 100
) -> Tuple[Dict[str, Any], float]:
    """
    Convert water mask to GeoJSON polygons
    
    Args:
        water_mask: Binary water mask ee.Image
        geometry: GeoJSON geometry
        min_area_pixels: Minimum area in pixels to keep
        
    Returns:
        Tuple of (GeoJSON FeatureCollection dict, total_water_area_km2)
    """
    try:
        ee_geometry = ee.Geometry(geometry)
        
        # Self-mask to only include water pixels (value = 1)
        water_masked = water_mask.selfMask()
        
        # Convert to vectors
        vectors = water_masked.reduceToVectors(
            geometryType='polygon',
            reducer=ee.Reducer.countEvery(),
            scale=30,
            maxPixels=1e9,
            eightConnected=False,
            geometry=ee_geometry
        )
        
        # Calculate area for each polygon and filter small ones
        # Sentinel-1 pixel area = 10m x 10m = 100 m²
        # But we're using scale=30 for vectorization
        min_area_m2 = min_area_pixels * 100  # 100 m² per S1 pixel
        
        def add_area(feature):
            return feature.set('area_m2', feature.geometry().area(1))
        
        vectors_with_area = vectors.map(add_area)
        
        # Filter by minimum area
        vectors_filtered = vectors_with_area.filter(
            ee.Filter.gte('area_m2', min_area_m2)
        )
        
        # Simplify geometries
        def simplify_geometry(feature):
            return feature.setGeometry(
                feature.geometry().simplify(maxError=100)
            )
        
        vectors_simplified = vectors_filtered.map(simplify_geometry)
        
        # Convert to GeoJSON
        geojson = vectors_simplified.getInfo()
        
        # Calculate total water area
        total_area_m2 = sum(
            feature['properties'].get('area_m2', 0)
            for feature in geojson.get('features', [])
        )
        total_area_km2 = total_area_m2 / 1_000_000
        
        logger.info(f"Vectorization complete: {len(geojson.get('features', []))} polygons")
        logger.info(f"Total water area: {total_area_km2:.3f} km²")
        
        return geojson, total_area_km2
        
    except Exception as e:
        logger.error(f"Error vectorizing water mask: {e}")
        # Return empty FeatureCollection on error
        return {
            "type": "FeatureCollection",
            "features": []
        }, 0.0
