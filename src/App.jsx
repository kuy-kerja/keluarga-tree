import { useState, useEffect, useRef } from 'react'

const API = '/api'

function App() {
  const [page, setPage] = useState('tree')
  const [anggota, setAnggota] = useState([])
  const [form, setForm] = useState({})
  const [editId, setEditId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [treeData, setTreeData] = useState([])
  const [filterGender, setFilterGender] = useState('')
  const canvasRef = useRef(null)

  useEffect(() => {
    loadAnggota()
    loadTree()
  }, [])

  async function loadAnggota() {
    const res = await fetch(`${API}/anggota`)
    setAnggota(await res.json())
  }

  async function loadTree() {
    const res = await fetch(`${API}/tree`)
    setTreeData(await res.json())
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const data = new FormData()
    Object.entries(form).forEach(([k, v]) => { if (v) data.append(k, v) })
    
    if (editId) {
      await fetch(`${API}/anggota/${editId}`, { method: 'PUT', body: data })
    } else {
      await fetch(`${API}/anggota}`, { method: 'POST', body: data })
    }
    
    setForm({})
    setEditId(null)
    await loadAnggota()
    await loadTree()
    setPage('tree')
  }

  async function handleDelete(id) {
    if (!confirm('Hapus anggota ini?')) return
    await fetch(`${API}/anggota/${id}`, { method: 'DELETE' })
    await loadAnggota()
    await loadTree()
    setSelected(null)
  }

  function startEdit(person) {
    setForm(person)
    setEditId(person.id)
    setPage('add')
  }

  function renderTreeCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width = 1200
    const H = canvas.height = 800
    ctx.clearRect(0, 0, W, H)

    function drawPerson(x, y, person, level) {
      const colors = { L: '#3B82F6', P: '#EC4899' }
      const color = colors[person.jenis_kelamin] || '#6B7280'
      const cardW = 160
      const cardH = 70

      // Card background
      ctx.fillStyle = '#ffffff'
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(x - cardW/2, y - cardH/2, cardW, cardH, 8)
      ctx.fill()
      ctx.stroke()

      // Name
      ctx.fillStyle = '#1F2937'
      ctx.font = 'bold 13px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(person.nama.substring(0, 18), x, y - 8)

      // Info
      ctx.fillStyle = '#6B7280'
      ctx.font = '11px sans-serif'
      const info = person.tanggal_lahir || ''
      ctx.fillText(info, x, y + 8)

      // Gender badge
      ctx.fillStyle = color
      ctx.font = '10px sans-serif'
      ctx.fillText(person.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan', x, y + 22)
    }

    function drawLines(from, children) {
      ctx.strokeStyle = '#D1D5DB'
      ctx.lineWidth = 2
      children.forEach(child => {
        ctx.beginPath()
        ctx.moveTo(from.x, from.y + 35)
        ctx.lineTo(from.x, from.y + 60)
        ctx.lineTo(child.x, from.y + 60)
        ctx.lineTo(child.x, child.y - 35)
        ctx.stroke()
      })
    }

    function layoutTree(node, x, y, spacing) {
      if (!node) return []
      const cards = [{ x, y, person: node }]
      
      if (node.anak && node.anak.length > 0) {
        const childSpacing = Math.max(spacing / node.anak.length, 180)
        const startX = x - (node.anak.length - 1) * childSpacing / 2

        node.anak.forEach((child, i) => {
          const cx = startX + i * childSpacing
          const cy = y + 100
          const childCards = layoutTree(child, cx, cy, childSpacing)
          cards.push(...childCards)
          drawLines({ x, y }, childCards.filter(c => c.person === child))
        })
      }

      return cards
    }

    // Draw tree
    let startX = 100
    treeData.forEach((root, i) => {
      const y = 80
      const cards = layoutTree(root, startX + i * 300, y, 250)
      cards.forEach(card => drawPerson(card.x, card.y, card.person, 0))
    })

    // If no data
    if (treeData.length === 0) {
      ctx.fillStyle = '#9CA3AF'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Belum ada data. Tambahkan anggota keluarga dulu!', W/2, H/2)
    }
  }

  useEffect(() => {
    if (page === 'tree') {
      setTimeout(renderTreeCanvas, 100)
    }
  }, [page, treeData])

  const filtered = filterGender ? anggota.filter(a => a.jenis_kelamin === filterGender) : anggota

  return (
    <div className="app">
      <header className="header">
        <h1>🫂 Silsilah Keluarga</h1>
        <nav>
          <button className={page==='tree'?'active':''} onClick={() => setPage('tree')}>Pohon</button>
          <button className={page==='list'?'active':''} onClick={() => setPage('list')}>Daftar</button>
          <button className={page==='add'?'active':''} onClick={() => { setForm({}); setEditId(null); setPage('add') }}>Tambah</button>
        </nav>
      </header>

      {/* PAGE: Family Tree */}
      {page === 'tree' && (
        <div className="tree-container">
          <canvas ref={canvasRef} className="tree-canvas" />
          <div className="tree-info">
            <p>Klik "Daftar" untuk melihat detail semua anggota</p>
          </div>
        </div>
      )}

      {/* PAGE: List */}
      {page === 'list' && (
        <div className="list-page">
          <div className="filter-bar">
            <select value={filterGender} onChange={e => setFilterGender(e.target.value)}>
              <option value="">Semua</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          {filtered.length === 0 ? (
            <div className="empty">
              <p>Belum ada data anggota keluarga.</p>
            </div>
          ) : (
            <div className="card-grid">
              {filtered.map(person => (
                <div key={person.id} className="card-person" onClick={() => setSelected(person)}>
                  <div className="card-avatar">
                    {person.foto ? (
                      <img src={`/uploads/${person.foto}`} alt={person.nama} />
                    ) : (
                      <div className="avatar-placeholder">{person.nama[0]}</div>
                    )}
                  </div>
                  <div className="card-info">
                    <h3>{person.nama}</h3>
                    <p>{person.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} {person.tanggal_lahir ? `• ${person.tanggal_lahir}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PAGE: Form */}
      {page === 'add' && (
        <div className="form-page">
          <form onSubmit={handleSubmit} className="form-card">
            <h2>{editId ? 'Edit' : 'Tambah'} Anggota Keluarga</h2>

            <div className="form-group">
              <label>Nama Lengkap *</label>
              <input type="text" value={form.nama || ''} onChange={e => setForm({...form, nama: e.target.value})} required />
            </div>

            <div className="form-group">
              <label>Nama Panggilan</label>
              <input type="text" value={form.nama_panggilan || ''} onChange={e => setForm({...form, nama_panggilan: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Jenis Kelamin *</label>
              <select value={form.jenis_kelamin || ''} onChange={e => setForm({...form, jenis_kelamin: e.target.value})} required>
                <option value="">Pilih</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tanggal Lahir</label>
              <input type="date" value={form.tanggal_lahir || ''} onChange={e => setForm({...form, tanggal_lahir: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Tanggal Wafat</label>
              <input type="date" value={form.tanggal_wafat || ''} onChange={e => setForm({...form, tanggal_wafat: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Tempat Lahir</label>
              <input type="text" value={form.tempat_lahir || ''} onChange={e => setForm({...form, tempat_lahir: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Pekerjaan</label>
              <input type="text" value={form.pekerjaan || ''} onChange={e => setForm({...form, pekerjaan: e.target.value})} />
            </div>

            <div className="form-group">
              <label>Foto</label>
              <input type="file" accept="image/*" onChange={e => setForm({...form, foto: e.target.files[0]})} />
            </div>

            <div className="form-group">
              <label>Ayah</label>
              <select value={form.id_ayah || ''} onChange={e => setForm({...form, id_ayah: e.target.value || null})}>
                <option value="">-- Tidak ada --</option>
                {anggota.filter(a => a.jenis_kelamin === 'L').map(a => (
                  <option key={a.id} value={a.id}>{a.nama}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Ibu</label>
              <select value={form.id_ibu || ''} onChange={e => setForm({...form, id_ibu: e.target.value || null})}>
                <option value="">-- Tidak ada --</option>
                {anggota.filter(a => a.jenis_kelamin === 'P').map(a => (
                  <option key={a.id} value={a.id}>{a.nama}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Pasangan</label>
              <select value={form.id_pasangan || ''} onChange={e => setForm({...form, id_pasangan: e.target.value || null})}>
                <option value="">-- Tidak ada --</option>
                {anggota.filter(a => a.id !== editId).map(a => (
                  <option key={a.id} value={a.id}>{a.nama} ({a.jenis_kelamin === 'L' ? 'L' : 'P'})</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary">{editId ? 'Simpan' : 'Tambah'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setForm({}); setEditId(null); setPage('tree') }}>Batal</button>
          </form>
        </div>
      )}

      {/* MODAL: Detail */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelected(null)}>×</button>
            <div className="modal-avatar">
              {selected.foto ? (
                <img src={`/uploads/${selected.foto}`} alt={selected.nama} />
              ) : (
                <div className="avatar-lg">{selected.nama[0]}</div>
              )}
            </div>
            <h2>{selected.nama}</h2>
            {selected.nama_panggilan && <p className="nickname">({selected.nama_panggilan})</p>}
            <div className="detail-list">
              <div><span>Jenis Kelamin:</span> {selected.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</div>
              {selected.tanggal_lahir && <div><span>Tanggal Lahir:</span> {selected.tanggal_lahir}</div>}
              {selected.tanggal_wafat && <div><span>Tanggal Wafat:</span> {selected.tanggal_wafat}</div>}
              {selected.tempat_lahir && <div><span>Tempat Lahir:</span> {selected.tempat_lahir}</div>}
              {selected.pekerjaan && <div><span>Pekerjaan:</span> {selected.pekerjaan}</div>}
              {selected.id_ayah && <div><span>Ayah:</span> {anggota.find(a => a.id === selected.id_ayah)?.nama || '-'}</div>}
              {selected.id_ibu && <div><span>Ibu:</span> {anggota.find(a => a.id === selected.id_ibu)?.nama || '-'}</div>}
              {selected.id_pasangan && <div><span>Pasangan:</span> {anggota.find(a => a.id === selected.id_pasangan)?.nama || '-'}</div>}
            </div>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={() => { startEdit(selected); setSelected(null) }}>Edit</button>
              <button className="btn btn-danger" onClick={() => handleDelete(selected.id)}>Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
