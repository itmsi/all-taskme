exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('tasks').del();
  
  // Get project and status IDs
  const projects = await knex('projects').select('id', 'name');
  const devProject = projects.find(p => p.name === 'TaskMe Web Application');
  const marketingProject = projects.find(p => p.name === 'Marketing Campaign 2024');
  const designProject = projects.find(p => p.name === 'UI/UX Redesign');
  
  const statuses = await knex('task_statuses').select('id', 'name', 'project_id');
  const devToDo = statuses.find(s => s.name === 'To Do' && s.project_id === devProject.id);
  const devInProgress = statuses.find(s => s.name === 'In Progress' && s.project_id === devProject.id);
  const devDone = statuses.find(s => s.name === 'Done' && s.project_id === devProject.id);
  const marketingToDo = statuses.find(s => s.name === 'To Do' && s.project_id === marketingProject.id);
  const designInProgress = statuses.find(s => s.name === 'In Progress' && s.project_id === designProject.id);
  
  // Get user IDs
  const users = await knex('users').select('id', 'username');
  const admin = users.find(u => u.username === 'admin');
  const john = users.find(u => u.username === 'john_doe');
  const jane = users.find(u => u.username === 'jane_smith');
  
  // Inserts seed entries
  return knex('tasks').insert([
    {
      id: knex.raw('uuid_generate_v4()'),
      title: 'Setup Database Schema',
      description: 'Create and setup the database schema for TaskMe',
      status_id: devDone.id,
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
      status_id: devInProgress.id,
      priority: 'high',
      due_date: '2024-10-30',
      estimated_hours: 12,
      actual_hours: 8,
      project_id: devProject.id,
      created_by: admin.id
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      title: 'Create API Documentation',
      description: 'Generate comprehensive API documentation',
      status_id: devToDo.id,
      priority: 'medium',
      due_date: '2024-11-05',
      estimated_hours: 6,
      actual_hours: 0,
      project_id: devProject.id,
      created_by: john.id
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
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      title: 'Design New Dashboard',
      description: 'Create modern dashboard design for TaskMe',
      status_id: designInProgress.id,
      priority: 'high',
      due_date: '2024-11-10',
      estimated_hours: 20,
      actual_hours: 12,
      project_id: designProject.id,
      created_by: jane.id,
      location_name: 'Design Studio',
      location_latitude: -6.175110,
      location_longitude: 106.865039
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      title: 'Mobile App Wireframes',
      description: 'Create wireframes for mobile application',
      status_id: designInProgress.id,
      priority: 'medium',
      due_date: '2024-11-20',
      estimated_hours: 14,
      actual_hours: 6,
      project_id: designProject.id,
      created_by: jane.id
    }
  ]);
};
