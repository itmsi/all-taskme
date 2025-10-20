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
