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

- **Adaptive Water Detection**: Otsu thresholding automatically adjusts to local conditions
- **Manual Overrides**: Advanced users can fine-tune detection parameters
- **Dual Basemaps**: Toggle between OpenStreetMap and Esri World Imagery
- **Test AOIs**: Pre-loaded test locations including historical flood events
- **Real-time Processing**: Results typically return in 30-60 seconds
- **No Caching**: Stateless design - download results as needed
- **Free Data**: Uses Copernicus Sentinel-1 SAR imagery via Google Earth Engine

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

The application includes 4 pre-loaded test AOIs:

1. **Ahrweiler, Germany (2021 Floods)** - European flash flooding event
2. **Sindh, Pakistan (2022 Floods)** - Massive monsoon flooding
3. **Venice Lagoon, Italy** - Permanent water baseline
4. **Sahara Desert, Algeria** - Dry control area (minimal water)

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

- **VV Threshold (dB)**: Primary water backscatter threshold
- **VH Threshold (dB)**: Secondary polarization threshold
- **VV-VH Difference**: Polarization ratio limit
- **Max Slope (degrees)**: Exclude steep terrain
- **Min Area (pixels)**: Remove small noise objects
- **Texture Window**: Spatial texture analysis window size

## ⚠️ Limitations

- **AOI Size**: Maximum 50×50 km (2500 km²) for real-time processing
- **Temporal**: Uses most recent acquisition (last 30 days)
- **Orbit**: ASCENDING pass only for consistency
- **Resolution**: 10m Sentinel-1 ground resolution
- **False Positives**: May occur in urban areas, wet soil, low-wind conditions
- **Processing Time**: 30-120 seconds depending on AOI size

## 🔮 Future Enhancements

- [ ] Temporal change detection (before/after flooding)
- [ ] Multi-temporal stacking for stability
- [ ] Sentinel-2 optical cross-validation
- [ ] Permanent water vs flood water classification
- [ ] Export to Shapefile/KML formats
- [ ] Time-series animation
- [ ] Email alerts for new detections
- [ ] Mobile-responsive design improvements

## 📄 License

MIT License - Free for educational and commercial use

## 🙏 Acknowledgments

- **Copernicus Sentinel-1** mission for free SAR data
- **Google Earth Engine** for cloud-based processing
- **OpenStreetMap** and **Esri** for basemap tiles

## 📧 Contact

For questions, issues, or collaborations, please open an issue on GitHub.

---

**Note**: This is a portfolio/demonstration project. For operational flood monitoring, consider additional validation and temporal analysis.
