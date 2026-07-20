require('dotenv').config();

const dns = require('dns');
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}


const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'rtpl_super_secret_session_token_key_12345';

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' })); // Support base64 image uploads

const fs = require('fs');
const path = require('path');

app.use(express.static(__dirname, { extensions: ['html'] }));

const USERS_FILE = path.join(__dirname, 'users_fallback.json');
const LEADS_FILE = path.join(__dirname, 'leads_fallback.json');

// Helper to read/write JSON files
function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

// MySQL Configuration
const dbConfig = {
  host: process.env.MYSQLHOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQLUSER || process.env.DB_USER || 'root',
  password: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQLDATABASE || process.env.DB_NAME || 'roshani_dynamic',
  port: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  ssl: process.env.MYSQLHOST ? { rejectUnauthorized: false } : false
};

let realConnection = null;
let isFallbackMode = false;

// Create Wrapper Connection Object
let connection = {
  query: function (sql, params, callback) {
    let actualCallback = typeof params === 'function' ? params : callback;
    let actualParams = typeof params === 'function' ? [] : params;

    if (!isFallbackMode && realConnection && realConnection.state !== 'disconnected') {
      realConnection.query(sql, actualParams, actualCallback);
      return;
    }

    // Fallback Mock SQL Parser/Executor
    try {
      const sqlLower = sql.trim().toLowerCase();

      // 1. SELECT * FROM users WHERE email = ?
      if (sqlLower.startsWith('select') && sqlLower.includes('from users') && sqlLower.includes('where email =')) {
        const email = actualParams[0].toLowerCase().trim();
        const users = readJSON(USERS_FILE);
        const user = users.find(u => u.email.toLowerCase().trim() === email);
        return actualCallback(null, user ? [user] : []);
      }

      // 2. INSERT INTO users (email, name, password, phone, type) VALUES (?, ?, ?, ?, ?)
      if (sqlLower.startsWith('insert into users')) {
        const users = readJSON(USERS_FILE);
        const email = actualParams[0].toLowerCase().trim();
        const name = actualParams[1];
        const passwordOrPic = actualParams[2];
        const phone = actualParams[3];
        const type = actualParams[4];

        const existing = users.find(u => u.email.toLowerCase().trim() === email);

        if (sqlLower.includes('on duplicate key update')) {
          if (existing) {
            existing.name = name;
            existing.picture = passwordOrPic;
            existing.phone = phone;
            existing.type = type || existing.type;
          } else {
            users.push({
              email,
              name,
              password: null,
              picture: passwordOrPic,
              phone,
              type: type || 'Standard Auth',
              date: new Date().toISOString()
            });
          }
          writeJSON(USERS_FILE, users);
          return actualCallback(null, { affectedRows: 1 });
        } else {
          if (existing) {
            return actualCallback({ code: 'ER_DUP_ENTRY', message: 'Duplicate entry' });
          }
          users.push({
            email,
            name,
            password: passwordOrPic,
            picture: null,
            phone,
            type: 'Standard Registration Form',
            date: new Date().toISOString()
          });
          writeJSON(USERS_FILE, users);
          return actualCallback(null, { affectedRows: 1 });
        }
      }

      // 3. UPDATE users SET password = ? WHERE email = ?
      if (sqlLower.startsWith('update users set password =')) {
        const password = actualParams[0];
        const email = actualParams[1].toLowerCase().trim();
        const users = readJSON(USERS_FILE);
        const user = users.find(u => u.email.toLowerCase().trim() === email);
        if (!user) {
          return actualCallback(null, { affectedRows: 0 });
        }
        user.password = password;
        writeJSON(USERS_FILE, users);
        return actualCallback(null, { affectedRows: 1 });
      }

      // 4. SELECT email, name, picture, phone, date, type FROM users ORDER BY date DESC
      if (sqlLower.startsWith('select') && sqlLower.includes('from users') && sqlLower.includes('order by date desc')) {
        const users = readJSON(USERS_FILE);
        users.sort((a, b) => new Date(b.date) - new Date(a.date));
        return actualCallback(null, users);
      }

      // 5. DELETE FROM users WHERE email = ?
      if (sqlLower.startsWith('delete from users where email =')) {
        const email = actualParams[0].toLowerCase().trim();
        let users = readJSON(USERS_FILE);
        const initialLen = users.length;
        users = users.filter(u => u.email.toLowerCase().trim() !== email);
        writeJSON(USERS_FILE, users);
        return actualCallback(null, { affectedRows: initialLen - users.length });
      }

      // 6. TRUNCATE TABLE users
      if (sqlLower.includes('truncate table users')) {
        writeJSON(USERS_FILE, []);
        return actualCallback(null);
      }

      // 7. INSERT INTO leads (name, email, phone, course, message)
      if (sqlLower.startsWith('insert into leads')) {
        const name = actualParams[0];
        const email = actualParams[1];
        const phone = actualParams[2];
        const course = actualParams[3];
        const message = actualParams[4];

        const leads = readJSON(LEADS_FILE);
        const newLead = {
          id: leads.length > 0 ? Math.max(...leads.map(l => l.id || 0)) + 1 : 1,
          name,
          email,
          phone,
          course,
          message,
          date: new Date().toISOString()
        };
        leads.push(newLead);
        writeJSON(LEADS_FILE, leads);
        return actualCallback(null, { insertId: newLead.id });
      }

      // 8. SELECT * FROM leads ORDER BY date DESC
      if (sqlLower.startsWith('select') && sqlLower.includes('from leads') && sqlLower.includes('order by date desc')) {
        const leads = readJSON(LEADS_FILE);
        leads.sort((a, b) => new Date(b.date) - new Date(a.date));
        return actualCallback(null, leads);
      }

      // 9. DELETE FROM leads WHERE id = ?
      if (sqlLower.startsWith('delete from leads where id =')) {
        const id = parseInt(actualParams[0], 10);
        let leads = readJSON(LEADS_FILE);
        const initialLen = leads.length;
        leads = leads.filter(l => l.id !== id);
        writeJSON(LEADS_FILE, leads);
        return actualCallback(null, { affectedRows: initialLen - leads.length });
      }

      // 10. TRUNCATE TABLE leads
      if (sqlLower.includes('truncate table leads')) {
        writeJSON(LEADS_FILE, []);
        return actualCallback(null);
      }

      return actualCallback(null, []);
    } catch (e) {
      console.error("Fallback DB Query Error:", e);
      return actualCallback(e);
    }
  }
};

