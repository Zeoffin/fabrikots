#!/bin/bash

# Build script for Railway deployment
echo "Starting build process..."

# Install Node.js dependencies and build React app
echo "Building React frontend..."
cd frontend
npm install
npm run build

# Copy built React files to Django static directory
echo "Copying React build to static directory..."
cd ..
rm -rf static/frontend
mkdir -p static/frontend
cp -r frontend/dist/* static/frontend/

echo "Build process completed!"