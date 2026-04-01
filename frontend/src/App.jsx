import { useState } from 'react'
import { useAnggota } from './hooks/useAnggota'
import FamilyTree from './components/FamilyTree'
import AnggotaList from './components/AnggotaList'
import AnggotaForm from './components/AnggotaForm'
import DetailModal from './components/DetailModal'
import './index.css'

const PAGES = { TREE: 'tree', LIST: 'list', FORM: 'form' }

function App() {
  const [page, setPage] = useState(PAGES.TREE)
  const [editData, setEditData] = useState(null)
  const [selected, setSelected] = useState(null)
  const { anggota, treeData, loading, error, create, update, remove } = useAnggota()

  const goToAdd = () => { setEditData(null); setPage(PAGES.FORM) }
  const goToEdit = (person) => { setEditData(person); setSelected(null); setPage(PAGES.FORM) }
  const goToTree = () => { setEditData(null); setPage(PAGES.TREE) }

  const handleSubmit = async (data, id) => {
    if (id) {
      await update(id, data)
    } else {
      await create(data)
    }
    goToTree()
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus anggota ini?')) return
    await remove(id)
    setSelected(null)
  }

  if (loading) return <div className="app"><div className="loading">Memuat...</div></div>
  if (error) return <div className="app"><div className="error">Error: {error}</div></div>

  return (
    <div className="app">
      <header className="header">
        <h1>🫂 Silsilah Keluarga</h1>
        <nav>
          <button className={page === PAGES.TREE ? 'active' : ''} onClick={goToTree}>Pohon</button>
          <button className={page === PAGES.LIST ? 'active' : ''} onClick={() => setPage(PAGES.LIST)}>Daftar</button>
          <button className={page === PAGES.FORM ? 'active' : ''} onClick={goToAdd}>Tambah</button>
        </nav>
      </header>

      {page === PAGES.TREE && (
        <FamilyTree anggota={anggota} treeData={treeData} onSelect={setSelected} />
      )}

      {page === PAGES.LIST && (
        <AnggotaList anggota={anggota} onSelect={setSelected} />
      )}

      {page === PAGES.FORM && (
        <AnggotaForm
          anggota={anggota}
          editData={editData}
          onSubmit={handleSubmit}
          onCancel={goToTree}
        />
      )}

      <DetailModal
        anggota={anggota}
        selected={selected}
        onClose={() => setSelected(null)}
        onEdit={goToEdit}
        onDelete={handleDelete}
      />
    </div>
  )
}

export default App
