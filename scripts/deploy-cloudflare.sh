#!/bin/bash

# Deploy to Cloudflare Pages Script
# This script builds and prepares the app for Cloudflare Pages deployment

echo "🚀 Starting Cloudflare Pages deployment preparation..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running linting..."
npm run lint

# Build for production
echo "🏗️  Building for production..."
npm run build:cloudflare

# Check if build was successful
if [ ! -d "dist" ]; then
    echo "❌ Build failed! dist directory not found."
    exit 1
fi

# Display build info
echo "✅ Build completed successfully!"
echo "📊 Build statistics:"
ls -la dist/
echo ""
echo "📁 Files in dist directory:"
find dist/ -type f -name "*.js" -o -name "*.css" -o -name "*.html" | head -10

echo ""
echo "🎉 Ready for Cloudflare Pages deployment!"
echo ""
echo "Next steps:"
echo "1. Go to https://dash.cloudflare.com/pages"
echo "2. Click 'Upload assets'"
echo "3. Drag and drop the 'dist' folder"
echo "4. Set environment variables:"
echo "   - VITE_SUPABASE_URL"
echo "   - VITE_SUPABASE_ANON_KEY"
echo "5. Deploy!"
echo ""
echo "Or connect your GitHub repository for automatic deployments."
