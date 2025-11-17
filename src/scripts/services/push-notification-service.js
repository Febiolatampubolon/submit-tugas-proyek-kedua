// Push Notification Service
class PushNotificationService {
  constructor() {
    // VAPID public key sesuai dokumentasi Story API
    this.vapidPublicKey =
      "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";
    this.isSubscribed = false;
    this.registration = null;
    this.subscription = null;
    this.isSupported = this.checkSupport();
  }

  // Check browser support
  checkSupport() {
    const supported = "serviceWorker" in navigator && "PushManager" in window;
    console.log("📱 Push Notification Support Check:", {
      serviceWorker: "serviceWorker" in navigator,
      PushManager: "PushManager" in window,
      Notification: "Notification" in window,
      supported: supported,
    });
    return supported;
  }

  // Initialize push notifications
  async initialize() {
    try {
      console.log("🔄 Initializing Push Notification Service...");

      if (!this.isSupported) {
        console.warn("❌ Push notifications not supported in this browser");
        this.showMessage(
          "Browser does not support push notifications",
          "warning"
        );
        return false;
      }

      // Get service worker registration
      console.log("📋 Getting service worker registration...");
      this.registration = await navigator.serviceWorker.ready;

      if (!this.registration) {
        console.warn("❌ Service Worker registration not available");
        this.showMessage("Service Worker not ready", "warning");
        return false;
      }

      console.log("✅ Service Worker ready:", {
        scope: this.registration.scope,
        active: !!this.registration.active,
      });

      // Check current subscription status
      await this.checkSubscription();

      console.log("✅ Push Notification Service initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize push notifications:", error);
      this.showMessage("Failed to initialize push notifications", "error");
      return false;
    }
  }

  // Check current subscription status
  async checkSubscription() {
    try {
      if (!this.registration) {
        console.warn("⚠️ No service worker registration available");
        return false;
      }

      console.log("🔍 Checking current subscription...");
      this.subscription = await this.registration.pushManager.getSubscription();
      this.isSubscribed = !!this.subscription;

      console.log("📊 Subscription status:", this.isSubscribed);

      if (this.subscription) {
        console.log("📝 Subscription details:", {
          endpoint: this.subscription.endpoint?.substring(0, 50) + "...",
        });

        // Verify subscription is still valid
        const isValid = await this.verifySubscription(this.subscription);
        if (!isValid) {
          console.log("🔄 Subscription invalid, unsubscribing...");
          await this.unsubscribe();
        }
      }

      this.updateUI();
      return this.isSubscribed;
    } catch (error) {
      console.error("❌ Error checking subscription:", error);
      return false;
    }
  }

  // Verify subscription is still valid
  async verifySubscription(subscription) {
    try {
      // Simple check - if endpoint exists and is valid
      return (
        subscription &&
        subscription.endpoint &&
        subscription.endpoint.startsWith("https://")
      );
    } catch (error) {
      console.error("Error verifying subscription:", error);
      return false;
    }
  }

  // Subscribe to push notifications
  // Di method subscribe, perbaiki error handling:
  async subscribe() {
    try {
      console.log("🚀 Starting push subscription process...");

      // Step 1: Request notification permission
      console.log("🔔 Requesting notification permission...");
      const permission = await this.requestPermission();
      console.log("📊 Notification permission result:", permission);

      if (permission !== "granted") {
        throw new Error(`Notification permission: ${permission}`);
      }

      // ... sisa kode subscribe ...
    } catch (error) {
      console.error("❌ Failed to subscribe to push notifications:", error);

      let userMessage = "Failed to enable notifications: ";

      if (error.permission === "denied") {
        userMessage = `
        ❌ Notification permission denied.
        
        How to fix:
        1. Click the 🔒 or ℹ️ icon in the address bar
        2. Select "Site settings" or "Permissions"
        3. Find "Notifications" 
        4. Select "Allow"
        5. Refresh the page and try again
      `;
      } else if (error.message.includes("not supported")) {
        userMessage = "Browser does not support push notifications.";
      } else {
        userMessage += error.message;
      }

      this.showMessage(userMessage, "error");
      return null;
    }
  }
  // Unsubscribe from push notifications
  async unsubscribe() {
    try {
      if (!this.subscription) {
        console.log("ℹ️ No subscription to unsubscribe");
        this.isSubscribed = false;
        this.updateUI();
        return true;
      }

      console.log("🚫 Unsubscribing from push notifications...");

      let successful = false;
      try {
        successful = await this.subscription.unsubscribe();
      } catch (unsubscribeError) {
        console.warn(
          "Unsubscribe method failed, manually removing:",
          unsubscribeError
        );
        successful = true; // Consider successful for manual removal
      }

      if (successful) {
        console.log("✅ Successfully unsubscribed from push notifications");
        this.subscription = null;
        this.isSubscribed = false;
        this.updateUI();
        this.showMessage("🔕 Push notifications disabled", "info");
      }

      return successful;
    } catch (error) {
      console.error("❌ Failed to unsubscribe:", error);
      this.showMessage("Failed to disable notifications", "error");
      return false;
    }
  }

  // Toggle subscription
  async toggleSubscription() {
    console.log("🔄 Toggling subscription, current status:", this.isSubscribed);

    if (this.isSubscribed) {
      await this.unsubscribe();
    } else {
      await this.subscribe();
    }
  }

