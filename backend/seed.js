#!/usr/bin/env node

/**
 * Database Seeder Script
 * 
 * This script populates the database with dummy data for testing and development.
 * 
 * Usage:
 *   node seed.js
 *   npm run seed
 */

require('dotenv').config();
const { seedDatabase } = require('./src/database/seeders');

console.log('🌱 TaskMe Database Seeder');
console.log('==========================');

seedDatabase()
  .then(() => {
    console.log('\n🎉 Seeding completed successfully!');
    console.log('You can now test the application with dummy data.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Seeding failed:', error.message);
    process.exit(1);
  });
