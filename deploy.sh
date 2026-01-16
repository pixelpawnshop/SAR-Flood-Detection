#!/bin/bash

# SAR Flood Detection - Backend Deployment Script
# Deploys FastAPI backend to Google Cloud Run

set -e

echo "🚀 Deploying SAR Flood Detection API to Google Cloud Run..."

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"
SERVICE_NAME="sar-flood-api"
REGION="us-central1"
SECRET_NAME="gee-service-account"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first:"
    echo "   https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if logged in
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" &> /dev/null; then
    echo "❌ Not logged in to gcloud. Run: gcloud auth login"
    exit 1
fi

# Set project
echo "📦 Setting GCP project to: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Deploy to Cloud Run
echo "☁️  Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --timeout 300s \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --allow-unauthenticated \
  --set-secrets GEE_SERVICE_ACCOUNT=$SECRET_NAME:latest \
  --set-env-vars PROJECT_ID=$PROJECT_ID

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Service URL: $SERVICE_URL"
echo "📖 API Docs: $SERVICE_URL/docs"
echo "🏥 Health Check: $SERVICE_URL/health"
echo ""
echo "Next steps:"
echo "1. Update frontend/.env.production with the service URL"
echo "2. Deploy frontend: cd frontend && npm run deploy"
echo ""
