#!/bin/bash

echo "🔧 Setup Knex Migration & Seeder"
echo "================================="

cd backend

echo ""
echo "🔍 Step 1: Install Knex"
echo "======================"

echo "📦 Installing Knex and PostgreSQL driver..."
npm install knex pg

echo ""
echo "🔍 Step 2: Create Knex Configuration"
echo "==================================="

# Create knexfile.js
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

echo ""
echo "🔍 Step 3: Create Directories"
echo "============================="

# Create directories
mkdir -p database/migrations
mkdir -p database/seeds

echo "✅ Directories created"

echo ""
echo "🔍 Step 4: Create Migration Files"
echo "================================="

# Create initial migration
cat > database/migrations/001_initial_schema.js << 'EOF'
exports.up = function(knex) {
  return knex.schema
    // Enable UUID extension
    .raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    // Users table
    .createTable('users', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('username', 50).unique().notNullable();
      table.string('email', 100).unique().notNullable();
      table.string('password_hash', 255).notNullable();
      table.string('full_name', 100).notNullable();
      table.string('avatar_url', 255);
      table.enum('role', ['admin', 'user']).defaultTo('user');
      table.boolean('is_active').defaultTo(true);
      table.timestamps(true, true);
    })
    
    // Teams table
    .createTable('teams', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name', 100).notNullable();
      table.text('description');
      table.uuid('leader_id').references('id').inTable('users').onDelete('CASCADE');
      table.timestamps(true, true);
    })
    
    // Team members table
    .createTable('team_members', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('team_id').references('id').inTable('teams').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.enum('role', ['leader', 'member', 'viewer']).defaultTo('member');
      table.timestamp('joined_at').defaultTo(knex.fn.now());
      table.unique(['team_id', 'user_id']);
    })
    
    // Projects table
    .createTable('projects', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name', 100).notNullable();
      table.text('description');
      table.enum('status', ['active', 'completed', 'on_hold', 'cancelled']).defaultTo('active');
      table.date('start_date');
      table.date('end_date');
      table.integer('progress').defaultTo(0).checkBetween([0, 100]);
      table.uuid('team_id').references('id').inTable('teams').onDelete('CASCADE');
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamps(true, true);
    })
    
    // Project collaborators table
    .createTable('project_collaborators', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.enum('role', ['owner', 'collaborator', 'viewer']).defaultTo('collaborator');
      table.timestamp('added_at').defaultTo(knex.fn.now());
      table.unique(['project_id', 'user_id']);
    })
    
    // Task statuses table
    .createTable('task_statuses', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('name', 50).notNullable();
      table.string('color', 7).defaultTo('#6B7280');
      table.integer('position').defaultTo(0);
      table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
      table.boolean('is_default').defaultTo(false);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.unique(['name', 'project_id']);
    })
    
    // Tasks table
    .createTable('tasks', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('title', 200).notNullable();
      table.text('description');
      table.uuid('status_id').references('id').inTable('task_statuses').onDelete('SET NULL');
      table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
      table.timestamp('due_date');
      table.integer('estimated_hours');
      table.integer('actual_hours').defaultTo(0);
      table.uuid('project_id').references('id').inTable('projects').onDelete('CASCADE');
      table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
      table.string('location_name', 255);
      table.decimal('location_latitude', 10, 8);
      table.decimal('location_longitude', 11, 8);
      table.text('location_address');
      table.timestamps(true, true);
    })
    
    // Task members table
    .createTable('task_members', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.timestamp('assigned_at').defaultTo(knex.fn.now());
      table.unique(['task_id', 'user_id']);
    })
    
    // Task attachments table
    .createTable('task_attachments', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE');
      table.string('filename', 255).notNullable();
      table.string('original_name', 255).notNullable();
      table.string('file_path', 500).notNullable();
      table.integer('file_size').notNullable();
      table.string('mime_type', 100).notNullable();
      table.uuid('uploaded_by').references('id').inTable('users').onDelete('SET NULL');
      table.timestamp('uploaded_at').defaultTo(knex.fn.now());
    })
    
    // Task comments table
    .createTable('task_comments', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE');
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.text('message').notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    
    // Notifications table
    .createTable('notifications', table => {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
      table.string('title', 200).notNullable();
      table.text('message').notNullable();
      table.string('type', 50).notNullable();
      table.boolean('is_read').defaultTo(false);
      table.uuid('related_id');
      table.string('related_type', 50);
      table.timestamp('created_at').defaultTo(knex.fn.now());
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('notifications')
    .dropTableIfExists('task_comments')
    .dropTableIfExists('task_attachments')
    .dropTableIfExists('task_members')
    .dropTableIfExists('tasks')
    .dropTableIfExists('task_statuses')
    .dropTableIfExists('project_collaborators')
    .dropTableIfExists('projects')
    .dropTableIfExists('team_members')
    .dropTableIfExists('teams')
    .dropTableIfExists('users');
};
EOF

# Create task extensions migration
cat > database/migrations/002_task_extensions.js << 'EOF'
exports.up = function(knex) {
  return knex.schema.createTable('task_extensions', table => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('task_id').references('id').inTable('tasks').onDelete('CASCADE');
    table.string('number_phone', 20);
    table.string('sales_name', 100);
    table.string('name_pt', 200);
    table.string('iup', 100);
    table.decimal('latitude', 10, 8);
    table.decimal('longitude', 11, 8);
    table.text('photo_link');
    table.integer('count_photo').defaultTo(0);
    table.text('voice_link');
    table.integer('count_voice').defaultTo(0);
    table.text('voice_transcript');
    table.boolean('is_completed').defaultTo(false);
    table.timestamps(true, true);
    table.unique('task_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('task_extensions');
};
EOF

echo "✅ Migration files created"

echo ""
echo "🔍 Step 5: Create Seed Files"
echo "============================"

# Create users seed
cat > database/seeds/01_users.js << 'EOF'
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  // Inserts seed entries
  return knex('users').insert([
    {
      id: knex.raw('uuid_generate_v4()'),
      username: 'admin',
      email: 'admin@taskme.com',
      password_hash: '$2b$10$rQZ8K9vXvYzA1B2C3D4E5e6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7',
      full_name: 'Admin User',
      role: 'admin',
      is_active: true
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      username: 'john_doe',
      email: 'john@taskme.com',
      password_hash: '$2b$10$rQZ8K9vXvYzA1B2C3D4E5e6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7',
      full_name: 'John Doe',
      role: 'user',
      is_active: true
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      username: 'jane_smith',
      email: 'jane@taskme.com',
      password_hash: '$2b$10$rQZ8K9vXvYzA1B2C3D4E5e6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7',
      full_name: 'Jane Smith',
      role: 'user',
      is_active: true
    }
  ]);
};
EOF

# Create teams seed
cat > database/seeds/02_teams.js << 'EOF'
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('teams').del();
  
  // Get user IDs
  const users = await knex('users').select('id', 'username');
  const admin = users.find(u => u.username === 'admin');
  const john = users.find(u => u.username === 'john_doe');
  
  // Inserts seed entries
  return knex('teams').insert([
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Development Team',
      description: 'Main development team for TaskMe project',
      leader_id: admin.id
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Marketing Team',
      description: 'Marketing and promotion team',
      leader_id: john.id
    }
  ]);
};
EOF

# Create projects seed
cat > database/seeds/03_projects.js << 'EOF'
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('projects').del();
  
  // Get team IDs
  const teams = await knex('teams').select('id', 'name');
  const devTeam = teams.find(t => t.name === 'Development Team');
  const marketingTeam = teams.find(t => t.name === 'Marketing Team');
  
  // Get user IDs
  const users = await knex('users').select('id', 'username');
  const admin = users.find(u => u.username === 'admin');
  
  // Inserts seed entries
  return knex('projects').insert([
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'TaskMe Web Application',
      description: 'Main web application for task management',
      status: 'active',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      progress: 75,
      team_id: devTeam.id,
      created_by: admin.id
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Marketing Campaign 2024',
      description: 'Marketing campaign for TaskMe product launch',
      status: 'active',
      start_date: '2024-06-01',
      end_date: '2024-12-31',
      progress: 30,
      team_id: marketingTeam.id,
      created_by: admin.id
    }
  ]);
};
EOF

