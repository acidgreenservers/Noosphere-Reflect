import '@testing-library/jest-dom';
import { vi } from 'vitest';
import 'fake-indexeddb/auto';

// Mock chrome API for extension tests
Object.defineProperty(window, 'chrome', {
    writable: true,
    value: {
        storage: {
            sync: {
                get: vi.fn(),
                set: vi.fn()
            }
        },
        runtime: {
            sendMessage: vi.fn(),
            onMessage: {
                addListener: vi.fn()
            }
        }
    }
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
}));

// Mock Web Worker
(global as any).Worker = class Worker {
    url: string;
    onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null;
    constructor(url: string) {
        this.url = url;
    }
    postMessage(msg: any) {
        setTimeout(() => {
            if (typeof this.onmessage === 'function') {
                const responseType = msg.type === 'ERROR' ? 'ERROR' : `${msg.type}_SUCCESS`;
                const payload = msg.type === 'SEARCH' ? { results: [] } : {};
                this.onmessage({
                    data: {
                        type: responseType,
                        payload,
                        messageId: msg.messageId
                    }
                } as MessageEvent);
            }
        }, 0);
    }
    terminate() {}
    addEventListener() {}
    removeEventListener() {}
    dispatchEvent() { return false; }
};

