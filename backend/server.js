import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Simple request/response logger to help capture failing requests during debugging
app.use((req, res, next) => {
  const start = Date.now();
  const chunks = [];
  const originalWrite = res.write;
  const originalEnd = res.end;

  res.write = function (chunk) {
    chunks.push(Buffer.from(chunk));
    return originalWrite.apply(res, arguments);
  };

  res.end = function (chunk) {
    if (chunk) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString('utf8');
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    try {
      console.log('  Request body:', JSON.stringify(req.body));
      console.log('  Response body:', body);
    } catch (e) {
      // ignore circular
    }
    return originalEnd.apply(res, arguments);
  };

  next();
});

// Postgres connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://timetracker:password@localhost:5432/timetracker'
});

pool.on('connect', () => console.log('✓ Connected to Postgres database'));

// Helper to convert `?` placeholders into $1, $2... for pg
function toPgParams(sql, params = []) {
  let i = 0;
  const text = sql.replace(/\?/g, () => {
    i += 1;
    return `$${i}`;
  });
  return { text, values: params };
}

export const dbRun = async (sql, params = []) => {
  const { text, values } = toPgParams(sql, params);
  const client = await pool.connect();
  try {
    // Try with RETURNING id for INSERT, otherwise just run the query
    let finalText = text;
    if (text.trim().toUpperCase().startsWith('INSERT')) {
      finalText = text + ' RETURNING id';
    }
    const res = await client.query(finalText, values);
    return { id: res.rows[0]?.id ?? null, rowCount: res.rowCount };
  } finally {
    client.release();
  }
};

export const dbGet = async (sql, params = []) => {
  const { text, values } = toPgParams(sql, params);
  const res = await pool.query(text, values);
  return res.rows[0] || null;
};

export const dbAll = async (sql, params = []) => {
  const { text, values } = toPgParams(sql, params);
  const res = await pool.query(text, values);
  return res.rows || [];
};

