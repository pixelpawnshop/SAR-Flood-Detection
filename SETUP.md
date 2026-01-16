# 🚀 Quick Setup Guide

## Initial Setup (First Time)

### 1. Google Earth Engine Setup
```bash
# Follow the detailed guide
cat docs/GEE_SETUP.md

# Summary:
# - Create GCP project
# - Enable Earth Engine API
# - Create service account
# - Download JSON credentials
# - Save to backend/credentials/gee-service-account.json
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# Activate (Windows CMD)
venv\Scripts\activate.bat

# Install dependencies
pip install -r requirements.txt

# Create .env file
copy .env.example .env

# Edit .env and set GEE_SERVICE_ACCOUNT_PATH
notepad .env
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Update .env.development if needed (default is localhost:8000)
```

## Running Locally

### Terminal 1 - Backend
```bash
cd backend
.\venv\Scripts\Activate.ps1  # or appropriate activation command
python run_local.py

# Should see:
# ✅ GEE credentials found
# 🚀 Starting SAR Flood Detection API...
#    Local: http://localhost:8000
#    Docs:  http://localhost:8000/docs
```

### Terminal 2 - Frontend
```bash
cd frontend
npm start

# Should open browser at http://localhost:3000
```

## Testing the Application

1. **Open** http://localhost:3000
2. **Select** a test location from dropdown (e.g., "Venice Lagoon, Italy")
3. **Click** "🛰️ Detect Water"
4. **Wait** 30-60 seconds for processing
5. **View** results - blue polygons show detected water
6. **Download** results as GeoJSON if desired

## Troubleshooting

### Backend Issues

**"GEE credentials not found"**
- Check `backend/credentials/gee-service-account.json` exists
- Verify `.env` file has correct path

**"Earth Engine access not configured"**
- Complete GEE signup at https://earthengine.google.com/signup/
- Register your GCP project

**Import errors**
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again

### Frontend Issues

**"Cannot connect to backend"**
- Verify backend is running on port 8000
- Check `.env.development` has correct API URL

**Map not loading**
- Check console for errors
- Ensure leaflet CSS is imported

**"Module not found" errors**
- Run `npm install` in frontend directory
- Delete `node_modules` and `package-lock.json`, run `npm install` again

## Deployment

### Backend to Cloud Run
```bash
# Set your GCP project ID
export GCP_PROJECT_ID=your-project-id

# Run deployment script
bash deploy.sh

# Or deploy manually:
cd backend
gcloud run deploy sar-flood-api \
  --source . \
  --region us-central1 \
  --timeout 300s \
  --memory 1Gi \
  --allow-unauthenticated \
  --set-secrets GEE_SERVICE_ACCOUNT=gee-service-account:latest
```

### Frontend to GitHub Pages
```bash
cd frontend

# Update .env.production with Cloud Run URL
echo "REACT_APP_API_URL=https://your-cloud-run-url" > .env.production

# Deploy
npm run deploy

# Or use GitHub Actions:
# 1. Go to repo Settings > Secrets
# 2. Add REACT_APP_API_URL secret with Cloud Run URL
# 3. Push to main branch
```

## Project Structure
```
sar/
├── backend/                    # FastAPI backend
│   ├── main.py                # API endpoints
│   ├── gee_processing.py      # GEE SAR processing
│   ├── water_detection.py     # Water detection algorithm
│   ├── utils.py               # Helper functions
│   ├── requirements.txt       # Python dependencies
│   ├── Dockerfile             # Cloud Run deployment
│   └── run_local.py           # Local development server
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── services/          # API integration
│   │   ├── utils/             # Validators
│   │   └── data/              # Test AOIs
│   ├── package.json           # Node dependencies
│   └── public/                # Static assets
├── docs/                       # Documentation
│   └── GEE_SETUP.md           # GEE setup guide
├── .github/                    # GitHub Actions
│   └── workflows/
│       └── deploy-frontend.yml
├── deploy.sh                   # Backend deployment script
└── README.md                   # Main documentation
```

## Key Features Implemented

✅ FastAPI backend with Google Earth Engine integration
✅ Sentinel-1 SAR imagery processing
✅ Adaptive Otsu thresholding for water detection
✅ Manual parameter overrides for advanced users
✅ React frontend with Leaflet maps
✅ Dual basemap support (OSM + Satellite)
✅ Test AOI selector with 4 pre-loaded locations
✅ Collapsible advanced parameters panel
✅ Multi-stage progress indicators
✅ GeoJSON download functionality
✅ Cloud Run deployment configuration
✅ GitHub Pages deployment workflow
✅ Comprehensive documentation

## Next Steps

1. ✅ Complete GEE service account setup
2. ✅ Test locally with all 4 test AOIs
3. ✅ Deploy backend to Cloud Run
4. ✅ Deploy frontend to GitHub Pages
5. 📸 Add screenshots to README
6. 🎨 Customize styling/branding
7. 📊 Add usage analytics (optional)
8. 🔒 Add API key authentication (optional)

## Support

- **Documentation**: See README.md and docs/GEE_SETUP.md
- **Issues**: Open an issue on GitHub
- **GEE Help**: https://developers.google.com/earth-engine

---

Happy flood detecting! 🛰️💧