# Create task statuses seed
cat > database/seeds/04_task_statuses.js << 'EOF'
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('task_statuses').del();
  
  // Get project IDs
  const projects = await knex('projects').select('id', 'name');
  
  // Insert default statuses for each project
  const statuses = [];
  projects.forEach(project => {
    statuses.push(
      {
        id: knex.raw('uuid_generate_v4()'),
        name: 'To Do',
        color: '#6B7280',
        position: 0,
        project_id: project.id,
        is_default: true
      },
      {
        id: knex.raw('uuid_generate_v4()'),
        name: 'In Progress',
        color: '#3B82F6',
        position: 1,
        project_id: project.id,
        is_default: true
      },
      {
        id: knex.raw('uuid_generate_v4()'),
        name: 'Review',
        color: '#F59E0B',
        position: 2,
        project_id: project.id,
        is_default: true
      },
      {
        id: knex.raw('uuid_generate_v4()'),
        name: 'Done',
        color: '#10B981',
        position: 3,
        project_id: project.id,
        is_default: true
      }
    );
  });
  
  return knex('task_statuses').insert(statuses);
};
EOF

# Create tasks seed
cat > database/seeds/05_tasks.js << 'EOF'
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('tasks').del();
  
  // Get project and status IDs
  const projects = await knex('projects').select('id', 'name');
  const devProject = projects.find(p => p.name === 'TaskMe Web Application');
  const marketingProject = projects.find(p => p.name === 'Marketing Campaign 2024');
  
  const statuses = await knex('task_statuses').select('id', 'name', 'project_id');
  const devToDo = statuses.find(s => s.name === 'To Do' && s.project_id === devProject.id);
  const devInProgress = statuses.find(s => s.name === 'In Progress' && s.project_id === devProject.id);
  const marketingToDo = statuses.find(s => s.name === 'To Do' && s.project_id === marketingProject.id);
  
  // Get user IDs
  const users = await knex('users').select('id', 'username');
  const admin = users.find(u => u.username === 'admin');
  const john = users.find(u => u.username === 'john_doe');
  
  // Inserts seed entries
  return knex('tasks').insert([
    {
      id: knex.raw('uuid_generate_v4()'),
      title: 'Setup Database Schema',
      description: 'Create and setup the database schema for TaskMe',
      status_id: devInProgress.id,
      priority: 'high',
      due_date: '2024-10-25',
      estimated_hours: 8,
      actual_hours: 6,
      project_id: devProject.id,
      created_by: admin.id,
      location_name: 'Office',
      location_latitude: -6.200000,
      location_longitude: 106.816666
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      title: 'Implement User Authentication',
      description: 'Implement JWT-based authentication system',
      status_id: devToDo.id,
      priority: 'high',
      due_date: '2024-10-30',
      estimated_hours: 12,
      actual_hours: 0,
      project_id: devProject.id,
      created_by: admin.id
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      title: 'Create Marketing Materials',
      description: 'Design and create marketing materials for TaskMe',
      status_id: marketingToDo.id,
      priority: 'medium',
      due_date: '2024-11-15',
      estimated_hours: 16,
      actual_hours: 0,
      project_id: marketingProject.id,
      created_by: john.id
    }
  ]);
};
EOF

