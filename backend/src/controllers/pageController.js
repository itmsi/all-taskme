const { query, transaction } = require('../database/connection');

function toSlug(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/\-+/g, '-')
    .replace(/^\-+|\-+$/g, '');
}

async function ensureUniqueSlug(baseSlug) {
  let slug = baseSlug;
  let i = 1;
  // Check existence
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await query('SELECT 1 FROM pages WHERE slug = $1 LIMIT 1', [slug]);
    if (res.rows.length === 0) return slug;
    slug = `${baseSlug}-${i++}`;
  }
}

exports.getTree = async (req, res) => {
  try {
    const userId = req.user.id;
    const { root_id: rootId } = req.query;
    const params = [];
    let where = 'created_by = $1';
    params.push(userId);

    if (rootId) {
      where += ' AND (id = $2 OR parent_page_id = $2)';
      params.push(rootId);
    }

    const pagesRes = await query(`
      SELECT id, title, slug, parent_page_id, created_at, updated_at
      FROM pages
      WHERE ${where}
      ORDER BY title ASC
    `, params);

    const nodesById = new Map();
    pagesRes.rows.forEach(p => nodesById.set(p.id, { ...p, children: [] }));
    const roots = [];
    nodesById.forEach(node => {
      if (node.parent_page_id && nodesById.has(node.parent_page_id)) {
        nodesById.get(node.parent_page_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    res.json({ success: true, data: roots });
  } catch (error) {
    console.error('getTree error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil tree pages' });
  }
};

exports.createPage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, parent_page_id: parentId = null } = req.body;
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Judul wajib diisi' });
    }
    const baseSlug = toSlug(title);
    const slug = await ensureUniqueSlug(baseSlug || 'page');
    const result = await query(`
      INSERT INTO pages (title, slug, parent_page_id, created_by, updated_by)
      VALUES ($1, $2, $3, $4, $4)
      RETURNING id, title, slug, parent_page_id, created_at, updated_at
    `, [title.trim(), slug, parentId, userId]);

    res.status(201).json({ success: true, message: 'Page berhasil dibuat', data: result.rows[0] });
  } catch (error) {
    console.error('createPage error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat page' });
  }
};

exports.getById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const result = await query(`
      SELECT id, title, slug, parent_page_id, created_at, updated_at
      FROM pages WHERE id = $1 AND created_by = $2
      LIMIT 1
    `, [id, userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Page tidak ditemukan' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('getById error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil page' });
  }
};

exports.getBySlug = async (req, res) => {
  try {
    const userId = req.user.id;
    const { slug } = req.params;
    const result = await query(`
      SELECT id, title, slug, parent_page_id, created_at, updated_at
      FROM pages WHERE slug = $1 AND created_by = $2
      LIMIT 1
    `, [slug, userId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Page tidak ditemukan' });
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('getBySlug error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil page' });
  }
};

exports.updatePage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, parent_page_id: parentId } = req.body;

    // Ensure ownership
    const exists = await query('SELECT id FROM pages WHERE id = $1 AND created_by = $2', [id, userId]);
    if (exists.rows.length === 0) return res.status(404).json({ success: false, message: 'Page tidak ditemukan' });

    let slugUpdate = null;
    if (title) {
      const baseSlug = toSlug(title);
      slugUpdate = await ensureUniqueSlug(baseSlug || 'page');
    }

    const result = await query(`
      UPDATE pages
      SET title = COALESCE($1, title),
          parent_page_id = COALESCE($2, parent_page_id),
          slug = COALESCE($3, slug),
          updated_by = $4,
          updated_at = NOW()
      WHERE id = $5
      RETURNING id, title, slug, parent_page_id, created_at, updated_at
    `, [title || null, parentId === undefined ? null : parentId, slugUpdate, userId, id]);

    res.json({ success: true, message: 'Page berhasil diperbarui', data: result.rows[0] });
  } catch (error) {
    console.error('updatePage error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui page' });
  }
};

exports.deletePage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    // Ownership
    const exists = await query('SELECT id FROM pages WHERE id = $1 AND created_by = $2', [id, userId]);
    if (exists.rows.length === 0) return res.status(404).json({ success: false, message: 'Page tidak ditemukan' });

    await query('DELETE FROM pages WHERE id = $1', [id]);
    res.json({ success: true, message: 'Page berhasil dihapus' });
  } catch (error) {
    console.error('deletePage error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus page' });
  }
};

exports.searchPages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { q = '' } = req.query;
    const term = `%${q.trim().toLowerCase()}%`;
    const result = await query(`
      SELECT DISTINCT p.id, p.title, p.slug, p.parent_page_id
      FROM pages p
      LEFT JOIN page_blocks b ON b.page_id = p.id
      WHERE p.created_by = $1 AND (
        LOWER(p.title) LIKE $2 OR
        (
          b.content::text LIKE $2
        )
      )
      ORDER BY p.title ASC
    `, [userId, term]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('searchPages error:', error);
    res.status(500).json({ success: false, message: 'Gagal melakukan pencarian' });
  }
};

// Blocks APIs
exports.listBlocks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: pageId } = req.params;
    // Ownership
    const exists = await query('SELECT id FROM pages WHERE id = $1 AND created_by = $2', [pageId, userId]);
    if (exists.rows.length === 0) return res.status(404).json({ success: false, message: 'Page tidak ditemukan' });

    const result = await query(`
      SELECT id, page_id, position, type, content, created_at, updated_at
      FROM page_blocks WHERE page_id = $1 ORDER BY position ASC
    `, [pageId]);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('listBlocks error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengambil blok' });
  }
};

