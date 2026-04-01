import { useState } from 'react'

export default function AnggotaList({ anggota, onSelect }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('')

  const filtered = anggota.filter(a => {
    const matchSearch = !search || a.nama.toLowerCase().includes(search.toLowerCase())
    const matchFilter = !filter || a.jenis_kelamin === filter
    return matchSearch && matchFilter
  })

  function getRelation(p) {
    const parts = []
    if (p.id_ayah || p.id_ibu) {
      const parent = anggota.find(a => a.id === (p.id_ayah || p.id_ibu))
      if (parent) parts.push(`Anak dari ${parent.nama}`)
    }
    if (p.id_pasangan) {
      const pasangan = anggota.find(a => a.id === p.id_pasangan)
      if (pasangan) parts.push(`Pasangan ${pasangan.nama}`)
    }
    return parts.join(' • ')
  }

  return (
    <div className="list-page">
      <div className="filter-bar">
        <input
          className="search-input"
          placeholder="🔍 Cari nama..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">Semua</option>
          <option value="L">Laki-laki</option>
          <option value="P">Perempuan</option>
        </select>
      </div>

      <div className="stats-bar">
        <span>📊 {anggota.length}</span>
        <span>♂ {anggota.filter(a => a.jenis_kelamin === 'L').length}</span>
        <span>♀ {anggota.filter(a => a.jenis_kelamin === 'P').length}</span>
      </div>

      {!filtered.length ? (
        <div className="empty">Belum ada data.</div>
      ) : (
        <div className="card-grid">
          {filtered.map(p => (
            <div key={p.id} className="card-person" onClick={() => onSelect(p)}>
              <div className="card-avatar">
                {p.foto ? (
                  <img src={`/uploads/${p.foto}`} alt={p.nama} />
                ) : (
                  <div className={`avatar-placeholder ${p.jenis_kelamin === 'L' ? 'male' : 'female'}`}>
                    {p.nama[0]}
                  </div>
                )}
              </div>
              <div className="card-info">
                <h3>{p.nama}</h3>
                <p className="card-meta">
                  {p.jenis_kelamin === 'L' ? '♂' : '♀'}
                  {p.tanggal_lahir && ` • ${p.tanggal_lahir}`}
                </p>
                {p.pekerjaan && <p className="card-job">{p.pekerjaan}</p>}
                {p.tanggal_nikah && <p className="wedding-badge">💑 {p.tanggal_nikah}</p>}
                <p className="card-relation">{getRelation(p)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