let reconnectTimeout = null;

function scheduleReconnect() {
  if (!reconnectTimeout) {
    console.log('Attempting to reconnect to MySQL in 15 seconds...');
    reconnectTimeout = setTimeout(() => {
      reconnectTimeout = null;
      connectDatabase();
    }, 15000);
  }
}

function connectDatabase() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  if (realConnection) {
    try { realConnection.destroy(); } catch (e) { }
    realConnection = null;
  }

  // Connect without database parameter first so we can create it if it doesn't exist
  const connConfig = { ...dbConfig };
  delete connConfig.database;

  realConnection = mysql.createConnection(connConfig);

  realConnection.on('error', (err) => {
    console.error('MySQL connection error:', err.message);

    // Handle fatal errors (e.g. MySQL crash, server restart, idle timeout)
    if (err.fatal || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED' || err.code === 'ER_CON_COUNT_ERROR') {
      if (!isFallbackMode) {
        console.log('--- MySQL CRASHED / DISCONNECTED: FALLING BACK TO LOCAL JSON DATABASE ---');
        isFallbackMode = true;
      }
      scheduleReconnect();
    } else {
      if (!isFallbackMode) {
        console.log('--- FALLING BACK TO LOCAL JSON DATABASE ---');
        isFallbackMode = true;
      }
    }
  });

  realConnection.connect((err) => {
    if (err) {
      console.error('Error connecting to MySQL:', err.message);
      console.log('Please make sure XAMPP / phpMyAdmin is running!');
      if (!isFallbackMode) {
        console.log('--- FALLING BACK TO LOCAL JSON DATABASE ---');
        isFallbackMode = true;
      }
      // Retry connection in background safely
      scheduleReconnect();
      return;
    }
    console.log('Connected to MySQL server.');
    isFallbackMode = false;

    // Create Database dynamically
    const dbName = dbConfig.database || 'roshani_dynamic';
    realConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``, (err) => {
      if (err) {
        console.error('Error creating database:', err.message);
        return;
      }
      console.log(`Database \`${dbName}\` verified/created.`);

      // Switch to database
      realConnection.query(`USE \`${dbName}\``, (err) => {
        if (err) {
          console.error('Error switching to database:', err.message);
          isFallbackMode = true;
          return;
        }
        createTables();
      });
    });
  });
}

function createTables() {
  // Users Table (Secure with password field)
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      email VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      password VARCHAR(255) NULL,
      picture LONGTEXT,
      phone VARCHAR(50),
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME NULL,
      type VARCHAR(100) DEFAULT 'Standard Auth'
    )
  `;

  // Leads Table
  const createLeadsTable = `
    CREATE TABLE IF NOT EXISTS leads (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      course VARCHAR(150) NOT NULL,
      message TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  connection.query(createUsersTable, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    } else {
      console.log('Users table verified/created.');
      // Auto-patch columns if users table already existed without 'password' column
      connection.query("SHOW COLUMNS FROM users LIKE 'password'", (err, cols) => {
        if (!err && cols.length === 0) {
          connection.query("ALTER TABLE users ADD COLUMN password VARCHAR(255) NULL", (err) => {
            if (err) console.error("Error adding password column:", err.message);
            else console.log("Added missing password column to users table.");
          });
        }
      });
      // Also patch other missing columns if any
      connection.query("SHOW COLUMNS FROM users LIKE 'last_login'", (err, cols) => {
        if (!err && cols.length === 0) {
          connection.query("ALTER TABLE users ADD COLUMN last_login DATETIME NULL", (err) => {
            if (err) console.error("Error adding last_login column:", err.message);
            else console.log("Added missing last_login column to users table.");
          });
        }
      });
      connection.query("SHOW COLUMNS FROM users LIKE 'type'", (err, cols) => {
        if (!err && cols.length === 0) {
          connection.query("ALTER TABLE users ADD COLUMN type VARCHAR(100) DEFAULT 'Standard Auth'", (err) => {
            if (err) console.error("Error adding type column:", err.message);
            else console.log("Added missing type column to users table.");
          });
        }
      });
    }
  });

  connection.query(createLeadsTable, (err) => {
    if (err) console.error('Error creating leads table:', err.message);
    else console.log('Leads table verified/created.');
  });
}

connectDatabase();

// --- SECURE API ROUTES ---

// 1. User Registration (Hashed Password)
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  // Hash password
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  const query = `
    INSERT INTO users (email, name, password, phone, type)
    VALUES (?, ?, ?, ?, 'Standard Registration Form')
  `;

  connection.query(query, [email.toLowerCase().trim(), name, hashedPassword, phone || ''], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ error: 'An account with this email already exists.' });
      }
      return res.status(500).json({ error: err.message });
    }

    // Notify admin of new registration
    sendAdminNotification({
      subject: 'New User Registered',
      heading: 'New User Registration 🆕',
      color: '#1d4ed8',
      details: {
        'Name': name,
        'Email': email,
        'Phone': phone || 'Not provided',
        'Method': 'Standard Registration Form'
      }
    });

    res.json({ message: 'Registration successful!' });
  });
});

// 2. User Login (Verify Password)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  connection.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = results[0];

    // Check if user registered via Google OAuth
    if (!user.password) {
      return res.status(401).json({ error: 'This email is linked to Google Login. Please sign in with Google.' });
    }

    // Verify hashed password
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update last login timestamp in DB
    connection.query('UPDATE users SET last_login = NOW() WHERE email = ?', [user.email], (updateErr) => {
      if (updateErr) console.error('Error updating last login:', updateErr.message);
    });

    // Notify admin of user login
    sendAdminNotification({
      subject: `User Login: ${user.name}`,
      heading: 'User Logged In 🔑',
      color: '#0369a1',
      details: {
        'Name': user.name,
        'Email': user.email,
        'Phone': user.phone || 'Not provided',
        'Login Method': user.type || 'Standard Auth'
      }
    });

    // Generate JWT Token
    const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '2h' });

    res.json({
      message: 'Login successful!',
      token: token,
      user: {
        name: user.name,
        email: user.email,
        picture: user.picture,
        phone: user.phone,
        type: user.type
      }
    });
  });
});

// Store active OTPs in memory: { [email]: { otp: string, expiresAt: number } }
const activeOtps = {};

// --- Email Gateway Integration (Nodemailer) ---
const nodemailer = require('nodemailer');

function sendEmailOTP(recipientEmail, otpCode) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    const htmlContent = `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; color: #1e293b;">
        <h2 style="font-size: 20px; font-weight: 800; color: #1d4ed8; margin-top: 0;">Reset Your Password</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #64748b;">A password reset request was made for your account at RTPL Academy. Please use the verification code below to authorize your reset:</p>
        <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: 900; letter-spacing: 4px; color: #0f172a;">${otpCode}</span>
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">This code is valid for 5 minutes. If you did not make this request, please ignore this email.</p>
      </div>
    `;

    return fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'RTPL Academy <onboarding@resend.dev>',
        to: recipientEmail,
        subject: 'Password Reset Verification Code - RTPL Academy',
        html: htmlContent
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log('[OTP Verification] Sent via Resend:', data);
        return { messageId: data.id };
      });
  }

  return new Promise((resolve, reject) => {
    // Read SMTP configurations from process.env with sensible defaults
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;

    if (!emailUser || !emailPass) {
      return reject(new Error('SMTP credentials (EMAIL_USER / EMAIL_PASS) missing in env.'));
    }

    // Configure Nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // True for 465, false for 587
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const mailOptions = {
      from: `"RTPL Academy" <${emailUser}>`,
      to: recipientEmail,
      subject: 'Password Reset Verification Code - RTPL Academy',
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; color: #1e293b;">
          <h2 style="font-size: 20px; font-weight: 800; color: #1d4ed8; margin-top: 0;">Reset Your Password</h2>
          <p style="font-size: 14px; line-height: 1.5; color: #64748b;">A password reset request was made for your account at RTPL Academy. Please use the verification code below to authorize your reset:</p>
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: 900; letter-spacing: 4px; color: #0f172a;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-bottom: 0;">This code is valid for 5 minutes. If you did not make this request, please ignore this email.</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return reject(error);
      }
      resolve(info);
    });
  });
}

// ─── Admin Notification Email ────────────────────────────────────────────────
const ADMIN_NOTIFY_EMAIL = 'vyasdhruv503@gmail.com';

function sendAdminNotification({ subject, heading, color, details }) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const now = new Date().toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
  });

  const rows = Object.entries(details)
    .map(([k, v]) => `<tr><td style="padding:6px 12px;font-weight:700;color:#475569;font-size:13px;white-space:nowrap;">${k}</td><td style="padding:6px 12px;color:#0f172a;font-size:13px;">${v || '—'}</td></tr>`)
    .join('');

  const html = `
  <div style="font-family:'Segoe UI',sans-serif;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
    <div style="background:${color};padding:24px 28px;">
      <h1 style="margin:0;font-size:20px;font-weight:900;color:#fff;letter-spacing:-0.5px;">🔔 ${heading}</h1>
      <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.85);">Roshani Technologies Admin Alert</p>
    </div>
    <div style="padding:24px 28px;background:#f8fafc;">
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
        <tbody>${rows}</tbody>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;">🕐 Received at: <strong>${now} IST</strong></p>
    </div>
    <div style="padding:14px 28px;background:#fff;border-top:1px solid #f1f5f9;text-align:center;">
      <a href="https://roshani-tech.netlify.app/admin.html" style="display:inline-block;padding:10px 24px;background:${color};color:#fff;font-weight:800;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-radius:10px;text-decoration:none;">Open Admin Panel</a>
    </div>
  </div>`;

  if (resendApiKey) {
    // Send via Resend HTTP API (Port 443 - Never Blocked)
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'RTPL Notifications <onboarding@resend.dev>',
        to: process.env.EMAIL_USER || ADMIN_NOTIFY_EMAIL,
        subject: `🔔 ${subject} — Roshani Technologies`,
        html: html
      })
    })
      .then(res => res.json())
      .then(data => console.log('[Admin Notify] Sent via Resend API:', data))
      .catch(err => console.error('[Admin Notify] Resend API Error:', err.message));

    return;
  }

  // SMTP Fallback (when running locally)
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    console.warn('[Admin Notify] SMTP credentials missing — skipping notification.');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: { user: emailUser, pass: emailPass }
  });

  transporter.sendMail({
    from: `"RTPL Admin" <${emailUser}>`,
    to: ADMIN_NOTIFY_EMAIL,
    subject: `🔔 ${subject} — Roshani Technologies`,
    html
  }, (err, info) => {
    if (err) console.error('[Admin Notify] Email error:', err.message);
    else console.log('[Admin Notify] Email sent:', info.messageId);
  });
}
// ─────────────────────────────────────────────────────────────────────────────

// 2a. Generate OTP for Forgot Password (Email-based)
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // Verify if user exists with this email address
  connection.query('SELECT * FROM users WHERE email = ?', [cleanEmail], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) {
      return res.status(404).json({ error: 'This email address is not registered.' });
    }

    // Generate a secure 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    activeOtps[cleanEmail] = {
      otp: otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
    };

    console.log(`[OTP Verification] Generated OTP ${otp} for email: ${cleanEmail}`);

    // Send real Email dynamically
    sendEmailOTP(cleanEmail, otp)
      .then((info) => {
        console.log(`[Email Sent] Success: ${info.messageId}`);
        sendAdminNotification({
          subject: `Password Reset Requested: ${cleanEmail}`,
          heading: 'Password Reset Request (OTP Sent) 🔑',
          color: '#ea580c',
          details: {
            'Email': cleanEmail
          }
        });
        res.json({
          message: 'OTP sent successfully!',
          realEmail: true
        });
      })
      .catch((emailError) => {
        console.warn(`[SMTP Warning]:`, emailError.message);
        sendAdminNotification({
          subject: `Password Reset Requested (Simulation): ${cleanEmail}`,
          heading: 'Password Reset Request (Simulated OTP) ⚠️',
          color: '#eab308',
          details: {
            'Email': cleanEmail,
            'Error': emailError.message
          }
        });
        // Fallback to simulated delivery so the flow doesn't break if SMTP is not configured
        res.json({
          message: `OTP generated (Simulated: Email gateway not configured - ${emailError.message})`,
          otp: otp,
          error: emailError.message
        });
      });
  });
});

// 2b. Verify OTP Code (Email-based)
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email address and OTP code are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();
  const entry = activeOtps[cleanEmail];

  if (!entry) {
    return res.status(400).json({ error: 'No active OTP request found for this email address.' });
  }

  if (Date.now() > entry.expiresAt) {
    delete activeOtps[cleanEmail];
    return res.status(400).json({ error: 'The OTP code has expired. Please request a new one.' });
  }

  if (entry.otp !== otp.trim()) {
    return res.status(400).json({ error: 'Incorrect OTP code. Please try again.' });
  }

  // Success, clean up OTP code
  delete activeOtps[cleanEmail];
  res.json({ success: true, message: 'OTP verified successfully.' });
});

// 2c. Reset User Password (Email-based)
app.post('/api/auth/reset-password', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email address and new password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  // Hash new password
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  connection.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, cleanEmail], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Failed to update password. User not found.' });
    }

    sendAdminNotification({
      subject: `Password Reset Completed: ${cleanEmail}`,
      heading: 'Password Reset Successful ✅',
      color: '#16a34a',
      details: {
        'Email': cleanEmail
      }
    });

    res.json({ message: 'Password updated successfully!' });
  });
});

// 3. Save / Update Profile (Secure Endpoint)
app.post('/api/users', (req, res) => {
  const { email, name, picture, phone, type } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required.' });
  }

  const query = `
    INSERT INTO users (email, name, picture, phone, type)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      picture = VALUES(picture),
      phone = VALUES(phone),
      type = VALUES(type)
  `;

  connection.query(query, [email.toLowerCase().trim(), name, picture, phone, type || 'Standard Auth'], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Profile saved successfully' });
  });
});

// 4. Get All Users (Admin)
app.get('/api/users', (req, res) => {
  connection.query('SELECT email, name, picture, phone, date, last_login, type FROM users ORDER BY date DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 5. Delete User (Admin)
app.delete('/api/users/:email', (req, res) => {
  const email = req.params.email;
  connection.query('DELETE FROM users WHERE email = ?', [email], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'User deleted successfully' });
  });
});

// 6. Clear Users (Admin)
app.delete('/api/users', (req, res) => {
  connection.query('TRUNCATE TABLE users', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'All users cleared' });
  });
});

// 7. Add Lead
app.post('/api/leads', (req, res) => {
  const { name, email, phone, course, message } = req.body;
  if (!name || !email || !phone || !course) {
    return res.status(400).json({ error: 'Required fields missing.' });
  }

  const query = `
    INSERT INTO leads (name, email, phone, course, message)
    VALUES (?, ?, ?, ?, ?)
  `;

  connection.query(query, [name, email, phone, course, message], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Notify admin of new inquiry/lead
    sendAdminNotification({
      subject: 'New Course Inquiry Received',
      heading: 'New Course Inquiry 📋',
      color: '#059669',
      details: {
        'Name': name,
        'Email': email,
        'Phone': phone,
        'Course Interest': course,
        'Message': message || 'No message provided'
      }
    });

    res.json({ message: 'Lead added successfully', id: result.insertId });
  });
});

// 8. Get All Leads (Admin)
app.get('/api/leads', (req, res) => {
  connection.query('SELECT * FROM leads ORDER BY date DESC', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// 9. Delete Lead (Admin)
app.delete('/api/leads/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM leads WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Lead deleted successfully' });
  });
});

// 10. Clear Leads (Admin)
app.delete('/api/leads', (req, res) => {
  connection.query('TRUNCATE TABLE leads', (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'All leads cleared' });
  });
});

app.post('/api/chat', async (req, res) => {
  const { query, activeTopic } = req.body;
  if (!query) {
    return res.status(400).json({ error: 'Query is required.' });
  }

  const fetch = require('node-fetch');
  const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyA_placeholder_fallback_key';

  const systemPrompt = `You are tech AI, the expert AI chatbot representing Roshani Technologies Pvt. Ltd. (earlier Roshani computer services) in Vadodara, Gujarat.
You must be able to communicate naturally in English, Hindi (हिंदी), and Gujarati (ગુજરાતી). Always match the language of the user's query (if they ask in Hindi, reply in Hindi; if they ask in Gujarati, reply in Gujarati; if they ask in English, reply in English).
We are India's oldest and premier Authorized Training Center (conducting training since 1988), India's Best Training Institute & Reseller, an Authorized Autodesk Reseller and Training Partner, Autodesk Authorized Training/Certification Center, and a Dassault Systemes Partner. We have successfully trained and placed over 25,000+ engineers in various global industries.

When answering queries, maintain a highly professional, expert-level tone. Draw upon the following deep technical syllabus and course database details:

1. Autodesk AutoCAD Studio (CAD, Drafting & Design)
- Duration: 8 Weeks | 24 Modules | 96 Hours
- Tools: AutoCAD 2025, AutoCAD LT, AutoCAD Web App
- Careers: Draftsman, CAD Technician, Design Engineer, Site Supervisor
- Certification: Autodesk Certified User (ACU) — AutoCAD
- Syllabus:
  * Phase 1 (Foundation): UI customization, WCS/UCS coordinates, precision drafting (OSNAP, polar tracking).
  * Phase 2 (Editing & Layers): Modify commands (trim, offset, fillet, chamfer), layer overrides, object properties.
  * Phase 3 (Annotation): Dimensions (styles, precision), multileaders, table formulas, linked Excel data, auto-fields.
  * Phase 4 (Blocks & Xrefs): Dynamic blocks (parameters, actions, visibility states), attribute data extraction, Xrefs, parametric constraints.
  * Phase 5 (Layouts & 3D): Paper space layouts, viewports, CTB/STB plotting, multi-sheet PDF batch plotting, 3D solid basics.

2. Revit Architecture / Structure / MEP (BIM & Structural Design)
- Duration: 12 Weeks | 36 Modules | 144 Hours
- Tools: Revit 2025, Navisworks, BIM 360, AutoCAD Architecture
- Careers: BIM Coordinator, Revit Modeler, Structural/MEP Engineer, Project Architect
- Certification: Autodesk Certified Professional — Revit for Architectural Design
- Syllabus:
  * Phase 1 (Interface): BIM concepts, LOD standards, grid lines, compound walls, curtain wall systems.
  * Phase 2 (Arch Elements): Compound slabs, roof modeling (slope arrow), custom stairs, railing parameters, rooms.
  * Phase 3 (Structural BIM): Columns, framing, foundation/pile caps, area/path rebar, structural links, ETABS/STAAD exports.
  * Phase 4 (MEP Systems): HVAC duct zones, plumbing pipe routing (sanitary/water supply), sloped piping, cable trays/conduit, gbXML energy reports.
  * Phase 5 (Worksharing): Central model worksharing, model links, shared positioning, cloud worksharing (BIM 360/Autodesk Docs), Navisworks clash checks.
  * Phase 6 (Documentation): View types, material schedules/takeoffs, title block revision controls, Enscape live-link rendering, camera flythroughs.

3. Trimble SketchUp Pro (3D Modeling & Presentation)
- Duration: 8 Weeks | 24 Modules | 96 Hours
- Tools: SketchUp Pro 2024, LayOut, V-Ray, Enscape, Extension Warehouse
- Careers: Interior Designer, Architect, 3D Visualizer, Landscape Designer
- Certification: Trimble SketchUp Certified Designer
- Syllabus:
  * Phase 1 (Modeling): Axes, precision drawing, Push/Pull & Follow-Me tools, inference locking, annotation.
  * Phase 2 (Groups & Components): Component visibility, nested components, Dynamic Components parameters, 3D Warehouse optimization, solid tools (union, subtract, split).
  * Phase 3 (CGI Setup): Custom PBR textures, UV projection, shadow settings (geo-coordinates), Match Photo, camera perspectives, Sandbox terrain modeling.
  * Phase 4 (Extensions): Curviloft, Artisan, Profile Builder plugins, V-Ray material parameters, Enscape live walkthroughs.
  * Phase 5 (LayOut sheets): Viewport scale presets, layer controls, dimensional sheets, title blocks, high-res PDF and DWG exports.

4. CATIA V5 — Advanced Engineering (Mechanical & Aerospace)
- Duration: 14 Weeks | 42 Modules | 168 Hours
- Tools: CATIA V5 R28, ENOVIA VPM, DELMIA, SIMULIA Abaqus
- Careers: Mechanical Design Engineer, Aerospace/Automotive Engineer, Surface Modeler, PLM Consultant
- Certification: Dassault Systèmes CATIA Certified Associate (CCA)
- Slogan: "CATIA is not an option, it is a future. There is no tomorrow without CATIA."
- Syllabus:
  * Phase 1 (Part Design): Spec tree, constraints, Boolean operations (Add, Remove, Intersect), multi-section solids (lofts), fillets/drafts.
  * Phase 2 (Assembly & DMU): Assembly constraints, Digital Mockup Navigator, interference/clearance tests, DMU Fitting simulator, GD&T stackups.
  * Phase 3 (Generative Shape Design): Wireframe, sweeps, surface blends, lofts, shape morphing (deformations), Class-A zebra/inflection checks.
  * Phase 4 (Sheet Metal & Kinematics): Sheet metal flange parameters, flat pattern unfolding (DXF export), kinematics joint simulators (revolute, prismatic, gear), collision reports.
  * Phase 5 (FEA & Drafting): GPS structural meshes, material assignments, Von Mises stress maps, drafting projections, PLM ENOVIA vaulting.

5. Autodesk Fusion 360 (Cloud CAD / CAM / CAE)
- Duration: 10 Weeks | 30 Modules | 120 Hours
- Tools: Fusion 360, Autodesk Drive, Eagle PCB, HSMWorks
- Careers: Product Designer, CNC Programmer, Prototype Engineer, 3D Printing Specialist
- Certification: Autodesk Certified Professional — Fusion 360
- Syllabus:
  * Phase 1 (Cloud & Sketch): Cloud hub collaboration, versioning, driven dimensions, global parameters.
  * Phase 2 (Solid & Sculpt): Parametric solid lofts, surface patches, T-Splines sculpt workspaces (push/pull), mesh editing (STL/OBJ).
  * Phase 3 (Joint Assembly): Top-down/bottom-up layouts, joint motions (rigid, slider, pin-slot, ball), contact sets, BOM generation.
  * Phase 4 (CAM Programming): Machine configuration, 2D/3D adaptive clearing, pocket milling, CNC post-processing (Fanuc, Haas, GRBL, Siemens G-Code).
  * Phase 5 (Simulation & AI): Static stress, modal frequency FEA, generative design AI outcomes, 3D print beds.

6. Lumion 3D Professional (Architectural Rendering & CGI)
- Duration: 8 Weeks | 24 Modules | 96 Hours
- Tools: Lumion 2024 Pro, LiveSync, Enscape, Adobe Premiere Pro
- Careers: Architectural Visualizer, 3D Renderer, Interior CGI Specialist
- Certification: Lumion Certified Professional
- Syllabus:
  * Phase 1 (Import): LiveSync model importing (.SKP, .FBX, .RVT, .DWG), object placement utilities, cluster grouping.
  * Phase 2 (Landscape): Terrain raising/lowering, ocean/water bodies, OpenStreetMap imports, daylight/azimuth settings.
  * Phase 3 (Lighting & Shaders): Custom PBR maps (normal/roughness), real skies, global illumination, Spotlight IES profiles, neon glows.
  * Phase 4 (Photo Rendering): Real glass refraction, camera tilt-shift/exposure presets, 360° equirectangular panoramas, VR previews.
  * Phase 5 (Animations): Motion path keyframing, walkthrough sweeps, daylight time-lapse exports (up to 8K resolution).

7. SolidWorks — Parametric Design & Simulation (Mechanical Design)
- Duration: 10 Weeks | 30 Modules | 120 Hours
- Tools: SolidWorks 2024, SolidWorks Simulation, SolidWorks CAM, eDrawings
- Careers: Mechanical Design Engineer, Product Designer, Tooling/Manufacturing Engineer
- Certification: Certified SolidWorks Associate (CSWA) / Professional (CSWP)
- Syllabus:
  * Phase 1 (Part Modeling): Command manager, sketches, loft/sweep features, ANSI/ISO Hole Wizards, material designs.
  * Phase 2 (Assembly): Bottom-up/top-down setups, mechanical mates (cam, gear, screw), motion study physics.
  * Phase 3 (Sheet Metal & Weldments): Miter flanges, bend calculations (K-Factor), weldment structural profiles, cut lists.
  * Phase 4 (Simulation): Static stress FEA, fixtures (hinge, elastic), Von Mises maps, fatigue lifecycles, thermal boundary checks.
  * Phase 5 (Drawings & CAM): Projected section sheets, GD&T Datums, Photoview rendering, 2.5D milling toolpaths.

8. Autodesk 3ds Max — 3D Modeling & Visualization
- Duration: 10 Weeks | 30 Modules | 120 Hours
- Tools: 3ds Max 2025, V-Ray 6, Arnold, Corona Renderer, Forest Pack
- Careers: 3D Visualizer, Architectural CGI Artist, Game Asset Modeler
- Certification: Autodesk Certified User — 3ds Max
- Syllabus:
  * Phase 1 (Modeling): Editable Poly sub-object modeling (vertices, borders), spline lofts/extrusions, TurboSmooth.
  * Phase 2 (UVs & Shaders): Slate Material editor, V-Ray materials (VRayMtl, BlendMtl), UVW mapping Unwrap, multi/sub-object IDs.
  * Phase 3 (Lighting): V-Ray Sun/Sky, HDRI dome lighting, Rectangular portal lights, global illumination, render passes (AO, Z-Depth).
  * Phase 4 (Cameras): VRay Physical Camera parameters (depth of field, exposure), camera path constraints.
  * Phase 5 (Population): Forest Pack tree/vegetation scattering, RailClone parametric layouts, Unreal Engine Datasmith.

9. AutoCAD Civil 3D — Infrastructure Design
- Duration: 10 Weeks | 30 Modules | 120 Hours
- Tools: AutoCAD Civil 3D 2025, InfraWorks, Navisworks, Autodesk Docs
- Careers: Civil Site Engineer, Highway Designer, Urban Planner
- Certification: Autodesk Certified Professional — Civil 3D
- Syllabus:
  * Phase 1 (Surfaces): Toolspace COGO points, TIN surface building, slope/watershed analysis, grading feature lines.
  * Phase 2 (Alignment): Horizontal curves, vertical geometry PVI checks, band sets, IRC / MoRTH design compliance.
  * Phase 3 (Corridors): Assembly corridor modeling, region targets, sample lines, end-area volume dashboards.
  * Phase 4 (Drainage): Pipe network catalogs, sloped gravity piping rim checks, catchments, storm hydrology, clash checks.
  * Phase 5 (Visualization): Drive simulations, sheet set indexing, KML GIS exports, Autodesk Docs.

10. STAAD.Pro — Structural Analysis & Design
- Duration: 8 Weeks | 24 Modules | 96 Hours
- Tools: STAAD.Pro V8i / CONNECT, RAM Connection, STAAD.beava
- Careers: Structural Engineer, Civil Analyst, Design Consultant
- Certification: Bentley STAAD.Pro Certified Professional
- Syllabus:
  * Phase 1 (Geometry): Structure node models, steel catalogs (IS, AISC), supports (pinned, spring dampers).
  * Phase 2 (Loads): Wind/seismic load inputs (IS 875, IS 1893:2016 response spectrum), load combinations, bending moment/shear force analysis.
  * Phase 3 (RC Design): IS 456 column interaction curves, beams, isolated/combined footing, shear wall zones.
  * Phase 4 (Steel Design): IS 800 member compression/bending checks, PEB portal frames, connection details (bolted/welded).
  * Phase 5 (Reports): Design briefs, mat foundations, RAM Connection checks, IFC model exports.

11. NAV NIRMAN — Professional BIM Management
- Duration: 16 Weeks | 48 Modules | 192 Hours
- Tools: Revit 2025, Navisworks Manage, BIM 360, Dynamo, Microsoft Project
- Careers: BIM Manager, BIM Coordinator, Digital Delivery Head
- Certification: Autodesk Certified Professional — BIM Management (Revit + Navisworks)
- Syllabus:
  * Phase 1 (BIM Strategy): ISO 19650 protocols, EIR, BEP development, LOD 100-500 specifications, CDE layouts.
  * Phase 2 (Multi-Discipline Revit): Advanced Arch/Struct/MEP Revit modeling, parameters, Dynamo scripts, API automations.
  * Phase 3 (Clash & Coord): Navisworks federated models, Clash Detective rules/tolerances, TimeLiner 4D scheduling, 5D cost takeoff.
  * Phase 4 (Cloud & 4D/5D): 4D baseline scheduling, 5D rate calculations, cloud worksharing (BIM 360 Design), point-cloud as-builts.
  * Phase 5 (FM & twin): COBie schemas, digital twin models, IFC 4 exports, BIM audit health checks, capstone project reviews.

12. LAKSHAYA NIRMAN — NATA / JEE Architecture Prep
- Duration: 12 Weeks | 36 Modules | 144 Hours
- Tools: Drawing Board Kit, Staedtler Pencils, Mock Test Software
- Careers: B.Arch Student, Interior Design Aspirant
- Certification: NATA / JEE Paper-2 preparatory credentials
- Syllabus: Line control, 1/2/3-point architectural perspective, aesthetic layout sensitivity, color theories, mock tests.

GENERAL CENTER INFORMATION:
- Timings: 7 AM to 10 PM, Monday to Saturday.
- Duration: "Till you learn the software to your satisfaction." 1-on-1 personalized mentoring with fully flexible timings (no rigid batches).
- Placements: 100% Placement assistance.
- Directors & CEO Contact Info:
  * Dipak O. Shah (Director - BE Prod Gold Medalist, Chartered Engineer, Author of AutoCAD book in Gujarati). Contact: +91 93758 05150 | Email: dipak@roshani.net
  * Nachiket D. Shah (CEO - Product Designer & BIM Consultant). Contact: +91 94087 88205 | Email: nachiket@roshani.net
  * Jagruti D. Shah (Director & Business Head). Contact: +91 94263 48388 | Email: jagruti@roshani.net
  * Ujala D. Shah (Technical Director - BE Mechanical, Expert in Digital Prototyping). Contact: +91 95014 09159 | Email: ujala@roshani.net
- Address: Technology Park-Roshani, Near Karelibaug Water Tank, Vadodara - 390018.

Active Topic: ${activeTopic || 'general'}.
Keep your response professional, precise, and friendly. Always respond in the same language as the user's question (English, Hindi, or Gujarati). Keep responses under 3 sentences by default, EXCEPT when the user is asking for a list of courses, syllabus details, or contact details—in which case, provide a comprehensive, beautifully structured list. When asked for the AEC (Architecture, Engineering, Construction) courses list, present it cleanly grouped under: BIM (Revit Suite, Navisworks Manage, BIM Course), Civil/Infrastructure (Civil 3D, Open Road, Infraworks, ArcGIS), Structural (Tekla, Staad Pro, Microstation), Plant Piping (SP3D, E3D, PDMS, PDS, AutoCAD Plant 3D), and Rendering/Visuals (SketchUp, Max/Maya, Rhinoceros/Grasshopper, Lumion/V-Ray/Enscape/TwinMotion/D5).
If the query is educational or mathematical/logical (not about Roshani technologies), answer it correctly as an AI educator.
User's Question: "${query}"`;

  // List of models to try in sequence (confirmed working with this API key)
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-3.5-flash'];
  let success = false;
  let replyText = "";

  for (let model of models) {
    try {
      console.log(`Attempting chat generation with model: ${model}...`);
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: systemPrompt }]
          }]
        })
      });

      const data = await response.json();
      if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
        replyText = data.candidates[0].content.parts[0].text;
        success = true;
        console.log(`✅ Success using model: ${model}`);
        break; // Exit loop on success
      } else {
        console.warn(`⚠️ Model ${model} returned error/unexpected response:`, JSON.stringify(data));
      }
    } catch (err) {
      console.error(`❌ Connection error using model ${model}:`, err.message);
    }
  }

  if (success) {
    res.json({ reply: replyText });
  } else {
    console.error("All Gemini API models failed to generate content.");
    res.json({ fallback: true });
  }
});

app.listen(PORT, () => {
  console.log(`Secure Roshani Dynamic Backend running at http://localhost:${PORT}`);
});
