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
