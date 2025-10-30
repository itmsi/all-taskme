#!/usr/bin/env node
/*
  Usage:
    node scripts/test-sso-token.js "<JWT_TOKEN>"

  This script will:
    - Load env from backend/.env
    - Print JWT config summary
    - Verify the JWT using JWT_SECRET and JWT_ALGORITHM
    - Try to resolve email from token (direct claim or via dblink employees)
    - Optionally provision/sync a local user from SSO (no DB writes if verification fails)
*/

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { connectDB } = require('../src/database/connection');
const { resolveEmailFromToken, ensureLocalUserFromSso } = require('../src/utils/ssoProvisioning');

const main = async () => {
  const tokenArg = process.argv[2];
  if (!tokenArg) {
    console.error('Token is required. Example:\n  node scripts/test-sso-token.js "<JWT_TOKEN>"');
    process.exit(1);
  }

  // Sanitize and reflect JWT secret
  const rawSecret = process.env.JWT_SECRET || '';
  const cleanedSecret = rawSecret.replace(/^['"]|['"]$/g, '').trim();
  process.env.JWT_SECRET = cleanedSecret;
  const secretHash = cleanedSecret ? crypto.createHash('sha256').update(cleanedSecret).digest('hex').slice(0, 8) : 'none';

  console.log('[Test] JWT alg =', process.env.JWT_ALGORITHM || 'HS256');
  console.log('[Test] JWT secretHash =', secretHash, 'len =', cleanedSecret.length);
  console.log('[Test] DB_GATE_SSO =', `${process.env.DB_GATE_SSO_HOST}:${process.env.DB_GATE_SSO_PORT}`, 'db =', process.env.DB_GATE_SSO_NAME);

  try {
    // Basic decode for visibility
    const decodedHeaderPayload = jwt.decode(tokenArg, { complete: true });
    console.log('[Test] Token header =', decodedHeaderPayload && decodedHeaderPayload.header);
    console.log('[Test] Token claim keys =', decodedHeaderPayload && decodedHeaderPayload.payload ? Object.keys(decodedHeaderPayload.payload) : []);
  } catch (e) {
    console.log('[Test] Pre-verify decode error:', e.message);
  }

  try {
    const verified = jwt.verify(tokenArg, cleanedSecret, {
      algorithms: [process.env.JWT_ALGORITHM || 'HS256']
    });
    console.log('[Test] JWT VERIFY OK. Payload =', verified);
  } catch (e) {
    console.error('[Test] JWT VERIFY ERROR:', e.message);
    process.exit(2);
  }

  try {
    await connectDB();
    const { email } = await resolveEmailFromToken(tokenArg);
    console.log('[Test] Resolved email =', email);
    const user = await ensureLocalUserFromSso(email);
    console.log('[Test] Local user (provisioned/synced) =', {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active
    });
    console.log('[Test] SUCCESS');
    process.exit(0);
  } catch (e) {
    console.error('[Test] ERROR:', e.name, e.message);
    process.exit(3);
  }
};

main();


