const API = '/api'

export async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  getAll: () => fetchJSON(`${API}/anggota`),
  getById: (id) => fetchJSON(`${API}/anggota/${id}`),
  create: (data) => {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v != null) fd.append(k, v) })
    return fetchJSON(`${API}/anggota`, { method: 'POST', body: fd })
  },
  update: (id, data) => {
    const fd = new FormData()
    Object.entries(data).forEach(([k, v]) => { if (v != null) fd.append(k, v) })
    return fetchJSON(`${API}/anggota/${id}`, { method: 'PUT', body: fd })
  },
  delete: (id) => fetchJSON(`${API}/anggota/${id}`, { method: 'DELETE' }),
  tree: () => fetchJSON(`${API}/tree`),
}
