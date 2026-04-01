// ── ROUTING ──
function navigate(tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const page = document.getElementById('page-' + tab);
  const navEl = document.getElementById('nav-' + tab);
  if (page) page.classList.add('active');
  if (navEl) navEl.classList.add('active');
  location.hash = tab;
}

window.addEventListener('hashchange', () => {
  const tab = location.hash.slice(1) || 'protocols';
  navigate(tab);
});

window.addEventListener('DOMContentLoaded', () => {
  const tab = location.hash.slice(1) || 'protocols';
  navigate(tab);
  initProtocols();
  initLiterature();
  initData();
  initCalendar();
});

// ── LOCAL STORAGE HELPERS ──
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

// ══════════════════════════════════════════
// PROTOCOLS
// ══════════════════════════════════════════
const DEFAULT_PROTOCOLS = [
  {
    id: 1, title: 'scRNA-seq: 10x Chromium Cell Capture',
    category: 'scRNA-seq',
    time: '~6 h',
    reagents: '10x Chromium Controller, Gel Beads, Partitioning Oil',
    notes: 'Keep cells on ice at all times. Target 5,000–10,000 cells/µL. Count with trypan blue before loading.',
    steps: [
      { title: 'Cell suspension prep', desc: 'Prepare single-cell suspension at 700–1,200 cells/µL in PBS + 0.04% BSA. Remove doublets and debris by FACS if possible.' },
      { title: 'Chip loading', desc: 'Load cells, Gel Beads, and Partitioning Oil onto the Chromium Chip. Run the Controller on the appropriate setting.' },
      { title: 'GEM generation & barcoding', desc: 'Incubate at 53°C for 45 min (RT), then 85°C for 5 min to release mRNA and initiate reverse transcription.' },
      { title: 'cDNA amplification', desc: 'Clean up Post-GEM RT-Cleanup beads, then PCR-amplify cDNA. Typically 12–14 cycles.' },
      { title: 'Library construction', desc: 'Fragment, A-tail, and ligate sequencing adapters. Perform sample index PCR (6–8 cycles).' },
      { title: 'QC and sequencing', desc: 'Check library with Bioanalyzer (expected ~400 bp peak). Sequence at ≥20,000 reads/cell.' }
    ]
  },
  {
    id: 2, title: 'CITE-seq: Antibody Conjugation & Staining',
    category: 'CITE-seq',
    time: '~3 h',
    reagents: 'TotalSeq antibodies, 10x 3\' CITE-seq kit, oligo-conjugated antibodies',
    notes: 'Titrate each antibody individually. Use an antibody panel ≤ 50 targets to avoid signal saturation.',
    steps: [
      { title: 'Cell blocking', desc: 'Block Fc receptors with Human TruStain FcX for 10 min on ice in FACS buffer.' },
      { title: 'Antibody staining', desc: 'Incubate cells with TotalSeq antibody cocktail for 30 min on ice at recommended concentrations.' },
      { title: 'Washing', desc: 'Wash 3× with cold PBS + 2% BSA. Keep volumes and centrifugation consistent across samples.' },
      { title: 'Cell resuspension', desc: 'Resuspend cells in PBS + 0.04% BSA for 10x loading. Count and assess viability (>85% required).' },
      { title: 'GEM generation', desc: 'Load as standard 10x Chromium run. Both mRNA and ADT oligos will be captured.' }
    ]
  },
  {
    id: 3, title: 'Seurat: Standard scRNA-seq Analysis',
    category: 'Bioinformatics',
    time: 'Variable',
    reagents: 'R ≥4.2, Seurat ≥4.0, cellranger output (filtered_feature_bc_matrix/)',
    notes: 'Adjust nFeature_RNA and percent.mt thresholds per dataset. Use SCTransform for datasets with high technical variance.',
    steps: [
      { title: 'Load data', desc: 'Read10X() → CreateSeuratObject(). Filter: nFeature_RNA 200–5000, percent.mt < 20.' },
      { title: 'Normalization', desc: 'NormalizeData() with log-normalization, scale factor 10,000. Or use SCTransform() for regressing out MT%.' },
      { title: 'Feature selection', desc: 'FindVariableFeatures(nfeatures = 2000). Inspect top variable genes.' },
      { title: 'Scaling & PCA', desc: 'ScaleData() on variable features, then RunPCA(npcs = 50). Check ElbowPlot to choose dims.' },
      { title: 'Clustering', desc: 'FindNeighbors(dims = 1:20) → FindClusters(resolution = 0.5). Try multiple resolutions.' },
      { title: 'UMAP & annotation', desc: 'RunUMAP(dims = 1:20). Annotate clusters using FindAllMarkers() and known marker genes.' }
    ]
  }
];

