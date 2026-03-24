/**
 * ToastManager - Centralized notification queue for Chrome Extension
 * Prevents toast overlap and ensures sequential messaging.
 */
class ToastManager {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.toastContainer = null;
        this.injectStyles();
    }

    injectStyles() {
        if (document.getElementById('nr-toast-styles')) return;
        const style = document.createElement('style');
        style.id = 'nr-toast-styles';
        style.textContent = `
      .nr-toast-container {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000000;
        display: flex;
        flex-direction: column;
        gap: 10px;
        pointer-events: none;
        font-family: system-ui, -apple-system, sans-serif;
      }
      .nr-toast {
        background: #333;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-size: 14px;
        min-width: 200px;
        max-width: 350px;
        opacity: 0;
        transform: translateX(20px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        display: flex;
        align-items: center;
        border-left: 4px solid #4caf50;
      }
      .nr-toast.visible {
        opacity: 1;
        transform: translateX(0);
      }
      .nr-toast.error { border-left-color: #ef4444; }
      .nr-toast.warning { border-left-color: #f59e0b; }
      .nr-toast.info { border-left-color: #3b82f6; }
    `;
        document.head.appendChild(style);
    }

    ensureContainer() {
        if (!this.toastContainer) {
            this.toastContainer = document.createElement('div');
            this.toastContainer.className = 'nr-toast-container';
            document.body.appendChild(this.toastContainer);
        }
        return this.toastContainer;
    }

    show(message, type = 'success', duration = 3000) {
        this.queue.push({ message, type, duration });
        this.processQueue();
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;
        this.isProcessing = true;

        const { message, type, duration } = this.queue.shift();
        const container = this.ensureContainer();

        const toast = document.createElement('div');
        toast.className = `nr-toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('visible');
        });

        await new Promise(resolve => setTimeout(resolve, duration));

        toast.classList.remove('visible');
        await new Promise(resolve => setTimeout(resolve, 300)); // Wait for transition
        toast.remove();

        this.isProcessing = false;
        this.processQueue();
    }
}

// Initialize globally
if (!window.ToastManager) {
    window.ToastManager = new ToastManager();
}
