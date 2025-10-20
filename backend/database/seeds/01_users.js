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
