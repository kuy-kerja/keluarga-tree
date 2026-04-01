export default function DetailModal({ anggota, selected, onClose, onEdit, onDelete }) {
  if (!selected) return null

  const children = anggota.filter(a => a.id_ayah === selected.id || a.id_ibu === selected.id)
  const ayah = anggota.find(a => a.id === selected.id_ayah)
  const ibu = anggota.find(a => a.id === selected.id_ibu)
  const pasangan = anggota.find(a => a.id === selected.id_pasangan)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

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
          {ayah && <div><span>Ayah:</span> {ayah.nama}</div>}
          {ibu && <div><span>Ibu:</span> {ibu.nama}</div>}
          {pasangan && <div><span>Pasangan:</span> {pasangan.nama}</div>}
        </div>

        {children.length > 0 && (
          <div className="detail-children">
            <h4>👶 Anak ({children.length}):</h4>
            <div className="children-list">
              {children.map(child => (
                <div key={child.id} className="child-item">
                  <span>{child.nama}</span>
                  <span className="child-gender">{child.jenis_kelamin === 'L' ? '♂' : '♀'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={() => onEdit(selected)}>Edit</button>
          <button className="btn btn-danger" onClick={() => onDelete(selected.id)}>Hapus</button>
        </div>
      </div>
    </div>
  )
}
