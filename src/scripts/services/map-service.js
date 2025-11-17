import L from "leaflet";
import { MAP_CONFIG } from "../config/api-config.js";

class MapService {
  constructor(containerId) {
    this.containerId = containerId;
    this.map = null;
    this.markers = new Map();
    this.markerClickCallback = null;
    this.activeMarkerId = null;
    this.layerControl = null;
    this.tileLayers = {};
    this.tempMarker = null;
  }

  async initMap(
    center = MAP_CONFIG.DEFAULT_CENTER,
    zoom = MAP_CONFIG.DEFAULT_ZOOM
  ) {
    try {
      const container = document.getElementById(this.containerId);

      if (!container) {
        throw new Error(
          `Map container with id '${this.containerId}' not found`
        );
      }

      // Check if map is already initialized
      if (this.map) {
        console.log("Map already initialized, reusing existing instance");
        return this.map;
      }

      // Check if container already has a map instance
      if (container._leaflet_id) {
        console.log("Container already has a map, removing existing instance");
        // Remove existing map from container
        container._leaflet_id = null;
        container.innerHTML = "";
      }

      // Initialize the map
      this.map = L.map(this.containerId, {
        center: center,
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        touchZoom: true,
        keyboard: true,
        keyboardPanDelta: 80,
      });

      // Create tile layers
      this.createTileLayers();

      // Add default layer
      this.tileLayers.openstreetmap.addTo(this.map);

      // Add layer control for multiple tile layers
      this.addLayerControl();

      // Add scale control
      L.control
        .scale({
          metric: true,
          imperial: false,
          position: "bottomleft",
        })
        .addTo(this.map);

      // Setup keyboard accessibility
      this.setupAccessibility();

      console.log("Map initialized successfully");
      return this.map;
    } catch (error) {
      console.error("Failed to initialize map:", error);
      throw error;
    }
  }

  createTileLayers() {
    // OpenStreetMap layer
    this.tileLayers.openstreetmap = L.tileLayer(
      MAP_CONFIG.TILE_LAYERS.OPENSTREETMAP.url,
      {
        attribution: MAP_CONFIG.TILE_LAYERS.OPENSTREETMAP.attribution,
        maxZoom: 19,
      }
    );

    // Satellite layer
    this.tileLayers.satellite = L.tileLayer(
      MAP_CONFIG.TILE_LAYERS.SATELLITE.url,
      {
        attribution: MAP_CONFIG.TILE_LAYERS.SATELLITE.attribution,
        maxZoom: 19,
      }
    );

    // Terrain layer
    this.tileLayers.terrain = L.tileLayer(MAP_CONFIG.TILE_LAYERS.TERRAIN.url, {
      attribution: MAP_CONFIG.TILE_LAYERS.TERRAIN.attribution,
      maxZoom: 17,
    });
  }

  addLayerControl() {
    const baseMaps = {
      [MAP_CONFIG.TILE_LAYERS.OPENSTREETMAP.name]:
        this.tileLayers.openstreetmap,
      [MAP_CONFIG.TILE_LAYERS.SATELLITE.name]: this.tileLayers.satellite,
      [MAP_CONFIG.TILE_LAYERS.TERRAIN.name]: this.tileLayers.terrain,
    };

    this.layerControl = L.control
      .layers(baseMaps, null, {
        position: "topright",
        collapsed: false,
      })
      .addTo(this.map);
  }

