"""
Local development server for SAR Flood Detection API
Loads GEE credentials from local file and runs FastAPI with hot reload
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Verify GEE credentials exist
gee_cred_path = os.getenv('GEE_SERVICE_ACCOUNT_PATH')
if not gee_cred_path or not os.path.exists(gee_cred_path):
    print("❌ ERROR: GEE service account credentials not found!")
    print(f"   Looking for: {gee_cred_path}")
    print("\nPlease:")
    print("1. Create backend/credentials/ directory")
    print("2. Place your GEE service account JSON in backend/credentials/gee-service-account.json")
    print("3. Copy .env.example to .env and update GEE_SERVICE_ACCOUNT_PATH")
    print("\nSee docs/GEE_SETUP.md for detailed instructions.")
    sys.exit(1)

print("✅ GEE credentials found")
print(f"   Path: {gee_cred_path}")

# Run the server
if __name__ == "__main__":
    import uvicorn
    
    print("\n🚀 Starting SAR Flood Detection API...")
    print("   Local: http://localhost:8000")
    print("   Docs:  http://localhost:8000/docs")
    print("\n   Press CTRL+C to stop\n")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
