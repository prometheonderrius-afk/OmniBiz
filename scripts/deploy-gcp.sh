#!/usr/bin/env bash

# 🚀 OmniBiz AI - One-Click GCP Cloud Run Deployment Script
set -e

PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "wacom-canvas")
REGION="us-central1"
SERVICE_NAME="omnibiz-app"

echo "================================================="
echo "🚀 Building & Deploying OmniBiz AI to GCP Cloud Run"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "================================================="

# Build Vite static assets
npm run build

# Deploy container directly from source to Cloud Run
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production

echo "✅ GCP Deployment Complete!"
echo "🌐 Your app is now live on Google Cloud Platform!"
