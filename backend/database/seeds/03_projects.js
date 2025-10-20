exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('projects').del();
  
  // Get team IDs
  const teams = await knex('teams').select('id', 'name');
  const devTeam = teams.find(t => t.name === 'Development Team');
  const marketingTeam = teams.find(t => t.name === 'Marketing Team');
  const designTeam = teams.find(t => t.name === 'Design Team');
  
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
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'UI/UX Redesign',
      description: 'Complete redesign of user interface',
      status: 'active',
      start_date: '2024-08-01',
      end_date: '2024-11-30',
      progress: 50,
      team_id: designTeam.id,
      created_by: admin.id
    }
  ]);
};
