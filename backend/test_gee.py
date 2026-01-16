import ee
import json
import os
from dotenv import load_dotenv

load_dotenv()
cred_path = os.getenv('GEE_SERVICE_ACCOUNT_PATH')

# Convert to absolute path
if cred_path and not os.path.isabs(cred_path):
    cred_path = os.path.join(os.path.dirname(__file__), cred_path)

print(f"🔍 Testing GEE Connection...")
print(f"📁 Credentials path: {cred_path}")
print(f"📁 File exists: {os.path.exists(cred_path)}")

try:
    with open(cred_path) as f:
        data = json.load(f)
    
    credentials = ee.ServiceAccountCredentials(
        data['client_email'],
        cred_path
    )
    ee.Initialize(credentials)
    
    # Test query
    collection = ee.ImageCollection('COPERNICUS/S1_GRD').limit(1)
    count = collection.size().getInfo()
    
    print('✅ GEE Authentication successful!')
    print(f"✅ Service account: {data['client_email']}")
    print(f"✅ Found {count} Sentinel-1 image(s)")
    
except FileNotFoundError:
    print(f"❌ Credentials file not found at: {cred_path}")
    print("   Check your .env file and credentials path")
    print(f"\n📂 Current directory: {os.getcwd()}")
    print(f"📂 Script directory: {os.path.dirname(__file__)}")
except Exception as e:
    print(f"❌ Error: {str(e)}")