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
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Design Team',
      description: 'UI/UX design team',
      leader_id: admin.id
    }
  ]);
};
