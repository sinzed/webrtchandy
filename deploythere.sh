#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Variables
REMOTE_USER=ubuntu
REMOTE_HOST=188.121.107.117
REMOTE_BASE_DIR=/var/www/html/cameloop/web/

# Build the application
echo "Building the application..."


# Deploy the new build to a versioned directory
echo "Deploying the new build to ${NEW_DIR}..."
rsync -avz --delete ./ ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_BASE_DIR}

echo "Deployment successful!"
