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
  const [showPasangan, setShowPasangan] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
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
      await fetch(`${API}/anggota`, { method: 'POST', body: data })
    }
    
    setForm({})
    setEditId(null)
    setShowPasangan(false)
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
    setShowPasangan(!!person.id_pasangan)
    setPage('add')
  }

  function renderTreeCanvas() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    // Hitung ukuran canvas berdasarkan data
    const totalMembers = anggota.length
    const rows = Math.ceil(totalMembers / 4) || 1
    const W = canvas.width = 1600
    const H = canvas.height = Math.max(800, rows * 130 + 100)
    
    ctx.clearRect(0, 0, W, H)

    const drawn = new Set()

    function drawCard(cx, cy, p, isHighlighted = false) {
      if (!p) return
      const cardW = 140
      const cardH = 60
      const colors = { L: '#3B82F6', P: '#EC4899' }
      const color = colors[p.jenis_kelamin] || '#6B7280'
      
      ctx.fillStyle = isHighlighted ? '#FFF9C4' : '#ffffff'
      ctx.strokeStyle = isHighlighted ? '#F59E0B' : color
      ctx.lineWidth = isHighlighted ? 3 : 2
      ctx.beginPath()
      ctx.roundRect(cx - cardW/2, cy - cardH/2, cardW, cardH, 8)
      ctx.fill()
      ctx.stroke()

      // Foto placeholder
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(cx - 45, cy, 18, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.nama[0], cx - 45, cy + 4)

      // Nama
      ctx.fillStyle = '#1F2937'
      ctx.font = 'bold 11px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(p.nama.substring(0, 14), cx + 15, cy - 8)

      // Info
      ctx.fillStyle = '#6B7280'
      ctx.font = '9px sans-serif'
      const info = []
      if (p.tanggal_lahir) info.push(p.tanggal_lahir.substring(0, 4))
      if (p.pekerjaan) info.push(p.pekerjaan.substring(0, 12))
      ctx.fillText(info.join(' • ') || p.jenis_kelamin === 'L' ? 'L' : 'P', cx + 15, cy + 5)

      // Gender
      ctx.fillStyle = color
      ctx.font = '8px sans-serif'
      ctx.fillText(p.jenis_kelamin === 'L' ? '♂' : '♀', cx + 15, cy + 18)
    }

    function drawCouple(x, y, person, pasangan, nikah) {
      const cardW = 140
      const gap = pasangan ? 30 : 0

      // Person
      drawCard(x, y, person)

      // Spouse
      if (pasangan) {
        // Heart line
        ctx.strokeStyle = '#F59E0B'
        ctx.lineWidth = 2
        ctx.setLineDash([4, 2])
        ctx.beginPath()
        ctx.moveTo(x + cardW/2, y)
        ctx.lineTo(x + cardW/2 + gap, y)
        ctx.stroke()
        ctx.setLineDash([])

        // Heart
        ctx.fillStyle = '#F59E0B'
        ctx.font = '16px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('♥', x + cardW/2 + gap/2, y - 8)

        // Wedding date
        if (nikah) {
          ctx.fillStyle = '#92400E'
          ctx.font = 'bold 9px sans-serif'
          ctx.fillText(`💑 ${nikah}`, x + cardW/2 + gap/2, y + 8)
        }

        // Spouse card
        drawCard(x + cardW + gap, y, pasangan)
      }

      return { x, y }
    }

    function layoutTree(node, x, y, spacing) {
      if (!node || drawn.has(node.id)) return []
      drawn.add(node.id)

      const cards = []
      
      // Get spouse data
      const pasangan = node.id_pasangan ? anggota.find(a => a.id === node.id_pasangan) : null
      if (pasangan) drawn.add(pasangan.id)
      
      const nikah = node.tanggal_nikah || (pasangan?.tanggal_nikah) || null

      drawCouple(x, y, node, pasangan, nikah)
      cards.push({ x, y, node })

      if (node.anak && node.anak.length > 0) {
        const childSpacing = Math.max(spacing / node.anak.length, 160)
        const startX = x - (node.anak.length - 1) * childSpacing / 2
        const childY = y + 100

        node.anak.forEach((child, i) => {
          const cx = startX + i * childSpacing
          const childCards = layoutTree(child, cx, childY, childSpacing)
          cards.push(...childCards)

          // Connection line
          ctx.strokeStyle = '#9CA3AF'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(x, y + 30)
          ctx.lineTo(x, y + 55)
          ctx.lineTo(cx, y + 55)
          ctx.lineTo(cx, childY - 30)
          ctx.stroke()
        })
      }

      return cards
    }

    // Draw connected tree members first
    let offsetX = 180
    let offsetY = 70
    treeData.forEach((root, i) => {
      layoutTree(root, offsetX + i * 350, offsetY, 300)
    })

    // Draw unconnected members (not in any tree)
    const unconnected = anggota.filter(a => !drawn.has(a.id))
    if (unconnected.length > 0) {
      const sectionY = treeData.length > 0 ? (Math.ceil(treeData.length / 3) * 130 + 100) : 70
      
      // Section header
      ctx.fillStyle = '#6B7280'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Anggota Lainnya', W/2, sectionY - 20)

      unconnected.forEach((person, i) => {
        const col = i % 5
        const row = Math.floor(i / 5)
        const x = 150 + col * 280
        const y = sectionY + row * 90
        drawCard(x, y, person)
      })
    }

    // Empty state
    if (anggota.length === 0) {
      ctx.fillStyle = '#9CA3AF'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Belum ada data. Klik "Tambah" untuk mulai!', W/2, H/2)
    }
  }

  useEffect(() => {
    if (page === 'tree') {
      setTimeout(renderTreeCanvas, 100)
    }
  }, [page, treeData, anggota])

  // Filter & search
  const filtered = anggota.filter(a => {
    const matchGender = !filterGender || a.jenis_kelamin === filterGender
    const matchSearch = !searchTerm || a.nama.toLowerCase().includes(searchTerm.toLowerCase())
    return matchGender && matchSearch
  })

  // Get relation label
  function getRelationLabel(person) {
    const labels = []
    if (person.id_ayah || person.id_ibu) {
      const parent = anggota.find(a => a.id === (person.id_ayah || person.id_ibu))
      if (parent) labels.push(`Anak dari ${parent.nama}`)
    }
    if (person.id_pasangan) {
      const pasangan = anggota.find(a => a.id === person.id_pasangan)
      if (pasangan) labels.push(`Pasangan ${pasangan.nama}`)
    }
    return labels.join(' • ')
  }

  return (
    <div className="app">
      <header className="header">
        <h1>🫂 Silsilah Keluarga</h1>
        <nav>
          <button className={page==='tree'?'active':''} onClick={() => setPage('tree')}>Pohon</button>
          <button className={page==='list'?'active':''} onClick={() => setPage('list')}>Daftar</button>
          <button className={page==='add'?'active':''} onClick={() => { setForm({}); setEditId(null); setShowPasangan(false); setPage('add') }}>Tambah</button>
        </nav>
      </header>

      {/* PAGE: Family Tree */}
      {page === 'tree' && (
        <div className="tree-container">
          <div className="tree-scroll">
            <canvas ref={canvasRef} className="tree-canvas" />
          </div>
          <div className="tree-legend">
            <span>🔵 Laki-laki</span>
            <span>🔴 Perempuan</span>
            <span>💛 Nikah</span>
            <span>📊 Total: {anggota.length} anggota</span>
          </div>
        </div>
      )}

      {/* PAGE: List */}
      {page === 'list' && (
        <div className="list-page">
          <div className="filter-bar">
            <input 
              type="text" 
              placeholder="🔍 Cari nama..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <select value={filterGender} onChange={e => setFilterGender(e.target.value)}>
              <option value="">Semua</option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </div>
          
          <div className="stats-bar">
            <span>📊 Total: {anggota.length}</span>
            <span>♂ Laki-laki: {anggota.filter(a => a.jenis_kelamin === 'L').length}</span>
            <span>♀ Perempuan: {anggota.filter(a => a.jenis_kelamin === 'P').length}</span>
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
                      <div className={`avatar-placeholder ${person.jenis_kelamin === 'L' ? 'male' : 'female'}`}>
                        {person.nama[0]}
                      </div>
                    )}
                  </div>
                  <div className="card-info">
                    <h3>{person.nama}</h3>
                    <p className="card-meta">
                      {person.jenis_kelamin === 'L' ? '♂ Laki-laki' : '♀ Perempuan'}
                      {person.tanggal_lahir && ` • ${person.tanggal_lahir}`}
                    </p>
                    {person.pekerjaan && <p className="card-job">{person.pekerjaan}</p>}
                    {person.tanggal_nikah && <p className="wedding-badge">💑 {person.tanggal_nikah}</p>}
                    <p className="card-relation">{getRelationLabel(person)}</p>
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

            <div className="form-row">
              <div className="form-group">
                <label>Tanggal Lahir</label>
                <input type="date" value={form.tanggal_lahir || ''} onChange={e => setForm({...form, tanggal_lahir: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Tanggal Wafat</label>
                <input type="date" value={form.tanggal_wafat || ''} onChange={e => setForm({...form, tanggal_wafat: e.target.value})} />
              </div>
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

            <div className="form-divider">
              <span>👨‍👩‍👧‍👦 Hubungan Keluarga</span>
            </div>

            <div className="form-row">
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
            </div>

            <div className="form-group">
              <label>Pasangan</label>
              <select value={form.id_pasangan || ''} onChange={e => { setForm({...form, id_pasangan: e.target.value || null}); setShowPasangan(!!e.target.value) }}>
                <option value="">-- Tidak ada --</option>
                {anggota.filter(a => a.id !== editId).map(a => (
                  <option key={a.id} value={a.id}>{a.nama} ({a.jenis_kelamin === 'L' ? 'L' : 'P'})</option>
                ))}
              </select>
            </div>

            {showPasangan && (
              <div className="form-group wedding-group">
                <label>💑 Tanggal Pernikahan</label>
                <input type="date" value={form.tanggal_nikah || ''} onChange={e => setForm({...form, tanggal_nikah: e.target.value})} />
              </div>
            )}

            <button type="submit" className="btn btn-primary">{editId ? 'Simpan Perubahan' : 'Tambah Anggota'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => { setForm({}); setEditId(null); setShowPasangan(false); setPage('tree') }}>Batal</button>
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
                <div className={`avatar-lg ${selected.jenis_kelamin === 'L' ? 'male' : 'female'}`}>
                  {selected.nama[0]}
                </div>
              )}
            </div>
            <h2>{selected.nama}</h2>
            {selected.nama_panggilan && <p className="nickname">({selected.nama_panggilan})</p>}
            
            <div className="detail-badges">
              <span className={`badge ${selected.jenis_kelamin === 'L' ? 'badge-male' : 'badge-female'}`}>
                {selected.jenis_kelamin === 'L' ? '♂ Laki-laki' : '♀ Perempuan'}
              </span>
              {selected.tanggal_lahir && <span className="badge">🎂 {selected.tanggal_lahir}</span>}
              {selected.tanggal_nikah && <span className="badge badge-wedding">💑 {selected.tanggal_nikah}</span>}
            </div>

            <div className="detail-list">
              {selected.tanggal_wafat && <div><span>Tanggal Wafat:</span> {selected.tanggal_wafat}</div>}
              {selected.tempat_lahir && <div><span>Tempat Lahir:</span> {selected.tempat_lahir}</div>}
              {selected.pekerjaan && <div><span>Pekerjaan:</span> {selected.pekerjaan}</div>}
              {selected.id_ayah && <div><span>Ayah:</span> {anggota.find(a => a.id === selected.id_ayah)?.nama || '-'}</div>}
              {selected.id_ibu && <div><span>Ibu:</span> {anggota.find(a => a.id === selected.id_ibu)?.nama || '-'}</div>}
              {selected.id_pasangan && <div><span>Pasangan:</span> {anggota.find(a => a.id === selected.id_pasangan)?.nama || '-'}</div>}
            </div>

            {/* Children */}
            {anggota.filter(a => a.id_ayah === selected.id || a.id_ibu === selected.id).length > 0 && (
              <div className="detail-children">
                <h4>👶 Anak:</h4>
                <div className="children-list">
                  {anggota.filter(a => a.id_ayah === selected.id || a.id_ibu === selected.id).map(child => (
                    <div key={child.id} className="child-item" onClick={() => { setSelected(child) }}>
                      <span>{child.nama}</span>
                      <span className="child-gender">{child.jenis_kelamin === 'L' ? '♂' : '♀'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
