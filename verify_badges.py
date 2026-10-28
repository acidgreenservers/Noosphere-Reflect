import time
from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    page.goto('http://localhost:5173/')
    time.sleep(3)

    page.evaluate('''() => {
        return new Promise((resolve) => {
            const req = indexedDB.open('noosphere_reflect_db');
            req.onsuccess = (e) => {
                const db = e.target.result;
                const tx = db.transaction(['chats'], 'readwrite');
                tx.objectStore('chats').put({
                    id: 'test-session-123',
                    title: 'Exported & Modified Test Chat',
                    messages: [{ id: 'm1', role: 'user', content: 'Hello', timestamp: Date.now() }],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    metadata: {
                        exportStatus: 'modified',
                        lastExportDate: new Date().toISOString(),
                        exportCount: 2,
                        exportFormats: ['zip-markdown', 'zip-json']
                    }
                });
                tx.oncomplete = () => resolve();
            };
        });
    }''')

    time.sleep(1)
    page.goto('http://localhost:5173/#/archive')
    time.sleep(3)

    page.screenshot(path='/home/jules/verification/screenshots/exported_modified_badges.png', full_page=True)
    browser.close()
    print("Screenshot saved successfully!")
