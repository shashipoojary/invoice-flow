import Database from 'better-sqlite3';
import path from 'path';

// Create database connection
const dbPath = path.join(process.cwd(), 'invoice_flow.db');
const db = new Database(dbPath);

// Initialize database tables
export function initDatabase() {
  try {
    // Create users table
    db.exec(`
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
    db.exec(`
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
    db.exec(`
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
    db.exec(`
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
export function query(text: string, params: any[] = []) {
  try {
    const stmt = db.prepare(text);
    const result = stmt.all(params);
    return { rows: result };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export function queryOne(text: string, params: any[] = []) {
  try {
    const stmt = db.prepare(text);
    const result = stmt.get(params);
    return { rows: result ? [result] : [] };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export function insert(text: string, params: any[] = []) {
  try {
    const stmt = db.prepare(text);
    const result = stmt.run(params);
    return { 
      rows: [], 
      insertId: result.lastInsertRowid,
      rowCount: result.changes 
    };
  } catch (error) {
    console.error('Database insert error:', error);
    throw error;
  }
}

// Initialize database
initDatabase();

export { db };
