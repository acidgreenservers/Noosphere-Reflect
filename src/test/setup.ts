import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock IndexedDB
const indexedDB = {
    open: vi.fn(),
    deleteDatabase: vi.fn()
};

Object.defineProperty(window, 'indexedDB', {
    writable: true,
    value: indexedDB
});

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
