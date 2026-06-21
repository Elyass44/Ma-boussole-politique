const COLORS = {
  'LFI-NFP': '#CC0033',
  'ECOS':    '#50A000',
  'SOC':     '#E5007D',
  'GDR':     '#8B0000',
  'LIOT':    '#9370DB',
  'DEM':     '#FF8C00',
  'HOR':     '#00B09B',
  'EPR':     '#0066CC',
  'UDDPLR':  '#002395',
  'DR':      '#0047AB',
  'RN':      '#010066',
  'NI':      '#9E9E9E',
}

function rRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  if (ctx.roundRect) {
    ctx.roundRect(x, y, w, h, r)
  } else {
    ctx.rect(x, y, w, h)
  }
  ctx.fill()
}

function fitText(ctx, text, maxWidth) {
  let size = 52
  ctx.font = `bold ${size}px system-ui, sans-serif`
  while (ctx.measureText(text).width > maxWidth && size > 24) {
    size -= 2
    ctx.font = `bold ${size}px system-ui, sans-serif`
  }
  return size
}

export function generateShareCard(scores, answeredCount) {
  return new Promise(resolve => {
    const W = 1200, H = 630
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')

    const top = scores[0]
    const topColor = COLORS[top.abbr] ?? '#0066CC'
    const pct = Math.round(top.score * 100)

    // ── Background ──────────────────────────────────────────────
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, W, H)

    // Subtle color wash from left
    const grad = ctx.createLinearGradient(0, 0, W * 0.65, 0)
    grad.addColorStop(0, topColor + '1a')
    grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, W, H)

    // Accent bar at top
    ctx.fillStyle = topColor
    ctx.fillRect(0, 0, W, 6)

    // ── Header ──────────────────────────────────────────────────
    ctx.fillStyle = '#475569'
    ctx.font = 'bold 20px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('MA BOUSSOLE POLITIQUE', 80, 68)

    // ── Left: Main result ────────────────────────────────────────
    ctx.fillStyle = '#64748b'
    ctx.font = '32px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('Je vote à', 80, 160)

    // Big percentage
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 148px system-ui, sans-serif'
    ctx.fillText(`${pct}%`, 80, 330)

    // "comme"
    ctx.fillStyle = '#64748b'
    ctx.font = '32px system-ui, sans-serif'
    ctx.fillText('comme', 80, 390)

    // Group name — auto-fit
    const nameMaxW = 590
    fitText(ctx, top.libelle, nameMaxW)
    ctx.fillStyle = topColor
    ctx.fillText(top.libelle, 80, 460)

    // Abbr badge
    ctx.fillStyle = '#1e293b'
    const abbrX = 80, abbrY = 490, abbrPad = 12
    ctx.font = 'bold 20px system-ui, sans-serif'
    const abbrW = ctx.measureText(top.abbr).width + abbrPad * 2
    rRect(ctx, abbrX, abbrY, abbrW, 34, 6)
    ctx.fillStyle = topColor
    ctx.textAlign = 'left'
    ctx.fillText(top.abbr, abbrX + abbrPad, abbrY + 23)

    // ── Right: Score bars ────────────────────────────────────────
    const rx = 710
    const barMaxW = 420
    const top6 = scores.slice(0, Math.min(scores.length, 6))

    ctx.fillStyle = '#334155'
    ctx.font = 'bold 16px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText('CLASSEMENT', rx, 108)

    top6.forEach((g, i) => {
      const y = 132 + i * 78
      const color = COLORS[g.abbr] ?? '#888'
      const gPct = Math.round(g.score * 100)
      const filledW = Math.max(Math.round(g.score * barMaxW), 4)
      const isTop = i === 0

      // Row highlight for #1
      if (isTop) {
        ctx.fillStyle = '#1e293b'
        rRect(ctx, rx - 12, y - 8, barMaxW + 24, 66, 8)
      }

      // Group name
      ctx.fillStyle = isTop ? '#e2e8f0' : '#64748b'
      ctx.font = `${isTop ? 'bold' : ''} 19px system-ui, sans-serif`
      ctx.textAlign = 'left'
      // Truncate long names
      let name = g.libelle
      ctx.font = `${isTop ? 'bold ' : ''}19px system-ui, sans-serif`
      while (ctx.measureText(name).width > barMaxW - 60 && name.length > 4) {
        name = name.slice(0, -1)
      }
      if (name !== g.libelle) name += '…'
      ctx.fillText(name, rx, y + 18)

      // Percentage
      ctx.fillStyle = isTop ? '#ffffff' : '#475569'
      ctx.font = `bold 19px system-ui, sans-serif`
      ctx.textAlign = 'right'
      ctx.fillText(`${gPct}%`, rx + barMaxW, y + 18)

      // Bar track
      ctx.fillStyle = '#1e293b'
      rRect(ctx, rx, y + 26, barMaxW, 16, 4)

      // Bar fill
      ctx.fillStyle = color + (isTop ? 'ff' : 'aa')
      rRect(ctx, rx, y + 26, filledW, 16, 4)
    })

    // ── Vertical divider ────────────────────────────────────────
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(680, 80, 1, H - 136)

    // ── Footer ──────────────────────────────────────────────────
    ctx.fillStyle = '#1e293b'
    ctx.fillRect(0, H - 52, W, 52)

    ctx.fillStyle = '#475569'
    ctx.font = '15px system-ui, sans-serif'
    ctx.textAlign = 'left'
    ctx.fillText(
      `Basé sur ${answeredCount} votes à l'Assemblée nationale  •  Données CIVIX.fr  •  Licence Ouverte Etalab 2.0`,
      80, H - 18
    )

    ctx.fillStyle = '#94a3b8'
    ctx.font = 'bold 16px system-ui, sans-serif'
    ctx.textAlign = 'right'
    ctx.fillText('poliquiz.fr', W - 80, H - 18)

    canvas.toBlob(resolve, 'image/png')
  })
}
