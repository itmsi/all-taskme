const { query } = require('./src/database/connection');

async function cleanDuplicateStatuses() {
  try {
    console.log('🧹 Membersihkan status duplikat...');
    
    // Hapus status default yang memiliki project_id (karena seharusnya global)
    const deleteResult = await query(`
      DELETE FROM task_statuses 
      WHERE is_default = true AND project_id IS NOT NULL
    `);
    
    console.log(`✅ Berhasil menghapus ${deleteResult.rowCount} status duplikat`);
    
    // Pastikan ada status default global
    const globalStatuses = await query(`
      SELECT COUNT(*) as count FROM task_statuses 
      WHERE is_default = true AND project_id IS NULL
    `);
    
    if (parseInt(globalStatuses.rows[0].count) === 0) {
      console.log('📝 Menambahkan status default global...');
      
      await query(`
        INSERT INTO task_statuses (name, color, position, project_id, is_default) VALUES
        ('To Do', '#6B7280', 0, NULL, true),
        ('In Progress', '#3B82F6', 1, NULL, true),
        ('Review', '#F59E0B', 2, NULL, true),
        ('Done', '#10B981', 3, NULL, true)
        ON CONFLICT DO NOTHING
      `);
      
      console.log('✅ Status default global berhasil ditambahkan');
    } else {
      console.log('✅ Status default global sudah ada');
    }
    
    console.log('🎉 Pembersihan selesai!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

cleanDuplicateStatuses();
