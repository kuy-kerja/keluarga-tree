import express from 'express';
import Database from 'better-sqlite3';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Upload config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `foto_${Date.now()}${ext}`);
  }
});
const upload = multer({ storage });

// Serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database
const db = new Database(path.join(__dirname, 'keluarga.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS anggota (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    nama_panggilan TEXT,
    jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L','P')),
    tanggal_lahir TEXT,
    tanggal_wafat TEXT,
    tempat_lahir TEXT,
    pekerjaan TEXT,
    foto TEXT,
    id_ayah INTEGER REFERENCES anggota(id),
    id_ibu INTEGER REFERENCES anggota(id),
    id_pasangan INTEGER REFERENCES anggota(id),
    tanggal_nikah TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  )
`);

// API Routes
// Get all anggota
app.get('/api/anggota', (req, res) => {
  const rows = db.prepare('SELECT * FROM anggota ORDER BY created_at DESC').all();
  res.json(rows);
});

// Get single anggota
app.get('/api/anggota/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM anggota WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Tidak ditemukan' });
  res.json(row);
});

// Add anggota
app.post('/api/anggota', upload.single('foto'), (req, res) => {
  const { nama, nama_panggilan, jenis_kelamin, tanggal_lahir, tanggal_wafat, tempat_lahir, pekerjaan, id_ayah, id_ibu, id_pasangan, tanggal_nikah } = req.body;
  const foto = req.file ? req.file.filename : null;
  
  const result = db.prepare(`
    INSERT INTO anggota (nama, nama_panggilan, jenis_kelamin, tanggal_lahir, tanggal_wafat, tempat_lahir, pekerjaan, foto, id_ayah, id_ibu, id_pasangan, tanggal_nikah)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(nama, nama_panggilan || null, jenis_kelamin, tanggal_lahir || null, tanggal_wafat || null, tempat_lahir || null, pekerjaan || null, foto, id_ayah || null, id_ibu || null, id_pasangan || null, tanggal_nikah || null);

  // Jika ada pasangan, update juga pasangan & tanggal nikah
  if (id_pasangan) {
    db.prepare('UPDATE anggota SET id_pasangan = ?, tanggal_nikah = ? WHERE id = ?').run(result.lastInsertRowid, tanggal_nikah || null, id_pasangan);
  }

  res.json({ id: result.lastInsertRowid, foto });
});

// Update anggota
app.put('/api/anggota/:id', upload.single('foto'), (req, res) => {
  const { nama, nama_panggilan, jenis_kelamin, tanggal_lahir, tanggal_wafat, tempat_lahir, pekerjaan, id_ayah, id_ibu, id_pasangan, tanggal_nikah } = req.body;
  const id = req.params.id;

  // Get existing to handle old foto
  const existing = db.prepare('SELECT foto, id_pasangan FROM anggota WHERE id = ?').get(id);
  let foto = existing?.foto;

  if (req.file) {
    // Delete old foto
    if (existing?.foto) {
      const oldPath = path.join(__dirname, 'uploads', existing.foto);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    foto = req.file.filename;
  }

  db.prepare(`
    UPDATE anggota SET nama=?, nama_panggilan=?, jenis_kelamin=?, tanggal_lahir=?, tanggal_wafat=?, tempat_lahir=?, pekerjaan=?, foto=?, id_ayah=?, id_ibu=?, id_pasangan=?, tanggal_nikah=?
    WHERE id=?
  `).run(nama, nama_panggilan || null, jenis_kelamin, tanggal_lahir || null, tanggal_wafat || null, tempat_lahir || null, pekerjaan || null, foto, id_ayah || null, id_ibu || null, id_pasangan || null, tanggal_nikah || null, id);

  // Jika ada pasangan baru, update juga pasangan
  if (id_pasangan && id_pasangan !== existing?.id_pasangan) {
    db.prepare('UPDATE anggota SET id_pasangan = ?, tanggal_nikah = ? WHERE id = ?').run(id, tanggal_nikah || null, id_pasangan);
  }

  res.json({ success: true });
});

// Delete anggota
app.delete('/api/anggota/:id', (req, res) => {
  const existing = db.prepare('SELECT foto FROM anggota WHERE id = ?').get(req.params.id);
  if (existing?.foto) {
    const filePath = path.join(__dirname, 'uploads', existing.foto);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }
  db.prepare('DELETE FROM anggota WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Family tree structure (with children & spouses)
app.get('/api/tree', (req, res) => {
  const all = db.prepare('SELECT * FROM anggota').all();
  
  const byId = {};
  all.forEach(a => { byId[a.id] = { ...a, anak: [], pasangan: null }; });

  // Build tree
  all.forEach(a => {
    // Hubungan parent
    if (a.id_ayah || a.id_ibu) {
      const parentId = a.id_ayah || a.id_ibu;
      if (byId[parentId]) {
        byId[parentId].anak.push(byId[a.id]);
      }
    }
    // Hubungan pasangan
    if (a.id_pasangan && byId[a.id_pasangan]) {
      byId[a.id].pasangan = byId[a.id_pasangan];
    }
  });

  // Roots: no parent
  const roots = all.filter(a => !a.id_ayah && !a.id_ibu);
  res.json(roots.map(r => byId[r.id]));
});

// Serve frontend in production
app.use(express.static(path.join(__dirname, '../dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
