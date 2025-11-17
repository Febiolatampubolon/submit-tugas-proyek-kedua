// IndexedDB Service for App
class IndexedDBService {
  constructor() {
    this.dbName = "AppDB";
    this.dbVersion = 1;
    this.db = null;
    this.stores = {
      STORIES: "stories",
      FAVORITES: "favorites",
      OFFLINE_STORIES: "offlineStories",
      SYNC_QUEUE: "syncQueue",
    };
  }

  // Initialize IndexedDB
  async initialize() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error("IndexedDB initialization failed:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log("IndexedDB initialized successfully");
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create stories object store
        if (!db.objectStoreNames.contains(this.stores.STORIES)) {
          const storiesStore = db.createObjectStore(this.stores.STORIES, {
            keyPath: "id",
          });
          storiesStore.createIndex("name", "name", { unique: false });
          storiesStore.createIndex("createdAt", "createdAt", { unique: false });
          storiesStore.createIndex("lat", "lat", { unique: false });
          storiesStore.createIndex("lon", "lon", { unique: false });
        }

        // Create favorites object store
        if (!db.objectStoreNames.contains(this.stores.FAVORITES)) {
          const favoritesStore = db.createObjectStore(this.stores.FAVORITES, {
            keyPath: "storyId",
          });
          favoritesStore.createIndex("addedAt", "addedAt", { unique: false });
        }

        // Create offline stories object store
        if (!db.objectStoreNames.contains(this.stores.OFFLINE_STORIES)) {
          const offlineStoriesStore = db.createObjectStore(
            this.stores.OFFLINE_STORIES,
            {
              keyPath: "tempId",
              autoIncrement: true,
            }
          );
          offlineStoriesStore.createIndex("createdAt", "createdAt", {
            unique: false,
          });
          offlineStoriesStore.createIndex("synced", "synced", {
            unique: false,
          });
        }

        // Create sync queue object store
        if (!db.objectStoreNames.contains(this.stores.SYNC_QUEUE)) {
          const syncQueueStore = db.createObjectStore(this.stores.SYNC_QUEUE, {
            keyPath: "id",
            autoIncrement: true,
          });
          syncQueueStore.createIndex("action", "action", { unique: false });
          syncQueueStore.createIndex("timestamp", "timestamp", {
            unique: false,
          });
        }

        console.log("IndexedDB stores created/upgraded");
      };
    });
  }

  // Generic method to perform database operations
  async performOperation(storeName, operation, data = null) {
    if (!this.db) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      let request;

      switch (operation) {
        case "add":
          request = store.add(data);
          break;
        case "put":
          request = store.put(data);
          break;
        case "get":
          request = store.get(data);
          break;
        case "delete":
          request = store.delete(data);
          break;
        case "getAll":
          request = store.getAll();
          break;
        case "clear":
          request = store.clear();
          break;
        default:
          reject(new Error(`Unknown operation: ${operation}`));
          return;
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Stories CRUD operations
  async addStory(story) {
    try {
      const storyWithTimestamp = {
        ...story,
        addedAt: new Date().toISOString(),
        cached: true,
      };
      await this.performOperation(
        this.stores.STORIES,
        "put",
        storyWithTimestamp
      );
      console.log("Story added to IndexedDB:", story.id);
      return storyWithTimestamp;
    } catch (error) {
      console.error("Failed to add story to IndexedDB:", error);
      throw error;
    }
  }

  async getStory(id) {
    try {
      const story = await this.performOperation(this.stores.STORIES, "get", id);
      return story;
    } catch (error) {
      console.error("Failed to get story from IndexedDB:", error);
      return null;
    }
  }

  async getAllStories() {
    try {
      const stories = await this.performOperation(
        this.stores.STORIES,
        "getAll"
      );
      return stories || [];
    } catch (error) {
      console.error("Failed to get all stories from IndexedDB:", error);
      return [];
    }
  }

  async deleteStory(id) {
    try {
      await this.performOperation(this.stores.STORIES, "delete", id);
      console.log("Story deleted from IndexedDB:", id);
      return true;
    } catch (error) {
      console.error("Failed to delete story from IndexedDB:", error);
      return false;
    }
  }

  async clearStories() {
    try {
      await this.performOperation(this.stores.STORIES, "clear");
      console.log("All stories cleared from IndexedDB");
      return true;
    } catch (error) {
      console.error("Failed to clear stories from IndexedDB:", error);
      return false;
    }
  }

  // Search and filter operations
  async searchStories(query) {
    try {
      const stories = await this.getAllStories();
      const searchResults = stories.filter(
        (story) =>
          story.name?.toLowerCase().includes(query.toLowerCase()) ||
          story.description?.toLowerCase().includes(query.toLowerCase())
      );
      return searchResults;
    } catch (error) {
      console.error("Failed to search stories:", error);
      return [];
    }
  }

  async sortStories(sortBy = "createdAt", order = "desc") {
    try {
      const stories = await this.getAllStories();
      return stories.sort((a, b) => {
        let valueA = a[sortBy];
        let valueB = b[sortBy];

        // Handle date sorting
        if (sortBy === "createdAt" || sortBy === "addedAt") {
          valueA = new Date(valueA);
          valueB = new Date(valueB);
        }

        // Handle string sorting
        if (typeof valueA === "string") {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }

        if (order === "asc") {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });
    } catch (error) {
      console.error("Failed to sort stories:", error);
      return [];
    }
  }

  async filterStories(filters) {
    try {
      const stories = await this.getAllStories();
      return stories.filter((story) => {
        let match = true;

        // Filter by date range
        if (filters.dateFrom) {
          const storyDate = new Date(story.createdAt);
          const filterDate = new Date(filters.dateFrom);
          if (storyDate < filterDate) match = false;
        }

        if (filters.dateTo) {
          const storyDate = new Date(story.createdAt);
          const filterDate = new Date(filters.dateTo);
          if (storyDate > filterDate) match = false;
        }

        // Filter by location (if coordinates are provided)
        if (filters.nearLocation && story.lat && story.lon) {
          const distance = this.calculateDistance(
            filters.nearLocation.lat,
            filters.nearLocation.lon,
            story.lat,
            story.lon
          );
          if (distance > (filters.maxDistance || 50)) match = false; // Default 50km
        }

        return match;
      });
    } catch (error) {
      console.error("Failed to filter stories:", error);
      return [];
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) *
        Math.cos(this.degreesToRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Favorites operations
  async addToFavorites(storyId, storyData) {
    try {
      const favorite = {
        storyId: storyId,
        storyData: storyData,
        addedAt: new Date().toISOString(),
      };
      await this.performOperation(this.stores.FAVORITES, "put", favorite);
      console.log("Story added to favorites:", storyId);
      return favorite;
    } catch (error) {
      console.error("Failed to add story to favorites:", error);
      throw error;
    }
  }

  async removeFromFavorites(storyId) {
    try {
      await this.performOperation(this.stores.FAVORITES, "delete", storyId);
      console.log("Story removed from favorites:", storyId);
      return true;
    } catch (error) {
      console.error("Failed to remove story from favorites:", error);
      return false;
    }
  }

  async getFavorites() {
    try {
      const favorites = await this.performOperation(
        this.stores.FAVORITES,
        "getAll"
      );
      return favorites || [];
    } catch (error) {
      console.error("Failed to get favorites:", error);
      return [];
    }
  }

  async isFavorite(storyId) {
    try {
      const favorite = await this.performOperation(
        this.stores.FAVORITES,
        "get",
        storyId
      );
      return !!favorite;
    } catch (error) {
      console.error("Failed to check if story is favorite:", error);
      return false;
    }
  }

  // Offline operations
  async addOfflineStory(storyData) {
    try {
      const offlineStory = {
        ...storyData,
        createdAt: new Date().toISOString(),
        synced: false,
        action: "create",
      };
      const result = await this.performOperation(
        this.stores.OFFLINE_STORIES,
        "add",
        offlineStory
      );
      console.log("Offline story added:", result);

      // Add to sync queue
      await this.addToSyncQueue("create", offlineStory);

      return result;
    } catch (error) {
      console.error("Failed to add offline story:", error);
      throw error;
    }
  }

  async getOfflineStories() {
    try {
      const offlineStories = await this.performOperation(
        this.stores.OFFLINE_STORIES,
        "getAll"
      );
      return offlineStories.filter((story) => !story.synced) || [];
    } catch (error) {
      console.error("Failed to get offline stories:", error);
      return [];
    }
  }

  async markStorySynced(tempId, apiId) {
    try {
      const story = await this.performOperation(
        this.stores.OFFLINE_STORIES,
        "get",
        tempId
      );
      if (story) {
        story.synced = true;
        story.apiId = apiId;
        story.syncedAt = new Date().toISOString();
        await this.performOperation(this.stores.OFFLINE_STORIES, "put", story);
      }
      return true;
    } catch (error) {
      console.error("Failed to mark story as synced:", error);
      return false;
    }
  }

  // Sync queue operations
  async addToSyncQueue(action, data) {
    try {
      const queueItem = {
        action: action,
        data: data,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };
      await this.performOperation(this.stores.SYNC_QUEUE, "add", queueItem);
      return queueItem;
    } catch (error) {
      console.error("Failed to add to sync queue:", error);
      throw error;
    }
  }

  async getSyncQueue() {
    try {
      return (
        (await this.performOperation(this.stores.SYNC_QUEUE, "getAll")) || []
      );
    } catch (error) {
      console.error("Failed to get sync queue:", error);
      return [];
    }
  }

  async removeSyncQueueItem(id) {
    try {
      await this.performOperation(this.stores.SYNC_QUEUE, "delete", id);
      return true;
    } catch (error) {
      console.error("Failed to remove sync queue item:", error);
      return false;
    }
  }

  async clearSyncQueue() {
    try {
      await this.performOperation(this.stores.SYNC_QUEUE, "clear");
      return true;
    } catch (error) {
      console.error("Failed to clear sync queue:", error);
      return false;
    }
  }

  // Database management
  async clearAllData() {
    try {
      await Promise.all([
        this.performOperation(this.stores.STORIES, "clear"),
        this.performOperation(this.stores.FAVORITES, "clear"),
        this.performOperation(this.stores.OFFLINE_STORIES, "clear"),
        this.performOperation(this.stores.SYNC_QUEUE, "clear"),
      ]);
      console.log("All IndexedDB data cleared");
      return true;
    } catch (error) {
      console.error("Failed to clear all data:", error);
      return false;
    }
  }

  async getDBStats() {
    try {
      const [stories, favorites, offlineStories, syncQueue] = await Promise.all(
        [
          this.getAllStories(),
          this.getFavorites(),
          this.getOfflineStories(),
          this.getSyncQueue(),
        ]
      );

      return {
        stories: stories.length,
        favorites: favorites.length,
        offlineStories: offlineStories.length,
        syncQueue: syncQueue.length,
        totalSize: this.estimateStorageSize(
          stories,
          favorites,
          offlineStories,
          syncQueue
        ),
      };
    } catch (error) {
      console.error("Failed to get database stats:", error);
      return {
        stories: 0,
        favorites: 0,
        offlineStories: 0,
        syncQueue: 0,
        totalSize: 0,
      };
    }
  }

  estimateStorageSize(...arrays) {
    const totalItems = arrays.reduce((sum, arr) => sum + arr.length, 0);
    return totalItems * 2; // Rough estimate in KB
  }
}

export default IndexedDBService;
