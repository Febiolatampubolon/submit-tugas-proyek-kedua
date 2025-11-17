export class AccessibilityUtils {
  // Improved focus management
  static manageFocus() {
    // Trap focus in modals
    document.addEventListener('keydown', (event) => {
      const modal = document.querySelector('.camera-modal[style*="flex"]');
      if (modal && event.key === 'Tab') {
        this.trapFocus(event, modal);
      }
    });
  }

  static trapFocus(event, container) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        event.preventDefault();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        event.preventDefault();
      }
    }
  }

  // Announce content changes to screen readers
  static announce(message, priority = 'polite') {
    const announcer = document.getElementById('live-announcer') || this.createAnnouncer();
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  }

  static createAnnouncer() {
    const announcer = document.createElement('div');
    announcer.id = 'live-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    document.body.appendChild(announcer);
    return announcer;
  }

  // Enhanced keyboard navigation for interactive elements
  static enhanceKeyboardNavigation() {
    // Card keyboard support
    document.addEventListener('keydown', (event) => {
      const target = event.target;
      
      // Story cards
      if (target.classList.contains('story-card')) {
        this.handleCardKeyboard(event, target);
      }
      
      // Filter buttons
      if (target.classList.contains('filter-btn')) {
        this.handleFilterKeyboard(event, target);
      }
    });

    // Focus indicators for all interactive elements
    this.addFocusIndicators();
  }

  static handleCardKeyboard(event, card) {
    const cards = Array.from(document.querySelectorAll('.story-card'));
    const currentIndex = cards.indexOf(card);
    
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % cards.length;
        cards[nextIndex].focus();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + cards.length) % cards.length;
        cards[prevIndex].focus();
        break;
      case 'Home':
        event.preventDefault();
        cards[0].focus();
        break;
      case 'End':
        event.preventDefault();
        cards[cards.length - 1].focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        // Trigger click on the card or its primary action
        const storyId = card.dataset.storyId;
        if (storyId) {
          this.announce(`Cerita ${card.querySelector('.story-title')?.textContent} dipilih`);
          // Highlight corresponding marker if map exists
          const mapEvent = new CustomEvent('highlightMarker', { detail: storyId });
          document.dispatchEvent(mapEvent);
        }
        break;
    }
  }

  static handleFilterKeyboard(event, button) {
    const buttons = Array.from(document.querySelectorAll('.filter-btn'));
    const currentIndex = buttons.indexOf(button);
    
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % buttons.length;
        buttons[nextIndex].focus();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        buttons[prevIndex].focus();
        break;
      case 'Home':
        event.preventDefault();
        buttons[0].focus();
        break;
      case 'End':
        event.preventDefault();
        buttons[buttons.length - 1].focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        button.click();
        this.announce(`Filter ${button.textContent} diterapkan`);
        break;
    }
  }

  static addFocusIndicators() {
    // Add focus styling for elements that need it
    const style = document.createElement('style');
    style.textContent = `
      .story-card:focus,
      .feature-card:focus,
      .filter-btn:focus,
      .marker-pin:focus {
        outline: 3px solid var(--primary-color);
        outline-offset: 2px;
      }
      
      .story-card:focus {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(37, 99, 235, 0.2);
      }
      
      /* High contrast mode support */
      @media (prefers-contrast: high) {
        .story-card:focus,
        .feature-card:focus,
        .btn:focus {
          outline: 3px solid currentColor;
        }
      }
      
      /* Reduced motion support */
      @media (prefers-reduced-motion: reduce) {
        .story-card,
        .feature-card,
        .btn {
          transition: none;
        }
        
        .spinner {
          animation: none;
        }
        
        .marker-pin {
          animation: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Form validation announcements
  static announceFormErrors(formElement) {
    const errors = formElement.querySelectorAll('.form-error:not(:empty)');
    if (errors.length > 0) {
      const errorMessages = Array.from(errors).map(error => error.textContent);
      this.announce(`${errors.length} kesalahan ditemukan: ${errorMessages.join(', ')}`, 'assertive');
    }
  }

  // Page navigation announcements
  static announcePageChange(pageTitle) {
    this.announce(`Halaman ${pageTitle} dimuat`, 'polite');
  }

  // Loading state announcements
  static announceLoadingState(isLoading, context = '') {
    if (isLoading) {
      this.announce(`Memuat${context ? ' ' + context : ''}...`, 'polite');
    } else {
      this.announce(`Selesai memuat${context ? ' ' + context : ''}`, 'polite');
    }
  }

  // Color contrast utilities
  static checkColorContrast() {
    // Simple check for color contrast (can be enhanced)
    const isHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
    if (isHighContrast) {
      document.body.classList.add('high-contrast-mode');
    }
  }

  // Motion preference handling
  static respectMotionPreference() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      document.body.classList.add('reduced-motion');
    }
  }

  // Initialize all accessibility features
  static init() {
    this.manageFocus();
    this.enhanceKeyboardNavigation();
    this.createAnnouncer();
    this.addFocusIndicators();
    this.checkColorContrast();
    this.respectMotionPreference();
    
    // Listen for preference changes
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', this.checkColorContrast);
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', this.respectMotionPreference);
  }

  // Skip link functionality
  static setupSkipLinks() {
    const skipLink = document.querySelector('.skip-to-content');
    if (skipLink) {
      skipLink.addEventListener('click', (event) => {
        event.preventDefault();
        const target = document.querySelector(skipLink.getAttribute('href'));
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }
}