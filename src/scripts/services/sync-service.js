// Sync Service for handling offline/online data synchronization
import IndexedDBService from './indexeddb-service.js';
import ApiService from './api-service.js';

class SyncService {
  constructor() {
    this.indexedDBService = new IndexedDBService();
    
    // ApiService sudah di-import sebagai instance, bukan class
    this.apiService = ApiService; // Langsung gunakan instance
    
    this.isOnline = navigator.onLine;
    this.syncInProgress = false;
    this.syncListeners = [];

    // Listen for online/offline events
    this.setupOnlineListeners();
  }

  async initialize() {
    try {
      await this.indexedDBService.initialize();
      console.log('✅ Sync service initialized');
      
      // Start sync if online
      if (this.isOnline) {
        await this.syncOfflineData();
      }
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize sync service:', error);
      return false;
    }
  }

  setupOnlineListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Connection restored - starting sync');
      this.isOnline = true;
      this.notifyListeners('online');
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      console.log('📴 Connection lost - entering offline mode');
      this.isOnline = false;
      this.notifyListeners('offline');
    });
  }

  // Add listener for sync events
  addSyncListener(callback) {
    this.syncListeners.push(callback);
  }

  // Remove sync listener
  removeSyncListener(callback) {
    this.syncListeners = this.syncListeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners(event, data = null) {
    this.syncListeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  // Main sync function
  async syncOfflineData() {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return;
    }

    if (!this.isOnline) {
      console.log('Device is offline, cannot sync');
      return;
    }

    this.syncInProgress = true;
    this.notifyListeners('sync-start');

    try {
      console.log('🔄 Starting offline data synchronization...');
      
      // Get offline stories
      const offlineStories = await this.indexedDBService.getOfflineStories();
      const syncQueue = await this.indexedDBService.getSyncQueue();
      
      let syncedCount = 0;
      let failedCount = 0;

      // Sync offline stories
      for (const offlineStory of offlineStories) {
        try {
          await this.syncOfflineStory(offlineStory);
          syncedCount++;
          this.notifyListeners('story-synced', { story: offlineStory, success: true });
        } catch (error) {
          console.error('Failed to sync offline story:', error);
          failedCount++;
          this.notifyListeners('story-synced', { story: offlineStory, success: false, error });
        }
      }

      // Process sync queue
      for (const queueItem of syncQueue) {
        try {
          await this.processSyncQueueItem(queueItem);
          await this.indexedDBService.removeSyncQueueItem(queueItem.id);
          this.notifyListeners('queue-item-synced', { item: queueItem, success: true });
        } catch (error) {
          console.error('Failed to process sync queue item:', error);
          this.notifyListeners('queue-item-synced', { item: queueItem, success: false, error });
        }
      }

      // Update cached stories with latest data from API
      await this.updateCachedStories();

      const result = {
        syncedCount,
        failedCount,
        totalProcessed: offlineStories.length + syncQueue.length
      };

      console.log('✅ Sync completed:', result);
      this.notifyListeners('sync-complete', result);

      return result;

    } catch (error) {
      console.error('❌ Sync process failed:', error);
      this.notifyListeners('sync-error', error);
      throw error;
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync individual offline story
  async syncOfflineStory(offlineStory) {
    try {
      // Check if user is authenticated
      if (!this.apiService.isAuthenticated()) {
        throw new Error('User not authenticated');
      }

      // Prepare story data for API
      const formData = new FormData();
      formData.append('description', offlineStory.description);
      
      // Handle photo - if it's a base64 string, convert it to blob
      if (offlineStory.photo) {
        let photoBlob;
        if (typeof offlineStory.photo === 'string' && offlineStory.photo.startsWith('data:')) {
          // Convert base64 to blob
          const response = await fetch(offlineStory.photo);
          photoBlob = await response.blob();
        } else if (offlineStory.photo instanceof File || offlineStory.photo instanceof Blob) {
          photoBlob = offlineStory.photo;
        }
        
        if (photoBlob) {
          formData.append('photo', photoBlob, offlineStory.photoName || 'story-photo.jpg');
        }
      }

      // Add location if available
      if (offlineStory.lat && offlineStory.lon) {
        formData.append('lat', offlineStory.lat.toString());
        formData.append('lon', offlineStory.lon.toString());
      }

      // Send to API using the ApiService instance
      const response = await this.apiService.addStory(formData);
      
      if (response.error === false) {
        // Mark as synced
        await this.indexedDBService.markStorySynced(offlineStory.tempId, response.story?.id);
        
        // Add synced story to regular stories cache
        if (response.story) {
          await this.indexedDBService.addStory(response.story);
        }
        
        console.log('✅ Offline story synced successfully:', offlineStory.tempId);
        return response;
      } else {
        throw new Error(response.message || 'Failed to sync story');
      }

    } catch (error) {
      console.error('❌ Failed to sync offline story:', error);
      
      // Update retry count
      offlineStory.retryCount = (offlineStory.retryCount || 0) + 1;
      offlineStory.lastError = error.message;
      offlineStory.lastRetryAt = new Date().toISOString();
      
      // Mark as failed if too many retries
      if (offlineStory.retryCount >= 3) {
        offlineStory.syncFailed = true;
      }
      
      // Update in IndexedDB
      await this.indexedDBService.updateOfflineStory(offlineStory.tempId, offlineStory);
      
      throw error;
    }
  }

  // Process sync queue item
  async processSyncQueueItem(queueItem) {
    switch (queueItem.action) {
      case 'create':
        return await this.syncOfflineStory(queueItem.data);
      case 'update':
        // Handle story updates if needed
        console.log('Update action not implemented yet');
        break;
      case 'delete':
        // Handle story deletions if needed
        console.log('Delete action not implemented yet');
        break;
      default:
        console.warn('Unknown sync queue action:', queueItem.action);
    }
  }

  // Update cached stories with latest data from API
  async updateCachedStories() {
    try {
      if (!this.apiService.isAuthenticated()) {
        console.log('User not authenticated, skipping cached stories update');
        return;
      }

      console.log('📥 Updating cached stories from API...');
      
      // Get latest stories from API
      const response = await this.apiService.getStories();
      
      if (response.error === false && response.listStory) {
        // Clear old cached stories and add new ones
        await this.indexedDBService.clearStories();
        
        for (const story of response.listStory) {
          await this.indexedDBService.addStory(story);
        }
        
        console.log(`✅ Cached ${response.listStory.length} stories`);
      }

    } catch (error) {
      console.error('❌ Failed to update cached stories:', error);
    }
  }

  // Add story to offline queue when offline
  async addStoryOffline(storyData) {
    try {
      console.log('💾 Adding story to offline queue...');
      
      // Store photo as base64 for offline storage
      if (storyData.photo instanceof File) {
        storyData.photo = await this.fileToBase64(storyData.photo);
        storyData.photoName = storyData.photo.name;
      }

      // Add to offline stories
      const offlineStory = await this.indexedDBService.addOfflineStory(storyData);
      
      console.log('✅ Story added to offline queue:', offlineStory.tempId);
      return offlineStory;

    } catch (error) {
      console.error('❌ Failed to add story to offline queue:', error);
      throw error;
    }
  }

  // Convert file to base64 string
  async fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  // Get stories (online/offline aware)
  async getStories(forceRefresh = false) {
    try {
      if (this.isOnline && forceRefresh) {
        // Try to get fresh data from API
        try {
          await this.updateCachedStories();
        } catch (error) {
          console.warn('⚠️ Failed to refresh from API, using cached data');
        }
      }

      // Get cached stories from IndexedDB
      const cachedStories = await this.indexedDBService.getAllStories();
      
      // Get offline stories that haven't been synced
      const offlineStories = await this.indexedDBService.getOfflineStories();
      
      // Combine and return all stories
      const allStories = [...cachedStories];
      
      // Add offline stories with special indicator
      for (const offlineStory of offlineStories) {
        allStories.push({
          ...offlineStory,
          id: `offline-${offlineStory.tempId}`,
          isOffline: true,
          syncPending: true
        });
      }

      // Sort by creation date (newest first)
      allStories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      return allStories;

    } catch (error) {
      console.error('❌ Failed to get stories:', error);
      return [];
    }
  }

  // Force manual sync
  async forceSync() {
    if (!this.isOnline) {
      throw new Error('Device is offline. Cannot sync.');
    }

    return await this.syncOfflineData();
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      lastSyncAt: localStorage.getItem('lastSyncAt'),
      hasPendingChanges: false // Will be updated by checking IndexedDB
    };
  }

  // Check if there are pending changes
  async hasPendingChanges() {
    try {
      const [offlineStories, syncQueue] = await Promise.all([
        this.indexedDBService.getOfflineStories(),
        this.indexedDBService.getSyncQueue()
      ]);
      
      return offlineStories.length > 0 || syncQueue.length > 0;
    } catch (error) {
      console.error('Error checking pending changes:', error);
      return false;
    }
  }

  // Clear all offline data
  async clearOfflineData() {
    try {
      await this.indexedDBService.clearAllData();
      console.log('✅ All offline data cleared');
      this.notifyListeners('data-cleared');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear offline data:', error);
      return false;
    }
  }
}

export default SyncService;