  // Request notification permission
  // Di method requestPermission, perbaiki handling:
  async requestPermission() {
    if (!("Notification" in window)) {
      throw new Error("Browser does not support notifications");
    }

    const currentPermission = Notification.permission;
    console.log("📊 Current notification permission:", currentPermission);

    if (currentPermission === "denied") {
      // Berikan instruksi yang lebih jelas kepada user
      const error = new Error(
        "Notification permission denied. Click the lock icon in the address bar → Site settings → Notifications → Allow."
      );
      error.permission = "denied";
      throw error;
    }

    if (currentPermission === "granted") {
      return "granted";
    }

    // Request permission - only if not yet determined
    try {
      const permission = await Notification.requestPermission();
      console.log("🔔 Permission request result:", permission);

      if (permission === "denied") {
        const error = new Error(
          "You denied notification permission. To change, open browser settings."
        );
        error.permission = "denied";
        throw error;
      }

      return permission;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      throw new Error("Failed to request notification permission");
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    try {
      console.log("🌐 Sending subscription to server...");

      const subscriptionData = subscription.toJSON
        ? subscription.toJSON()
        : {
            endpoint: subscription.endpoint,
            keys: subscription.keys,
          };

      const body = {
        endpoint: subscriptionData.endpoint,
        keys: subscriptionData.keys,
      };

      console.log("📦 Subscription data:", {
        endpoint: body.endpoint?.substring(0, 50) + "...",
        hasKeys: !!body.keys,
      });

      const token = this.getAuthToken();
      const headers = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(
        "https://story-api.dicoding.dev/v1/notifications/subscribe",
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify(body),
        }
      );

      console.log("📡 Server response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ Subscription sent to server successfully");
      return result;
    } catch (error) {
      console.error("❌ Failed to send subscription to server:", error);
      // Jangan throw error, biarkan subscription berhasil secara lokal
      throw error; // Tapi throw untuk diketahui di console
    }
  }

  // Get authentication token
  getAuthToken() {
    try {
      const authData = localStorage.getItem("authData");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed.token;
      }
      return null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  }

  // Convert VAPID key format
  urlB64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  // Update UI based on subscription status
  updateUI() {
    const toggleButton = document.getElementById("notification-toggle-btn");

    if (!toggleButton) {
      console.warn("❌ Notification button not found for UI update");
      return;
    }

    if (!this.isSupported) {
      toggleButton.innerHTML = "❌ Not Supported";
      toggleButton.setAttribute(
        "title",
        "Browser does not support push notifications"
      );
      toggleButton.disabled = true;
      return;
    }

    toggleButton.innerHTML = this.isSubscribed
      ? "🔔 Notifications"
      : "🔕 Notifications";
    toggleButton.classList.toggle("active", this.isSubscribed);
    toggleButton.setAttribute(
      "aria-label",
      this.isSubscribed ? "Disable notifications" : "Enable notifications"
    );
    toggleButton.setAttribute(
      "title",
      this.isSubscribed ? "Notifications active" : "Notifications inactive"
    );
    toggleButton.disabled = false;
  }

  // Show message to user
  showMessage(message, type = "info") {
    console.log(`💬 [${type}]: ${message}`);

    // Use global message function if available
    if (window.showMessage) {
      window.showMessage(message, type);
      return;
    }

    // Fallback message display
    let messageEl = document.getElementById("push-message");
    if (!messageEl) {
      messageEl = document.createElement("div");
      messageEl.id = "push-message";
      messageEl.className = "global-message";
      document.body.appendChild(messageEl);
    }

    messageEl.textContent = message;
    messageEl.className = `global-message ${type} show`;

    setTimeout(() => {
      messageEl.classList.remove("show");
    }, 5000);
  }

  // Simulate receiving a push notification when a new story is added
  simulateNewStoryNotification(storyData) {
    console.log("📢 Simulating new story notification:", storyData);

    // Check if notifications are supported and permission is granted
    if (!("Notification" in window)) {
      console.warn("❌ Notification API not supported");
      return false;
    }

    if (Notification.permission !== "granted") {
      console.warn("❌ Notification permission not granted");
      return false;
    }

    try {
      // Create notification
      const notification = new Notification("📖 New Story Added!", {
        body:
          `"${
            storyData.name || "Untitled Story"
          }" - ${storyData.description?.substring(0, 100)}...` ||
          "A new story has been added",
        icon: "/images/story.png",
        image: storyData.photoUrl, // Jika ada URL foto
        badge: "/images/icon-192x512x512.png",
        tag: "new-story",
        requireInteraction: true,
        data: {
          storyId: storyData.id,
          url: "/#/stories",
        },
        actions: [
          {
            action: "view",
            title: "Lihat Cerita",
          },
          {
            action: "close",
            title: "Tutup",
          },
        ],
      });

      // Handle notification click
      notification.onclick = () => {
        console.log("Notification clicked, story ID:", storyData.id);
        window.focus();
        window.location.hash = `#/stories/${storyData.id}`;
        notification.close();
      };

      // Handle notification close
      notification.onclose = () => {
        console.log("Notification closed");
      };

      console.log("✅ Local notification shown successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to show local notification:", error);
      return false;
    }
  }

  // Alternative method name for compatibility
  showLocalNotification(title, body, data = {}) {
    return this.simulateNewStoryNotification({
      name: title,
      description: body,
      ...data,
    });
  }

  // Get debug info
  getDebugInfo() {
    return {
      supported: this.isSupported,
      serviceWorker: "serviceWorker" in navigator,
      pushManager: "PushManager" in window,
      notification: "Notification" in window,
      permission: Notification.permission,
      isSubscribed: this.isSubscribed,
      hasRegistration: !!this.registration,
      hasSubscription: !!this.subscription,
    };
  }
}

// Export for use in other modules
export default PushNotificationService;
