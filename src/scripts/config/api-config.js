// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://story-api.dicoding.dev/v1',
  ENDPOINTS: {
    STORIES: '/stories',
    STORIES_WITH_LOCATION: '/stories?location=1',
    REGISTER: '/register',
    LOGIN: '/login',
    ADD_STORY: '/stories'
  },
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json'
  }
};

export const MAP_CONFIG = {
  DEFAULT_CENTER: [-6.2, 106.816666], // Jakarta coordinates
  DEFAULT_ZOOM: 10,
  TILE_LAYERS: {
    OPENSTREETMAP: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
      name: 'OpenStreetMap'
    },
    SATELLITE: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '© Esri',
      name: 'Satellite'
    },
    TERRAIN: {
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      attribution: '© OpenTopoMap contributors',
      name: 'Terrain'
    }
  }
};