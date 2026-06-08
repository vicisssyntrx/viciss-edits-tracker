// --- Application State ---
let state = {
    supabaseUrl: localStorage.getItem('supabase_url') || '',
    supabaseKey: localStorage.getItem('supabase_key') || '',
    supabase: null,
    isConnected: false,
    isViewOnly: false,
    
    currentProjectId: null,
    projects: [],
    scheduleEntries: [],
    isEditMode: false,
    draggedRowId: null
};

// --- Default Seeding Data (Matches the 7 rows from the screenshot) ---
const DEFAULT_PROJECT_NAME = "NHKA 14-33";
const DEFAULT_ENTRIES = [
    {
        window: "8 Jun – 12 Jun",
        note: "",
        english_versions: ["E1 (N14)", "E2 (N15)"],
        english_status: "not-started",
        hindi_versions: ["H1 (N24)"],
        hindi_status: "not-started",
        position: 1.0
    },
    {
        window: "15 Jun – 19 Jun",
        note: "",
        english_versions: ["E3 (N16)", "E4 (N17)"],
        english_status: "not-started",
        hindi_versions: ["H2 (N25)"],
        hindi_status: "not-started",
        position: 2.0
    },
    {
        window: "21 Jun – 23 Jun",
        note: "24 Jun – 30 Jun Unavailable",
        english_versions: ["E5 (N18)"],
        english_status: "not-started",
        hindi_versions: ["H3 (N26)"],
        hindi_status: "not-started",
        position: 3.0
    },
    {
        window: "1 Jul – 3 Jul",
        note: "",
        english_versions: [], // empty shows N/A
        english_status: "not-started",
        hindi_versions: ["H4 (N27)", "H5 (N28)"],
        hindi_status: "not-started",
        position: 4.0
    },
    {
        window: "5 Jul – 9 Jul",
        note: "",
        english_versions: ["E6 (N19)", "E7 (N20)"],
        english_status: "not-started",
        hindi_versions: ["H6 (N29)"],
        hindi_status: "not-started",
        position: 5.0
    },
    {
        window: "12 Jul – 16 Jul",
        note: "",
        english_versions: ["E8 (N21)", "E9 (N22)"],
        english_status: "not-started",
        hindi_versions: ["H7 (N30)"],
        hindi_status: "not-started",
        position: 6.0
    },
    {
        window: "19 Jul – 23 Jul",
        note: "",
        english_versions: ["E10 (N23)"],
        english_status: "not-started",
        hindi_versions: ["H8 (N31)", "H9 (N32)", "H10 (N33)"],
        hindi_status: "not-started",
        position: 7.0
    }
];

// --- DOM Nodes Cache ---
const DOM = {
    projectTitleDisplay: document.getElementById('project-title-display'),
    connectionStatus: document.getElementById('connection-status'),
    connectionStatusText: document.getElementById('connection-status-text'),
    progressPercent: document.getElementById('progress-percent'),
    progressBarFill: document.getElementById('progress-bar-fill'),
    
    btnSaveEntry: document.getElementById('btn-save-entry'),
    btnCancelEntry: document.getElementById('btn-cancel-entry'),
    btnCancelProject: document.getElementById('btn-cancel-project'),
    
    btnSettings: document.getElementById('btn-settings'),
    btnThemeToggle: document.getElementById('btn-theme-toggle'),
    btnShareBoard: document.getElementById('btn-share-board'),
    btnAddEntry: document.getElementById('btn-add-entry'),
    btnEditList: document.getElementById('btn-edit-list'),
    btnEditListText: document.getElementById('btn-edit-list-text'),
    
    projectBar: document.getElementById('project-bar'),
    projectSelect: document.getElementById('project-select'),
    btnNewProject: document.getElementById('btn-new-project'),
    btnDeleteProject: document.getElementById('btn-delete-project'),
    editStatusBanner: document.getElementById('edit-status-banner'),
    
    scheduleRowsContainer: document.getElementById('schedule-rows-container'),
    
    summaryEnRange: document.getElementById('summary-en-range'),
    summaryHiRange: document.getElementById('summary-hi-range'),
    
    modalEntry: document.getElementById('modal-entry'),
    formEntry: document.getElementById('form-entry'),
    modalEntryTitle: document.getElementById('modal-entry-title'),
    entryIdInput: document.getElementById('entry-id-input'),
    inputWindow: document.getElementById('input-window'),
    inputNote: document.getElementById('input-note'),
    inputEnglishVersions: document.getElementById('input-english-versions'),
    inputHindiVersions: document.getElementById('input-hindi-versions'),
    
    modalProject: document.getElementById('modal-project'),
    formProject: document.getElementById('form-project'),
    inputProjectName: document.getElementById('input-project-name'),
    
    modalShare: document.getElementById('modal-share'),
    shareViewLink: document.getElementById('share-view-link'),
    shareEditLink: document.getElementById('share-edit-link'),
    shareConnectionTypeNote: document.getElementById('share-connection-type-note'),
    
    modalSettings: document.getElementById('modal-settings'),
    formSettings: document.getElementById('form-settings'),
    inputSupabaseUrl: document.getElementById('input-supabase-url'),
    inputSupabaseKey: document.getElementById('input-supabase-key'),
    settingsConnStatus: document.getElementById('settings-conn-status'),
    btnClearSupabase: document.getElementById('btn-clear-supabase'),
    btnCopySql: document.getElementById('btn-copy-sql'),
    btnCopyView: document.getElementById('btn-copy-view'),
    btnCopyEdit: document.getElementById('btn-copy-edit'),
    
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// --- Initialization ---
window.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    setupEventListeners();
    await parseUrlParams(); // Check URL sharing parameters first
    await initApp();
});

// --- Theme Manager ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const sunIcon = document.querySelector('.theme-sun');
    const moonIcon = document.querySelector('.theme-moon');
    if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

