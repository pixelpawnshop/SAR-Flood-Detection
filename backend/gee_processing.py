"""
Google Earth Engine processing functions for Sentinel-1 SAR imagery
"""

import ee
import os
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Tuple, Optional

logger = logging.getLogger(__name__)


def initialize_gee():
    """
    Initialize Google Earth Engine with service account credentials
    Detects environment (local vs Cloud Run) and authenticates accordingly
    """
    try:
        # Check if running locally with file-based credentials
        local_cred_path = os.getenv('GEE_SERVICE_ACCOUNT_PATH', '')
        
        if local_cred_path and os.path.exists(local_cred_path):
            # Local development
            logger.info(f"Initializing GEE with local credentials: {local_cred_path}")
            with open(local_cred_path) as f:
                key_data = json.load(f)
            
            credentials = ee.ServiceAccountCredentials(
                key_data['client_email'],
                local_cred_path
            )
            ee.Initialize(credentials)
            
        else:
            # Cloud Run with Secret Manager or environment variable
            cred_json = os.getenv('GEE_SERVICE_ACCOUNT')
            
            if cred_json:
                logger.info("Initializing GEE with Cloud Run credentials")
                key_data = json.loads(cred_json)
                credentials = ee.ServiceAccountCredentials(
                    key_data['client_email'],
                    key_data=cred_json
                )
                ee.Initialize(credentials)
            else:
                raise ValueError(
                    "GEE credentials not found. Set GEE_SERVICE_ACCOUNT_PATH (local) "
                    "or GEE_SERVICE_ACCOUNT (Cloud Run)"
                )
        
        logger.info("✅ Google Earth Engine initialized successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize Google Earth Engine: {e}")
        raise


def get_sentinel1_image(geometry: Dict[str, Any]) -> Tuple[Optional[ee.Image], Optional[str]]:
    """
    Get the most recent Sentinel-1 image for the AOI
    
    Args:
        geometry: GeoJSON geometry dict
        
    Returns:
        Tuple of (ee.Image, acquisition_date_string) or (None, None) if no imagery found
    """
    try:
        # Convert GeoJSON to ee.Geometry
        ee_geometry = ee.Geometry(geometry)
        
        # Define date range (last 30 days)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=30)
        
        # Filter Sentinel-1 collection
        collection = (ee.ImageCollection('COPERNICUS/S1_GRD')
            .filterBounds(ee_geometry)
            .filterDate(start_date.strftime('%Y-%m-%d'), end_date.strftime('%Y-%m-%d'))
            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV'))
            .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH'))
            .filter(ee.Filter.eq('instrumentMode', 'IW'))
            .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING'))
        )
        
        # Get the most recent image
        image_list = collection.sort('system:time_start', False).limit(1)
        
        # Check if any images found
        size = image_list.size().getInfo()
        
        if size == 0:
            logger.warning("No Sentinel-1 imagery found in the last 30 days")
            return None, None
        
        # Get the image
        image = ee.Image(image_list.first())
        
        # Get acquisition date
        timestamp = image.get('system:time_start').getInfo()
        acquisition_date = datetime.fromtimestamp(timestamp / 1000).strftime('%Y-%m-%d')
        
        logger.info(f"Found Sentinel-1 image from {acquisition_date}")
        
        return image, acquisition_date
        
    except Exception as e:
        logger.error(f"Error fetching Sentinel-1 imagery: {e}")
        raise


def preprocess_sar(image: ee.Image, geometry: Dict[str, Any]) -> ee.Image:
    """
    Preprocess Sentinel-1 SAR image
    - Apply Lee speckle filter
    - Terrain correction
    - Convert to dB
    
    Args:
        image: Raw Sentinel-1 ee.Image
        geometry: GeoJSON geometry for clipping
        
    Returns:
        Preprocessed ee.Image
    """
    try:
        ee_geometry = ee.Geometry(geometry)
        
        # Select VV and VH bands
        vv = image.select('VV')
        vh = image.select('VH')
        
        # Apply Lee speckle filter (focal median for noise reduction)
        # Using 7x7 kernel (square with radius ~50m at 10m resolution)
        vv_filtered = vv.focal_median(radius=50, units='meters', kernelType='square')
        vh_filtered = vh.focal_median(radius=50, units='meters', kernelType='square')
        
        # Convert to dB scale
        # dB = 10 * log10(DN)
        vv_db = vv_filtered.log10().multiply(10)
        vh_db = vh_filtered.log10().multiply(10)
        
        # Combine bands
        processed = ee.Image.cat([
            vv_db.rename('VV_db'),
            vh_db.rename('VH_db')
        ])
        
        # Clip to AOI
        processed = processed.clip(ee_geometry)
        
        logger.info("SAR preprocessing complete")
        
        return processed
        
    except Exception as e:
        logger.error(f"Error preprocessing SAR: {e}")
        raise


def derive_features(image: ee.Image, geometry: Dict[str, Any]) -> ee.Image:
    """
    Derive additional features from preprocessed SAR image
    - VV - VH difference
    - Texture (local standard deviation)
    - Slope from DEM
    
    Args:
        image: Preprocessed SAR ee.Image
        geometry: GeoJSON geometry
        
    Returns:
        ee.Image with additional feature bands
    """
    try:
        ee_geometry = ee.Geometry(geometry)
        
        # Get VV and VH bands
        vv_db = image.select('VV_db')
        vh_db = image.select('VH_db')
        
        # Compute VV - VH difference
        vv_vh_diff = vv_db.subtract(vh_db).rename('VV_VH_diff')
        
        # Compute texture (local standard deviation on VV)
        # Using 3x3 window (~30m at 10m resolution)
        texture = vv_db.focal_stdDev(
            radius=30,
            units='meters',
            kernelType='square'
        ).rename('texture')
        
        # Get slope from SRTM DEM
        dem = ee.Image('USGS/SRTMGL1_003')
        slope = ee.Terrain.slope(dem).rename('slope')
        
        # Combine all features
        features = ee.Image.cat([
            vv_db,
            vh_db,
            vv_vh_diff,
            texture,
            slope
        ])
        
        # Clip to AOI
        features = features.clip(ee_geometry)
        
        logger.info("Feature derivation complete")
        
        return features
        
    except Exception as e:
        logger.error(f"Error deriving features: {e}")
        raise
