/**
 * ReliabilityManager
 * Provides unthrottled timers via Web Workers and focus spoofing
 * to ensure background tasks complete reliably.
 */
window.ReliabilityManager = (function () {
    let worker = null;
    const pendingTimers = new Map();
    let nextTimerId = 1;

    /**
     * Initializes the unthrottled worker
     */
    function initWorker() {
        if (worker) return;

        const workerCode = `
      const timers = new Map();
      self.onmessage = function(e) {
        if (e.data.type === 'timeout') {
          const id = e.data.id;
          setTimeout(() => {
            self.postMessage({ type: 'tick', id: id });
          }, e.data.delay);
        }
      };
    `;

        const blob = new Blob([workerCode], { type: 'application/javascript' });
        worker = new Worker(URL.createObjectURL(blob));

        worker.onmessage = function (e) {
            if (e.data.type === 'tick') {
                const resolve = pendingTimers.get(e.data.id);
                if (resolve) {
                    pendingTimers.delete(e.data.id);
                    resolve();
                }
            }
        };
    }

    return {
        /**
         * Injects focus spoofing into the page's MAIN world
         */
        enableSpoofing: function () {
            console.log('[Noosphere] Activating Focus Spoofing...');
            const script = document.createElement('script');
            script.textContent = `
        (function() {
          if (window.__NOOSPHERE_SPOOF_ACTIVE) return;
          window.__NOOSPHERE_SPOOF_ACTIVE = true;

          // 1. Override Visibility APIs
          Object.defineProperty(document, 'hidden', { 
            get: () => false, 
            configurable: true 
          });
          Object.defineProperty(document, 'visibilityState', { 
            get: () => 'visible', 
            configurable: true 
          });
          
          // 2. Mock hasFocus
          document.hasFocus = () => true;

          // 3. Block events that notify the page of being hidden or blurred
          const blockedEvents = [
            'visibilitychange', 
            'webkitvisibilitychange', 
            'blur', 
            'focusout', 
            'pagehide'
          ];
          
          const originalAddEventListener = EventTarget.prototype.addEventListener;
          EventTarget.prototype.addEventListener = function(type, listener, options) {
            if (blockedEvents.includes(type)) {
              // console.debug('[Noosphere] Blocked event listener:', type);
              return;
            }
            return originalAddEventListener.apply(this, arguments);
          };

          // 4. Periodic "Keep-Alive" events
          setInterval(() => {
            window.dispatchEvent(new Event('focus'));
            window.dispatchEvent(new Event('pageshow'));
          }, 1000);

          console.log('[Noosphere] Reliability Engine Active in MAIN world');
        })();
      `;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        },

        /**
         * Unthrottled sleep using Web Worker
         */
        sleep: function (ms) {
            initWorker();
            return new Promise(resolve => {
                const id = nextTimerId++;
                pendingTimers.set(id, resolve);
                worker.postMessage({ type: 'timeout', id: id, delay: ms });
            });
        }
    };
})();