// --- Parse URL Parameters (Sharing router) ---
async function parseUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const sharedData = params.get('data');
    const projectId = params.get('project_id');
    const url = params.get('url');
    const key = params.get('key');
    
    if (mode === 'view') {
        state.isViewOnly = true;
        document.body.classList.add('view-only-active');
        // Hide edit triggers in header
        DOM.btnAddEntry.style.display = 'none';
        DOM.btnEditList.style.display = 'none';
        DOM.btnSettings.style.display = 'none';
        DOM.btnNewProject.style.display = 'none';
        DOM.btnDeleteProject.style.display = 'none';
        
        // Disable project switching visual controls
        DOM.projectSelect.disabled = true;
        
        // Update status badge
        DOM.connectionStatus.className = 'status-indicator-badge view-only';
        DOM.connectionStatusText.textContent = 'View-Only Mode';
    }
    
    // Check if shared using URL credentials (Supabase online mode)
    if (url && key) {
        state.supabaseUrl = decodeURIComponent(url);
        state.supabaseKey = decodeURIComponent(key);
        // Connect to the shared supabase instance for this session
        await connectToSupabase(state.supabaseUrl, state.supabaseKey, false);
    } else {
        // Normal offline local configuration check
        await connectToSupabase(state.supabaseUrl, state.supabaseKey, true);
    }
    
    // Parse encoded data (Offline fallback mode)
    if (sharedData) {
        try {
            const decodedJson = decodeURIComponent(escape(atob(sharedData)));
            const parsed = JSON.parse(decodedJson);
            
            if (mode === 'view') {
                // For view only, lock state to URL data directly
                state.projects = parsed.projects || [];
                state.scheduleEntries = parsed.entries || [];
                state.currentProjectId = projectId || (state.projects[0] ? state.projects[0].id : null);
                showToast("Loaded Shared View-Only Board");
            } else if (mode === 'edit') {
                // Import dialog
                const confirmImport = confirm("An editable project has been shared with you. Would you like to import it into your workspace?");
                if (confirmImport) {
                    if (state.isConnected) {
                        // Import to Supabase
                        await importProjectToDatabase(parsed);
                    } else {
                        // Import to LocalStorage
                        importProjectToLocalStorage(parsed);
                    }
                    // Clean URL params to prevent re-importing on refresh
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        } catch (e) {
            console.error("Failed to decode shared data:", e);
            showToast("Failed to parse shared link data");
        }
    } else if (projectId) {
        state.currentProjectId = projectId;
    }
}

// --- Initialize App Data ---
async function initApp() {
    if (state.isViewOnly && state.scheduleEntries.length > 0) {
        // If view-only data was already parsed from URL, render it
        renderProjects();
        renderSchedule();
        return;
    }
    
    if (state.isConnected) {
        await loadProjectsFromSupabase();
    } else {
        loadProjectsFromLocalStorage();
    }
}

// --- Supabase Connection Logic ---
async function connectToSupabase(url, key, saveToStorage = true) {
    if (!url || !key) {
        state.isConnected = false;
        updateConnectionUI();
        return;
    }
    
    try {
        state.supabase = supabase.createClient(url, key);
        
        // Simple request to test connection
        const { data, error } = await state.supabase.from('projects').select('count', { count: 'exact', head: true });
        
        if (error) throw error;
        
        state.isConnected = true;
        if (saveToStorage) {
            localStorage.setItem('supabase_url', url);
            localStorage.setItem('supabase_key', key);
            state.supabaseUrl = url;
            state.supabaseKey = key;
        }
        
        updateConnectionUI();
        setupRealtimeSubscriptions();
    } catch (e) {
        console.error("Supabase connection failed:", e);
        state.isConnected = false;
        updateConnectionUI(e.message || "Failed to reach Supabase server.");
    }
}

function updateConnectionUI(errorMessage = '') {
    if (state.isViewOnly) return;
    
    if (state.isConnected) {
        DOM.connectionStatus.className = 'status-indicator-badge online';
        DOM.connectionStatusText.textContent = 'Supabase Live Sync';
        DOM.shareConnectionTypeNote.textContent = 'Linked with Supabase. Share links will sync live across devices.';
    } else {
        DOM.connectionStatus.className = 'status-indicator-badge offline';
        DOM.connectionStatusText.textContent = 'Offline Mode';
        DOM.shareConnectionTypeNote.textContent = 'Syncing is currently handled locally. Connect Supabase in Settings for multi-device sync.';
        if (errorMessage) {
            DOM.settingsConnStatus.className = 'connection-status-panel error';
            DOM.settingsConnStatus.textContent = `Error: ${errorMessage}`;
        }
    }
}

// --- Realtime Subscriptions ---
let projectsChannel = null;
let entriesChannel = null;

function setupRealtimeSubscriptions() {
    if (!state.isConnected || !state.supabase) return;
    
    // Clean old subscriptions
    if (projectsChannel) state.supabase.removeChannel(projectsChannel);
    if (entriesChannel) state.supabase.removeChannel(entriesChannel);
    
    // Subscribe to projects table changes
    projectsChannel = state.supabase
        .channel('public:projects')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, async (payload) => {
            console.log('Realtime Projects change:', payload);
            await loadProjectsFromSupabase(false); // reload lists
        })
        .subscribe();
        
    // Subscribe to schedule_entries table changes
    entriesChannel = state.supabase
        .channel('public:schedule_entries')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_entries' }, async (payload) => {
            console.log('Realtime Entries change:', payload);
            if (payload.new && payload.new.project_id === state.currentProjectId) {
                await loadEntriesFromSupabase(state.currentProjectId);
            } else if (payload.old && payload.eventType === 'DELETE') {
                // check if deleted row was in our current list
                const idx = state.scheduleEntries.findIndex(e => e.id === payload.old.id);
                if (idx !== -1) {
                    state.scheduleEntries.splice(idx, 1);
                    renderSchedule();
                }
            }
        })
        .subscribe();
}

