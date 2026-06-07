import { useState, useEffect } from 'react'

interface Item { id: string; desc: string; qty: number; price: number }
interface Issuer {
  name: string; logo: string
  address: string; phone: string; email: string
  taxId: string; taxCond: string
  startNumber: number; footer: string
}
interface Doc {
  id: string
  type: 'recibo' | 'presupuesto'
  number: number
  client: string; clientPhone: string; clientId: string; clientAddr: string
  items: Item[]
  discount: number
  total: number
  date: string
  validUntil: string
  payment: string
  notes: string
}

const money = (n: number) =>
  '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const blankItem = (): Item => ({ id: crypto.randomUUID(), desc: '', qty: 1, price: 0 })
const today = () => new Date().toLocaleDateString('es-AR')

const DEFAULT_ISSUER: Issuer = {
  name: '', logo: '', address: '', phone: '', email: '',
  taxId: '', taxCond: 'Monotributo', startNumber: 1, footer: '',
}
const PAYMENTS = ['Efectivo', 'Transferencia', 'Tarjeta', 'Mercado Pago', 'Cheque', 'Otro']
const TAX_CONDS = ['Monotributo', 'Responsable Inscripto', 'Exento', 'Consumidor Final', '-']

declare global { interface Window { jspdf?: { jsPDF: new (o?: unknown) => JsPDFLike } } }
interface JsPDFLike {
  setFontSize(n: number): void
  setFont(f: string, s?: string): void
  setTextColor(r: number, g: number, b: number): void
  setFillColor(r: number, g: number, b: number): void
  setDrawColor(r: number, g: number, b: number): void
  text(t: string | string[], x: number, y: number, o?: unknown): void
  rect(x: number, y: number, w: number, h: number, s?: string): void
  line(x1: number, y1: number, x2: number, y2: number): void
  addImage(d: string, f: string, x: number, y: number, w: number, h: number): void
  save(name: string): void
  splitTextToSize(t: string, w: number): string[]
}

type Tab = 'crear' | 'historial' | 'ajustes'

