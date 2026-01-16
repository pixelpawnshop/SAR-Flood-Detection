# Google Earth Engine Service Account Setup Guide

This guide walks you through creating a Google Earth Engine service account for the SAR Flood Detection application.

## Prerequisites

- A Google account
- Access to Google Cloud Platform (GCP)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "sar-flood-detection")
5. Click **"Create"**
6. Wait for the project to be created and select it

## Step 2: Enable Required APIs

1. In the Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for and enable the following APIs:
   - **Earth Engine API**
   - **Cloud Run API** (for deployment)
   - **Secret Manager API** (for credential storage)

## Step 3: Register for Google Earth Engine

1. Go to [Google Earth Engine signup](https://earthengine.google.com/signup/)
2. Sign in with your Google account
3. Select **"Register a Cloud Project"**
4. Enter your GCP project ID (from Step 1)
5. Accept the terms and submit
6. Wait for approval (usually instant for Cloud Projects)

## Step 4: Create a Service Account

1. In Cloud Console, go to **"IAM & Admin"** > **"Service Accounts"**
2. Click **"Create Service Account"**
3. Enter details:
   - **Name**: `gee-sar-service-account`
   - **Description**: `Service account for SAR flood detection app`
4. Click **"Create and Continue"**

## Step 5: Grant Permissions

1. In the **"Grant this service account access to project"** section:
   - Add role: **"Earth Engine Resource Admin"**
   - Add role: **"Earth Engine Resource Writer"** (if needed)
2. Click **"Continue"**
3. Click **"Done"** (skip optional user access)

## Step 6: Create and Download JSON Key

1. Find your newly created service account in the list
2. Click on the service account email
3. Go to the **"Keys"** tab
4. Click **"Add Key"** > **"Create new key"**
5. Select **"JSON"** format
6. Click **"Create"**
7. The JSON key file will download automatically

**⚠️ IMPORTANT**: Keep this file secure! It provides full access to your GEE account.

## Step 7: Set Up for Local Development

1. Create a `credentials` directory in the `backend` folder:
   ```bash
   mkdir backend/credentials
   ```

2. Move the downloaded JSON file to this directory:
   ```bash
   mv ~/Downloads/gee-sar-service-account-*.json backend/credentials/gee-service-account.json
   ```

3. Create a `.env` file in the `backend` directory:
   ```bash
   cd backend
   cp .env.example .env
   ```

4. Edit `.env` and set:
   ```
   GEE_SERVICE_ACCOUNT_PATH=./credentials/gee-service-account.json
   ```

5. Verify the credentials are excluded from git:
   ```bash
   # This should show backend/credentials/ in .gitignore
   cat ../.gitignore | grep credentials
   ```

## Step 8: Test Local Authentication

1. Activate your Python virtual environment:
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Run a simple test:
   ```python
   python -c "
   import ee
   import json
   import os
   from dotenv import load_dotenv
   
   load_dotenv()
   cred_path = os.getenv('GEE_SERVICE_ACCOUNT_PATH')
   
   with open(cred_path) as f:
       data = json.load(f)
   
   credentials = ee.ServiceAccountCredentials(
       data['client_email'],
       cred_path
   )
   ee.Initialize(credentials)
   
   # Test query
   image = ee.Image('COPERNICUS/S1_GRD').first()
   print('✅ GEE Authentication successful!')
   print(f'Service account: {data[\"client_email\"]}')
   "
   ```

If you see "✅ GEE Authentication successful!", you're all set!

## Step 9: Set Up for Cloud Run Deployment

### Option A: Using Secret Manager (Recommended)

1. In Cloud Console, go to **"Security"** > **"Secret Manager"**
2. Click **"Create Secret"**
3. Name: `gee-service-account`
4. For the secret value, paste the **entire contents** of your JSON key file
5. Click **"Create Secret"**
6. Grant the Cloud Run service account access:
   - Go to the secret's **"Permissions"** tab
   - Click **"Grant Access"**
   - Add principal: `{project-number}-compute@developer.gserviceaccount.com`
   - Role: **"Secret Manager Secret Accessor"**

### Option B: Using Environment Variables (Less Secure)

1. When deploying to Cloud Run, pass the JSON content as an environment variable:
   ```bash
   gcloud run deploy sar-flood-api \
     --set-env-vars GEE_SERVICE_ACCOUNT="$(cat backend/credentials/gee-service-account.json)"
   ```

**Recommendation**: Use Secret Manager (Option A) for production deployments.

## Step 10: Update Backend Code

The backend code should automatically detect the environment:

```python
# backend/gee_processing.py

def initialize_gee():
    """Initialize Google Earth Engine with service account credentials"""
    import os
    import json
    import ee
    
    # Check if running locally or on Cloud Run
    if os.path.exists(os.getenv('GEE_SERVICE_ACCOUNT_PATH', '')):
        # Local development
        cred_path = os.getenv('GEE_SERVICE_ACCOUNT_PATH')
        with open(cred_path) as f:
            data = json.load(f)
        credentials = ee.ServiceAccountCredentials(
            data['client_email'],
            cred_path
        )
        ee.Initialize(credentials)
    else:
        # Cloud Run with Secret Manager
        # The secret is mounted as an environment variable
        cred_json = os.getenv('GEE_SERVICE_ACCOUNT')
        if cred_json:
            data = json.loads(cred_json)
            credentials = ee.ServiceAccountCredentials(
                data['client_email'],
                key_data=cred_json
            )
            ee.Initialize(credentials)
        else:
            raise ValueError("GEE credentials not found")
```

## Troubleshooting

### "Earth Engine access is not configured for this project"

- Make sure you completed Step 3 (Register for GEE)
- Wait a few minutes after registration
- Verify your project ID matches in GEE and GCP

### "Permission denied" errors

- Ensure the service account has "Earth Engine Resource Admin" role
- Check that the service account email ends with `.gserviceaccount.com`
- Verify the JSON key is not corrupted

### "Invalid credentials" during initialization

- Check that the JSON file path is correct in `.env`
- Verify the JSON file is valid (can be opened and parsed)
- Ensure you're using the service account credentials, not OAuth credentials

### Cloud Run deployment fails

- Verify Secret Manager permissions
- Check that the secret name matches in your deployment script
- Ensure the Cloud Run service account has access to the secret

## Security Best Practices

1. **Never commit credentials to git**
   - Always keep `credentials/` in `.gitignore`
   - Use Secret Manager for production

2. **Rotate keys periodically**
   - Create new keys every 90 days
   - Delete old keys after rotation

3. **Use least-privilege permissions**
   - Only grant necessary Earth Engine roles
   - Avoid "Owner" or "Editor" roles

4. **Monitor usage**
   - Check GEE quota usage regularly
   - Set up billing alerts in GCP

## Additional Resources

- [Google Earth Engine Authentication](https://developers.google.com/earth-engine/guides/service_account)
- [GCP Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Earth Engine Python API](https://developers.google.com/earth-engine/guides/python_install)

---

**Need Help?** Open an issue on GitHub or consult the [GEE Community Forum](https://groups.google.com/g/google-earth-engine-developers).
