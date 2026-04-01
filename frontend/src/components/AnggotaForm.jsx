import { useState, useEffect } from 'react'

const EMPTY = {
  nama: '', nama_panggilan: '', jenis_kelamin: '',
  tanggal_lahir: '', tanggal_wafat: '', tempat_lahir: '',
  pekerjaan: '', foto: null, id_ayah: '', id_ibu: '',
  id_pasangan: '', tanggal_nikah: '',
}

export default function AnggotaForm({ anggota, editData, onSubmit, onCancel }) {
  const [form, setForm] = useState(EMPTY)
  const isEdit = !!editData

  useEffect(() => {
    if (editData) {
      setForm({
        nama: editData.nama || '',
        nama_panggilan: editData.nama_panggilan || '',
        jenis_kelamin: editData.jenis_kelamin || '',
        tanggal_lahir: editData.tanggal_lahir || '',
        tanggal_wafat: editData.tanggal_wafat || '',
        tempat_lahir: editData.tempat_lahir || '',
        pekerjaan: editData.pekerjaan || '',
        foto: null,
        id_ayah: editData.id_ayah || '',
        id_ibu: editData.id_ibu || '',
        id_pasangan: editData.id_pasangan || '',
        tanggal_nikah: editData.tanggal_nikah || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [editData])

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...form }
    if (isEdit && !data.foto) delete data.foto
    onSubmit(data, editData?.id)
  }

  const laki = anggota.filter(a => a.jenis_kelamin === 'L')
  const perempuan = anggota.filter(a => a.jenis_kelamin === 'P')

  return (
    <div className="form-page">
      <form onSubmit={handleSubmit} className="form-card">
        <h2>{isEdit ? 'Edit' : 'Tambah'} Anggota Keluarga</h2>

        <div className="form-group">
          <label>Nama Lengkap *</label>
          <input value={form.nama} onChange={e => set('nama', e.target.value)} required />
        </div>

        <div className="form-group">
          <label>Nama Panggilan</label>
          <input value={form.nama_panggilan} onChange={e => set('nama_panggilan', e.target.value)} />
        </div>

        <div className="form-group">
          <label>Jenis Kelamin *</label>
          <select value={form.jenis_kelamin} onChange={e => set('jenis_kelamin', e.target.value)} required>
            <option value="">Pilih</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Tanggal Lahir</label>
            <input type="date" value={form.tanggal_lahir} onChange={e => set('tanggal_lahir', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Tanggal Wafat</label>
            <input type="date" value={form.tanggal_wafat} onChange={e => set('tanggal_wafat', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label>Tempat Lahir</label>
          <input value={form.tempat_lahir} onChange={e => set('tempat_lahir', e.target.value)} />
        </div>

        <div className="form-group">
          <label>Pekerjaan</label>
          <input value={form.pekerjaan} onChange={e => set('pekerjaan', e.target.value)} />
        </div>

        <div className="form-group">
          <label>Foto</label>
          <input type="file" accept="image/*" onChange={e => set('foto', e.target.files[0])} />
        </div>

        <div className="form-divider"><span>👨‍👩‍👧‍👦 Hubungan Keluarga</span></div>

        <div className="form-row">
          <div className="form-group">
            <label>Ayah</label>
            <select value={form.id_ayah} onChange={e => set('id_ayah', e.target.value)}>
              <option value="">-- Tidak ada --</option>
              {laki.map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Ibu</label>
            <select value={form.id_ibu} onChange={e => set('id_ibu', e.target.value)}>
              <option value="">-- Tidak ada --</option>
              {perempuan.map(a => <option key={a.id} value={a.id}>{a.nama}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Pasangan</label>
          <select
            value={form.id_pasangan}
            onChange={e => set('id_pasangan', e.target.value)}
          >
            <option value="">-- Tidak ada --</option>
            {anggota.filter(a => a.id !== editData?.id).map(a => (
              <option key={a.id} value={a.id}>{a.nama} ({a.jenis_kelamin === 'L' ? 'L' : 'P'})</option>
            ))}
          </select>
        </div>

        {form.id_pasangan && (
          <div className="form-group wedding-group">
            <label>💑 Tanggal Pernikahan</label>
            <input type="date" value={form.tanggal_nikah} onChange={e => set('tanggal_nikah', e.target.value)} />
          </div>
        )}

        <button type="submit" className="btn btn-primary">
          {isEdit ? 'Simpan Perubahan' : 'Tambah Anggota'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Batal</button>
      </form>
    </div>
  )
}