export default function App() {
  const [tab, setTab] = useState<Tab>('crear')
  const [issuer, setIssuer] = useState<Issuer>(DEFAULT_ISSUER)
  const [history, setHistory] = useState<Doc[]>([])

  // form comprobante
  const [docType, setDocType] = useState<'recibo' | 'presupuesto'>('recibo')
  const [client, setClient] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientAddr, setClientAddr] = useState('')
  const [items, setItems] = useState<Item[]>([blankItem()])
  const [discount, setDiscount] = useState('')
  const [date, setDate] = useState(today())
  const [validUntil, setValidUntil] = useState('')
  const [payment, setPayment] = useState('Efectivo')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    const i = localStorage.getItem('dot-recibos-issuer')
    if (i) setIssuer({ ...DEFAULT_ISSUER, ...JSON.parse(i) })
    const h = localStorage.getItem('dot-recibos-history')
    if (h) setHistory(JSON.parse(h))
  }, [])

  const saveIssuer = (next: Issuer) => { setIssuer(next); localStorage.setItem('dot-recibos-issuer', JSON.stringify(next)) }
  const persistHistory = (next: Doc[]) => { setHistory(next); localStorage.setItem('dot-recibos-history', JSON.stringify(next)) }

  const subtotal = items.reduce((a, it) => a + (it.qty || 0) * (it.price || 0), 0)
  const discN = parseFloat(discount) || 0
  const total = Math.max(0, subtotal - discN)

  const setItem = (id: string, patch: Partial<Item>) => setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const addItem = () => setItems((arr) => [...arr, blankItem()])
  const rmItem = (id: string) => setItems((arr) => (arr.length > 1 ? arr.filter((it) => it.id !== id) : arr))
  const canSave = client.trim().length > 0 && total > 0
  const nextNumber = () => (issuer.startNumber || 1) + history.length
  const docTitle = (t: Doc['type']) => (t === 'recibo' ? 'RECIBO' : 'PRESUPUESTO')

  const buildText = (d: Doc) => {
    const lines = d.items.filter((it) => it.desc.trim()).map((it) => `- ${it.desc} x${it.qty}  ${money(it.qty * it.price)}`).join('\n')
    return `*${docTitle(d.type)} N° ${String(d.number).padStart(4, '0')}*\n` +
      (issuer.name ? `${issuer.name}\n` : '') +
      (issuer.phone ? `Tel: ${issuer.phone}\n` : '') +
      `\nCliente: ${d.client}\nFecha: ${d.date}\n` +
      (d.validUntil ? `Valido hasta: ${d.validUntil}\n` : '') +
      `\n${lines}\n` +
      (d.discount > 0 ? `\nDescuento: -${money(d.discount)}` : '') +
      `\n*TOTAL: ${money(d.total)}*` +
      (d.payment ? `\nForma de pago: ${d.payment}` : '')
  }

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (file.size > 500000) { alert('La imagen es muy grande (max 500KB).'); return }
    const reader = new FileReader()
    reader.onload = () => saveIssuer({ ...issuer, logo: String(reader.result) })
    reader.readAsDataURL(file)
  }

  const generatePDF = (d: Doc) => {
    const lib = window.jspdf
    if (!lib) { alert('No se pudo cargar el generador de PDF. Revisa tu conexion.'); return }
    const doc = new lib.jsPDF({ unit: 'mm', format: 'a4' })
    const M = 18, W = 210
    const BAND = 44

    // ===== Franja azul DOT =====
    doc.setFillColor(46, 143, 208); doc.rect(0, 0, W, BAND, 'F')
    let nameX = M
    if (issuer.logo) { try { doc.addImage(issuer.logo, 'PNG', M, 8, 28, 28); nameX = M + 34 } catch { /* ignore */ } }
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(16)
    doc.text(issuer.name || 'Mi negocio', nameX, 16)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(225, 238, 248)
    const emLines: string[] = []
    if (issuer.address) emLines.push(issuer.address)
    const linePhoneMail = [issuer.phone, issuer.email].filter(Boolean).join('  ·  ')
    if (linePhoneMail) emLines.push(linePhoneMail)
    const lineTax = [issuer.taxId ? `CUIT/CUIL: ${issuer.taxId}` : '', issuer.taxCond && issuer.taxCond !== '-' ? issuer.taxCond : ''].filter(Boolean).join('  ·  ')
    if (lineTax) emLines.push(lineTax)
    doc.text(emLines, nameX, 22)

    // Caja tipo + numero
    doc.setFillColor(255, 255, 255); doc.setDrawColor(255, 255, 255)
    doc.rect(W - M - 52, 9, 52, 26, 'FD')
    doc.setTextColor(46, 143, 208); doc.setFont('helvetica', 'bold'); doc.setFontSize(14)
    doc.text(docTitle(d.type), W - M - 26, 18, { align: 'center' })
    doc.setTextColor(27, 29, 34); doc.setFontSize(11)
    doc.text(`N° ${String(d.number).padStart(4, '0')}`, W - M - 26, 26, { align: 'center' })
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120, 124, 130)
    doc.text(d.date, W - M - 26, 32, { align: 'center' })

    let y = BAND + 12

    // ===== Datos cliente (caja) =====
    doc.setDrawColor(220, 224, 228); doc.setFillColor(248, 250, 252)
    const cliLines: string[] = []
    if (d.clientId) cliLines.push(`CUIT/DNI: ${d.clientId}`)
    if (d.clientAddr) cliLines.push(d.clientAddr)
    if (d.clientPhone) cliLines.push(`Tel: ${d.clientPhone}`)
    const cliH = 14 + cliLines.length * 5
    doc.rect(M, y, W - 2 * M, cliH, 'FD')
    doc.setTextColor(120, 124, 130); doc.setFont('helvetica', 'normal'); doc.setFontSize(8)
    doc.text('CLIENTE', M + 4, y + 6)
    doc.setTextColor(27, 29, 34); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
    doc.text(d.client, M + 4, y + 12)
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(90, 94, 100)
    doc.text(cliLines, M + 4, y + 18)
    // Validez (derecha)
    if (d.validUntil) {
      doc.setTextColor(120, 124, 130); doc.setFontSize(8); doc.text('VALIDO HASTA', W - M - 4, y + 6, { align: 'right' })
      doc.setTextColor(27, 29, 34); doc.setFont('helvetica', 'bold'); doc.setFontSize(11)
      doc.text(d.validUntil, W - M - 4, y + 12, { align: 'right' })
    }
    y += cliH + 10

    // ===== Tabla items =====
    doc.setFillColor(27, 29, 34); doc.rect(M, y, W - 2 * M, 9, 'F')
    doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(9)
    doc.text('DESCRIPCION', M + 3, y + 6)
    doc.text('CANT', W - M - 62, y + 6, { align: 'right' })
    doc.text('PRECIO', W - M - 33, y + 6, { align: 'right' })
    doc.text('SUBTOTAL', W - M - 3, y + 6, { align: 'right' })
    y += 9
    doc.setTextColor(40, 44, 50); doc.setFont('helvetica', 'normal'); doc.setFontSize(10)
    d.items.filter((it) => it.desc.trim()).forEach((it, idx) => {
      if (idx % 2 === 1) { doc.setFillColor(247, 249, 251); doc.rect(M, y, W - 2 * M, 8, 'F') }
      doc.text(doc.splitTextToSize(it.desc, 95)[0], M + 3, y + 5.5)
      doc.text(String(it.qty), W - M - 62, y + 5.5, { align: 'right' })
      doc.text(money(it.price), W - M - 33, y + 5.5, { align: 'right' })
      doc.text(money(it.qty * it.price), W - M - 3, y + 5.5, { align: 'right' })
      y += 8
    })

    // ===== Totales =====
    y += 4; doc.setDrawColor(220, 224, 228); doc.line(W - M - 75, y, W - M, y); y += 7
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(90, 94, 100)
    if (d.discount > 0) {
      doc.text('Subtotal', W - M - 60, y); doc.text(money(subtotalOf(d)), W - M - 3, y, { align: 'right' }); y += 6
      doc.text('Descuento', W - M - 60, y); doc.text(`-${money(d.discount)}`, W - M - 3, y, { align: 'right' }); y += 7
    }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13); doc.setTextColor(46, 143, 208)
    doc.text('TOTAL', W - M - 60, y); doc.text(money(d.total), W - M - 3, y, { align: 'right' })
    y += 12

    // ===== Forma de pago + observaciones =====
    if (d.payment) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(90, 94, 100)
      doc.text(`Forma de pago: `, M, y)
      doc.setFont('helvetica', 'bold'); doc.setTextColor(27, 29, 34)
      doc.text(d.payment, M + 28, y); y += 7
    }
    if (d.notes) {
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(120, 124, 130)
      doc.text('Observaciones:', M, y); y += 4.5
      doc.text(doc.splitTextToSize(d.notes, W - 2 * M), M, y)
    }

    // ===== Footer =====
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(150, 154, 160)
    const ft = issuer.footer
      ? doc.splitTextToSize(issuer.footer, W - 2 * M)
      : ['Comprobante no valido como factura. Generado con Recibos by dot - @dot.sfco']
    doc.text(ft, M, 285)

    doc.save(`${docTitle(d.type)}-${String(d.number).padStart(4, '0')}-${d.client.replace(/\s+/g, '_')}.pdf`)
  }

  const subtotalOf = (d: Doc) => d.items.reduce((a, it) => a + it.qty * it.price, 0)

  const build = (): Doc | null => {
    if (!canSave) return null
    return {
      id: crypto.randomUUID(), type: docType, number: nextNumber(),
      client: client.trim(), clientPhone: clientPhone.trim(), clientId: clientId.trim(), clientAddr: clientAddr.trim(),
      items: items.filter((it) => it.desc.trim()), discount: discN, total,
      date, validUntil: validUntil.trim(), payment, notes: notes.trim(),
    }
  }
  const emitPDF = () => { const d = build(); if (!d) return; persistHistory([d, ...history]); generatePDF(d); reset() }
  const emitWhatsApp = () => { const d = build(); if (!d) return; persistHistory([d, ...history]); window.open(`https://wa.me/?text=${encodeURIComponent(buildText(d))}`, '_blank'); reset() }
  const reset = () => {
    setClient(''); setClientPhone(''); setClientId(''); setClientAddr('')
    setItems([blankItem()]); setDiscount(''); setDate(today()); setValidUntil(''); setNotes(''); setTab('historial')
  }
  const duplicate = (d: Doc) => {
    setDocType(d.type); setClient(d.client); setClientPhone(d.clientPhone); setClientId(d.clientId); setClientAddr(d.clientAddr)
    setItems(d.items.map((it) => ({ ...it, id: crypto.randomUUID() }))); setDiscount(d.discount ? String(d.discount) : '')
    setDate(today()); setValidUntil(''); setPayment(d.payment); setNotes(d.notes); setTab('crear')
  }

  return (
    <div className="app">
      <div className="wrap">
        <header className="head">
          <div className="brand">
            <h1>{issuer.name.trim() ? issuer.name : <>Recibos <span className="accent">by dot</span></>}</h1>
            <p>{tab === 'crear' ? 'Nuevo comprobante' : tab === 'historial' ? 'Comprobantes emitidos' : 'Ajustes'}</p>
          </div>
          <span className="sig">dot<span className="dot">&bull;</span></span>
        </header>

        {tab === 'crear' && (
          <>
            <div className="card">
              <h2>Tipo de <span className="accent">comprobante</span></h2>
              <div className="seg">
                <button className={docType === 'recibo' ? 'on' : ''} onClick={() => setDocType('recibo')}>Recibo</button>
                <button className={docType === 'presupuesto' ? 'on' : ''} onClick={() => setDocType('presupuesto')}>Presupuesto</button>
              </div>
              <div className="row2" style={{ marginTop: 16 }}>
                <div className="f"><label className="label">Fecha</label>
                  <input className="inp" value={date} onChange={(e) => setDate(e.target.value)} placeholder="dd/mm/aaaa" /></div>
                <div className="f"><label className="label">Valido hasta {docType === 'recibo' ? '(opc.)' : ''}</label>
                  <input className="inp" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} placeholder="dd/mm/aaaa" /></div>
              </div>
              <div className="f" style={{ marginBottom: 0 }}>
                <label className="label">Forma de pago</label>
                <select className="inp" value={payment} onChange={(e) => setPayment(e.target.value)}>
                  {PAYMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="card">
              <h2><span className="accent">Cliente</span></h2>
              <div className="f"><label className="label">Nombre / Razon social</label>
                <input className="inp" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nombre del cliente" /></div>
              <div className="row2">
                <div className="f"><label className="label">CUIT / DNI</label>
                  <input className="inp" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="20-..." /></div>
                <div className="f"><label className="label">Telefono</label>
                  <input className="inp" type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="351..." /></div>
              </div>
              <div className="f" style={{ marginBottom: 0 }}><label className="label">Direccion (opc.)</label>
                <input className="inp" value={clientAddr} onChange={(e) => setClientAddr(e.target.value)} placeholder="Calle 123, Ciudad" /></div>
            </div>

            <div className="card">
              <h2><span className="accent">Items</span></h2>
              <div className="items-head"><span className="label">Detalle</span><button className="add-link" onClick={addItem}>+ Agregar item</button></div>
              {items.map((it) => (
                <div className="item" key={it.id}>
                  <input className="inp-sm desc" value={it.desc} onChange={(e) => setItem(it.id, { desc: e.target.value })} placeholder="Descripcion" />
                  <input className="inp-sm qty" type="number" inputMode="numeric" min="1" value={it.qty} onChange={(e) => setItem(it.id, { qty: parseFloat(e.target.value) || 0 })} placeholder="Cant" />
                  <input className="inp-sm price" type="number" inputMode="decimal" min="0" value={it.price || ''} onChange={(e) => setItem(it.id, { price: parseFloat(e.target.value) || 0 })} placeholder="Precio" />
                  <button className="rm" onClick={() => rmItem(it.id)} aria-label="Quitar">&times;</button>
                </div>
              ))}
              <div className="f" style={{ marginTop: 12, marginBottom: 0 }}>
                <label className="label">Descuento (opc.)</label>
                <input className="inp" type="number" inputMode="decimal" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" />
              </div>
              <div className="total-row">
                <span className="l">{discN > 0 ? 'Total (con descuento)' : 'Total'}</span>
                <span className="v">{money(total)}</span>
              </div>
            </div>

            <div className="card">
              <h2><span className="accent">Observaciones</span></h2>
              <textarea className="inp ta" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas, garantia, condiciones..." />
            </div>
            <footer className="foot">Hecho por dot<span className="dot">&bull;</span> &middot; @dot.sfco</footer>
          </>
        )}

        {tab === 'historial' && (
          <>
            {history.length === 0 ? (
              <div className="empty"><div className="big">&#129534;</div>Todavia no generaste comprobantes.<br />Crea uno desde <b>Crear</b>.</div>
            ) : history.map((d) => (
              <div className="hist-row" key={d.id}>
                <div style={{ flex: 1 }}>
                  <div className="who">{d.client}<span className={`badge ${d.type}`}>{d.type === 'recibo' ? 'Recibo' : 'Presup.'}</span></div>
                  <div className="meta">N° {String(d.number).padStart(4, '0')} &middot; {d.date} &middot; {money(d.total)}</div>
                </div>
                <div className="hist-actions">
                  <button className="ha pdf" onClick={() => generatePDF(d)} title="Descargar PDF">PDF</button>
                  <button className="ha" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildText(d))}`, '_blank')} title="WhatsApp">&#9993;</button>
                  <button className="ha" onClick={() => duplicate(d)} title="Duplicar">&#10697;</button>
                </div>
              </div>
            ))}
            <footer className="foot">Hecho por dot<span className="dot">&bull;</span> &middot; @dot.sfco</footer>
          </>
        )}

        {tab === 'ajustes' && (
          <>
            <div className="card">
              <h2>Logo y <span className="accent">datos</span></h2>
              <div className="f logo-f">
                <label className="label">Logo (opcional)</label>
                <div className="logo-row">
                  {issuer.logo ? <img className="logo-prev" src={issuer.logo} alt="logo" /> : <div className="logo-prev empty-logo">sin logo</div>}
                  <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>{issuer.logo ? 'Cambiar' : 'Subir logo'}<input type="file" accept="image/*" onChange={onLogo} style={{ display: 'none' }} /></label>
                  {issuer.logo && <button className="btn btn-ghost" onClick={() => saveIssuer({ ...issuer, logo: '' })}>Quitar</button>}
                </div>
                <p className="hint">Se ve mejor con fondo transparente (va sobre la franja azul).</p>
              </div>
              <div className="f"><label className="label">Nombre / Negocio</label>
                <input className="inp" value={issuer.name} onChange={(e) => saveIssuer({ ...issuer, name: e.target.value })} placeholder="Tomas Griglio / Mi Negocio" /></div>
              <div className="f"><label className="label">Direccion</label>
                <input className="inp" value={issuer.address} onChange={(e) => saveIssuer({ ...issuer, address: e.target.value })} placeholder="Calle 123, San Francisco, Cordoba" /></div>
              <div className="row2">
                <div className="f"><label className="label">Telefono</label>
                  <input className="inp" type="tel" value={issuer.phone} onChange={(e) => saveIssuer({ ...issuer, phone: e.target.value })} placeholder="3492 69-7116" /></div>
                <div className="f"><label className="label">Email</label>
                  <input className="inp" type="email" value={issuer.email} onChange={(e) => saveIssuer({ ...issuer, email: e.target.value })} placeholder="hola@negocio.com" /></div>
              </div>
              <div className="row2">
                <div className="f"><label className="label">CUIT / CUIL</label>
                  <input className="inp" value={issuer.taxId} onChange={(e) => saveIssuer({ ...issuer, taxId: e.target.value })} placeholder="20-12345678-9" /></div>
                <div className="f"><label className="label">Condicion</label>
                  <select className="inp" value={issuer.taxCond} onChange={(e) => saveIssuer({ ...issuer, taxCond: e.target.value })}>
                    {TAX_CONDS.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select></div>
              </div>
            </div>
            <div className="card">
              <h2><span className="accent">Comprobantes</span></h2>
              <div className="f"><label className="label">Numero inicial</label>
                <input className="inp" type="number" inputMode="numeric" value={issuer.startNumber} onChange={(e) => saveIssuer({ ...issuer, startNumber: parseInt(e.target.value) || 1 })} />
                <p className="hint">El proximo sera el N° {String(nextNumber()).padStart(4, '0')}.</p></div>
              <div className="f" style={{ marginBottom: 0 }}><label className="label">Pie de pagina / leyenda</label>
                <textarea className="inp ta" value={issuer.footer} onChange={(e) => saveIssuer({ ...issuer, footer: e.target.value })} placeholder="Gracias por su compra. Garantia 30 dias..." /></div>
            </div>
            <footer className="foot">Hecho por dot<span className="dot">&bull;</span> &middot; @dot.sfco</footer>
          </>
        )}
      </div>

      {tab === 'crear' && (
        <div className="actions">
          <button className="btn btn-primary" onClick={emitPDF} disabled={!canSave}>Generar PDF</button>
          <button className="btn btn-ghost" onClick={emitWhatsApp} disabled={!canSave}>WhatsApp</button>
        </div>
      )}

      <nav className="bottomnav">
        <button className={tab === 'crear' ? 'on' : ''} onClick={() => setTab('crear')}>
          <span className="bn-ico">&#9998;</span><span className="bn-tx">Crear</span></button>
        <button className={tab === 'historial' ? 'on' : ''} onClick={() => setTab('historial')}>
          <span className="bn-ico">&#128220;</span><span className="bn-tx">Historial</span></button>
        <button className={tab === 'ajustes' ? 'on' : ''} onClick={() => setTab('ajustes')}>
          <span className="bn-ico">&#9881;</span><span className="bn-tx">Ajustes</span></button>
      </nav>
    </div>
  )
}