// --- Database Operations (Supabase Mode) ---
async function loadProjectsFromSupabase(fetchEntries = true) {
    try {
        const { data: dbProjects, error } = await state.supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        
        state.projects = dbProjects || [];
        
        if (state.projects.length === 0) {
            // Seed default project
            await seedDefaultProjectToSupabase();
        } else {
            // Set current project
            if (!state.currentProjectId || !state.projects.some(p => p.id === state.currentProjectId)) {
                state.currentProjectId = state.projects[0].id;
            }
            renderProjects();
            if (fetchEntries) {
                await loadEntriesFromSupabase(state.currentProjectId);
            }
        }
    } catch (e) {
        console.error("Failed to load projects:", e);
        showToast("Error loading projects from Supabase");
    }
}

async function loadEntriesFromSupabase(projectId) {
    try {
        const { data: dbEntries, error } = await state.supabase
            .from('schedule_entries')
            .select('*')
            .eq('project_id', projectId)
            .order('position', { ascending: true });
            
        if (error) throw error;
        
        state.scheduleEntries = dbEntries || [];
        renderSchedule();
    } catch (e) {
        console.error("Failed to load entries:", e);
        showToast("Error loading schedule items");
    }
}

async function seedDefaultProjectToSupabase() {
    try {
        // Insert project
        const { data: newProj, error: pError } = await state.supabase
            .from('projects')
            .insert({ name: DEFAULT_PROJECT_NAME })
            .select()
            .single();
            
        if (pError) throw pError;
        
        const seededEntries = DEFAULT_ENTRIES.map(e => ({
            project_id: newProj.id,
            time_frame: e.window,
            note: e.note,
            english_versions: e.english_versions,
            english_status: e.english_status,
            hindi_versions: e.hindi_versions,
            hindi_status: e.hindi_status,
            position: e.position
        }));
        
        const { error: eError } = await state.supabase
            .from('schedule_entries')
            .insert(seededEntries);
            
        if (eError) throw eError;
        
        state.currentProjectId = newProj.id;
        await loadProjectsFromSupabase(true);
        showToast("Initialized database with default NHKA schedule");
    } catch (e) {
        console.error("Seeding failed:", e);
    }
}

async function importProjectToDatabase(parsed) {
    try {
        // Insert new project
        const { data: newProj, error: pErr } = await state.supabase
            .from('projects')
            .insert({ name: parsed.projects[0]?.name || "Imported Project" })
            .select()
            .single();
            
        if (pErr) throw pErr;
        
        const entries = (parsed.entries || []).map((e, index) => ({
            project_id: newProj.id,
            time_frame: e.time_frame || e.window,
            note: e.note || '',
            english_versions: e.english_versions || [],
            english_status: e.english_status || 'not-started',
            hindi_versions: e.hindi_versions || [],
            hindi_status: e.hindi_status || 'not-started',
            position: e.position || (index + 1)
        }));
        
        if (entries.length > 0) {
            const { error: eErr } = await state.supabase
                .from('schedule_entries')
                .insert(entries);
            if (eErr) throw eErr;
        }
        
        state.currentProjectId = newProj.id;
        await loadProjectsFromSupabase(true);
        showToast("Project imported successfully into Supabase!");
    } catch (e) {
        console.error("Failed importing to Supabase:", e);
        showToast("Failed to import to database");
    }
}

// --- LocalStorage offline operations ---
function loadProjectsFromLocalStorage() {
    let savedProjects = localStorage.getItem('local_projects');
    let savedEntries = localStorage.getItem('local_schedule_entries');
    
    if (savedProjects) {
        state.projects = JSON.parse(savedProjects);
    }
    
    if (state.projects.length === 0) {
        // First initialization
        const defaultId = generateUUID();
        state.projects = [{ id: defaultId, name: DEFAULT_PROJECT_NAME }];
        state.currentProjectId = defaultId;
        
        state.scheduleEntries = DEFAULT_ENTRIES.map((e, idx) => ({
            id: `row-${idx+1}`,
            project_id: defaultId,
            ...e
        }));
        
        saveProjectsToLocalStorage();
        saveEntriesToLocalStorage();
    } else {
        if (!state.currentProjectId || !state.projects.some(p => p.id === state.currentProjectId)) {
            state.currentProjectId = state.projects[0].id;
        }
        
        if (savedEntries) {
            const allEntries = JSON.parse(savedEntries);
            state.scheduleEntries = allEntries.filter(e => e.project_id === state.currentProjectId)
                                                .sort((a, b) => a.position - b.position);
        } else {
            state.scheduleEntries = [];
        }
    }
    
    renderProjects();
    renderSchedule();
}

function saveProjectsToLocalStorage() {
    localStorage.setItem('local_projects', JSON.stringify(state.projects));
}

function saveEntriesToLocalStorage() {
    // We store all entries of all projects in one local storage array
    let allEntries = [];
    const savedEntries = localStorage.getItem('local_schedule_entries');
    if (savedEntries) {
        // Remove current project items to prevent duplication, then merge other projects
        allEntries = JSON.parse(savedEntries).filter(e => e.project_id !== state.currentProjectId);
    }
    allEntries = [...allEntries, ...state.scheduleEntries];
    localStorage.setItem('local_schedule_entries', JSON.stringify(allEntries));
}

function importProjectToLocalStorage(parsed) {
    const newProjectId = generateUUID();
    const importedProjName = parsed.projects[0]?.name || "Imported Project";
    
    state.projects.push({ id: newProjectId, name: importedProjName });
    saveProjectsToLocalStorage();
    
    const importedEntries = (parsed.entries || []).map((e, idx) => ({
        id: generateUUID(),
        project_id: newProjectId,
        window: e.time_frame || e.window,
        time_frame: e.time_frame || e.window,
        note: e.note || '',
        english_versions: e.english_versions || [],
        english_status: e.english_status || 'not-started',
        hindi_versions: e.hindi_versions || [],
        hindi_status: e.hindi_status || 'not-started',
        position: e.position || (idx + 1)
    }));
    
    // Save to local storage cache
    let allEntries = [];
    const savedEntries = localStorage.getItem('local_schedule_entries');
    if (savedEntries) allEntries = JSON.parse(savedEntries);
    allEntries = [...allEntries, ...importedEntries];
    localStorage.setItem('local_schedule_entries', JSON.stringify(allEntries));
    
    // Switch to imported
    state.currentProjectId = newProjectId;
    state.scheduleEntries = importedEntries.sort((a,b) => a.position - b.position);
    
    renderProjects();
    renderSchedule();
    showToast(`Imported project "${importedProjName}" locally!`);
}