function initProtocols() {
  let protocols = load('protocols', DEFAULT_PROTOCOLS);
  renderProtocols(protocols, 'all');

  document.getElementById('proto-filter-all').addEventListener('click', () => filterProtocols('all', protocols));
  document.getElementById('proto-filter-scrna').addEventListener('click', () => filterProtocols('scRNA-seq', protocols));
  document.getElementById('proto-filter-cite').addEventListener('click', () => filterProtocols('CITE-seq', protocols));
  document.getElementById('proto-filter-bio').addEventListener('click', () => filterProtocols('Bioinformatics', protocols));

  document.getElementById('proto-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const filtered = protocols.filter(p => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    renderProtocols(filtered, currentProtoFilter);
  });

  document.getElementById('btn-add-protocol').addEventListener('click', () => {
    document.getElementById('form-add-protocol').classList.toggle('open');
  });

  document.getElementById('proto-form-cancel').addEventListener('click', () => {
    document.getElementById('form-add-protocol').classList.remove('open');
  });

  document.getElementById('proto-form-save').addEventListener('click', () => {
    const title    = document.getElementById('pf-title').value.trim();
    const category = document.getElementById('pf-category').value;
    const time     = document.getElementById('pf-time').value.trim();
    const reagents = document.getElementById('pf-reagents').value.trim();
    const notes    = document.getElementById('pf-notes').value.trim();
    if (!title) return;
    const newP = { id: Date.now(), title, category, time, reagents, notes, steps: [] };
    protocols = [newP, ...protocols];
    save('protocols', protocols);
    renderProtocols(protocols, 'all');
    document.getElementById('form-add-protocol').classList.remove('open');
    document.getElementById('pf-title').value = '';
  });
}

let currentProtoFilter = 'all';
function filterProtocols(cat, protocols) {
  currentProtoFilter = cat;
  document.querySelectorAll('.proto-filter-btn').forEach(b => b.classList.remove('active'));
  const activeId = cat === 'all' ? 'proto-filter-all' :
    cat === 'scRNA-seq' ? 'proto-filter-scrna' :
    cat === 'CITE-seq'  ? 'proto-filter-cite'  : 'proto-filter-bio';
  document.getElementById(activeId)?.classList.add('active');
  const filtered = cat === 'all' ? protocols : protocols.filter(p => p.category === cat);
  renderProtocols(filtered, cat);
}

const CAT_COLORS = { 'scRNA-seq': 'green', 'CITE-seq': 'blue', 'Bioinformatics': 'purple' };

