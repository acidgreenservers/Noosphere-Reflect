const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  // Inject sample session into IndexedDB
  await page.evaluate(async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('noosphere_reflect_db');
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['chats'], 'readwrite');
        const store = transaction.objectStore('chats');
        const sampleSession = {
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
        };
        const putReq = store.put(sampleSession);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      request.onerror = () => reject(request.error);
    });
  });

  await page.goto('http://localhost:5173/#/archive');
  await page.waitForTimeout(1500);

  await page.screenshot({ path: '/home/jules/verification/screenshots/exported_modified_badges.png', fullPage: true });

  await browser.close();
  console.log('Saved screenshot to exported_modified_badges.png');
})();