// --- Render Operations ---
function renderProjects() {
    DOM.projectSelect.innerHTML = '';
    state.projects.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.name;
        if (p.id === state.currentProjectId) {
            opt.selected = true;
            DOM.projectTitleDisplay.textContent = `${p.name.toUpperCase()} SCHEDULE`;
        }
        DOM.projectSelect.appendChild(opt);
    });
}

function renderSchedule() {
    DOM.scheduleRowsContainer.innerHTML = '';
    
    if (state.scheduleEntries.length === 0) {
        DOM.scheduleRowsContainer.innerHTML = `
            <div class="loading-state">
                <p>No entries found. Click "+ Add Entry" to create one.</p>
            </div>`;
        updateCompletionProgress();
        updateLegendSummaries();
        return;
    }
    
    state.scheduleEntries.forEach((entry, idx) => {
        const row = document.createElement('div');
        row.className = 'row-card glass-card';
        row.id = entry.id;
        
        // Handle Drag & Drop triggers
        if (state.isEditMode) {
            row.classList.add('draggable');
            row.setAttribute('draggable', 'true');
            row.addEventListener('dragstart', handleDragStart);
            row.addEventListener('dragover', handleDragOver);
            row.addEventListener('drop', handleDrop);
            row.addEventListener('dragend', handleDragEnd);
        }
        
        // Col 1: Grip handle
        const colGrip = `
            <div class="col-grip" title="Drag to reorder">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <circle cx="9" cy="5" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="19" r="1.5"/>
                    <circle cx="15" cy="5" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="19" r="1.5"/>
                </svg>
            </div>`;
            
        // Col 2: Date window
        const noteHtml = entry.note ? `<span class="date-note">(${entry.note})</span>` : '';
        const colDate = `
            <div class="col-time-frame">
                <div class="calendar-icon-container">
                    <svg class="calendar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                </div>
                <div class="date-text-container">
                    <span class="date-main">${entry.time_frame || entry.window}</span>
                    ${noteHtml}
                </div>
            </div>`;
            
        // Col 3: English Versions
        let englishChips = '';
        if (!entry.english_versions || entry.english_versions.length === 0) {
            englishChips = '<span class="version-chip chip-empty">N/A</span>';
        } else {
            englishChips = entry.english_versions.map(v => `<span class="version-chip chip-english">${v}</span>`).join('');
        }
        const colEnVersions = `<div class="col-versions font-english-color">${englishChips}</div>`;
        
        // Col 4: English Status Dropdown
        const enStatusHtml = createStatusDropdownHtml(entry.id, 'english', entry.english_status);
        
        // Col 5: Hindi Versions
        let hindiChips = '';
        if (!entry.hindi_versions || entry.hindi_versions.length === 0) {
            hindiChips = '<span class="version-chip chip-empty">N/A</span>';
        } else {
            hindiChips = entry.hindi_versions.map(v => `<span class="version-chip chip-hindi">${v}</span>`).join('');
        }
        const colHiVersions = `<div class="col-versions font-hindi-color">${hindiChips}</div>`;
        
        // Col 6: Hindi Status Dropdown
        const hiStatusHtml = createStatusDropdownHtml(entry.id, 'hindi', entry.hindi_status);
        
        // Col 7: Actions (Edit / Delete)
        const colActions = `
            <div class="col-actions">
                <button class="btn-action" onclick="openEditEntryModal('${entry.id}')" title="Edit row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                </button>
                <button class="btn-action btn-action-delete" onclick="deleteEntry('${entry.id}')" title="Delete row">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
            </div>`;
            
        row.innerHTML = colGrip + colDate + colEnVersions + enStatusHtml + colHiVersions + hiStatusHtml + colActions;
        DOM.scheduleRowsContainer.appendChild(row);
    });
    
    updateCompletionProgress();
    updateLegendSummaries();
}

function createStatusDropdownHtml(entryId, type, statusValue) {
    const formattedStatus = (statusValue || 'not-started').toUpperCase().replace('-', ' ');
    const lockedClass = state.isViewOnly ? 'locked' : '';
    
    return `
        <div class="col-status">
            <div class="status-dropdown-pills">
                <button class="status-pill-trigger ${statusValue} ${lockedClass}" 
                        id="status-trigger-${entryId}-${type}" 
                        onclick="toggleDropdownMenu(event, '${entryId}', '${type}')">
                    <span class="status-dot-icon"></span>
                    <span>${formattedStatus}</span>
                </button>
                <div class="status-dropdown-menu" id="status-menu-${entryId}-${type}">
                    <div class="status-menu-item" onclick="selectStatusOption(event, '${entryId}', '${type}', 'not-started')">
                        <span class="status-dot dot-not-started"></span> NOT STARTED
                    </div>
                    <div class="status-menu-item" onclick="selectStatusOption(event, '${entryId}', '${type}', 'started')">
                        <span class="status-dot dot-started"></span> STARTED
                    </div>
                    <div class="status-menu-item" onclick="selectStatusOption(event, '${entryId}', '${type}', 'completed')">
                        <span class="status-dot dot-completed"></span> COMPLETED
                    </div>
                </div>
            </div>
        </div>`;
}

