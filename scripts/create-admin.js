#!/usr/bin/env node

/**
 * Create Super Admin User Script
 * 
 * This script creates a super admin user for TaskMe system.
 * 
 * Usage:
 *   node create-admin.js
 *   npm run create-admin
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./src/database/connection');

const createAdmin = async () => {
  try {
    console.log('🔐 Creating Super Admin User...');
    console.log('================================');

    // Check if admin already exists
    const existingAdmin = await query(
      'SELECT id, username, email FROM users WHERE role = $1',
      ['admin']
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Admin user already exists:');
      existingAdmin.rows.forEach(admin => {
        console.log(`   👤 ${admin.username} (${admin.email})`);
      });
      console.log('\n🔑 Default admin credentials:');
      console.log('   Email: admin@taskme.com');
      console.log('   Password: admin123');
      return;
    }

    // Create admin user
    const adminData = {
      username: 'admin',
      email: 'admin@taskme.com',
      password: 'admin123',
      full_name: 'Super Administrator'
    };

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Insert admin user
    const result = await query(`
      INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, username, email, full_name, role, is_active, created_at
    `, [
      adminData.username,
      adminData.email,
      hashedPassword,
      adminData.full_name,
      'admin',
      true,
      new Date()
    ]);

    const admin = result.rows[0];

    console.log('✅ Super Admin created successfully!');
    console.log('\n📋 Admin Details:');
    console.log(`   🆔 ID: ${admin.id}`);
    console.log(`   👤 Username: ${admin.username}`);
    console.log(`   📧 Email: ${admin.email}`);
    console.log(`   👨‍💼 Full Name: ${admin.full_name}`);
    console.log(`   🔑 Role: ${admin.role}`);
    console.log(`   ✅ Status: ${admin.is_active ? 'Active' : 'Inactive'}`);
    console.log(`   📅 Created: ${admin.created_at}`);

    console.log('\n🔑 Login Credentials:');
    console.log(`   📧 Email: ${adminData.email}`);
    console.log(`   🔐 Password: ${adminData.password}`);

    console.log('\n🌐 Access URLs:');
    console.log('   🖥️  Frontend: http://localhost:9562');
    console.log('   📚 API Docs: http://localhost:9561/api-docs');

    console.log('\n⚠️  Security Note:');
    console.log('   Please change the default password after first login!');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
};

// Run if this file is executed directly
if (require.main === module) {
  createAdmin()
    .then(() => {
      console.log('\n🎉 Admin creation completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Admin creation failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createAdmin };
