#!/usr/bin/env node

/**
 * Script to fix location columns issue
 * This script will create a simple migration that can be run manually
 */

console.log('🔧 TaskMe Location Columns Fix Script')
console.log('=====================================')
console.log('')
console.log('Since Docker is not running, please follow these steps manually:')
console.log('')
console.log('1. Start your PostgreSQL database server')
console.log('2. Connect to your database using your preferred tool (psql, pgAdmin, etc.)')
console.log('3. Run the following SQL commands:')
console.log('')
console.log('   ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_name VARCHAR(255);')
console.log('   ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8);')
console.log('   ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8);')
console.log('   ALTER TABLE tasks ADD COLUMN IF NOT EXISTS location_address TEXT;')
console.log('')
console.log('4. Restart your backend server')
console.log('')
console.log('Alternatively, you can run this script with the correct database connection:')
console.log('   node fix-location-columns.js --host=localhost --port=5432 --database=your_db --user=your_user --password=your_password')
console.log('')

// Check if command line arguments are provided
const args = process.argv.slice(2)
if (args.length > 0) {
  const { Pool } = require('pg')
  
  // Parse command line arguments
  let config = {
    host: 'localhost',
    port: 5432,
    database: 'taskme_db',
    user: 'postgres',
    password: ''
  }
  
  args.forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=')
      if (key === 'host') config.host = value
      if (key === 'port') config.port = parseInt(value)
      if (key === 'database') config.database = value
      if (key === 'user') config.user = value
      if (key === 'password') config.password = value
    }
  })
  
  const pool = new Pool(config)
  
  async function runMigration() {
    try {
      console.log('🔄 Connecting to database and adding location columns...')
      
      await pool.query(`
        ALTER TABLE tasks 
        ADD COLUMN IF NOT EXISTS location_name VARCHAR(255),
        ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8),
        ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8),
        ADD COLUMN IF NOT EXISTS location_address TEXT;
      `)
      
      console.log('✅ Location columns added successfully!')
      
      // Verify the columns exist
      const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name LIKE 'location_%'
        ORDER BY column_name;
      `)
      
      console.log('📋 Location columns in tasks table:')
      result.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type}`)
      })
      
    } catch (error) {
      console.error('❌ Migration failed:', error.message)
      process.exit(1)
    } finally {
      await pool.end()
    }
  }
  
  runMigration()
}
