# SAR Flood Detection Application

A web application for detecting surface water and flooding events using free Sentinel-1 SAR (Synthetic Aperture Radar) data from Google Earth Engine.

## 🎯 Overview

This application enables users to:
- Draw an Area of Interest (AOI) anywhere on Earth
- Automatically fetch the latest Sentinel-1 SAR imagery
- Detect surface water using adaptive Otsu thresholding
- Visualize results interactively with dual basemap options
- Download detected water polygons as GeoJSON

## 🏗️ Architecture

```
┌─────────────────────────┐
│ Frontend (GitHub Pages) │
│  - React + Leaflet      │
│  - AOI drawing          │
│  - Basemap toggle       │
└─────────────┬───────────┘
              │ GeoJSON AOI + params
              ▼
┌─────────────────────────┐
│ Backend (Cloud Run)     │
│  - FastAPI              │
│  - Google Earth Engine  │
│  - Sentinel-1 SAR       │
│  - Water detection      │
└─────────────┬───────────┘
              │ GeoJSON water polygons
              ▼
┌─────────────────────────┐
│ Visualization           │
│  - Water overlay        │
│  - Metadata display     │
│  - GeoJSON download     │
└─────────────────────────┘
```

## 🚀 Features

- **Adaptive Water Detection**: Otsu thresholding automatically adjusts to scene characteristics
- **Location Search**: Search and navigate to any location worldwide
- **GeoJSON Export**: Download detected water polygons for further analysis
- **Free Data**: Uses Copernicus Sentinel-1 SAR via Google Earth Engine

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **Google Earth Engine**: SAR imagery access and processing
- **Pydantic**: Request/response validation
- **Google Cloud Run**: Serverless deployment

### Frontend
- **React 18**: UI framework
- **Leaflet**: Interactive mapping
- **Leaflet Draw**: AOI drawing tools
- **Turf.js**: Geospatial calculations
- **Axios**: API communication

## 📋 Prerequisites

### Backend
- Python 3.10+
- Google Cloud Platform account
- Google Earth Engine service account
- gcloud CLI (for deployment)

### Frontend
- Node.js 16+
- npm or yarn

## 🔧 Setup Instructions

### 1. Google Earth Engine Service Account

Follow the detailed guide in [docs/GEE_SETUP.md](docs/GEE_SETUP.md) to:
1. Create a GCP project
2. Enable Earth Engine API
3. Create a service account
4. Download credentials JSON
5. Set up for local development and Cloud Run

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and set:
# GEE_SERVICE_ACCOUNT_PATH=./credentials/gee-service-account.json

# Place your GEE service account JSON in backend/credentials/

# Run locally
python run_local.py
```

Backend will be available at http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm start
```

Frontend will be available at http://localhost:3000

## 🧪 Testing with Sample AOIs

The application includes 2 pre-loaded test locations:

1. **Venice Lagoon, Italy** - Permanent water baseline for algorithm validation
2. **Lake Mead, Nevada/Arizona** - Large reservoir for drought monitoring

Select these from the sidebar to quickly test the application.

## 🚀 Deployment

### Backend to Google Cloud Run

```bash
# From project root
./deploy.sh

# Or manually:
cd backend
gcloud run deploy sar-flood-api \
  --source . \
  --region us-central1 \
  --platform managed \
  --timeout 300s \
  --memory 1Gi \
  --allow-unauthenticated \
  --set-secrets GEE_SERVICE_ACCOUNT=gee-service-account:latest
```

### Frontend to GitHub Pages

```bash
cd frontend

# Update .env.production with your Cloud Run URL
# REACT_APP_API_URL=https://your-cloud-run-url

# Deploy
npm run deploy
```

Or use the GitHub Actions workflow (see `.github/workflows/deploy-frontend.yml`)

## 📊 Water Detection Algorithm

1. **Data Ingestion**: Fetch most recent Sentinel-1 GRD imagery (last 30 days)
2. **Preprocessing**: 
   - Radiometric calibration
   - Terrain correction (SRTM)
   - dB conversion
   - Lee speckle filtering
3. **Feature Derivation**:
   - VV and VH polarizations
   - VV-VH difference
   - Texture (local std dev)
   - Slope
4. **Adaptive Detection**:
   - Otsu thresholding (or manual override)
   - Polarization rules
   - Terrain masking
   - Texture filtering
5. **Refinement**:
   - Morphological operations
   - Small object removal
   - Geometry simplification
6. **Vectorization**: Convert to GeoJSON polygons

## 🎨 Advanced Parameters

For fine-tuning detection (accessible via collapsible panel):

- **End Date**: Select a specific date to search for imagery on or before that date (default: latest available)
- **Max Slope (degrees)**: Exclude steep terrain unlikely to retain water (default: 5°)
- **Min Area (pixels)**: Filter out small noise artifacts (default: 100 pixels)

The algorithm uses adaptive Otsu thresholding which automatically determines the optimal VV backscatter threshold based on the image histogram.

## ⚠️ Limitations

### Technical Constraints
- **AOI Size**: Maximum 50×50 km (2500 km²) for real-time processing
- **Temporal**: Uses most recent acquisition within specified date range
- **Orbit**: ASCENDING pass only for consistency
- **Resolution**: 10m Sentinel-1 ground resolution
- **Processing Time**: 15-30 seconds depending on AOI size

### Algorithm Limitations
- **No-Water Scenes**: Otsu thresholding may incorrectly identify "water" pixels in completely dry areas (unimodal histograms with no actual water present)
- **Frozen Water Bodies**: Ice and snow on rivers/lakes appear similar to land in SAR imagery, causing frozen water to be missed or misclassified

### Environmental Conditions
- **High Winds**: Wind-roughened water surfaces increase backscatter, reducing detection accuracy or causing water to appear as land
- **Vegetation**: Dense floating vegetation may mask water presence

## 🔮 Future Enhancements

- [ ] Temporal change detection (before/after flooding)
- [ ] Multi-temporal stacking for stability
- [ ] Sentinel-2 optical cross-validation
- [ ] Permanent water vs flood water classification
- [ ] Time-series animation

## 📄 License

MIT License - Free for educational and commercial use

## 🙏 Acknowledgments

- **Copernicus Sentinel-1** mission for free SAR data
- **Google Earth Engine** for cloud-based processing
- **OpenStreetMap** and **Esri** for basemap tiles

## 📧 Contact

For questions, issues, or collaborations, please open an issue on GitHub.

---

**Note**: This is a demonstration project. For operational flood monitoring, consider additional validation and temporal analysis.
