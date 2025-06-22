#!/bin/bash

# Build and Test Script for "Where The Cat?"
# This script builds the project and runs basic tests

echo "🐱 Building Where The Cat? for production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    print_error "Node.js version 16 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_status "Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi

print_status "npm version: $(npm --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Failed to install dependencies"
        exit 1
    fi
    print_status "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Check for environment variables
if [ ! -f ".env.local" ] && [ -z "$VITE_SUPABASE_URL" ]; then
    print_warning "No .env.local file found and no environment variables set"
    print_warning "Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    echo "You can copy .env.example to .env.local and fill in your values"
fi

# Run linting
echo "🔍 Running linter..."
npm run lint
if [ $? -ne 0 ]; then
    print_warning "Linting issues found, but continuing with build"
else
    print_status "Linting passed"
fi

# Clean previous build
echo "🧹 Cleaning previous build..."
npm run clean 2>/dev/null || rm -rf dist
print_status "Previous build cleaned"

# Build the project
echo "🏗️  Building project..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi

print_status "Build completed successfully"

# Check if dist directory was created
if [ ! -d "dist" ]; then
    print_error "Build output directory 'dist' not found"
    exit 1
fi

# Check build output
echo "📊 Build output analysis:"
echo "Total files: $(find dist -type f | wc -l)"
echo "Total size: $(du -sh dist | cut -f1)"

# Check for critical files
CRITICAL_FILES=("dist/index.html" "dist/assets")
for file in "${CRITICAL_FILES[@]}"; do
    if [ -e "$file" ]; then
        print_status "Found: $file"
    else
        print_error "Missing: $file"
        exit 1
    fi
done

# Check if assets are properly generated
ASSET_COUNT=$(find dist/assets -name "*.js" -o -name "*.css" | wc -l)
if [ "$ASSET_COUNT" -gt 0 ]; then
    print_status "Generated $ASSET_COUNT asset files"
else
    print_error "No asset files generated"
    exit 1
fi

# Optional: Start preview server
read -p "🚀 Start preview server? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Starting preview server on http://localhost:3000"
    echo "Press Ctrl+C to stop"
    npm run serve
fi

print_status "Build and test completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Test the build locally with: npm run serve"
echo "2. Deploy to Netlify following NETLIFY_DEPLOYMENT_GUIDE.md"
echo "3. Set up environment variables in Netlify dashboard"
echo ""
echo "🎉 Your app is ready for deployment!"
