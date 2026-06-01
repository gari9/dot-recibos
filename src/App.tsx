import { useState, useEffect } from 'react'

interface Item { id: string; desc: string; qty: number; price: number }
interface Issuer { name: string; detail: string }
interface Doc {
  id: string
  type: 'recibo' | 'presupuesto'
  number: number
  client: string
  items: Item[]
  total: number
  date: string
}

const money = (n: number) =>
  '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const blankItem = (): Item => ({ id: crypto.randomUUID(), desc: '', qty: 1, price: 0 })

export default function App() {
  const [tab, setTab] = useState<'crear' | 'historial'>('crear')
  const [issuer, setIssuer] = useState<Issuer>({ name: '', detail: '' })
  const [docType, setDocType] = useState<'recibo' | 'presupuesto'>('recibo')
  const [client, setClient] = useState('')
  const [items, setItems] = useState<Item[]>([blankItem()])
  const [history, setHistory] = useState<Doc[]>([])

  useEffect(() => {
    const i = localStorage.getItem('dot-recibos-issuer')
    if (i) setIssuer(JSON.parse(i))
    const h = localStorage.getItem('dot-recibos-history')
    if (h) setHistory(JSON.parse(h))
  }, [])

  const saveIssuer = (next: Issuer) => {
    setIssuer(next)
    localStorage.setItem('dot-recibos-issuer', JSON.stringify(next))
  }

  const total = items.reduce((a, it) => a + (it.qty || 0) * (it.price || 0), 0)

  const setItem = (id: string, patch: Partial<Item>) =>
    setItems((arr) => arr.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const addItem = () => setItems((arr) => [...arr, blankItem()])
  const rmItem = (id: string) =>
    setItems((arr) => (arr.length > 1 ? arr.filter((it) => it.id !== id) : arr))

  const canSave = client.trim().length > 0 && total > 0

  const buildText = (d: Doc) => {
    const head = d.type === 'recibo' ? 'RECIBO' : 'PRESUPUESTO'
    const lines = d.items
      .filter((it) => it.desc.trim())
      .map((it) => `- ${it.desc} x${it.qty}  ${money(it.qty * it.price)}`)
      .join('\n')
    return (
      `*${head} N° ${String(d.number).padStart(4, '0')}*\n` +
      (issuer.name ? `${issuer.name}\n` : '') +
      (issuer.detail ? `${issuer.detail}\n` : '') +
      `\nCliente: ${d.client}\nFecha: ${d.date}\n\n${lines}\n\n*TOTAL: ${money(d.total)}*`
    )
  }

  const persistHistory = (next: Doc[]) => {
    setHistory(next)
    localStorage.setItem('dot-recibos-history', JSON.stringify(next))
  }

  const save = (): Doc | null => {
    if (!canSave) return null
    const doc: Doc = {
      id: crypto.randomUUID(),
      type: docType,
      number: history.length + 1,
      client: client.trim(),
      items: items.filter((it) => it.desc.trim()),
      total,
      date: new Date().toLocaleDateString('es-AR'),
    }
    persistHistory([doc, ...history])
    return doc
  }

  const shareWhatsApp = () => {
    const doc = save()
    if (!doc) return
    window.open(`https://wa.me/?text=${encodeURIComponent(buildText(doc))}`, '_blank')
    reset()
  }

  const justSave = () => {
    if (save()) reset()
  }

  const reset = () => {
    setClient('')
    setItems([blankItem()])
    setTab('historial')
  }

  return (
    <div className="app">
      <div className="wrap">
        <header className="head">
          <div className="brand">
            <h1>Recibos <span className="accent">by dot</span></h1>
            <p>Recibos y presupuestos en segundos</p>
          </div>
          <span className="sig">dot<span className="dot">&bull;</span></span>
        </header>

        <div className="tabs">
          <button className={tab === 'crear' ? 'on' : ''} onClick={() => setTab('crear')}>Crear</button>
          <button className={tab === 'historial' ? 'on' : ''} onClick={() => setTab('historial')}>
            Historial{history.length ? ` (${history.length})` : ''}
          </button>
        </div>

        {tab === 'crear' ? (
          <>
            <div className="card">
              <h2>Tus <span className="accent">datos</span></h2>
              <div className="f">
                <label className="label">Nombre / Negocio</label>
                <input className="inp" value={issuer.name} onChange={(e) => saveIssuer({ ...issuer, name: e.target.value })} placeholder="Tomas Griglio / Mi Negocio" />
              </div>
              <div className="f">
                <label className="label">Contacto (tel, CUIT, dir.)</label>
                <input className="inp" value={issuer.detail} onChange={(e) => saveIssuer({ ...issuer, detail: e.target.value })} placeholder="Tel 351... · CUIT 20-..." />
                <p className="hint">Se guarda para la proxima vez.</p>
              </div>
            </div>

            <div className="card">
              <h2>Comprobante</h2>
              <div className="tabs" style={{ marginBottom: 14 }}>
                <button className={docType === 'recibo' ? 'on' : ''} onClick={() => setDocType('recibo')}>Recibo</button>
                <button className={docType === 'presupuesto' ? 'on' : ''} onClick={() => setDocType('presupuesto')}>Presupuesto</button>
              </div>
              <div className="f">
                <label className="label">Cliente</label>
                <input className="inp" value={client} onChange={(e) => setClient(e.target.value)} placeholder="Nombre del cliente" />
              </div>

              <div className="items-head">
                <span className="label">Items</span>
                <button className="add-link" onClick={addItem}>+ Agregar item</button>
              </div>
              {items.map((it) => (
                <div className="item" key={it.id}>
                  <input className="inp-sm desc" value={it.desc} onChange={(e) => setItem(it.id, { desc: e.target.value })} placeholder="Descripcion" />
                  <input className="inp-sm qty" type="number" inputMode="numeric" min="1" value={it.qty} onChange={(e) => setItem(it.id, { qty: parseFloat(e.target.value) || 0 })} placeholder="Cant" />
                  <input className="inp-sm price" type="number" inputMode="decimal" min="0" value={it.price || ''} onChange={(e) => setItem(it.id, { price: parseFloat(e.target.value) || 0 })} placeholder="Precio" />
                  <button className="rm" onClick={() => rmItem(it.id)} aria-label="Quitar">&times;</button>
                </div>
              ))}

              <div className="total-row">
                <span className="l">Total</span>
                <span className="v">{money(total)}</span>
              </div>
            </div>

            <footer className="foot">Hecho por dot<span className="dot">&bull;</span> &middot; @dot.sfco</footer>
          </>
        ) : (
          <>
            {history.length === 0 ? (
              <div className="empty">
                <div className="big">&#129534;</div>
                Todavia no generaste comprobantes.<br />Crea uno desde la pestana <b>Crear</b>.
              </div>
            ) : (
              history.map((d) => (
                <div className="hist-row" key={d.id}>
                  <div>
                    <div className="who">
                      {d.client}
                      <span className={`badge ${d.type}`}>{d.type === 'recibo' ? 'Recibo' : 'Presup.'}</span>
                    </div>
                    <div className="meta">N° {String(d.number).padStart(4, '0')} &middot; {d.date} &middot; {d.items.length} item(s)</div>
                  </div>
                  <div className="amt">{money(d.total)}</div>
                </div>
              ))
            )}
            <footer className="foot">Hecho por dot<span className="dot">&bull;</span> &middot; @dot.sfco</footer>
          </>
        )}
      </div>

      {tab === 'crear' && (
        <div className="actions">
          <button className="btn btn-primary" onClick={shareWhatsApp} disabled={!canSave}>Enviar por WhatsApp</button>
          <button className="btn btn-ghost" onClick={justSave} disabled={!canSave}>Guardar</button>
        </div>
      )}
    </div>
  )
}
