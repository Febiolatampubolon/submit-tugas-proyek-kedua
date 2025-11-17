import ApiService from "./api-service.js";

class NavigationService {
  constructor() {
    this.navContainer = null;
    this.authListeners = [];
  }

  init() {
    this.navContainer = document.getElementById("nav-list");
    this.refreshMenu();

    // Perubahan status login/logout
    window.addEventListener("authStatusChanged", () => {
      this.refreshMenu();
    });

    // Sinkronisasi logout dari tab lain
    window.addEventListener("storage", (event) => {
      if (event.key === "token") {
        this.refreshMenu();
      }
    });
  }

  refreshMenu() {
    if (!this.navContainer) return;

    const userLoggedIn = ApiService.isAuthenticated();

    if (userLoggedIn) {
      this.showUserMenu();
    } else {
      this.showGuestMenu();
    }

    // Panggil callback bila status login berubah
    this.authListeners.forEach((fn) => fn(userLoggedIn));
  }

  showGuestMenu() {
    this.navContainer.innerHTML = `
      <li role="none"><a href="#/" role="menuitem" tabindex="0">🏠 Halaman Utama</a></li>
      <li role="none"><a href="#/stories" role="menuitem" tabindex="0">📚 Daftar Cerita</a></li>
      <li role="none"><a href="#/login" role="menuitem" tabindex="0">🔐 Login</a></li>
      <li role="none"><a href="#/register" role="menuitem" tabindex="0">📝 Buat Akun</a></li>
      <li role="none"><a href="#/about" role="menuitem" tabindex="0">ℹ️ Info Aplikasi</a></li>
    `;
  }

  showUserMenu() {
    this.navContainer.innerHTML = `
      <li role="none"><a href="#/" role="menuitem" tabindex="0">🏠 Halaman Utama</a></li>
      <li role="none"><a href="#/stories" role="menuitem" tabindex="0">📚 Daftar Cerita</a></li>
      <li role="none"><a href="#/add-story" role="menuitem" tabindex="0">➕ Buat Cerita Baru</a></li>
      <li role="none">
        <button id="logout-btn" class="nav-logout-btn" role="menuitem" tabindex="0" aria-label="Keluar dari aplikasi">
          🚪 Keluar
        </button>
      </li>
      <li role="none"><a href="#/about" role="menuitem" tabindex="0">ℹ️ Info Aplikasi</a></li>
    `;

    const logoutBtn = document.getElementById("logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", this.logoutHandler.bind(this));

      // Aksesibilitas: tekan Enter atau Space
      logoutBtn.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          this.logoutHandler();
        }
      });
    }
  }

  logoutHandler() {
    const confirmLogout = confirm("Yakin ingin keluar dari akun ini?");
    if (confirmLogout) {
      ApiService.logout();
      this.refreshMenu();
    }
  }

  onAuthStatusChange(fn) {
    this.authListeners.push(fn);
  }

  static notifyAuthChange() {
    window.dispatchEvent(new CustomEvent("authStatusChanged"));
  }
}

export default new NavigationService();
