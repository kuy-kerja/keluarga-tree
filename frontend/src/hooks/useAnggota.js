import { useState, useEffect, useCallback } from 'react'
import { api } from '../utils/api'

export function useAnggota() {
  const [anggota, setAnggota] = useState([])
  const [treeData, setTreeData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [all, tree] = await Promise.all([api.getAll(), api.tree()])
      setAnggota(all)
      setTreeData(tree)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = useCallback(async (data) => {
    await api.create(data)
    await load()
  }, [load])

  const update = useCallback(async (id, data) => {
    await api.update(id, data)
    await load()
  }, [load])

  const remove = useCallback(async (id) => {
    await api.delete(id)
    await load()
  }, [load])

  return { anggota, treeData, loading, error, create, update, remove, reload: load }
}