// --- Dropdown Interactions ---
window.toggleDropdownMenu = function(event, entryId, type) {
    event.stopPropagation();
    
    if (state.isViewOnly) return;
    
    const menu = document.getElementById(`status-menu-${entryId}-${type}`);
    const trigger = document.getElementById(`status-trigger-${entryId}-${type}`);
    const rowCard = document.getElementById(entryId);
    
    const isShowing = menu && menu.classList.contains('show');
    
    // Close other dropdowns
    closeAllDropdowns();
    
    if (menu) {
        if (!isShowing) {
            menu.classList.add('show');
            trigger.classList.add('active');
            if (rowCard) rowCard.classList.add('dropdown-open-active');
        }
    }
};

window.selectStatusOption = async function(event, entryId, type, statusValue) {
    event.stopPropagation();
    closeAllDropdowns();
    
    const idx = state.scheduleEntries.findIndex(e => e.id === entryId);
    if (idx === -1) return;
    
    const statusKey = type === 'english' ? 'english_status' : 'hindi_status';
    state.scheduleEntries[idx][statusKey] = statusValue;
    
    // Rerender row locally
    renderSchedule();
    
    // Sync change
    if (state.isConnected) {
        try {
            const { error } = await state.supabase
                .from('schedule_entries')
                .update({ [statusKey]: statusValue })
                .eq('id', entryId);
                
            if (error) throw error;
        } catch (e) {
            console.error("Database status update failed:", e);
            showToast("Failed to sync status changes");
        }
    } else {
        saveEntriesToLocalStorage();
    }
};

function closeAllDropdowns() {
    document.querySelectorAll('.status-dropdown-menu').forEach(m => m.classList.remove('show'));
    document.querySelectorAll('.status-pill-trigger').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.row-card').forEach(r => r.classList.remove('dropdown-open-active'));
}

// Close dropdowns if clicking anywhere else
document.addEventListener('click', () => {
    closeAllDropdowns();
});

// --- Progress Calculation ---
function updateCompletionProgress() {
    if (state.scheduleEntries.length === 0) {
        DOM.progressPercent.textContent = '0%';
        DOM.progressBarFill.style.width = '0%';
        return;
    }
    
    let totalPoints = 0;
    const maxPoints = state.scheduleEntries.length * 2 * 100; // 2 tracks (EN, HI) per row, 100 points max each
    
    state.scheduleEntries.forEach(e => {
        totalPoints += getStatusPoints(e.english_status);
        totalPoints += getStatusPoints(e.hindi_status);
    });
    
    const percentage = Math.round((totalPoints / maxPoints) * 100);
    DOM.progressPercent.textContent = `${percentage}%`;
    DOM.progressBarFill.style.width = `${percentage}%`;
}

function getStatusPoints(status) {
    switch (status) {
        case 'completed': return 100;
        case 'started': return 50;
        case 'not-started':
        default:
            return 0;
    }
}

// --- Legend Ranges Dynamically Calculated ---
function updateLegendSummaries() {
    let enMin = Infinity, enMax = -Infinity;
    let hiMin = Infinity, hiMax = -Infinity;
    
    let enNMin = Infinity, enNMax = -Infinity;
    let hiNMin = Infinity, hiNMax = -Infinity;
    
    const numRegex = /\d+/g;
    
    state.scheduleEntries.forEach(entry => {
        // Parse English version values
        (entry.english_versions || []).forEach(v => {
            const matches = v.match(numRegex);
            if (matches && matches.length >= 2) {
                const eNum = parseInt(matches[0]);
                const nNum = parseInt(matches[1]);
                if (!isNaN(eNum)) {
                    enMin = Math.min(enMin, eNum);
                    enMax = Math.max(enMax, eNum);
                }
                if (!isNaN(nNum)) {
                    enNMin = Math.min(enNMin, nNum);
                    enNMax = Math.max(enNMax, nNum);
                }
            }
        });
        
        // Parse Hindi version values
        (entry.hindi_versions || []).forEach(v => {
            const matches = v.match(numRegex);
            if (matches && matches.length >= 2) {
                const hNum = parseInt(matches[0]);
                const nNum = parseInt(matches[1]);
                if (!isNaN(hNum)) {
                    hiMin = Math.min(hiMin, hNum);
                    hiMax = Math.max(hiMax, hNum);
                }
                if (!isNaN(nNum)) {
                    hiNMin = Math.min(hiNMin, nNum);
                    hiNMax = Math.max(hiNMax, nNum);
                }
            }
        });
    });
    
    // Render English Span
    if (enMin !== Infinity && enMax !== -Infinity) {
        DOM.summaryEnRange.style.display = 'inline-block';
        DOM.summaryEnRange.textContent = `EN: E${enMin} - E${enMax} (N${enNMin} - ${enNMax})`;
    } else {
        DOM.summaryEnRange.style.display = 'none';
    }
    
    // Render Hindi Span
    if (hiMin !== Infinity && hiMax !== -Infinity) {
        DOM.summaryHiRange.style.display = 'inline-block';
        DOM.summaryHiRange.textContent = `HI: H${hiMin} - H${hiMax} (N${hiNMin} - ${hiNMax})`;
    } else {
        DOM.summaryHiRange.style.display = 'none';
    }
}

// --- Drag & Drop Fractional Position Reordering ---
function handleDragStart(e) {
    state.draggedRowId = this.id;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.id);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const draggingEl = document.querySelector('.dragging');
    const cards = [...DOM.scheduleRowsContainer.querySelectorAll('.row-card:not(.dragging)')];
    
    const nextCard = cards.find(card => {
        const rect = card.getBoundingClientRect();
        // Check if pointer is in the upper half of the row card
        return e.clientY < rect.top + rect.height / 2;
    });
    
    if (nextCard) {
        DOM.scheduleRowsContainer.insertBefore(draggingEl, nextCard);
    } else {
        DOM.scheduleRowsContainer.appendChild(draggingEl);
    }
}

