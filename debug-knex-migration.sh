#!/bin/bash

echo "🔧 Debug Knex Migration Issue"
echo "============================="

cd backend

echo ""
echo "🔍 Step 1: Check Environment Variables"
echo "======================================"

# Load .env file
if [ -f ".env" ]; then
    echo "✅ .env file found"
    echo "📋 Environment variables:"
    export $(cat .env | grep -v '^#' | xargs)
    echo "  DB_HOST_DEV: $DB_HOST_DEV"
    echo "  DB_PORT_DEV: $DB_PORT_DEV"
    echo "  DB_USER_DEV: $DB_USER_DEV"
    echo "  DB_NAME_DEV: $DB_NAME_DEV"
    echo "  DATABASE_URL: $DATABASE_URL"
else
    echo "❌ .env file not found"
    echo "📝 Creating .env file..."
    
    cat > .env << 'EOF'
# Database Configuration
DB_HOST_DEV=localhost
DB_PORT_DEV=9541
DB_USER_DEV=msiserver
DB_PASS_DEV=Rubysa179596!
DB_NAME_DEV=taskme

# Application Configuration
NODE_ENV=development
PORT=9561
JWT_SECRET=OXxlwlSwrNBWn1QXFDN11qVACOys25JlhuGyF0p1f947QRG1goD2JhNqUY3LVyUrEGmiIw
CORS_ORIGIN=http://localhost:9562

# Database URL (constructed from above)
DATABASE_URL=postgresql://msiserver:Rubysa179596!@localhost:9541/taskme
EOF
    
    export $(cat .env | grep -v '^#' | xargs)
    echo "✅ .env file created"
fi

echo ""
echo "🔍 Step 2: Check Database Connection"
echo "===================================="

echo "📊 Testing database connection..."
psql -h ${DB_HOST_DEV} -p ${DB_PORT_DEV} -U ${DB_USER_DEV} -d ${DB_NAME_DEV} -c "SELECT version();" || {
    echo "❌ Database connection failed"
    echo "Please check your database configuration"
    exit 1
}

echo "✅ Database connection successful"

echo ""
echo "🔍 Step 3: Check Knex Installation"
echo "=================================="

echo "📦 Checking Knex installation..."
if npm list knex > /dev/null 2>&1; then
    echo "✅ Knex is installed"
    npm list knex
else
    echo "❌ Knex not installed, installing..."
    npm install knex pg
fi

echo ""
echo "🔍 Step 4: Check knexfile.js"
echo "============================"

if [ -f "knexfile.js" ]; then
    echo "✅ knexfile.js found"
    echo "📋 knexfile.js content:"
    cat knexfile.js
else
    echo "❌ knexfile.js not found, creating..."
    
    cat > knexfile.js << 'EOF'
require('dotenv').config();

module.exports = {
  development: {
    client: 'postgresql',
    connection: {
      host: process.env.DB_HOST_DEV || 'localhost',
      port: process.env.DB_PORT_DEV || 5432,
      user: process.env.DB_USER_DEV || 'postgres',
      password: process.env.DB_PASS_DEV || '',
      database: process.env.DB_NAME_DEV || 'taskme'
    },
    migrations: {
      directory: './database/migrations'
    },
    seeds: {
      directory: './database/seeds'
    }
  },

  production: {
    client: 'postgresql',
    connection: process.env.DATABASE_URL || {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'taskme'
    },
    migrations: {
      directory: './database/migrations'
    },
    seeds: {
      directory: './database/seeds'
    }
  }
};
EOF
    
    echo "✅ knexfile.js created"
fi

echo ""
echo "🔍 Step 5: Check Migration Directory"
echo "===================================="

if [ -d "database/migrations" ]; then
    echo "✅ migrations directory found"
    echo "📋 Migration files:"
    ls -la database/migrations/
else
    echo "❌ migrations directory not found, creating..."
    mkdir -p database/migrations
    echo "✅ migrations directory created"
fi

echo ""
echo "🔍 Step 6: Check Package.json Scripts"
echo "======================================"

echo "📋 Current package.json scripts:"
npm run --silent 2>/dev/null || echo "No scripts found"

echo ""
echo "🔍 Step 7: Test Knex Connection"
echo "==============================="

echo "📊 Testing Knex connection..."
node -e "
const knex = require('knex');
const config = require('./knexfile.js');
const db = knex(config.development);

db.raw('SELECT version()')
  .then(res => {
    console.log('✅ Knex connection successful');
    console.log('📊 PostgreSQL version:', res.rows[0].version);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Knex connection failed:', err.message);
    process.exit(1);
  });
"

if [ $? -eq 0 ]; then
    echo "✅ Knex connection test passed"
else
    echo "❌ Knex connection test failed"
    echo "Please check your database configuration"
    exit 1
fi

echo ""
echo "🔍 Step 8: Try Migration with Verbose Output"
echo "============================================"

echo "📊 Running migration with verbose output..."
NODE_ENV=development npx knex migrate:latest --verbose

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully"
else
    echo "❌ Migration failed"
    echo ""
    echo "🔍 Common Issues and Solutions:"
    echo "1. Check if database exists"
    echo "2. Check if user has proper permissions"
    echo "3. Check if tables already exist"
    echo "4. Check migration files syntax"
fi

echo ""
echo "🔍 Step 9: Check Migration Status"
echo "=================================="

echo "📊 Checking migration status..."
npx knex migrate:status

cd ..

echo ""
echo "✨ Debug completed!"
echo ""
echo "🔧 If migration still fails, try:"
echo "  1. Check database permissions"
echo "  2. Check if tables already exist"
echo "  3. Check migration file syntax"
echo "  4. Try: npx knex migrate:rollback --all"
echo "  5. Then: npx knex migrate:latest"
