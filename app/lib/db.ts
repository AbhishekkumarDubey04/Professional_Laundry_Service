import fs from "fs";
import path from "path";

// Define our mock database structure
interface Database {
  orders: any[];
  customers: any[];
  societies: any[];
  services: any[];
}

const DB_PATH = path.join(process.cwd(), "data.json");

// Default initial state
const defaultDb: Database = {
  orders: [],
  customers: [],
  societies: [
    { id: 1, name: "Sunrise Apartments", has_blocks: true, is_active: true },
    { id: 2, name: "Green Valley", has_blocks: false, is_active: true },
    { id: 3, name: "Silver Oaks", has_blocks: true, is_active: true },
  ],
  services: [
    { id: "1", name: "Ironing", price: 2, icon: "👕" },
    { id: "2", name: "Washing", price: 3, icon: "💧" },
    { id: "3", "name": "Dry Cleaning", price: 5, icon: "🌬️" },
    { id: "4", name: "Folding", price: 1, icon: "📁" },
  ],
};

function readDb(): Database {
  try {
    if (!fs.existsSync(DB_PATH)) {
      writeDb(defaultDb);
      return defaultDb;
    }
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data) as Database;
  } catch (error) {
    console.error("Error reading mock DB:", error);
    return defaultDb;
  }
}

function writeDb(db: Database) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing mock DB:", error);
  }
}

export const db = {
  getOrders: () => readDb().orders,
  insertOrder: (order: any) => {
    const current = readDb();
    const newOrder = { ...order, id: Date.now().toString(), created_at: new Date().toISOString() };
    current.orders.push(newOrder);
    writeDb(current);
    return newOrder;
  },
  updateOrder: (id: string, updates: any) => {
    const current = readDb();
    const index = current.orders.findIndex((o) => o.id === id);
    if (index === -1) return null;
    current.orders[index] = { ...current.orders[index], ...updates };
    writeDb(current);
    return current.orders[index];
  },
  
  getCustomers: () => readDb().customers,
  upsertCustomer: (customer: any) => {
    const current = readDb();
    const index = current.customers.findIndex((c) => c.phone_number === customer.phone_number);
    if (index === -1) {
      current.customers.push(customer);
    } else {
      current.customers[index] = { ...current.customers[index], ...customer };
    }
    writeDb(current);
    return customer;
  },

  getSocieties: () => readDb().societies,
  insertSociety: (society: any) => {
    const current = readDb();
    const newSociety = { ...society, id: Date.now() };
    current.societies.push(newSociety);
    writeDb(current);
    return newSociety;
  },

  getServices: () => readDb().services,
  insertService: (service: any) => {
    const current = readDb();
    const newService = { ...service, id: Date.now().toString() };
    current.services = current.services || [];
    current.services.push(newService);
    writeDb(current);
    return newService;
  },
  updateService: (id: string, updates: any) => {
    const current = readDb();
    current.services = current.services || [];
    const index = current.services.findIndex((s) => s.id === id);
    if (index === -1) return null;
    current.services[index] = { ...current.services[index], ...updates };
    writeDb(current);
    return current.services[index];
  },
  deleteService: (id: string) => {
    const current = readDb();
    current.services = current.services || [];
    const initialLength = current.services.length;
    current.services = current.services.filter((s) => s.id !== id);
    writeDb(current);
    return current.services.length !== initialLength;
  },
};