async function handleDrop(e) {
    e.preventDefault();
    const droppedId = e.dataTransfer.getData('text/plain');
    if (!droppedId) return;
    
    const rowCards = [...DOM.scheduleRowsContainer.querySelectorAll('.row-card')];
    const newIdx = rowCards.findIndex(card => card.id === droppedId);
    
    if (newIdx === -1) return;
    
    // Calculate new position double
    let newPosition = 0;
    if (rowCards.length === 1) {
        newPosition = 1.0;
    } else if (newIdx === 0) {
        // Dropped at top, less than first
        const nextId = rowCards[1].id;
        const nextEntry = state.scheduleEntries.find(ent => ent.id === nextId);
        newPosition = nextEntry.position - 1.0;
    } else if (newIdx === rowCards.length - 1) {
        // Dropped at bottom, greater than last
        const prevId = rowCards[rowCards.length - 2].id;
        const prevEntry = state.scheduleEntries.find(ent => ent.id === prevId);
        newPosition = prevEntry.position + 1.0;
    } else {
        // Dropped between two elements
        const prevId = rowCards[newIdx - 1].id;
        const nextId = rowCards[newIdx + 1].id;
        const prevEntry = state.scheduleEntries.find(ent => ent.id === prevId);
        const nextEntry = state.scheduleEntries.find(ent => ent.id === nextId);
        newPosition = (prevEntry.position + nextEntry.position) / 2;
    }
    
    // Update local state
    const entryIdx = state.scheduleEntries.findIndex(ent => ent.id === droppedId);
    if (entryIdx !== -1) {
        state.scheduleEntries[entryIdx].position = newPosition;
    }
    
    // Sort array
    state.scheduleEntries.sort((a, b) => a.position - b.position);
    
    // Render sorted list to avoid styling glitch
    renderSchedule();
    
    // Sync change
    if (state.isConnected) {
        try {
            const { error } = await state.supabase
                .from('schedule_entries')
                .update({ position: newPosition })
                .eq('id', droppedId);
            if (error) throw error;
        } catch (err) {
            console.error("Failed reorder sync:", err);
            showToast("Failed to sync order change");
        }
    } else {
        saveEntriesToLocalStorage();
    }
}

function handleDragEnd() {
    this.classList.remove('dragging');
    state.draggedRowId = null;
}

// --- CRUD Row Modals Handlers ---
window.openEditEntryModal = function(id) {
    const entry = state.scheduleEntries.find(e => e.id === id);
    if (!entry) return;
    
    DOM.modalEntryTitle.textContent = "Edit Schedule Entry";
    DOM.entryIdInput.value = entry.id;
    DOM.inputWindow.value = entry.time_frame || entry.window;
    DOM.inputNote.value = entry.note || '';
    DOM.inputEnglishVersions.value = (entry.english_versions || []).join(', ');
    DOM.inputHindiVersions.value = (entry.hindi_versions || []).join(', ');
    
    openModal(DOM.modalEntry);
};

window.deleteEntry = async function(id) {
    if (!confirm("Are you sure you want to delete this entry?")) return;
    
    const idx = state.scheduleEntries.findIndex(e => e.id === id);
    if (idx === -1) return;
    
    state.scheduleEntries.splice(idx, 1);
    renderSchedule();
    
    if (state.isConnected) {
        try {
            const { error } = await state.supabase
                .from('schedule_entries')
                .delete()
                .eq('id', id);
            if (error) throw error;
            showToast("Row deleted");
        } catch (e) {
            console.error("Delete failed:", e);
            showToast("Failed to sync row deletion");
        }
    } else {
        saveEntriesToLocalStorage();
        showToast("Row deleted");
    }
};

// --- Form Submissions ---
DOM.formEntry.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = DOM.entryIdInput.value;
    const windowVal = DOM.inputWindow.value.trim();
    const noteVal = DOM.inputNote.value.trim();
    
    // Helper to parse tags
    const parseTags = (str) => str ? str.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    const enVersions = parseTags(DOM.inputEnglishVersions.value);
    const hiVersions = parseTags(DOM.inputHindiVersions.value);
    
    if (id) {
        // UPDATE MODE
        const idx = state.scheduleEntries.findIndex(ent => ent.id === id);
        if (idx === -1) return;
        
        state.scheduleEntries[idx].window = windowVal;
        state.scheduleEntries[idx].time_frame = windowVal;
        state.scheduleEntries[idx].note = noteVal;
        state.scheduleEntries[idx].english_versions = enVersions;
        state.scheduleEntries[idx].hindi_versions = hiVersions;
        
        renderSchedule();
        closeModal(DOM.modalEntry);
        
        if (state.isConnected) {
            try {
                const { error } = await state.supabase
                    .from('schedule_entries')
                    .update({
                        time_frame: windowVal,
                        note: noteVal,
                        english_versions: enVersions,
                        hindi_versions: hiVersions
                    })
                    .eq('id', id);
                if (error) throw error;
                showToast("Entry updated");
            } catch (err) {
                console.error("Update failed:", err);
                showToast("Failed to sync changes");
            }
        } else {
            saveEntriesToLocalStorage();
            showToast("Entry updated");
        }
    } else {
        // ADD MODE
        let lastPos = 0;
        if (state.scheduleEntries.length > 0) {
            lastPos = state.scheduleEntries[state.scheduleEntries.length - 1].position;
        }
        const newPos = lastPos + 1.0;
        
        const newEntry = {
            id: generateUUID(),
            project_id: state.currentProjectId,
            window: windowVal,
            time_frame: windowVal,
            note: noteVal,
            english_versions: enVersions,
            english_status: 'not-started',
            hindi_versions: hiVersions,
            hindi_status: 'not-started',
            position: newPos
        };
        
        state.scheduleEntries.push(newEntry);
        renderSchedule();
        closeModal(DOM.modalEntry);
        
        if (state.isConnected) {
            try {
                const { error } = await state.supabase
                    .from('schedule_entries')
                    .insert({
                        project_id: state.currentProjectId,
                        time_frame: windowVal,
                        note: noteVal,
                        english_versions: enVersions,
                        english_status: 'not-started',
                        hindi_versions: hiVersions,
                        hindi_status: 'not-started',
                        position: newPos
                    });
                if (error) throw error;
                await loadEntriesFromSupabase(state.currentProjectId); // reload to get DB assigned UUID
                showToast("New entry created");
            } catch (err) {
                console.error("Insert failed:", err);
                showToast("Failed to sync new entry");
            }
        } else {
            saveEntriesToLocalStorage();
            showToast("New entry created");
        }
    }
});