  setupAccessibility() {
    // Make map container focusable
    const mapContainer = this.map.getContainer();
    mapContainer.setAttribute("tabindex", "0");
    mapContainer.setAttribute("role", "application");
    mapContainer.setAttribute("aria-label", "Peta interaktif cerita");

    // Add keyboard event listeners
    mapContainer.addEventListener("keydown", (event) => {
      const panDistance = 50;
      const zoomLevel = this.map.getZoom();

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          this.map.panBy([0, -panDistance]);
          break;
        case "ArrowDown":
          event.preventDefault();
          this.map.panBy([0, panDistance]);
          break;
        case "ArrowLeft":
          event.preventDefault();
          this.map.panBy([-panDistance, 0]);
          break;
        case "ArrowRight":
          event.preventDefault();
          this.map.panBy([panDistance, 0]);
          break;
        case "+":
        case "=":
          event.preventDefault();
          this.map.setZoom(zoomLevel + 1);
          break;
        case "-":
          event.preventDefault();
          this.map.setZoom(zoomLevel - 1);
          break;
      }
    });
  }

  addStoryMarker(story) {
    if (!story.lat || !story.lon) return null;

    const customIcon = L.divIcon({
      className: "custom-marker",
      html: `
        <div class="marker-pin" data-story-id="${story.id}">
          <div class="marker-icon">📚</div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    const marker = L.marker([story.lat, story.lon], {
      icon: customIcon,
      title: story.name || "Cerita",
      alt: `Lokasi cerita: ${story.name || "Tanpa judul"}`,
    });

    const popupContent = `
      <div class="marker-popup">
        <div class="popup-image">
          <img src="${story.photoUrl}" alt="${
      story.description || "Foto cerita"
    }" loading="lazy">
        </div>
        <div class="popup-content">
          <h4>${story.name || "Cerita Tanpa Judul"}</h4>
          <p>${story.description || "Tidak ada deskripsi"}</p>
          <div class="popup-meta">
            <small>📅 ${new Date(story.createdAt).toLocaleDateString(
              "id-ID"
            )}</small>
          </div>
        </div>
      </div>
    `;

    marker.bindPopup(popupContent, {
      maxWidth: 300,
      className: "custom-popup",
    });

    marker.on("click", () => {
      this.activeMarkerId = story.id;
      if (this.markerClickCallback) {
        this.markerClickCallback(story);
      }
    });

    // Add keyboard support
    marker.on("add", () => {
      const markerElement = marker.getElement();
      if (markerElement) {
        markerElement.setAttribute("tabindex", "0");
        markerElement.setAttribute("role", "button");
        markerElement.setAttribute(
          "aria-label",
          `Marker cerita: ${story.name || "Tanpa judul"}`
        );

        markerElement.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            marker.fire("click");
          }
        });
      }
    });

    marker.addTo(this.map);
    this.markers.set(story.id, marker);

    return marker;
  }

  addClickableMarker(lat, lon, callback) {
    const tempIcon = L.divIcon({
      className: "temp-marker",
      html: '<div class="temp-marker-pin">📍</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    const marker = L.marker([lat, lon], {
      icon: tempIcon,
      title: "Lokasi yang dipilih",
    });

    marker.on("click", () => {
      if (callback) {
        callback(lat, lon);
      }
    });

    return marker;
  }

  onMarkerClick(callback) {
    this.markerClickCallback = callback;
  }

  highlightMarker(storyId) {
    // Clear previous highlights
    this.clearHighlight();

    const marker = this.markers.get(storyId);
    if (marker) {
      const markerElement = marker.getElement();
      if (markerElement) {
        markerElement.classList.add("highlighted");
      }
      this.activeMarkerId = storyId;
    }
  }

  clearHighlight() {
    if (this.activeMarkerId) {
      const marker = this.markers.get(this.activeMarkerId);
      if (marker) {
        const markerElement = marker.getElement();
        if (markerElement) {
          markerElement.classList.remove("highlighted");
        }
      }
      this.activeMarkerId = null;
    }
  }

  clearMarkers() {
    this.markers.forEach((marker) => {
      this.map.removeLayer(marker);
    });
    this.markers.clear();
  }

  fitBoundsToMarkers() {
    if (this.markers.size > 0) {
      const group = new L.featureGroup(Array.from(this.markers.values()));
      this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
    }
  }

  setView(lat, lon, zoom = MAP_CONFIG.DEFAULT_ZOOM) {
    if (this.map) {
      this.map.setView([lat, lon], zoom);
    }
  }

  onClick(callback) {
    if (this.map) {
      this.map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        callback(lat, lng);
      });
    }
  }

  addTemporaryMarker(lat, lon) {
    if (!this.map) return null;

    // Remove existing temporary marker
    if (this.tempMarker) {
      this.map.removeLayer(this.tempMarker);
    }

    const tempIcon = L.divIcon({
      className: "temp-marker",
      html: '<div class="temp-marker-pin">📍</div>',
      iconSize: [30, 30],
      iconAnchor: [15, 30],
    });

    this.tempMarker = L.marker([lat, lon], {
      icon: tempIcon,
      title: "Lokasi yang dipilih",
    }).addTo(this.map);

    return this.tempMarker;
  }

  removeTemporaryMarker() {
    if (this.tempMarker && this.map) {
      this.map.removeLayer(this.tempMarker);
      this.tempMarker = null;
    }
  }

  // Check if map is initialized
  isInitialized() {
    return this.map !== null;
  }

  // Reset map instance
  reset() {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.markers.clear();
      this.tempMarker = null;
      this.activeMarkerId = null;
    }
  }

  destroy() {
    this.reset();
  }
}

export default MapService;
