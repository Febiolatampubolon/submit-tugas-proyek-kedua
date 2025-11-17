import routes from "../routes/routes";
import { getActiveRoute } from "../routes/url-parser";
import {
  ViewTransitions,
  ROUTE_TRANSITIONS,
} from "../utils/view-transitions.js";

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;
  #currentRoute = null;

  constructor({ navigationDrawer, drawerButton, content }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer = navigationDrawer;

    this.#setupDrawer();
    this.#setupAccessibility();
  }

  #setupDrawer() {
    const toggleDrawer = () => {
      const isOpen = this.#navigationDrawer.classList.contains("open");
      this.#navigationDrawer.classList.toggle("open");
      this.#drawerButton.setAttribute("aria-expanded", (!isOpen).toString());

      // Announce drawer state for screen readers
      const announcement = isOpen
        ? "Navigation drawer closed"
        : "Navigation drawer opened";
      this.#announceToScreenReader(announcement);
    };

    this.#drawerButton.addEventListener("click", toggleDrawer);

    // Keyboard support for drawer button
    this.#drawerButton.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggleDrawer();
      }
    });

    document.body.addEventListener("click", (event) => {
      if (
        !this.#navigationDrawer.contains(event.target) &&
        !this.#drawerButton.contains(event.target)
      ) {
        this.#navigationDrawer.classList.remove("open");
        this.#drawerButton.setAttribute("aria-expanded", "false");
      }

      this.#navigationDrawer.querySelectorAll("a").forEach((link) => {
        if (link.contains(event.target)) {
          this.#navigationDrawer.classList.remove("open");
          this.#drawerButton.setAttribute("aria-expanded", "false");
        }
      });
    });

    // Close drawer on Escape key
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        this.#navigationDrawer.classList.contains("open")
      ) {
        this.#navigationDrawer.classList.remove("open");
        this.#drawerButton.setAttribute("aria-expanded", "false");
        this.#drawerButton.focus();
        this.#announceToScreenReader("Navigation drawer closed");
      }
    });
  }

  #setupAccessibility() {
    // Setup keyboard navigation for menu items
    const menuItems =
      this.#navigationDrawer.querySelectorAll('a[role="menuitem"]');

    menuItems.forEach((item, index) => {
      item.addEventListener("keydown", (event) => {
        switch (event.key) {
          case "ArrowDown":
            event.preventDefault();
            const nextIndex = (index + 1) % menuItems.length;
            menuItems[nextIndex].focus();
            break;
          case "ArrowUp":
            event.preventDefault();
            const prevIndex = (index - 1 + menuItems.length) % menuItems.length;
            menuItems[prevIndex].focus();
            break;
          case "Home":
            event.preventDefault();
            menuItems[0].focus();
            break;
          case "End":
            event.preventDefault();
            menuItems[menuItems.length - 1].focus();
            break;
        }
      });
    });
  }

  #announceToScreenReader(message) {
    const announcement = document.createElement("div");
    announcement.setAttribute("aria-live", "polite");
    announcement.setAttribute("aria-atomic", "true");
    announcement.className = "sr-only";
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  async renderPage() {
    try {
      const url = getActiveRoute();
      console.log("Rendering page for URL:", url);

      const page = routes[url];

      if (!page) {
        console.error("Page not found for route:", url);
        console.log("Available routes:", Object.keys(routes));

        // Show 404 page
        this.#content.innerHTML = `
          <div style="text-align: center; padding: 2rem;">
            <h1>404 - Page Not Found</h1>
            <p>Route "${url}" not found</p>
            <p>Available routes: ${Object.keys(routes).join(", ")}</p>
            <a href="#/" style="color: blue; text-decoration: underline;">Go Home</a>
          </div>
        `;
        return;
      }

      console.log("Page found:", page.constructor.name);

      const transitionConfig = ROUTE_TRANSITIONS[url] || { type: "fade" };

      const updateContent = async () => {
        console.log("Updating content for:", page.constructor.name);

        // Update page title
        document.title = page.title || "App";

        // Render page content
        const content = await page.render();
        console.log("Content rendered, length:", content.length);

        // Remove initialization status
        const initStatus = document.getElementById("initialization-status");
        if (initStatus) {
          initStatus.remove();
        }

        // Focus management for accessibility
        this.#content.innerHTML = content;

        // Focus main content for screen readers
        this.#content.setAttribute("tabindex", "-1");
        this.#content.focus();

        await page.afterRender();
        console.log("After render completed");

        this.#currentRoute = url;
      };

      try {
        if (transitionConfig.type === "slide") {
          await ViewTransitions.slideTransition(
            updateContent,
            transitionConfig.direction
          );
        } else {
          await ViewTransitions.fadeTransition(updateContent);
        }
      } catch (error) {
        console.warn(
          "View transition failed, falling back to regular update:",
          error
        );
        await updateContent();
      }

      console.log("Page render completed successfully");
    } catch (error) {
      console.error("Error in renderPage:", error);

      // Fallback content for errors
      this.#content.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: red;">
          <h1>⚠️ Render Error</h1>
          <p>Failed to render page</p>
          <p>Error: ${error.message}</p>
          <button onclick="location.reload()">🔄 Reload</button>
        </div>
      `;
    }
  }

  getCurrentRoute() {
    return this.#currentRoute;
  }
}

export default App;