// --- Modal Utilities ---
function openModal(modalEl) {
    modalEl.classList.add('show');
}

function closeModal(modalEl) {
    modalEl.classList.remove('show');
}

// --- Event Listeners Bindings ---
function setupEventListeners() {
    // Modal Close buttons
    document.querySelectorAll('.btn-close, .modal-backdrop').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target === btn || btn.classList.contains('btn-close')) {
                const openModal = document.querySelector('.modal-backdrop.show');
                if (openModal) closeModal(openModal);
            }
        });
    });
    
    // Stop backdrop close if clicking form content
    document.querySelectorAll('.modal-content').forEach(content => {
        content.addEventListener('click', (e) => e.stopPropagation());
    });
    
    // Add Entry trigger
    DOM.btnAddEntry.addEventListener('click', () => {
        if (state.isViewOnly) return;
        DOM.modalEntryTitle.textContent = "Add Schedule Entry";
        DOM.formEntry.reset();
        DOM.entryIdInput.value = '';
        openModal(DOM.modalEntry);
    });
    
    DOM.btnCancelEntry.addEventListener('click', () => closeModal(DOM.modalEntry));
    DOM.btnCancelProject.addEventListener('click', () => closeModal(DOM.modalProject));
    
    // Edit List Toggle
    DOM.btnEditList.addEventListener('click', () => {
        if (state.isViewOnly) return;
        state.isEditMode = !state.isEditMode;
        
        const appContainer = document.querySelector('.app-container');
        
        if (state.isEditMode) {
            appContainer.classList.add('edit-mode-active');
            DOM.editStatusBanner.style.display = 'flex';
            DOM.btnEditList.classList.add('btn-primary');
            DOM.btnEditList.classList.remove('btn-secondary');
            DOM.btnEditListText.textContent = 'DONE EDITING';
        } else {
            appContainer.classList.remove('edit-mode-active');
            DOM.editStatusBanner.style.display = 'none';
            DOM.btnEditList.classList.remove('btn-primary');
            DOM.btnEditList.classList.add('btn-secondary');
            DOM.btnEditListText.textContent = 'EDIT LIST';
        }
        
        renderSchedule(); // re-render to activate/deactivate drag hooks
    });
    
    // Project switcher
    DOM.projectSelect.addEventListener('change', async (e) => {
        state.currentProjectId = e.target.value;
        const selectedProj = state.projects.find(p => p.id === state.currentProjectId);
        if (selectedProj) {
            DOM.projectTitleDisplay.textContent = `${selectedProj.name.toUpperCase()} SCHEDULE`;
        }
        
        if (state.isConnected) {
            await loadEntriesFromSupabase(state.currentProjectId);
        } else {
            const savedEntries = localStorage.getItem('local_schedule_entries');
            if (savedEntries) {
                state.scheduleEntries = JSON.parse(savedEntries)
                    .filter(ent => ent.project_id === state.currentProjectId)
                    .sort((a, b) => a.position - b.position);
            } else {
                state.scheduleEntries = [];
            }
            renderSchedule();
        }
    });
    
    // Add new project modal trigger
    DOM.btnNewProject.addEventListener('click', () => {
        if (state.isViewOnly) return;
        DOM.formProject.reset();
        openModal(DOM.modalProject);
    });
    
    // Create project form submit
    DOM.formProject.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pName = DOM.inputProjectName.value.trim();
        if (!pName) return;
        
        closeModal(DOM.modalProject);
        
        if (state.isConnected) {
            try {
                const { data: newProj, error } = await state.supabase
                    .from('projects')
                    .insert({ name: pName })
                    .select()
                    .single();
                    
                if (error) throw error;
                
                // Seed new project with default template structure for convenience
                const seededEntries = DEFAULT_ENTRIES.map(ent => ({
                    project_id: newProj.id,
                    time_frame: ent.window,
                    note: ent.note,
                    english_versions: ent.english_versions,
                    english_status: ent.english_status,
                    hindi_versions: ent.hindi_versions,
                    hindi_status: ent.hindi_status,
                    position: ent.position
                }));
                
                const { error: eError } = await state.supabase
                    .from('schedule_entries')
                    .insert(seededEntries);
                    
                if (eError) throw eError;
                
                state.currentProjectId = newProj.id;
                await loadProjectsFromSupabase(true);
                showToast(`Created project "${pName}" with template schedule`);
            } catch (err) {
                console.error("Project insert failed:", err);
                showToast("Failed to create project in database");
            }
        } else {
            // Local mode
            const pId = generateUUID();
            state.projects.push({ id: pId, name: pName });
            saveProjectsToLocalStorage();
            
            // Seed defaults locally
            const localSeeds = DEFAULT_ENTRIES.map((ent, idx) => ({
                id: generateUUID(),
                project_id: pId,
                ...ent
            }));
            
            state.scheduleEntries = localSeeds;
            saveEntriesToLocalStorage();
            
            state.currentProjectId = pId;
            renderProjects();
            renderSchedule();
            showToast(`Created project "${pName}" locally`);
        }
    });
    
    // Delete project trigger
    DOM.btnDeleteProject.addEventListener('click', async () => {
        if (state.isViewOnly) return;
        const currentProj = state.projects.find(p => p.id === state.currentProjectId);
        if (!currentProj) return;
        
        if (!confirm(`Are you absolutely sure you want to delete the project "${currentProj.name}"? This deletes all associated schedule records permanently.`)) return;
        
        if (state.isConnected) {
            try {
                const { error } = await state.supabase
                    .from('projects')
                    .delete()
                    .eq('id', state.currentProjectId);
                    
                if (error) throw error;
                
                state.currentProjectId = null;
                await loadProjectsFromSupabase(true);
                showToast("Project deleted from database");
            } catch (err) {
                console.error("Project delete failed:", err);
                showToast("Failed to delete project");
            }
        } else {
            // Local delete
            state.projects = state.projects.filter(p => p.id !== state.currentProjectId);
            saveProjectsToLocalStorage();
            
            // Clean local entries cache
            const savedEntries = localStorage.getItem('local_schedule_entries');
            if (savedEntries) {
                const filtered = JSON.parse(savedEntries).filter(e => e.project_id !== state.currentProjectId);
                localStorage.setItem('local_schedule_entries', JSON.stringify(filtered));
            }
            
            state.currentProjectId = state.projects[0] ? state.projects[0].id : null;
            if (!state.currentProjectId) {
                // reset to default if all deleted
                localStorage.removeItem('local_projects');
                localStorage.removeItem('local_schedule_entries');
                loadProjectsFromLocalStorage();
            } else {
                loadProjectsFromLocalStorage();
            }
            showToast("Project deleted locally");
        }
    });
    
    // Settings modal trigger
    DOM.btnSettings.addEventListener('click', () => {
        if (state.isViewOnly) return;
        DOM.inputSupabaseUrl.value = state.supabaseUrl;
        DOM.inputSupabaseKey.value = state.supabaseKey;
        DOM.settingsConnStatus.style.display = 'none';
        openModal(DOM.modalSettings);
    });
    
    DOM.btnResetSettingsClose = document.getElementById('btn-close-settings');
    DOM.btnResetSettingsClose.addEventListener('click', () => closeModal(DOM.modalSettings));
    
    // Disconnect Supabase settings trigger
    DOM.btnClearSupabase.addEventListener('click', () => {
        if (confirm("Disconnect database sync and switch back to LocalStorage offline mode?")) {
            localStorage.removeItem('supabase_url');
            localStorage.removeItem('supabase_key');
            state.supabaseUrl = '';
            state.supabaseKey = '';
            state.supabase = null;
            state.isConnected = false;
            
            closeModal(DOM.modalSettings);
            updateConnectionUI();
            
            // Reload local
            loadProjectsFromLocalStorage();
            showToast("Switched back to offline LocalStorage mode");
        }
    });
    
    // Supabase Connect submission
    DOM.formSettings.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = DOM.inputSupabaseUrl.value.trim();
        const key = DOM.inputSupabaseKey.value.trim();
        
        DOM.settingsConnStatus.className = 'connection-status-panel';
        DOM.settingsConnStatus.style.display = 'block';
        DOM.settingsConnStatus.textContent = 'Testing connection...';
        
        await connectToSupabase(url, key, true);
        
        if (state.isConnected) {
            DOM.settingsConnStatus.className = 'connection-status-panel success';
            DOM.settingsConnStatus.textContent = 'Connected successfully! Sync active.';
            showToast("Connected to Supabase. Database sync online!");
            
            // Wait slightly so they see connection check, then close
            setTimeout(async () => {
                closeModal(DOM.modalSettings);
                await initApp();
            }, 1000);
        } else {
            // Error handling is handled in updateConnectionUI
            DOM.settingsConnStatus.className = 'connection-status-panel error';
            DOM.settingsConnStatus.textContent = 'Connection failed. Please check your Supabase URL & Anon Key.';
        }
    });
    
    // Theme toggle
    DOM.btnThemeToggle.addEventListener('click', () => {
        const curr = document.documentElement.getAttribute('data-theme');
        setTheme(curr === 'dark' ? 'light' : 'dark');
    });
    
    // Share Board button trigger
    DOM.btnShareBoard.addEventListener('click', () => {
        let viewUrl = '';
        let editUrl = '';
        
        if (state.isConnected) {
            // Online Mode share links (references database uuid)
            const origin = window.location.origin + window.location.pathname;
            const encodedUrl = encodeURIComponent(state.supabaseUrl);
            const encodedKey = encodeURIComponent(state.supabaseKey);
            
            viewUrl = `${origin}?mode=view&project_id=${state.currentProjectId}&url=${encodedUrl}&key=${encodedKey}`;
            editUrl = `${origin}?mode=edit&project_id=${state.currentProjectId}&url=${encodedUrl}&key=${encodedKey}`;
        } else {
            // Offline Mode share links (encodes the entire project data base64 into the URL)
            const origin = window.location.origin + window.location.pathname;
            const currentProj = state.projects.find(p => p.id === state.currentProjectId);
            const projectWrap = {
                projects: [currentProj],
                entries: state.scheduleEntries
            };
            
            const stringified = JSON.stringify(projectWrap);
            // Safe unicode base64 encoding
            const base64 = btoa(unescape(encodeURIComponent(stringified)));
            
            viewUrl = `${origin}?mode=view&project_id=${state.currentProjectId}&data=${base64}`;
            editUrl = `${origin}?mode=edit&project_id=${state.currentProjectId}&data=${base64}`;
        }
        
        DOM.shareViewLink.value = viewUrl;
        DOM.shareEditLink.value = editUrl;
        
        openModal(DOM.modalShare);
    });
    
    // Copy buttons
    DOM.btnCopyView.addEventListener('click', () => {
        copyToClipboard(DOM.shareViewLink.value);
        showToast("View-Only link copied to clipboard!");
    });
    
    DOM.btnCopyEdit.addEventListener('click', () => {
        copyToClipboard(DOM.shareEditLink.value);
        showToast("Edit link copied to clipboard!");
    });
    
    DOM.btnCopySql.addEventListener('click', () => {
        const sqlText = document.getElementById('sql-schema-text').textContent;
        copyToClipboard(sqlText);
        showToast("SQL script copied!");
    });
}

// --- Utilities ---
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
    } else {
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
    }
}

function showToast(message) {
    DOM.toastMessage.textContent = message;
    DOM.toast.classList.add('show');
    
    setTimeout(() => {
        DOM.toast.classList.remove('show');
    }, 3000);
}
