const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Globalne varijable za toggle ranjivosti
let sqlInjectionEnabled = true;
let sensitiveDataExposureEnabled = true;

// Inicijalizacija baze podataka
const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message TEXT,
    pin TEXT
  )`);

  // Dodaj neke početne podatke
  db.run(`INSERT INTO users (message, pin) VALUES ('admin', '1234')`);
  db.run(`INSERT INTO users (message, pin) VALUES ('user', '5678')`);
});

// Osjetljivi podaci (simulacija)
const sensitiveData = {
  users: [
    { id: 1, name: 'Ivan Horvat', email: 'ivan.horvat@example.com', oib: '12345678901', creditCard: '4532-1234-5678-9010' },
    { id: 2, name: 'Ana Marić', email: 'ana.maric@example.com', oib: '98765432109', creditCard: '5555-1234-5678-9010' },
    { id: 3, name: 'Marko Novak', email: 'marko.novak@example.com', oib: '11223344556', creditCard: '4111-1234-5678-9010' }
  ],
  sessionCookies: 'session_id=abc123xyz; user_role=admin; csrf_token=xyz789abc',
  apiKeys: ['sk_live_1234567890abcdef', 'sk_test_abcdef1234567890']
};

// API endpointi

// Toggle SQL Injection
app.post('/api/toggle-sql-injection', (req, res) => {
  sqlInjectionEnabled = req.body.enabled;
  res.json({ enabled: sqlInjectionEnabled });
});

app.get('/api/sql-injection-status', (req, res) => {
  res.json({ enabled: sqlInjectionEnabled });
});

// Toggle Sensitive Data Exposure
app.post('/api/toggle-sensitive-data', (req, res) => {
  sensitiveDataExposureEnabled = req.body.enabled;
  res.json({ enabled: sensitiveDataExposureEnabled });
});

app.get('/api/sensitive-data-status', (req, res) => {
  res.json({ enabled: sensitiveDataExposureEnabled });
});

// SQL Injection endpoint
app.post('/api/save-data', (req, res) => {
  const { message, pin } = req.body;

  if (sqlInjectionEnabled) {
    // RANJIVO: Direktno spajanje u SQL upit bez parametrizacije
    const query = `INSERT INTO users (message, pin) VALUES ('${message}', '${pin}')`;

    db.run(query, function(err) {
      if (err) {
        return res.json({
          success: false,
          error: err.message,
          query: query,
          vulnerable: true
        });
      }

      // Dohvati sve korisnike da pokažemo učinak
      db.all('SELECT * FROM users', (err, rows) => {
        if (err) {
          return res.json({ success: false, error: err.message });
        }
        res.json({
          success: true,
          message: 'Podaci spremljeni',
          users: rows,
          query: query,
          vulnerable: true
        });
      });
    });
  } else {
    // SIGURNO: Parametrizirani upit
    const query = `INSERT INTO users (message, pin) VALUES (?, ?)`;

    db.run(query, [message, pin], function(err) {
      if (err) {
        return res.json({
          success: false,
          error: err.message,
          query: query,
          vulnerable: false
        });
      }

      db.all('SELECT * FROM users', (err, rows) => {
        if (err) {
          return res.json({ success: false, error: err.message });
        }
        res.json({
          success: true,
          message: 'Podaci spremljeni (sigurno)',
          users: rows,
          query: query,
          vulnerable: false
        });
      });
    });
  }
});

// Pretraga korisnika (za SQL Injection demonstraciju)
app.post('/api/search-users', (req, res) => {
  const { message } = req.body;

  if (sqlInjectionEnabled) {
    // RANJIVO: Direktno spajanje
    const query = `SELECT * FROM users WHERE message = '${message}'`;

    db.all(query, (err, rows) => {
      if (err) {
        return res.json({
          success: false,
          error: err.message,
          query: query,
          vulnerable: true
        });
      }
      res.json({
        success: true,
        users: rows,
        query: query,
        vulnerable: true
      });
    });
  } else {
    // SIGURNO: Parametrizirani upit
    const query = `SELECT * FROM users WHERE message = ?`;

    db.all(query, [message], (err, rows) => {
      if (err) {
        return res.json({
          success: false,
          error: err.message,
          query: query,
          vulnerable: false
        });
      }
      res.json({
        success: true,
        users: rows,
        query: query,
        vulnerable: false
      });
    });
  }
});

// Sensitive Data Exposure endpoint
app.get('/api/sensitive-data', (req, res) => {
  if (sensitiveDataExposureEnabled) {
    // RANJIVO: Vraćamo sve osjetljive podatke
    res.json({
      success: true,
      data: sensitiveData,
      vulnerable: true,
      message: 'Osjetljivi podaci prikazani (ranjivost uključena)'
    });
  } else {
    // SIGURNO: Vraćamo samo osnovne podatke
    res.json({
      success: true,
      data: {
        users: sensitiveData.users.map(u => ({ id: u.id, name: u.name })),
        message: 'Osjetljivi podaci skriveni (ranjivost isključena)'
      },
      vulnerable: false
    });
  }
});

// Reset baze podataka
app.post('/api/reset-database', (req, res) => {
  db.serialize(() => {
    db.run('DELETE FROM users');
    db.run(`INSERT INTO users (message, pin) VALUES ('admin', '1234')`);
    db.run(`INSERT INTO users (message, pin) VALUES ('user', '5678')`);

    db.all('SELECT * FROM users', (err, rows) => {
      res.json({ success: true, users: rows });
    });
  });
});

// Dohvati sve korisnike
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM users', (err, rows) => {
    if (err) {
      return res.json({ success: false, error: err.message });
    }
    res.json({ success: true, users: rows });
  });
});

app.listen(PORT, () => {
  console.log(`Server pokrenut na portu ${PORT}`);
  console.log(`Otvori http://localhost:${PORT} u pregledniku`);
});