function renderProtocols(protocols, cat) {
  const container = document.getElementById('protocols-list');
  if (!protocols.length) {
    container.innerHTML = '<div class="empty-state">No protocols found.</div>';
    return;
  }
  container.innerHTML = protocols.map(p => {
    const color = CAT_COLORS[p.category] || 'gray';
    const stepsHtml = p.steps.map((s, i) => `
      <div class="protocol-step">
        <div class="step-num">${i + 1}</div>
        <div class="step-content"><h4>${s.title}</h4><p>${s.desc}</p></div>
      </div>`).join('');
    return `
    <div class="card" style="margin-bottom:1rem">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:0.75rem">
        <div>
          <h3>${p.title}</h3>
          <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;align-items:center">
            <span class="badge badge-${color}">${p.category}</span>
            ${p.time ? `<span style="font-size:12px;color:var(--text-3)">⏱ ${p.time}</span>` : ''}
          </div>
        </div>
      </div>
      ${p.reagents ? `<p style="font-size:12.5px;color:var(--text-2);margin-bottom:0.75rem"><strong>Reagents:</strong> ${p.reagents}</p>` : ''}
      ${p.steps.length ? `<details><summary style="cursor:pointer;font-size:13px;color:var(--accent);font-weight:500;margin-bottom:0.5rem">View ${p.steps.length} steps</summary>${stepsHtml}</details>` : ''}
      ${p.notes ? `<p style="font-size:12.5px;color:var(--text-2);margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--border-light)">📝 ${p.notes}</p>` : ''}
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════
// LITERATURE
// ══════════════════════════════════════════
const DEFAULT_PAPERS = [
  {
    id: 1,
    title: 'Integrated analysis of multimodal single-cell data',
    authors: 'Hao Y, Hao S, Andersen-Nissen E, et al.',
    journal: 'Cell, 2021 · DOI: 10.1016/j.cell.2021.04.048',
    abstract: 'Introduces Weighted Nearest Neighbor (WNN) analysis in Seurat v4 for joint analysis of RNA and protein modalities in CITE-seq.',
    tags: ['Seurat', 'CITE-seq', 'multimodal', 'WNN'],
    category: 'Methods',
    url: 'https://doi.org/10.1016/j.cell.2021.04.048'
  },
  {
    id: 2,
    title: 'SCANPY: large-scale single-cell gene expression data analysis',
    authors: 'Wolf FA, Angerer P, Theis FJ.',
    journal: 'Genome Biology, 2018 · DOI: 10.1186/s13059-017-1382-0',
    abstract: 'Python-based toolkit for analysing single-cell gene expression data. Scales to more than one million cells.',
    tags: ['Python', 'scanpy', 'scRNA-seq', 'large-scale'],
    category: 'Methods',
    url: 'https://doi.org/10.1186/s13059-017-1382-0'
  },
  {
    id: 3,
    title: 'Immunological memory to SARS-CoV-2 assessed for up to 8 months after infection',
    authors: 'Dan JM, Mateus J, Kato Y, et al.',
    journal: 'Science, 2021 · DOI: 10.1126/science.abf4063',
    abstract: 'Longitudinal analysis of B cells, T cells, and antibody responses in COVID-19 convalescents showing durable immune memory.',
    tags: ['COVID-19', 'B cells', 'T cells', 'immune memory'],
    category: 'Immunology',
    url: 'https://doi.org/10.1126/science.abf4063'
  },
  {
    id: 4,
    title: 'A single-cell atlas of the tumor and immune ecosystem of human breast cancer',
    authors: 'Wu SZ, Al-Eryani G, Roden DL, et al.',
    journal: 'Nature Genetics, 2021 · DOI: 10.1038/s41588-021-00911-1',
    abstract: 'Single-cell transcriptomic profiling of breast tumors revealing cell-type composition, tumor–immune interactions and clinical relevance.',
    tags: ['tumor immunology', 'breast cancer', 'TME', 'scRNA-seq'],
    category: 'Immunology',
    url: 'https://doi.org/10.1038/s41588-021-00911-1'
  }
];

function initLiterature() {
  let papers = load('papers', DEFAULT_PAPERS);
  renderPapers(papers, 'all');

  document.getElementById('lit-search').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    const f = papers.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.authors.toLowerCase().includes(q) ||
      p.tags.join(' ').toLowerCase().includes(q)
    );
    renderPapers(f, currentLitFilter);
  });

  ['all', 'Methods', 'Immunology', 'Review'].forEach(cat => {
    const id = 'lit-filter-' + cat.toLowerCase();
    document.getElementById(id)?.addEventListener('click', () => {
      currentLitFilter = cat;
      document.querySelectorAll('.lit-filter-btn').forEach(b => b.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      const f = cat === 'all' ? papers : papers.filter(p => p.category === cat);
      renderPapers(f, cat);
    });
  });

  document.getElementById('btn-add-paper').addEventListener('click', () => {
    document.getElementById('form-add-paper').classList.toggle('open');
  });

  document.getElementById('paper-form-cancel').addEventListener('click', () => {
    document.getElementById('form-add-paper').classList.remove('open');
  });

  document.getElementById('paper-form-save').addEventListener('click', () => {
    const title    = document.getElementById('lf-title').value.trim();
    const authors  = document.getElementById('lf-authors').value.trim();
    const journal  = document.getElementById('lf-journal').value.trim();
    const abstract = document.getElementById('lf-abstract').value.trim();
    const url      = document.getElementById('lf-url').value.trim();
    const category = document.getElementById('lf-category').value;
    const tags     = document.getElementById('lf-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    if (!title) return;
    papers = [{ id: Date.now(), title, authors, journal, abstract, url, category, tags }, ...papers];
    save('papers', papers);
    renderPapers(papers, 'all');
    document.getElementById('form-add-paper').classList.remove('open');
    document.getElementById('lf-title').value = '';
  });
}

let currentLitFilter = 'all';
const LIT_CAT_COLORS = { Methods: 'blue', Immunology: 'green', Review: 'orange' };

function renderPapers(papers, cat) {
  const container = document.getElementById('papers-list');
  if (!papers.length) { container.innerHTML = '<div class="empty-state">No papers found.</div>'; return; }
  container.innerHTML = papers.map(p => {
    const color = LIT_CAT_COLORS[p.category] || 'gray';
    return `
    <div class="paper-card" style="margin-bottom:1rem">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem">
        <h3>${p.title}</h3>
        <span class="badge badge-${color}" style="flex-shrink:0;margin-top:2px">${p.category || 'Other'}</span>
      </div>
      <div class="authors">${p.authors}</div>
      <div class="journal">${p.journal}</div>
      ${p.abstract ? `<p class="abstract">${p.abstract}</p>` : ''}
      <div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:2px">
        ${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <div class="actions">
        ${p.url ? `<a href="${p.url}" target="_blank" class="btn">↗ Open DOI</a>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════
// DATA
// ══════════════════════════════════════════
const DEFAULT_DATASETS = [
  {
    id: 1,
    name: 'PBMCs 10k (10x Genomics)',
    type: 'scRNA-seq',
    cells: '11,769',
    description: 'Human PBMCs from a healthy donor. Standard benchmark dataset. Available from the 10x Genomics website.',
    tags: ['PBMC', 'human', 'healthy donor', 'benchmark'],
    path: 'data/pbmc10k/',
    url: 'https://www.10xgenomics.com/datasets/10k-human-pbmcs-3-v3-1-chromium-x-with-intronic-reads-3-1-standard'
  },
  {
    id: 2,
    name: 'Tumor-Infiltrating Lymphocytes – Breast Cancer',
    type: 'scRNA-seq',
    cells: '~47,000',
    description: 'Single-cell atlas of TILs from breast cancer patients (Wu et al. Nature Genetics, 2021). Contains T cells, B cells, myeloid cells, and more.',
    tags: ['TIL', 'breast cancer', 'T cells', 'myeloid'],
    path: 'data/breast_tils/',
    url: 'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE176078'
  },
  {
    id: 3,
    name: 'COVID-19 PBMC Time Course',
    type: 'CITE-seq',
    cells: '~260,000',
    description: 'Multi-modal CITE-seq data from COVID-19 patients at multiple disease severities and time points. Includes 228 antibodies.',
    tags: ['COVID-19', 'CITE-seq', 'multimodal', 'longitudinal'],
    path: 'data/covid_cite/',
    url: 'https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE164378'
  }
];

function initData() {
  let datasets = load('datasets', DEFAULT_DATASETS);
  renderDatasets(datasets);

  document.getElementById('btn-add-dataset').addEventListener('click', () => {
    document.getElementById('form-add-dataset').classList.toggle('open');
  });

  document.getElementById('dataset-form-cancel').addEventListener('click', () => {
    document.getElementById('form-add-dataset').classList.remove('open');
  });

  document.getElementById('dataset-form-save').addEventListener('click', () => {
    const name        = document.getElementById('df-name').value.trim();
    const type        = document.getElementById('df-type').value;
    const cells       = document.getElementById('df-cells').value.trim();
    const description = document.getElementById('df-desc').value.trim();
    const path        = document.getElementById('df-path').value.trim();
    const url         = document.getElementById('df-url').value.trim();
    const tags        = document.getElementById('df-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    if (!name) return;
    datasets = [{ id: Date.now(), name, type, cells, description, path, url, tags }, ...datasets];
    save('datasets', datasets);
    renderDatasets(datasets);
    document.getElementById('form-add-dataset').classList.remove('open');
    document.getElementById('df-name').value = '';
  });

  // stats
  document.getElementById('stat-datasets').textContent = datasets.length;
  const types = [...new Set(datasets.map(d => d.type))];
  document.getElementById('stat-types').textContent = types.length;
}

const TYPE_COLORS = { 'scRNA-seq': 'green', 'CITE-seq': 'blue', 'Bulk RNA-seq': 'orange', 'ATAC-seq': 'purple', 'Other': 'gray' };

function renderDatasets(datasets) {
  document.getElementById('stat-datasets').textContent = datasets.length;
  const container = document.getElementById('datasets-list');
  container.innerHTML = datasets.map(d => {
    const color = TYPE_COLORS[d.type] || 'gray';
    return `
    <div class="dataset-card">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem">
        <h3>${d.name}</h3>
        <span class="badge badge-${color}" style="flex-shrink:0">${d.type}</span>
      </div>
      ${d.cells ? `<p class="meta">🔬 ${d.cells} cells</p>` : ''}
      <p class="meta">${d.description}</p>
      <div class="tags">${d.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>
      ${d.path ? `<p class="meta" style="font-family:'DM Mono',monospace;font-size:11px;margin-top:4px">📁 ${d.path}</p>` : ''}
      <div style="display:flex;gap:8px;margin-top:4px">
        ${d.url ? `<a href="${d.url}" target="_blank" class="btn">↗ Source</a>` : ''}
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════
// CALENDAR
// ══════════════════════════════════════════
const DEFAULT_EVENTS = [
  { id: 1, title: 'Lab Meeting', date: getRelDate(3),  time: '10:00', type: 'meeting',  location: 'Seminar Room A', notes: 'Bring progress update slides' },
  { id: 2, title: 'Journal Club', date: getRelDate(7), time: '14:00', type: 'seminar',  location: 'Building C', notes: 'Presenting: Wu et al. 2021' },
  { id: 3, title: 'Abstract Deadline', date: getRelDate(12), time: '23:59', type: 'deadline', location: '', notes: 'EMBL single-cell symposium abstract' },
  { id: 4, title: 'Institute Retreat', date: getRelDate(18), time: '09:00', type: 'social', location: 'Conference Center', notes: 'Pack for 2 nights' },
  { id: 5, title: 'Supervisor Meeting', date: getRelDate(1), time: '11:00', type: 'meeting', location: 'Office 3.14', notes: '' }
];

function getRelDate(daysAhead) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_SHORT = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
let calYear, calMonth;

function initCalendar() {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();

  let events = load('events', DEFAULT_EVENTS);
  renderCalendar(events);
  renderEvents(events);

  document.getElementById('cal-prev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar(load('events', DEFAULT_EVENTS));
  });

  document.getElementById('cal-next').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar(load('events', DEFAULT_EVENTS));
  });

  document.getElementById('btn-add-event').addEventListener('click', () => {
    document.getElementById('form-add-event').classList.toggle('open');
  });

  document.getElementById('event-form-cancel').addEventListener('click', () => {
    document.getElementById('form-add-event').classList.remove('open');
  });

  document.getElementById('event-form-save').addEventListener('click', () => {
    const title    = document.getElementById('ef-title').value.trim();
    const date     = document.getElementById('ef-date').value;
    const time     = document.getElementById('ef-time').value;
    const type     = document.getElementById('ef-type').value;
    const location = document.getElementById('ef-location').value.trim();
    const notes    = document.getElementById('ef-notes').value.trim();
    if (!title || !date) return;
    events = [{ id: Date.now(), title, date, time, type, location, notes }, ...events];
    save('events', events);
    renderCalendar(events);
    renderEvents(events);
    document.getElementById('form-add-event').classList.remove('open');
    document.getElementById('ef-title').value = '';
  });
}

function renderCalendar(events) {
  const label = document.getElementById('cal-month-label');
  label.textContent = `${MONTHS[calMonth]} ${calYear}`;

  const grid = document.getElementById('cal-grid');
  const firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  // Offset for Mon-start (getDay(): 0=Sun,1=Mon,...6=Sat) → shift so Mon=0
  let startOffset = firstDay === 0 ? 6 : firstDay - 1;

  const eventDates = new Set(
    events.filter(e => {
      const d = new Date(e.date + 'T00:00:00');
      return d.getFullYear() === calYear && d.getMonth() === calMonth;
    }).map(e => parseInt(e.date.slice(-2)))
  );

  let html = DAYS_SHORT.map(d => `<div class="cal-header">${d}</div>`).join('');

  // Prev month filler
  const prevDays = new Date(calYear, calMonth, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month"><span>${prevDays - i}</span></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear();
    const hasEvent = eventDates.has(d);
    html += `<div class="cal-day${isToday ? ' today' : ''}${hasEvent ? ' has-event' : ''}"><span>${d}</span></div>`;
  }

  // Next month filler
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;
  let nextDay = 1;
  for (let i = startOffset + daysInMonth; i < totalCells; i++) {
    html += `<div class="cal-day other-month"><span>${nextDay++}</span></div>`;
  }

  grid.innerHTML = html;
}

const TYPE_CLASSES = { meeting: '', seminar: 'seminar', deadline: 'deadline', social: 'social' };
const TYPE_LABELS = { meeting: 'Lab meeting', seminar: 'Seminar', deadline: 'Deadline', social: 'Social' };
const TYPE_BADGE_COLORS = { meeting: 'green', seminar: 'purple', deadline: 'orange', social: 'blue' };

function renderEvents(events) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcoming = events
    .filter(e => new Date(e.date + 'T00:00:00') >= now)
    .sort((a, b) => a.date.localeCompare(b.date));

  const container = document.getElementById('events-list');
  if (!upcoming.length) {
    container.innerHTML = '<div class="empty-state">No upcoming events. Add one above!</div>';
    return;
  }

  container.innerHTML = upcoming.map(e => {
    const d = new Date(e.date + 'T00:00:00');
    const dayNum = d.getDate();
    const mon = MONTHS[d.getMonth()].slice(0, 3).toUpperCase();
    const typeClass = TYPE_CLASSES[e.type] || '';
    const badgeColor = TYPE_BADGE_COLORS[e.type] || 'gray';
    return `
    <div class="event-item ${typeClass}">
      <div class="event-date-block">
        <div class="day">${dayNum}</div>
        <div class="mon">${mon}</div>
      </div>
      <div class="event-info">
        <h4>${e.title} <span class="badge badge-${badgeColor}" style="margin-left:5px">${TYPE_LABELS[e.type] || e.type}</span></h4>
        <p>${e.time ? e.time + ' · ' : ''}${e.location || 'No location specified'}</p>
        ${e.notes ? `<p style="margin-top:3px;font-style:italic">${e.notes}</p>` : ''}
      </div>
    </div>`;
  }).join('');
}