exports.createBlock = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: pageId } = req.params;
    const { type = 'text', content = {}, position } = req.body;

    const exists = await query('SELECT id FROM pages WHERE id = $1 AND created_by = $2', [pageId, userId]);
    if (exists.rows.length === 0) return res.status(404).json({ success: false, message: 'Page tidak ditemukan' });

    let nextPos = position;
    if (nextPos === undefined || nextPos === null) {
      const maxRes = await query('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM page_blocks WHERE page_id = $1', [pageId]);
      nextPos = maxRes.rows[0].next || 0;
    }

    const result = await query(`
      INSERT INTO page_blocks (page_id, position, type, content, created_by, updated_by)
      VALUES ($1, $2, $3, $4::jsonb, $5, $5)
      RETURNING id, page_id, position, type, content, created_at, updated_at
    `, [pageId, nextPos, type, JSON.stringify(content || {}), userId]);

    res.status(201).json({ success: true, message: 'Blok berhasil dibuat', data: result.rows[0] });
  } catch (error) {
    console.error('createBlock error:', error);
    res.status(500).json({ success: false, message: 'Gagal membuat blok' });
  }
};

exports.updateBlock = async (req, res) => {
  try {
    const userId = req.user.id;
    const { blockId } = req.params;
    const { type, content, position } = req.body;

    const ownerRes = await query(`
      SELECT b.id, b.page_id FROM page_blocks b
      JOIN pages p ON p.id = b.page_id
      WHERE b.id = $1 AND p.created_by = $2
    `, [blockId, userId]);
    if (ownerRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Blok tidak ditemukan' });

    const result = await query(`
      UPDATE page_blocks
      SET type = COALESCE($1, type),
          content = COALESCE($2::jsonb, content),
          position = COALESCE($3, position),
          updated_by = $4,
          updated_at = NOW()
      WHERE id = $5
      RETURNING id, page_id, position, type, content, created_at, updated_at
    `, [type || null, content ? JSON.stringify(content) : null, position === undefined ? null : position, userId, blockId]);

    res.json({ success: true, message: 'Blok berhasil diperbarui', data: result.rows[0] });
  } catch (error) {
    console.error('updateBlock error:', error);
    res.status(500).json({ success: false, message: 'Gagal memperbarui blok' });
  }
};

exports.deleteBlock = async (req, res) => {
  try {
    const userId = req.user.id;
    const { blockId } = req.params;
    const ownerRes = await query(`
      SELECT b.id FROM page_blocks b
      JOIN pages p ON p.id = b.page_id
      WHERE b.id = $1 AND p.created_by = $2
    `, [blockId, userId]);
    if (ownerRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Blok tidak ditemukan' });

    await query('DELETE FROM page_blocks WHERE id = $1', [blockId]);
    res.json({ success: true, message: 'Blok berhasil dihapus' });
  } catch (error) {
    console.error('deleteBlock error:', error);
    res.status(500).json({ success: false, message: 'Gagal menghapus blok' });
  }
};

exports.reorderBlocks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: pageId } = req.params;
    const { order } = req.body; // array of block IDs in desired order
    if (!Array.isArray(order)) return res.status(400).json({ success: false, message: 'Order harus berupa array' });

    // Ownership
    const exists = await query('SELECT id FROM pages WHERE id = $1 AND created_by = $2', [pageId, userId]);
    if (exists.rows.length === 0) return res.status(404).json({ success: false, message: 'Page tidak ditemukan' });

    await transaction(async (client) => {
      for (let i = 0; i < order.length; i++) {
        await client.query('UPDATE page_blocks SET position = $1, updated_at = NOW() WHERE id = $2 AND page_id = $3', [i, order[i], pageId]);
      }
    });

    res.json({ success: true, message: 'Urutan blok berhasil diperbarui' });
  } catch (error) {
    console.error('reorderBlocks error:', error);
    res.status(500).json({ success: false, message: 'Gagal mengurutkan blok' });
  }
};

// Upload image and create an image block
exports.uploadBlockImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id: pageId } = req.params;

    // Ownership
    const exists = await query('SELECT id FROM pages WHERE id = $1 AND created_by = $2', [pageId, userId]);
    if (exists.rows.length === 0) return res.status(404).json({ success: false, message: 'Page tidak ditemukan' });

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'File tidak ditemukan' });
    }

    // Get next position
    const maxRes = await query('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM page_blocks WHERE page_id = $1', [pageId]);
    const nextPos = maxRes.rows[0].next || 0;

    const content = {
      url: `/uploads/${req.file.filename}`,
      original_name: req.file.originalname,
      mime_type: req.file.mimetype,
      size: req.file.size
    };

    const result = await query(`
      INSERT INTO page_blocks (page_id, position, type, content, created_by, updated_by)
      VALUES ($1, $2, 'image', $3::jsonb, $4, $4)
      RETURNING id, page_id, position, type, content, created_at, updated_at
    `, [pageId, nextPos, JSON.stringify(content), userId]);

    res.status(201).json({ success: true, message: 'Gambar diupload', data: result.rows[0] });
  } catch (error) {
    console.error('uploadBlockImage error:', error);
    res.status(500).json({ success: false, message: 'Gagal upload gambar' });
  }
};


