import { useEffect, useRef } from 'react'

const CARD_W = 140
const CARD_H = 60
const COLORS = { L: '#3B82F6', P: '#EC4899' }

export default function FamilyTree({ anggota, treeData, onSelect }) {
  const canvasRef = useRef(null)

  function drawCard(ctx, cx, cy, p) {
    const color = COLORS[p.jenis_kelamin] || '#6B7280'
    ctx.fillStyle = '#fff'
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(cx - CARD_W / 2, cy - CARD_H / 2, CARD_W, CARD_H, 8)
    ctx.fill()
    ctx.stroke()

    // Avatar circle
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(cx - 45, cy, 16, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(p.nama[0], cx - 45, cy + 4)

    // Name
    ctx.fillStyle = '#1F2937'
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(p.nama.substring(0, 14), cx - 24, cy - 6)

    // Info
    ctx.fillStyle = '#6B7280'
    ctx.font = '9px sans-serif'
    const info = p.tanggal_lahir?.substring(0, 4) || (p.jenis_kelamin === 'L' ? '♂' : '♀')
    ctx.fillText(info, cx - 24, cy + 6)

    // Gender
    ctx.fillStyle = color
    ctx.font = '8px sans-serif'
    ctx.fillText(p.jenis_kelamin === 'L' ? '♂ L' : '♀ P', cx - 24, cy + 18)
  }

  function drawCouple(ctx, x, y, person, pasangan, nikah) {
    const gap = pasangan ? 30 : 0
    drawCard(ctx, x, y, person)

    if (pasangan) {
      // Dashed line
      ctx.strokeStyle = '#F59E0B'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 2])
      ctx.beginPath()
      ctx.moveTo(x + CARD_W / 2, y)
      ctx.lineTo(x + CARD_W / 2 + gap, y)
      ctx.stroke()
      ctx.setLineDash([])

      // Heart
      ctx.fillStyle = '#F59E0B'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('♥', x + CARD_W / 2 + gap / 2, y - 8)

      // Wedding date
      if (nikah) {
        ctx.fillStyle = '#92400E'
        ctx.font = 'bold 8px sans-serif'
        ctx.fillText(`💑 ${nikah}`, x + CARD_W / 2 + gap / 2, y + 10)
      }

      drawCard(ctx, x + CARD_W + gap, y, pasangan)
    }
  }

  function layout(ctx, node, x, y, spacing, drawn) {
    if (!node || drawn.has(node.id)) return
    drawn.add(node.id)

    const pasangan = node.id_pasangan
      ? anggota.find(a => a.id === node.id_pasangan)
      : null
    if (pasangan) drawn.add(pasangan.id)

    const nikah = node.tanggal_nikah || pasangan?.tanggal_nikah
    drawCouple(ctx, x, y, node, pasangan, nikah)

    if (node.anak?.length) {
      const childGap = Math.max(spacing / node.anak.length, 160)
      const startX = x - ((node.anak.length - 1) * childGap) / 2

      node.anak.forEach((child, i) => {
        const cx = startX + i * childGap
        const cy = y + 110

        // Line
        ctx.strokeStyle = '#9CA3AF'
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(x, y + 30)
        ctx.lineTo(x, y + 55)
        ctx.lineTo(cx, y + 55)
        ctx.lineTo(cx, cy - 30)
        ctx.stroke()

        layout(ctx, child, cx, cy, childGap, drawn)
      })
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const W = 1600
    const rows = Math.ceil(anggota.length / 4) || 1
    canvas.width = W
    canvas.height = Math.max(800, rows * 130 + 100)
    ctx.clearRect(0, 0, W, H)

    const drawn = new Set()

    // Draw tree roots
    treeData.forEach((root, i) => {
      layout(ctx, root, 180 + i * 350, 70, 300, drawn)
    })

    // Draw unconnected
    const unconnected = anggota.filter(a => !drawn.has(a.id))
    if (unconnected.length) {
      const sectionY = treeData.length ? (Math.ceil(treeData.length / 3) * 130 + 100) : 70
      ctx.fillStyle = '#6B7280'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Anggota Lainnya', W / 2, sectionY - 20)

      unconnected.forEach((p, i) => {
        const col = i % 5
        const row = Math.floor(i / 5)
        drawCard(ctx, 150 + col * 280, sectionY + row * 90, p)
      })
    }

    // Empty
    if (!anggota.length) {
      ctx.fillStyle = '#9CA3AF'
      ctx.font = '16px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Belum ada data. Klik "Tambah"!', W / 2, canvas.height / 2)
    }
  }, [anggota, treeData])

  return (
    <div className="tree-container">
      <div className="tree-scroll">
        <canvas ref={canvasRef} className="tree-canvas" />
      </div>
      <div className="tree-legend">
        <span>🔵 Laki-laki</span>
        <span>🔴 Perempuan</span>
        <span>💛 Nikah</span>
        <span>📊 Total: {anggota.length}</span>
      </div>
    </div>
  )
}
