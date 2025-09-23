#!/usr/bin/env python3
"""
Railway startup script for FastAPI application.
This ensures the app runs with the correct PORT environment variable.
"""
import os
import uvicorn
from app import app

if __name__ == "__main__":
    # Get port from Railway environment variable
    port = int(os.environ.get("PORT", 8000))
    print(f"Starting FastAPI app on port {port}")
    
    # Start the server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )
