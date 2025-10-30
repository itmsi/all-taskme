const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');
const { hashPassword } = require('./password');

// Build dblink connection string from env
const buildGateSsoConnStr = () => {
  const host = process.env.DB_GATE_SSO_HOST;
  const port = process.env.DB_GATE_SSO_PORT || '5432';
  const db = process.env.DB_GATE_SSO_NAME;
  const user = process.env.DB_GATE_SSO_USER;
  const password = process.env.DB_GATE_SSO_PASSWORD;
  return `host=${host} port=${port} dbname=${db} user=${user} password=${password}`;
};

const GATE_SSO_CONN_NAME = 'gate_sso_conn';

const ensureDblinkConnected = async () => {
  const connStr = buildGateSsoConnStr();
  // Check existing connections
  const existing = await query(`SELECT unnest(dblink_get_connections()) AS name`);
  const names = existing.rows.map(r => r.name);
  if (!names.includes(GATE_SSO_CONN_NAME)) {
    console.log(`[SSO] dblink connecting to ${process.env.DB_GATE_SSO_NAME} as ${process.env.DB_GATE_SSO_USER}`);
    await query(`SELECT dblink_connect($1::text, $2::text)`, [GATE_SSO_CONN_NAME, connStr]);
  }
};

// Generic fetch from employees by a specific column
const fetchEmployeeByColumn = async (column, value) => {
  await ensureDblinkConnected();
  const sql = `
    SELECT employee_email, full_name, avatar_url
    FROM dblink($1,
      'SELECT employee_email, employee_name AS full_name, employee_foto AS avatar_url FROM employees WHERE ${column} = ' || quote_literal($2)
    ) AS t(employee_email text, full_name text, avatar_url text)
  `;
  try {
    console.log(`[SSO] Fetch employee by ${column}=${value}`);
    const result = await query(sql, [GATE_SSO_CONN_NAME, value]);
    return result.rows[0] || null;
  } catch (err) {
    console.error('[SSO] dblink fetch error, will reconnect once:', err.message);
    // Try reconnect once on failure
    await query(`SELECT dblink_disconnect($1::text)`, [GATE_SSO_CONN_NAME]).catch(() => {});
    await ensureDblinkConnected();
    const retry = await query(sql, [GATE_SSO_CONN_NAME, value]);
    return retry.rows[0] || null;
  }
};

// Fetch employee by email
const fetchEmployeeByEmail = async (email) => {
  return await fetchEmployeeByColumn('employee_email', email);
};

// Fetch employee by identifier column (e.g., id or employee_id)
const fetchEmployeeByIdentifier = async (identifierValue) => {
  const identifierColumn = process.env.SSO_EMPLOYEE_ID_COLUMN || 'employee_id';
  return await fetchEmployeeByColumn(identifierColumn, identifierValue);
};

// Ensure local user exists and up-to-date for given email
const ensureLocalUserFromSso = async (email) => {
  // Try find local user
  const existing = await query(
    'SELECT id, email, username, full_name, avatar_url, role, is_active FROM users WHERE email = $1',
    [email]
  );
  if (existing.rows.length > 0) {
    const user = existing.rows[0];
    // Optionally refresh profile fields from SSO on each auth
    try {
      const employee = await fetchEmployeeByEmail(email);
      if (employee) {
        const newFullName = employee.full_name || user.full_name;
        const newAvatar = employee.avatar_url || user.avatar_url;
        if (newFullName !== user.full_name || newAvatar !== user.avatar_url) {
          await query(
            'UPDATE users SET full_name = $1, avatar_url = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [newFullName, newAvatar, user.id]
          );
          return {
            ...user,
            full_name: newFullName,
            avatar_url: newAvatar
          };
        }
      }
    } catch (_) {
      // Ignore sync errors; keep current user
    }
    return user;
  }

  // If not exists, fetch from SSO and create
  const employee = await fetchEmployeeByEmail(email);
  const fullName = employee?.full_name || email.split('@')[0];
  const avatarUrl = employee?.avatar_url || null;
  const username = email.split('@')[0];
  const passwordHash = await hashPassword('sso-placeholder');
  const insert = await query(
    `INSERT INTO users (email, username, password_hash, full_name, avatar_url, role, is_active)
     VALUES ($1, $2, $3, $4, $5, 'user', true)
     RETURNING id, email, username, full_name, avatar_url, role, is_active`,
    [email, username, passwordHash, fullName, avatarUrl]
  );
  return insert.rows[0];
};

// Decode SSO JWT and resolve email
// 1) Use claim specified by JWT_EMAIL_CLAIM (default: email)
// 2) Fallback to 'sub'
// 3) Fallback to lookup via employee identifier claim (default: employee_id)
const resolveEmailFromToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET, {
    algorithms: [process.env.JWT_ALGORITHM || 'HS256']
  });

  const emailClaim = process.env.JWT_EMAIL_CLAIM || 'email';
  const directEmail = decoded[emailClaim] || decoded.sub;
  if (directEmail) {
    console.log(`[SSO] Resolved email from token claim '${directEmail === decoded[emailClaim] ? emailClaim : 'sub'}'`);
    return { decoded, email: directEmail };
  }

  const employeeIdClaim = process.env.SSO_EMPLOYEE_ID_CLAIM || 'employee_id';
  const employeeIdentifier = decoded[employeeIdClaim];
  if (employeeIdentifier) {
    console.log(`[SSO] Resolving email via employee identifier claim '${employeeIdClaim}'=${employeeIdentifier}`);
    const emp = await fetchEmployeeByIdentifier(employeeIdentifier);
    if (emp && emp.employee_email) {
      return { decoded, email: emp.employee_email };
    }
    console.warn('[SSO] Employee identifier found in token but not found in gate_sso.employees');
    const notFound = new Error('Employee not found in gate_sso');
    notFound.name = 'EmployeeNotFound';
    throw notFound;
  }

  const err = new Error('Email claim missing in token and could not resolve via employee identifier');
  err.name = 'EmailResolveError';
  throw err;
};

module.exports = {
  fetchEmployeeByEmail,
  fetchEmployeeByIdentifier,
  ensureLocalUserFromSso,
  resolveEmailFromToken
};


