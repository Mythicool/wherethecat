# Where The Cat? 🐱

A community-driven web application for crowdsourcing lost and homeless cat locations to facilitate rescue efforts and community assistance.

## Features

### Core Functionality
- **Interactive Map**: Click anywhere on the map to report a homeless or lost cat
- **Cat Markers**: Custom cat-themed pins show reported cat locations
- **Real-time Updates**: See new cat reports instantly as they're added by other users
- **Photo Upload**: Add multiple photos to cat reports with automatic cloud storage
- **Detailed Information**: Add cat descriptions, colors, sizes, and dates spotted
- **Anonymous Reporting**: Report cats without creating an account (with visual distinctions)

### 📍 Advanced Geolocation
- **"Use My Location" Buttons**: Automatically detect your GPS location on map and form
- **GPS Accuracy Indicators**: Color-coded accuracy levels (excellent to poor)
- **Automatic Map Centering**: Centers map on your current location
- **Privacy-Conscious**: Clear notices about location data usage
- **Error Handling**: Graceful fallbacks for permission denials or GPS issues

### User Management
- **Google OAuth**: One-click sign-in with Google account
- **Anonymous Access**: Report cats without creating an account
- **Personal Dashboard**: View and manage your own cat reports
- **Report Management**: Edit, delete, or update the status of your reports
- **Data Export**: Export your cat reports in JSON or CSV format

### Search & Discovery
- **Advanced Search**: Filter cats by color, size, date range, and location
- **Location Search**: Search for specific addresses or use current location
- **Geocoding**: Automatic address lookup for cat locations
- **Interactive Filters**: Real-time filtering with visual feedback

### Technical Features
- **Cloud Database**: Powered by Firebase Firestore with real-time subscriptions
- **File Storage**: Secure photo storage with Firebase Storage
- **Authentication**: Google OAuth and anonymous sign-in via Firebase Auth
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Offline-Ready**: Graceful handling of network issues
- **Community Focused**: Built to help connect cats with potential rescuers and homes

## How to Use

1. **Report a Cat**: Click anywhere on the map where you've spotted a homeless or lost cat
2. **Add Details**: Fill out the form with any information you have about the cat
3. **View Reports**: Click on existing cat markers to see details about reported cats
4. **Help Cats**: Use the information to coordinate rescue efforts or find homes

## Technology Stack

### Frontend
- **React 18** with functional components and hooks
- **Vite** for fast development and building
- **React Leaflet** for interactive mapping (using OpenStreetMap)
- **Lucide React** for beautiful icons
- **CSS3** with responsive design and animations

### Backend & Database
- **Firebase** for backend-as-a-service
- **Firestore** for reliable NoSQL data storage
- **Real-time subscriptions** for live updates
- **Firebase Security Rules** for data protection
- **Firebase Storage** for photo management
- **Firebase Authentication** for secure user management

### External Services
- **Nominatim (OpenStreetMap)** for geocoding and reverse geocoding
- **Browser Geolocation API** for current location detection

## Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn
- A Firebase account (free tier is sufficient)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wherethecat
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Follow the detailed instructions in `FIREBASE_SETUP_GUIDE.md`
   - Create a Firebase project
   - Enable Authentication (Google + Anonymous)
   - Set up Firestore database
   - Configure Firebase Storage
   - Deploy security rules

4. Configure environment variables:
```bash
cp .env.local.example .env.local
# Edit .env.local with your Firebase credentials
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
# Test build locally with comprehensive checks
npm run build:test

# Build for production
npm run build

# Preview production build
npm run serve
```

The built files will be in the `dist` directory.

### 🚀 Deployment to Netlify

This app is optimized for deployment on Netlify:

1. **Connect your repository** to Netlify
2. **Configure build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Set environment variables** in Netlify dashboard:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
4. **Deploy!**

See [NETLIFY_DEPLOYMENT_GUIDE.md](./NETLIFY_DEPLOYMENT_GUIDE.md) for detailed instructions.

### 📋 Documentation

- [Deployment Guide](./NETLIFY_DEPLOYMENT_GUIDE.md) - Complete Netlify deployment
- [Environment Setup](./ENVIRONMENT_SETUP.md) - Environment variables guide
- [Geolocation Features](./GEOLOCATION_IMPLEMENTATION.md) - GPS functionality details
- [Anonymous Reporting](./ANONYMOUS_REPORTING_IMPLEMENTATION.md) - Anonymous features
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md) - Pre-launch checklist

## Contributing

This is a community project aimed at helping homeless cats. Contributions are welcome!

## License

This project is open source and available under the MIT License.
