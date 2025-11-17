export class ViewTransitions {
  static isSupported() {
    return "startViewTransition" in document;
  }

  static async transitionTo(updateCallback) {
    if (this.isSupported()) {
      return document.startViewTransition(updateCallback);
    } else {
      // Fallback for browsers that don't support view transitions
      return updateCallback();
    }
  }

  static async slideTransition(updateCallback, direction = "right") {
    if (!this.isSupported()) {
      return updateCallback();
    }

    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.style.viewTransitionName = `slide-${direction}`;
    }

    try {
      const transition = document.startViewTransition(updateCallback);
      await transition.finished;
    } catch (error) {
      console.warn("View transition failed:", error);
    } finally {
      if (mainContent) {
        mainContent.style.viewTransitionName = "";
      }
    }
  }

  static async fadeTransition(updateCallback) {
    if (!this.isSupported()) {
      return updateCallback();
    }

    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.style.viewTransitionName = "fade";
    }

    try {
      const transition = document.startViewTransition(updateCallback);
      await transition.finished;
    } catch (error) {
      console.warn("View transition failed:", error);
    } finally {
      if (mainContent) {
        mainContent.style.viewTransitionName = "";
      }
    }
  }
}

// Route-specific transition configurations
export const ROUTE_TRANSITIONS = {
  "/": { type: "fade", duration: 300 },
  "/stories": { type: "slide", direction: "left", duration: 400 },
  "/add-story": { type: "slide", direction: "up", duration: 350 },
  "/login": { type: "fade", duration: 250 },
  "/register": { type: "fade", duration: 250 },
  "/about": { type: "slide", direction: "right", duration: 300 },
};
