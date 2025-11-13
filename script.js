  const KEY = 'job_platforms_v1'
  let platforms = []
  let editId = null

  // default platforms (popular job sites)
  const DEFAULTS = [
   { id: 'p1', name: 'Naukri', url: 'https://www.naukri.com' },
   { id: 'p2', name: 'Indeed', url: 'https://www.indeed.co.in' },
   { id: 'p3', name: 'LinkedIn Jobs', url: 'https://www.linkedin.com/jobs' },
   { id: 'p4', name: 'Internshala', url: 'https://internshala.com' },
   { id: 'p5', name: 'Glassdoor', url: 'https://www.glassdoor.co.in' },
   { id: 'p6', name: 'CutShort', url: 'https://cutshort.io' },
   { id: 'p7', name: 'Monster India', url: 'https://www.monsterindia.com' },
   { id: 'p8', name: 'AngelList (Wellfound)', url: 'https://wellfound.com' },
   { id: 'p9', name: 'Shine', url: 'https://www.shine.com' },
   { id: 'p10', name: 'HackerEarth Jobs', url: 'https://www.hackerearth.com/jobs' }
  ]

  const el = {
   list: document.getElementById('platformList'),
   openAll: document.getElementById('openAll'),
   addBtn: document.getElementById('addBtn'),
   modal: document.getElementById('modal'),
   cancel: document.getElementById('cancel'),
   save: document.getElementById('save'),
   pName: document.getElementById('pName'),
   pLink: document.getElementById('pLink'),
   search: document.getElementById('search'),
   sortBy: document.getElementById('sortBy'),
   exportBtn: document.getElementById('exportBtn'),
   importBtn: document.getElementById('importBtn')
  }

  function uid() { return 'p_' + Math.random().toString(36).slice(2, 9) }

  function load() {
   const raw = localStorage.getItem(KEY)
   if (raw) { platforms = JSON.parse(raw) }
   else { platforms = DEFAULTS.slice(); save() }
   render()
  }

  function save() { localStorage.setItem(KEY, JSON.stringify(platforms)) }

  function render() {
   const q = el.search.value.trim().toLowerCase()
   const sort = el.sortBy.value
   let items = platforms.slice()
   if (q) items = items.filter(p => (p.name + ' ' + p.url).toLowerCase().includes(q))
   if (sort === 'name') items.sort((a, b) => a.name.localeCompare(b.name))
   if (sort === 'recent') items.sort((a, b) => (b._added || 0) - (a._added || 0))

   el.list.innerHTML = ''
   items.forEach(p => {
    const row = document.createElement('div')
    row.className = 'row'
    row.innerHTML = `
          <div class="left">
            <input type="checkbox" data-id="${p.id}" />
            <div style="display:flex;flex-direction:column">
              <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener" style="font-weight:600;color:inherit;text-decoration:none">${escapeHtml(p.name)}</a>
              <div style="font-size:13px;color:var(--muted)">${escapeHtml(p.url)}</div>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn ghost" data-action="edit" data-id="${p.id}">Edit</button>
            <button class="btn ghost" data-action="delete" data-id="${p.id}">Delete</button>
            <button class="btn" data-action="open" data-url="${escapeHtml(p.url)}">Open</button>
          </div>
        `
    el.list.appendChild(row)
   })
  }

  function escapeHtml(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }

  // open selected checkboxes
  function openSelected() {
   const checks = Array.from(document.querySelectorAll('#platformList input[type=checkbox]:checked'))
   if (checks.length === 0) { alert('Select one or more platforms to open (checkbox).'); return }
   checks.forEach(c => {
    const id = c.getAttribute('data-id')
    const p = platforms.find(x => x.id === id)
    if (p) window.open(p.url, '_blank')
   })
  }

  // open all
  el.openAll.addEventListener('click', () => {
   if (!confirm('Open all saved platforms in new tabs?')) return
   platforms.forEach(p => window.open(p.url, '_blank'))
  })

  // click handler for list (open/edit/delete/open single)
  el.list.addEventListener('click', (e) => {
   const btn = e.target.closest('button')
   if (!btn) return
   const act = btn.getAttribute('data-action')
   if (act === 'edit') openEdit(btn.getAttribute('data-id'))
   if (act === 'delete') { if (confirm('Delete this platform?')) { platforms = platforms.filter(x => x.id !== btn.getAttribute('data-id')); save(); render() } }
   if (act === 'open') window.open(btn.getAttribute('data-url'), '_blank')
  })

  // add new
  el.addBtn.addEventListener('click', () => { editId = null; el.pName.value = ''; el.pLink.value = 'https://'; el.modal.style.display = 'flex'; document.getElementById('modalTitle').textContent = 'Add Platform' })
  el.cancel.addEventListener('click', () => { el.modal.style.display = 'none' })
  el.save.addEventListener('click', () => {
   const name = el.pName.value.trim(); const url = el.pLink.value.trim()
   if (!name || !url) return alert('Name and URL are required')
   if (!/^https?:\/\//i.test(url)) return alert('Please include https:// or http:// in the URL')
   if (editId) { const idx = platforms.findIndex(x => x.id === editId); if (idx > -1) { platforms[idx].name = name; platforms[idx].url = url } }
   else { const obj = { id: uid(), name, url, _added: Date.now() }; platforms.unshift(obj) }
   save(); render(); el.modal.style.display = 'none'
  })

  function openEdit(id) { const p = platforms.find(x => x.id === id); if (!p) return; editId = id; el.pName.value = p.name; el.pLink.value = p.url; document.getElementById('modalTitle').textContent = 'Edit Platform'; el.modal.style.display = 'flex' }

  // export/import
  el.exportBtn.addEventListener('click', () => {
   const blob = new Blob([JSON.stringify(platforms, null, 2)], { type: 'application/json' })
   const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'platforms.json'; a.click(); URL.revokeObjectURL(a.href)
  })
  el.importBtn.addEventListener('click', () => {
   const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'application/json'; inp.onchange = e => {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader(); r.onload = ev => {
     try { const data = JSON.parse(ev.target.result); if (Array.isArray(data)) { const normalized = data.map(x => ({ id: x.id || uid(), name: x.name || 'Unnamed', url: x.url || '', _added: x._added || Date.now() })); platforms = normalized.concat(platforms); save(); render(); alert('Imported ' + normalized.length + ' platforms') } else alert('Invalid file') } catch (err) { alert('Failed to parse') }
    }; r.readAsText(f)
   }; inp.click()
  })

  // search and sort
  el.search.addEventListener('input', render)
  el.sortBy.addEventListener('change', render)

  // keyboard: open selected with Ctrl+O
  window.addEventListener('keydown', (e) => { if (e.ctrlKey && e.key.toLowerCase() === 'o') { e.preventDefault(); openSelected() } })

  // init
  load()