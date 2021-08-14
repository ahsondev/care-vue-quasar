const DB_NAME = 'care';
const DB_VERSION = 1;
const DB_STORE_NAME = 'inventoryItems';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onsuccess = function () {
      resolve(this.result);
    };
    req.onerror = () => reject();

    req.onupgradeneeded = function (evt) {
      const database = (evt.currentTarget as IDBRequest<IDBDatabase>).result;
      const store = database.createObjectStore(DB_STORE_NAME, {
        keyPath: 'itemCode',
        autoIncrement: false,
      });

      store.createIndex('itemShortCode', 'itemShortCode', { unique: false });
    };
  });
}

async function getObjectStore(
  storeName: string,
  mode: 'readwrite' | 'readonly'
): Promise<IDBObjectStore> {
  const db = await openDb();
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
}

async function getAll(
  storeName: string,
  mode: 'readwrite' | 'readonly'
): Promise<Array<unknown>> {
  const store = await getObjectStore(storeName, mode);
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = function (evt) {
      resolve((evt.target as IDBRequest<Array<unknown>>).result);
    };
    req.onerror = reject;
  });
}

async function clearObjectStore(storeName: string): Promise<void> {
  const store = await getObjectStore(storeName, 'readwrite');
  const req = store.clear();
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve();
    req.onerror = reject;
  });
}

export default {
  openDb,
  getObjectStore,
  clearObjectStore,
  getAll,
};
