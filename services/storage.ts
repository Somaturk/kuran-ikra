
const DB_NAME = 'KuranAppDB';
const STORE_NAME = 'surah_analyses';
const DB_VERSION = 1;

// Initialize the database
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("Database error:", (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

// Seed database with initial data using BATCH PROCESSING (Critical for iOS)
export const seedDatabase = async (data: Record<string, any>) => {
  if (!data || Object.keys(data).length === 0) return;
  
  const entries = Object.entries(data);
  const BATCH_SIZE = 50; // Process 50 items at a time to prevent iOS transaction timeouts
  
  // Helper to process a single batch
  const processBatch = async (batch: [string, any][]) => {
      const db = await initDB();
      return new Promise((resolve, reject) => {
          const tx = db.transaction(STORE_NAME, 'readwrite');
          const store = tx.objectStore(STORE_NAME);
          
          batch.forEach(([key, value]) => {
              store.put(value, key);
          });

          tx.oncomplete = () => resolve(true);
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(new Error("Transaction aborted"));
      });
  };

  // Iterate through chunks
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const chunk = entries.slice(i, i + BATCH_SIZE);
      try {
          await processBatch(chunk);
      } catch (e) {
          console.error(`Batch seeding failed at index ${i}`, e);
          // Optional: decide whether to throw or continue
      }
  }
};

// Save data to IndexedDB
export const saveToDB = async (key: string, data: any) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, key);
      
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("SaveToDB Error:", e);
    throw e;
  }
};

// Get data from IndexedDB
export const getFromDB = async (key: string): Promise<any> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("GetFromDB Error:", e);
    // Return null instead of throwing to prevent app crashes on read errors
    return null;
  }
};

// Get all keys (to show checkmarks)
export const getKeysFromDB = async (): Promise<string[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAllKeys();
      
      req.onsuccess = () => resolve(req.result as string[]);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("GetKeys Error:", e);
    return [];
  }
};

// Calculate total size using CURSORS (Memory safe for iOS)
export const getDBStats = async (): Promise<{count: number, size: number}> => {
    try {
        const db = await initDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const req = store.openCursor();
            
            let count = 0;
            let size = 0;

            req.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    count++;
                    // Approximation: Convert value to string to estimate size
                    // This is safer than getAll() which loads everything into RAM
                    try {
                        const valueStr = JSON.stringify(cursor.value);
                        size += valueStr.length;
                    } catch (e) {
                        // ignore sizing error
                    }
                    cursor.continue();
                } else {
                    resolve({ count, size });
                }
            };
            req.onerror = () => reject(req.error);
        });
    } catch (e) {
        console.error("Stats Error:", e);
        return { count: 0, size: 0 };
    }
}

// Clear all data
export const clearDB = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
    });
}
