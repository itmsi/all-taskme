-- Add task_extensions table untuk field-field tambahan
-- File ini akan menambahkan tabel baru tanpa mengubah struktur tabel tasks yang sudah ada

-- Task extensions table untuk field-field tambahan
CREATE TABLE IF NOT EXISTS task_extensions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    number_phone VARCHAR(20), -- Nomor telepon
    sales_name VARCHAR(100), -- Nama sales
    name_pt VARCHAR(200), -- Nama PT/Perusahaan
    iup VARCHAR(100), -- IUP (Izin Usaha Pertambangan)
    latitude DECIMAL(10, 8), -- Latitude (sudah ada di tasks tapi ditambahkan lagi untuk konsistensi)
    longitude DECIMAL(11, 8), -- Longitude (sudah ada di tasks tapi ditambahkan lagi untuk konsistensi)
    photo_link TEXT, -- Link foto
    count_photo INTEGER DEFAULT 0, -- Jumlah foto
    voice_link TEXT, -- Link voice/audio
    count_voice INTEGER DEFAULT 0, -- Jumlah file voice
    voice_transcript TEXT, -- Transkrip suara
    is_completed BOOLEAN DEFAULT false, -- Status completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_id) -- Satu task hanya bisa punya satu extension
);

-- Index untuk performa
CREATE INDEX IF NOT EXISTS idx_task_extensions_task_id ON task_extensions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_extensions_sales_name ON task_extensions(sales_name);
CREATE INDEX IF NOT EXISTS idx_task_extensions_name_pt ON task_extensions(name_pt);
CREATE INDEX IF NOT EXISTS idx_task_extensions_is_completed ON task_extensions(is_completed);

-- Trigger untuk updated_at
CREATE TRIGGER update_task_extensions_updated_at 
    BEFORE UPDATE ON task_extensions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
