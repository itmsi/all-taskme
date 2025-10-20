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