// Initialize database
async function initializeDatabase() {
  const createCompaniesTable = `
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      industry TEXT,
      pay_rate DOUBLE PRECISION DEFAULT 0,
      manager_email TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      hourly_rate DOUBLE PRECISION DEFAULT 0,
      pay_cycle_type TEXT DEFAULT 'weekly',
      pay_cycle_custom_day INTEGER,
      theme TEXT DEFAULT 'light',
      current_company_id INTEGER REFERENCES companies(id),
      profile_setup_complete BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  const createUserCompaniesTable = `
    CREATE TABLE IF NOT EXISTS user_companies (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      company_id INTEGER NOT NULL REFERENCES companies(id),
      hourly_rate DOUBLE PRECISION DEFAULT 0,
      role TEXT DEFAULT 'employee',
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE(user_id, company_id)
    );
  `;

  const createTimeEntriesTable = `
    CREATE TABLE IF NOT EXISTS time_entries (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      company_id INTEGER NOT NULL REFERENCES companies(id),
      clock_in TIMESTAMPTZ NOT NULL,
      clock_out TIMESTAMPTZ,
      duration_minutes INTEGER,
      notes TEXT,
      project TEXT,
      is_manual BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  const createBreaksTable = `
    CREATE TABLE IF NOT EXISTS breaks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      company_id INTEGER NOT NULL REFERENCES companies(id),
      break_start TIMESTAMPTZ NOT NULL,
      break_end TIMESTAMPTZ,
      duration_minutes INTEGER,
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  const createPayCyclesTable = `
    CREATE TABLE IF NOT EXISTS pay_cycles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      company_id INTEGER NOT NULL REFERENCES companies(id),
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      total_hours DOUBLE PRECISION DEFAULT 0,
      total_earnings DOUBLE PRECISION DEFAULT 0,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  const createEmailSettingsTable = `
    CREATE TABLE IF NOT EXISTS email_settings (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
      smtp_host TEXT,
      smtp_port INTEGER,
      smtp_user TEXT,
      smtp_password TEXT,
      reminder_enabled BOOLEAN DEFAULT false,
      reminder_before_minutes INTEGER DEFAULT 60,
      reminder_frequency TEXT DEFAULT 'daily',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  const createEmailLogTable = `
    CREATE TABLE IF NOT EXISTS email_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      company_id INTEGER NOT NULL REFERENCES companies(id),
      recipient TEXT NOT NULL,
      subject TEXT,
      status TEXT DEFAULT 'sent',
      sent_at TIMESTAMPTZ DEFAULT now(),
      created_at TIMESTAMPTZ DEFAULT now()
    );
  `;

  const createIndexes = [
    'CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_time_entries_company_id ON time_entries(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_time_entries_clock_in ON time_entries(clock_in)',
    'CREATE INDEX IF NOT EXISTS idx_breaks_user_id ON breaks(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_breaks_company_id ON breaks(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_pay_cycles_user_id ON pay_cycles(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_pay_cycles_company_id ON pay_cycles(company_id)',
    'CREATE INDEX IF NOT EXISTS idx_user_companies_user ON user_companies(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_user_companies_company ON user_companies(company_id)'
  ];

  const tables = [createCompaniesTable, createUsersTable, createUserCompaniesTable, createTimeEntriesTable, createBreaksTable, createPayCyclesTable, createEmailSettingsTable, createEmailLogTable];

  const migrations = [
    'ALTER TABLE companies ADD COLUMN IF NOT EXISTS user_id INTEGER',
    'ALTER TABLE companies ADD COLUMN IF NOT EXISTS description TEXT',
    'ALTER TABLE companies ADD COLUMN IF NOT EXISTS industry TEXT',
    'ALTER TABLE companies ADD COLUMN IF NOT EXISTS pay_rate DOUBLE PRECISION DEFAULT 0',
    'ALTER TABLE companies ADD COLUMN IF NOT EXISTS manager_email TEXT',
    'ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now()',
    'ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()',
    `DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'companies_user_id_fkey'
      ) THEN
        ALTER TABLE companies
          ADD CONSTRAINT companies_user_id_fkey
          FOREIGN KEY (user_id) REFERENCES users(id);
      END IF;
    END $$;`
  ];

  try {
    for (const stmt of tables) {
      await dbRun(stmt, []);
    }
    for (const stmt of migrations) {
      await dbRun(stmt, []);
    }
    for (const stmt of createIndexes) {
      await dbRun(stmt, []);
    }
    console.log('✓ Database schema initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'TimeTracker API is running' });
});

// Import routes
import authRoutes from './routes/auth.js';
import timeTrackingRoutes from './routes/timeTracking.js';
import userRoutes from './routes/users.js';
import payCycleRoutes from './routes/payCycle.js';
import breaksRoutes from './routes/breaks.js';
import entriesRoutes from './routes/entries.js';
import companiesRoutes from './routes/companies.js';
import manualEntriesRoutes from './routes/manualEntries.js';
import emailSettingsRoutes from './routes/emailSettings.js';
import payCycleSetupRoutes from './routes/payCycleSetup.js';
import expensesRoutes from './routes/expenses.js';
import messagesRoutes from './routes/messages.js';
import forthnightlyRoutes from './routes/fortnightly.js';

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/time', timeTrackingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/paycycle', payCycleRoutes);
app.use('/api/paycycle-setup', payCycleSetupRoutes);
app.use('/api/breaks', breaksRoutes);
app.use('/api/entries', entriesRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/manual-entries', manualEntriesRoutes);
app.use('/api/email-settings', emailSettingsRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/fortnightly', forthnightlyRoutes);

const PORT = process.env.PORT || 5000;

// Export pool and helpers
export { pool };

app.listen(PORT, async () => {
  console.log(`\n🚀 TimeTracker API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);
  
  // Initialize database tables
  await initializeDatabase();
});

