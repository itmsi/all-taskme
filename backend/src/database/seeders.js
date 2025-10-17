const { query } = require('./connection');
const bcrypt = require('bcryptjs');

// Helper function to generate random UUID (for consistency)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Helper function to get random element from array
const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

// Helper function to get random date
const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

// Helper function to get random boolean
const getRandomBoolean = () => Math.random() < 0.5;

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (in correct order due to foreign keys)
    console.log('🧹 Clearing existing data...');
    await query('DELETE FROM task_comments');
    await query('DELETE FROM task_attachments');
    await query('DELETE FROM task_members');
    await query('DELETE FROM notifications');
    await query('DELETE FROM tasks');
    await query('DELETE FROM task_statuses WHERE is_default = false');
    await query('DELETE FROM project_collaborators');
    await query('DELETE FROM projects');
    await query('DELETE FROM team_members');
    await query('DELETE FROM teams');
    await query('DELETE FROM users WHERE role != \'admin\'');

    // Seed Users
    console.log('👥 Seeding users...');
    const users = [];
    const userData = [
      { username: 'john_doe', email: 'john@example.com', full_name: 'John Doe' },
      { username: 'jane_smith', email: 'jane@example.com', full_name: 'Jane Smith' },
      { username: 'mike_johnson', email: 'mike@example.com', full_name: 'Mike Johnson' },
      { username: 'sarah_wilson', email: 'sarah@example.com', full_name: 'Sarah Wilson' },
      { username: 'david_brown', email: 'david@example.com', full_name: 'David Brown' },
      { username: 'lisa_davis', email: 'lisa@example.com', full_name: 'Lisa Davis' },
      { username: 'tom_anderson', email: 'tom@example.com', full_name: 'Tom Anderson' },
      { username: 'emma_taylor', email: 'emma@example.com', full_name: 'Emma Taylor' },
      { username: 'alex_martin', email: 'alex@example.com', full_name: 'Alex Martin' },
      { username: 'sophie_clark', email: 'sophie@example.com', full_name: 'Sophie Clark' }
    ];

    const hashedPassword = await bcrypt.hash('password123', 10);
    
    for (const user of userData) {
      const userId = generateUUID();
      await query(`
        INSERT INTO users (id, username, email, password_hash, full_name, role, is_active, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [userId, user.username, user.email, hashedPassword, user.full_name, 'user', true, new Date()]);
      users.push({ id: userId, ...user });
    }

    // Seed Teams
    console.log('👥 Seeding teams...');
    const teams = [];
    const teamData = [
      { name: 'Development Team', description: 'Frontend and Backend Development' },
      { name: 'Design Team', description: 'UI/UX Design and Graphics' },
      { name: 'Marketing Team', description: 'Digital Marketing and Content' },
      { name: 'QA Team', description: 'Quality Assurance and Testing' },
      { name: 'DevOps Team', description: 'Infrastructure and Deployment' }
    ];

    for (let i = 0; i < teamData.length; i++) {
      const teamId = generateUUID();
      const leaderId = users[i % users.length].id;
      await query(`
        INSERT INTO teams (id, name, description, leader_id, created_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [teamId, teamData[i].name, teamData[i].description, leaderId, new Date()]);
      teams.push({ id: teamId, leader_id: leaderId, ...teamData[i] });
    }

    // Seed Team Members
    console.log('👥 Seeding team members...');
    for (const team of teams) {
      // Add leader as member
      await query(`
        INSERT INTO team_members (id, team_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [generateUUID(), team.id, team.leader_id, 'leader', new Date()]);

      // Add 3-5 random members to each team
      const memberCount = Math.floor(Math.random() * 3) + 3;
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < memberCount && i < shuffledUsers.length; i++) {
        const userId = shuffledUsers[i].id;
        if (userId !== team.leader_id) {
          await query(`
            INSERT INTO team_members (id, team_id, user_id, role, joined_at)
            VALUES ($1, $2, $3, $4, $5)
          `, [generateUUID(), team.id, userId, getRandomElement(['member', 'viewer']), new Date()]);
        }
      }
    }

    // Seed Projects
    console.log('📁 Seeding projects...');
    const projects = [];
    const projectData = [
      { name: 'E-commerce Website', description: 'Build modern e-commerce platform', status: 'active' },
      { name: 'Mobile App Development', description: 'iOS and Android mobile application', status: 'active' },
      { name: 'Company Website Redesign', description: 'Complete website redesign project', status: 'active' },
      { name: 'API Integration', description: 'Third-party API integration project', status: 'active' },
      { name: 'Database Migration', description: 'Migrate to new database system', status: 'on_hold' },
      { name: 'Security Audit', description: 'Comprehensive security assessment', status: 'completed' },
      { name: 'Performance Optimization', description: 'Optimize application performance', status: 'active' },
      { name: 'User Authentication System', description: 'Implement JWT-based authentication', status: 'completed' }
    ];

    for (let i = 0; i < projectData.length; i++) {
      const projectId = generateUUID();
      const team = teams[i % teams.length];
      const creator = users[i % users.length];
      const startDate = getRandomDate(new Date(2024, 0, 1), new Date(2024, 5, 1));
      const endDate = getRandomDate(startDate, new Date(2024, 11, 31));
      const progress = Math.floor(Math.random() * 101);

      await query(`
        INSERT INTO projects (id, name, description, status, start_date, end_date, progress, team_id, created_by, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [projectId, projectData[i].name, projectData[i].description, projectData[i].status, 
          startDate, endDate, progress, team.id, creator.id, new Date()]);
      
      projects.push({ 
        id: projectId, 
        team_id: team.id, 
        created_by: creator.id, 
        ...projectData[i] 
      });
    }

    // Seed Project Collaborators
    console.log('🤝 Seeding project collaborators...');
    for (const project of projects) {
      // Add creator as owner
      await query(`
        INSERT INTO project_collaborators (id, project_id, user_id, role, added_at)
        VALUES ($1, $2, $3, $4, $5)
      `, [generateUUID(), project.id, project.created_by, 'owner', new Date()]);

      // Add 2-4 random collaborators to each project
      const collaboratorCount = Math.floor(Math.random() * 3) + 2;
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < collaboratorCount && i < shuffledUsers.length; i++) {
        const userId = shuffledUsers[i].id;
        if (userId !== project.created_by) {
          await query(`
            INSERT INTO project_collaborators (id, project_id, user_id, role, added_at)
            VALUES ($1, $2, $3, $4, $5)
          `, [generateUUID(), project.id, userId, getRandomElement(['collaborator', 'viewer']), new Date()]);
        }
      }
    }

    // Seed Task Statuses (custom ones for each project)
    console.log('📊 Seeding task statuses...');
    const customStatuses = [
      { name: 'Planning', color: '#8B5CF6', position: 0 },
      { name: 'In Development', color: '#3B82F6', position: 1 },
      { name: 'Code Review', color: '#F59E0B', position: 2 },
      { name: 'Testing', color: '#EF4444', position: 3 },
      { name: 'Deployed', color: '#10B981', position: 4 }
    ];

    for (const project of projects) {
      for (const status of customStatuses) {
        await query(`
          INSERT INTO task_statuses (id, name, color, position, project_id, is_default, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [generateUUID(), status.name, status.color, status.position, project.id, false, new Date()]);
      }
    }

    // Get all task statuses (including default ones)
    const allStatuses = await query('SELECT id, name, project_id FROM task_statuses ORDER BY position');

    // Seed Tasks
    console.log('📝 Seeding tasks...');
    const tasks = [];
    const taskTemplates = [
      { title: 'Setup development environment', priority: 'high' },
      { title: 'Design user interface mockups', priority: 'medium' },
      { title: 'Implement user authentication', priority: 'high' },
      { title: 'Create database schema', priority: 'urgent' },
      { title: 'Write unit tests', priority: 'medium' },
      { title: 'Setup CI/CD pipeline', priority: 'high' },
      { title: 'Implement API endpoints', priority: 'medium' },
      { title: 'Create documentation', priority: 'low' },
      { title: 'Performance testing', priority: 'medium' },
      { title: 'Security audit', priority: 'high' },
      { title: 'Bug fixes and optimization', priority: 'medium' },
      { title: 'Deploy to production', priority: 'urgent' },
      { title: 'User acceptance testing', priority: 'medium' },
      { title: 'Code review and refactoring', priority: 'low' },
      { title: 'Setup monitoring and logging', priority: 'medium' }
    ];

    for (const project of projects) {
      const taskCount = Math.floor(Math.random() * 8) + 5; // 5-12 tasks per project
      const projectStatuses = allStatuses.rows.filter(s => s.project_id === project.id || s.project_id === null);
      
      for (let i = 0; i < taskCount; i++) {
        const taskId = generateUUID();
        const template = taskTemplates[i % taskTemplates.length];
        const status = getRandomElement(projectStatuses);
        const creator = users[Math.floor(Math.random() * users.length)];
        const dueDate = getRandomDate(new Date(), new Date(2024, 11, 31));
        const estimatedHours = Math.floor(Math.random() * 20) + 2; // 2-22 hours
        const actualHours = Math.floor(Math.random() * estimatedHours * 1.5);

        await query(`
          INSERT INTO tasks (id, title, description, status_id, priority, due_date, estimated_hours, actual_hours, project_id, created_by, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        `, [taskId, template.title, `Description for ${template.title}`, status.id, template.priority, 
            dueDate, estimatedHours, actualHours, project.id, creator.id, new Date()]);
        
        tasks.push({ 
          id: taskId, 
          project_id: project.id, 
          created_by: creator.id, 
          status_id: status.id,
          ...template 
        });
      }
    }

    // Seed Task Members
    console.log('👥 Seeding task members...');
    for (const task of tasks) {
      const memberCount = Math.floor(Math.random() * 3) + 1; // 1-3 members per task
      const shuffledUsers = [...users].sort(() => 0.5 - Math.random());
      
      for (let i = 0; i < memberCount && i < shuffledUsers.length; i++) {
        const userId = shuffledUsers[i].id;
        await query(`
          INSERT INTO task_members (id, task_id, user_id, assigned_at)
          VALUES ($1, $2, $3, $4)
        `, [generateUUID(), task.id, userId, new Date()]);
      }
    }

    // Seed Task Comments (Chat messages)
    console.log('💬 Seeding task comments...');
    const commentTemplates = [
      'Great progress on this task!',
      'I need some clarification on the requirements.',
      'The implementation looks good, ready for review.',
      'Found a bug, will fix it soon.',
      'This task is almost complete.',
      'Need help with the API integration.',
      'Updated the documentation.',
      'Ready for testing phase.',
      'Deployed to staging environment.',
      'All tests are passing now.'
    ];

    for (const task of tasks) {
      const commentCount = Math.floor(Math.random() * 5) + 2; // 2-6 comments per task
      
      for (let i = 0; i < commentCount; i++) {
        const commentId = generateUUID();
        const user = users[Math.floor(Math.random() * users.length)];
        const message = commentTemplates[i % commentTemplates.length];
        const createdAt = getRandomDate(new Date(2024, 0, 1), new Date());

        await query(`
          INSERT INTO task_comments (id, task_id, user_id, message, created_at)
          VALUES ($1, $2, $3, $4, $5)
        `, [commentId, task.id, user.id, message, createdAt]);
      }
    }

    // Seed Notifications
    console.log('🔔 Seeding notifications...');
    const notificationTemplates = [
      { title: 'Task Assigned', message: 'You have been assigned to a new task', type: 'task_assigned' },
      { title: 'Project Update', message: 'Project status has been updated', type: 'project_update' },
      { title: 'New Comment', message: 'Someone commented on your task', type: 'task_comment' },
      { title: 'Deadline Approaching', message: 'Task deadline is approaching', type: 'deadline_reminder' },
      { title: 'Project Collaboration', message: 'You have been added to a project', type: 'project_collaborator_added' }
    ];

    for (const user of users) {
      const notificationCount = Math.floor(Math.random() * 8) + 3; // 3-10 notifications per user
      
      for (let i = 0; i < notificationCount; i++) {
        const notificationId = generateUUID();
        const template = notificationTemplates[i % notificationTemplates.length];
        const isRead = getRandomBoolean();
        const relatedTask = tasks[Math.floor(Math.random() * tasks.length)];
        const createdAt = getRandomDate(new Date(2024, 0, 1), new Date());

        await query(`
          INSERT INTO notifications (id, user_id, title, message, type, is_read, related_id, related_type, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [notificationId, user.id, template.title, template.message, template.type, 
            isRead, relatedTask.id, 'task', createdAt]);
      }
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`📊 Seeded data summary:`);
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   👥 Teams: ${teams.length}`);
    console.log(`   📁 Projects: ${projects.length}`);
    console.log(`   📝 Tasks: ${tasks.length}`);
    console.log(`   💬 Comments: ${tasks.length * 4} (average)`);
    console.log(`   🔔 Notifications: ${users.length * 6} (average)`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Function to run seeder
const runSeeder = async () => {
  try {
    await seedDatabase();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeder failed:', error);
    process.exit(1);
  }
};

// Run seeder if this file is executed directly
if (require.main === module) {
  runSeeder();
}

module.exports = {
  seedDatabase,
  runSeeder
};
