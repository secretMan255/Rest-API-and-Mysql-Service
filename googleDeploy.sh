#!/bin/bash

# Define environment variables
GOOGLE_PROJECT_ID=
CLOUD_RUN_SERVICE=
DB_USER=
DB_PASS=
DB_NAME=
INSTANCE_CONNECTION_NAME=
# ALLOWED_ORIGINS="*"
EXPIRES_IN=
emailService=
emailHost=
emailPort=
emailUser=
emailPass=
cronTime=

# Step 1: Build the image
# gcloud builds submit --tag gcr.io/$GOOGLE_PROJECT_ID/$CLOUD_RUN_SERVICE \
#      --project=$GOOGLE_PROJECT_ID

# Step 2: Deploy to Cloud Run
gcloud run deploy $CLOUD_RUN_SERVICE \
     --image=docker.io/yapyiliang2001/api-mysql-service:latest \
     --add-cloudsql-instances=$INSTANCE_CONNECTION_NAME \
     --update-env-vars=CLOUD_RUN_SERVICE=$CLOUD_RUN_SERVICE,DB_USER=$DB_USER,DB_PASS=$DB_PASS,DB_NAME=$DB_NAME,INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME,EXPIRES_IN=$EXPIRES_IN,emailService=$emailService,emailHost=$emailHost,emailPort=$emailPort,emailUser=$emailUser,emailPass=$emailPass,cronTime=$cronTime \
     --platform=managed \
     --region=asia-southeast1 \
     --allow-unauthenticated \
     --project=$GOOGLE_PROJECT_ID
