exports.up = async function(knex) {
  // Enable uuid-ossp if not enabled yet (safe to run)
  await knex.raw(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  await knex.schema.createTable('pages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('title', 255).notNullable();
    table.string('slug', 255).notNullable().unique();
    table.uuid('parent_page_id').nullable().references('id').inTable('pages').onDelete('SET NULL');
    table.uuid('workspace_id').nullable();
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index(['parent_page_id']);
    table.index(['workspace_id']);
    table.index(['created_by']);
    table.index(['slug']);
  });

  await knex.schema.createTable('page_blocks', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('page_id').notNullable().references('id').inTable('pages').onDelete('CASCADE');
    table.integer('position').notNullable().defaultTo(0);
    table.enu('type', ['text', 'image', 'todo', 'embed'], { useNative: true, enumName: 'page_block_type' }).notNullable().defaultTo('text');
    table.jsonb('content').notNullable().defaultTo('{}');
    table.uuid('created_by').notNullable();
    table.uuid('updated_by').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.index(['page_id']);
    table.index(['type']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('page_blocks');
  await knex.schema.dropTableIfExists('pages');
  // Drop enum type if created by this migration
  await knex.raw(`DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'page_block_type') THEN DROP TYPE page_block_type; END IF; END $$;`);
};


