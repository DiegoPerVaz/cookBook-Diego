# PhD Lab Notebook — Diego

A personal website for tracking lab protocols, relevant literature, important datasets, and institute events.

## Features

- **Protocols** — Step-by-step scRNA-seq, CITE-seq, and bioinformatics protocols with filterable categories
- **Literature** — Paper library with search, tags, DOI links, and category filters
- **Data** — Dataset tracker with metadata, local paths, source URLs, and useful resource links
- **Calendar** — Monthly calendar view + upcoming events list with colour-coded event types

All data is stored in your **browser's localStorage** — no backend needed.

## Setup for GitHub Pages

1. **Replace this repo's content** with the files in this folder (keep the existing git history).
2. In your GitHub repo, go to **Settings → Pages**.
3. Under "Source", select **Branch: main** (or `master`) and folder **/ (root)**.
4. Click **Save**. Your site will be live at `https://diegopervaz.github.io/cookBook-Diego` within a minute.

## Folder structure

```
cookBook-Diego/
├── index.html          ← main page (all 4 tabs)
├── css/
│   └── style.css
├── js/
│   └── app.js
└── README.md
```

## Customising

### Add a protocol, paper, dataset, or event
Click the **+ Add** button on any tab — everything is saved in your browser automatically.

### Change default content
Edit the `DEFAULT_PROTOCOLS`, `DEFAULT_PAPERS`, `DEFAULT_DATASETS`, and `DEFAULT_EVENTS` arrays at the top of `js/app.js`.

### Reset data
Open browser DevTools → Application → Local Storage → clear the relevant keys (`protocols`, `papers`, `datasets`, `events`).
