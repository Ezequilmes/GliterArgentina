# Docker Setup Script for Gliter Argentina
# This script will be used to pull and extract the Docker container once Docker Desktop is installed

# Configuration
$DOCKER_IMAGE = "us-central1-docker.pkg.dev/gliter-argentina/firebaseapphosting-images/my-web-app"
$DOCKER_TAG = "build-2025-11-04-002"
$DOCKER_DIGEST = "sha256:d9340705d299fca5ae8fb01646317279b4061d0caa1548c2ba960039d2dc1303"
$FULL_IMAGE = "${DOCKER_IMAGE}:${DOCKER_TAG}@${DOCKER_DIGEST}"
$EXTRACTION_DIR = "docker-extraction"

Write-Host "Docker Setup Script for Gliter Argentina" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

# Function to check if Docker is available
function Test-DockerAvailable {
    try {
        $dockerVersion = docker --version
        Write-Host "Docker found: $dockerVersion" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Docker not found. Please install Docker Desktop first." -ForegroundColor Red
        return $false
    }
}

# Function to pull the Docker image
function Pull-DockerImage {
    Write-Host "Pulling Docker image: $FULL_IMAGE" -ForegroundColor Yellow
    try {
        docker pull $FULL_IMAGE
        Write-Host "Docker image pulled successfully!" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Failed to pull Docker image: $_" -ForegroundColor Red
        return $false
    }
}

# Function to extract container filesystem
function Extract-ContainerFilesystem {
    Write-Host "Extracting container filesystem..." -ForegroundColor Yellow
    try {
        # Create extraction directory
        New-Item -ItemType Directory -Path $EXTRACTION_DIR -Force | Out-Null
        
        # Create a container from the image
        $containerId = docker create $FULL_IMAGE
        Write-Host "Created container: $containerId" -ForegroundColor Green
        
        # Export the container filesystem
        docker export $containerId | tar -x -C $EXTRACTION_DIR
        
        # Remove the temporary container
        docker rm $containerId
        
        Write-Host "Container filesystem extracted to: $EXTRACTION_DIR" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "Failed to extract container filesystem: $_" -ForegroundColor Red
        return $false
    }
}

# Function to verify image layers
function Verify-ImageLayers {
    Write-Host "Verifying image layers..." -ForegroundColor Yellow
    try {
        $imageInspect = docker image inspect $FULL_IMAGE | ConvertFrom-Json
        $layers = $imageInspect[0].RootFS.Layers
        
        Write-Host "Image contains $($layers.Count) layers:" -ForegroundColor Green
        foreach ($layer in $layers) {
            Write-Host "  - $layer" -ForegroundColor Gray
        }
        
        return $true
    }
    catch {
        Write-Host "Failed to verify image layers: $_" -ForegroundColor Red
        return $false
    }
}

# Function to verify checksums
function Verify-Checksums {
    Write-Host "Verifying checksums..." -ForegroundColor Yellow
    try {
        $imageInspect = docker image inspect $FULL_IMAGE | ConvertFrom-Json
        $repoDigests = $imageInspect[0].RepoDigests
        
        Write-Host "Repository digests:" -ForegroundColor Green
        foreach ($digest in $repoDigests) {
            Write-Host "  - $digest" -ForegroundColor Gray
        }
        
        return $true
    }
    catch {
        Write-Host "Failed to verify checksums: $_" -ForegroundColor Red
        return $false
    }
}

# Main execution
function Main {
    Write-Host "Starting Docker setup process..." -ForegroundColor Cyan
    
    # Check if Docker is available
    if (-not (Test-DockerAvailable)) {
        Write-Host "Please install Docker Desktop and try again." -ForegroundColor Red
        Write-Host "Download from: https://www.docker.com/products/docker-desktop/" -ForegroundColor Yellow
        return
    }
    
    # Pull the Docker image
    if (-not (Pull-DockerImage)) {
        Write-Host "Failed to pull Docker image. Exiting." -ForegroundColor Red
        return
    }
    
    # Verify image layers
    if (-not (Verify-ImageLayers)) {
        Write-Host "Failed to verify image layers. Exiting." -ForegroundColor Red
        return
    }
    
    # Verify checksums
    if (-not (Verify-Checksums)) {
        Write-Host "Failed to verify checksums. Exiting." -ForegroundColor Red
        return
    }
    
    # Extract container filesystem
    if (-not (Extract-ContainerFilesystem)) {
        Write-Host "Failed to extract container filesystem. Exiting." -ForegroundColor Red
        return
    }
    
    Write-Host "Docker setup completed successfully!" -ForegroundColor Green
    Write-Host "Container filesystem extracted to: $EXTRACTION_DIR" -ForegroundColor Green
    Write-Host "You can now examine the extracted files in the $EXTRACTION_DIR directory." -ForegroundColor Yellow
}

# Run the main function
Main