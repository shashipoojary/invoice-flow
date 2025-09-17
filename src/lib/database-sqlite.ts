import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';

// Create database connection
const dbPath = path.join(process.cwd(), 'invoice_flow.db');
const db = new sqlite3.Database(dbPath);

// Promisify database methods
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

// Initialize database tables
export async function initDatabase() {
  try {
    // Create users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create clients table
    await run(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        company TEXT,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Create invoices table
    await run(`
      CREATE TABLE IF NOT EXISTS invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        invoice_number TEXT NOT NULL,
        client_id INTEGER NOT NULL,
        subtotal REAL NOT NULL,
        tax_rate REAL NOT NULL,
        tax_amount REAL NOT NULL,
        total REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        due_date DATE NOT NULL,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (client_id) REFERENCES clients (id)
      )
    `);

    // Create invoice_items table
    await run(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        description TEXT NOT NULL,
        rate REAL NOT NULL,
        amount REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (invoice_id) REFERENCES invoices (id)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Database query functions
export async function query(text: string, params: any[] = []) {
  try {
    const result = await all(text, params);
    return { rows: result };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function queryOne(text: string, params: any[] = []) {
  try {
    const result = await get(text, params);
    return { rows: result ? [result] : [] };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function insert(text: string, params: any[] = []) {
  try {
    const result = await run(text, params);
    return { 
      rows: [], 
      insertId: result?.lastID || null,
      rowCount: result?.changes || 0
    };
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  }
}

// Initialize database on import
let dbInitialized = false;
export async function ensureDatabaseInitialized() {
  if (!dbInitialized) {
    await initDatabase();
    dbInitialized = true;
  }
}

// Initialize database on import
initDatabase().then(() => {
  dbInitialized = true;
  console.log('Database initialized successfully');
}).catch(console.error);

export { db };
