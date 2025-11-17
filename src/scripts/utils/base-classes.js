export class BasePresenter {
  constructor(view) {
    this.view = view;
  }

  async init() {
    // Override in child classes
  }

  showLoading() {
    if (this.view.showLoading) {
      this.view.showLoading();
    }
  }

  hideLoading() {
    if (this.view.hideLoading) {
      this.view.hideLoading();
    }
  }

  showError(message) {
    if (this.view.showError) {
      this.view.showError(message);
    } else {
      console.error(message);
    }
  }

  showSuccess(message) {
    if (this.view.showSuccess) {
      this.view.showSuccess(message);
    }
  }
}

export class BasePage {
  constructor() {
    this.presenter = null;
  }

  async render() {
    // Override in child classes
    return "<div>Base Page</div>";
  }

  async afterRender() {
    // Override in child classes
    if (this.presenter) {
      await this.presenter.init();
    }
  }

  showLoading() {
    const loadingElement = document.getElementById("loading-indicator");
    if (loadingElement) {
      loadingElement.style.display = "flex";
      loadingElement.setAttribute("aria-hidden", "false");
    }

    // Announce to screen readers
    import("./accessibility.js").then(({ AccessibilityUtils }) => {
      AccessibilityUtils.announceLoadingState(true);
    });
  }

  hideLoading() {
    const loadingElement = document.getElementById("loading-indicator");
    if (loadingElement) {
      loadingElement.style.display = "none";
      loadingElement.setAttribute("aria-hidden", "true");
    }

    // Announce to screen readers
    import("./accessibility.js").then(({ AccessibilityUtils }) => {
      AccessibilityUtils.announceLoadingState(false);
    });
  }

  showError(message) {
    this.showNotification(message, "error");

    // Announce error to screen readers
    import("./accessibility.js").then(({ AccessibilityUtils }) => {
      AccessibilityUtils.announce(`Error: ${message}`, "assertive");
    });
  }

  showSuccess(message) {
    this.showNotification(message, "success");

    // Announce success to screen readers
    import("./accessibility.js").then(({ AccessibilityUtils }) => {
      AccessibilityUtils.announce(message, "polite");
    });
  }

  showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <span>${message}</span>
      <button class="close-notification" onclick="this.parentElement.remove()">×</button>
    `;

    document.body.appendChild(notification);

    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }
}
