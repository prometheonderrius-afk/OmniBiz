#!/usr/bin/env bash

# 🚀 OmniBiz AI - Secure GCP Cloud Run Deployment Script (Secret Manager Enabled)
set -e

PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "wacom-canvas")
REGION="us-central1"
SERVICE_NAME="omnibiz-app"

echo "================================================="
echo "🚀 Deploying OmniBiz AI to GCP Cloud Run (Secret Manager Enabled)"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo "================================================="

# Build Vite static assets
npm run build

# Enable Secret Manager API if not already enabled
gcloud services enable secretmanager.googleapis.com --project="$PROJECT_ID" 2>/dev/null || true

# Helper function to ensure secret exists in Secret Manager
ensure_secret() {
  SECRET_NAME="$1"
  if ! gcloud secrets describe "$SECRET_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo "🔐 Creating secret placeholder in GCP Secret Manager: $SECRET_NAME"
    gcloud secrets create "$SECRET_NAME" --replication-policy="automatic" --project="$PROJECT_ID"
    echo "placeholder" | gcloud secrets versions add "$SECRET_NAME" --data-file=- --project="$PROJECT_ID"
  fi
}

# Ensure core secrets exist in Secret Manager
ensure_secret "GEMINI_API_KEY"
ensure_secret "TWILIO_ACCOUNT_SID"
ensure_secret "TWILIO_AUTH_TOKEN"
ensure_secret "STRIPE_SECRET_KEY"

# Deploy container to Cloud Run with Secret Manager environment bindings
gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,TWILIO_ACCOUNT_SID=TWILIO_ACCOUNT_SID:latest,TWILIO_AUTH_TOKEN=TWILIO_AUTH_TOKEN:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest

echo "================================================="
echo "✅ GCP Deployment Complete!"
echo "🔐 All API keys securely bound via GCP Secret Manager!"
echo "🌐 Your app is live on Google Cloud Platform!"
echo "================================================="