echo "✅ Seed files created"

echo ""
echo "🔍 Step 6: Update package.json"
echo "=============================="

# Add knex scripts to package.json
npm pkg set scripts.migrate="knex migrate:latest"
npm pkg set scripts.migrate:rollback="knex migrate:rollback"
npm pkg set scripts.seed="knex seed:run"
npm pkg set scripts.migrate:reset="knex migrate:rollback --all && knex migrate:latest && knex seed:run"

echo "✅ Package.json updated with Knex scripts"

echo ""
echo "🔍 Step 7: Create .env File"
echo "=========================="

# Create .env file if not exists
if [ ! -f ".env" ]; then
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
  echo "✅ .env file created"
else
  echo "✅ .env file already exists"
fi

cd ..

echo ""
echo "✨ Knex setup completed!"
echo ""
echo "🔧 Available Commands:"
echo "  - npm run migrate          # Run all migrations"
echo "  - npm run migrate:rollback # Rollback last migration"
echo "  - npm run seed             # Run all seeds"
echo "  - npm run migrate:reset    # Reset database and reseed"
echo ""
echo "🚀 To get started:"
echo "  1. cd backend"
echo "  2. npm run migrate    # Run migrations"
echo "  3. npm run seed       # Run seeds"
echo ""
echo "📁 Files created:"
echo "  - knexfile.js"
echo "  - database/migrations/"
echo "  - database/seeds/"
echo "  - .env"
