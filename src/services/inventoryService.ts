import { InventoryItem } from '../models';
import db from '../helpers/db';
const DB_STORE_NAME = 'inventoryItems';
class InventoryService {
  async getInventoryItems(): Promise<Array<InventoryItem>> {
    return (await db.getAll(DB_STORE_NAME, 'readonly')) as Array<InventoryItem>;
  }

  async saveInventoryItems(items: Array<InventoryItem>): Promise<void> {
    await db.clearObjectStore(DB_STORE_NAME);
    const store = await db.getObjectStore(DB_STORE_NAME, 'readwrite');
    items.forEach((x) => {
      store.add(JSON.parse(JSON.stringify(x)));
    });
  }
}

export default new InventoryService();
