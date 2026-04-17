/* ============================================
   DASHBOARD — script.js
   Vollständig neu geschrieben
   ============================================ */

// ─── WETTER ───────────────────────────────────
// Open-Meteo: 100% kostenlos, kein API-Key, kein CORS-Problem

const WMO_ICONS = {
    0:'fa-sun', 1:'fa-sun', 2:'fa-cloud-sun', 3:'fa-cloud',
    45:'fa-smog', 48:'fa-smog',
    51:'fa-cloud-rain', 53:'fa-cloud-rain', 55:'fa-cloud-rain',
    61:'fa-cloud-rain', 63:'fa-cloud-rain', 65:'fa-cloud-showers-heavy',
    71:'fa-snowflake', 73:'fa-snowflake', 75:'fa-snowflake', 77:'fa-snowflake',
    80:'fa-cloud-rain', 81:'fa-cloud-rain', 82:'fa-cloud-showers-heavy',
    85:'fa-snowflake', 86:'fa-snowflake',
    95:'fa-bolt', 96:'fa-bolt', 99:'fa-bolt'
};

const WMO_DESC = {
    0:'Klarer Himmel', 1:'Überwiegend klar', 2:'Teilweise bewölkt', 3:'Bedeckt',
    45:'Nebel', 48:'Eisnebel',
    51:'Leichter Nieselregen', 53:'Nieselregen', 55:'Starker Nieselregen',
    61:'Leichter Regen', 63:'Regen', 65:'Starker Regen',
    71:'Leichter Schnee', 73:'Schneefall', 75:'Starker Schneefall', 77:'Schneekörner',
    80:'Leichte Schauer', 81:'Schauer', 82:'Starke Schauer',
    85:'Leichte Schneeschauer', 86:'Schneeschauer',
    95:'Gewitter', 96:'Gewitter mit Hagel', 99:'Starkes Gewitter'
};

async function getCityName(lat, lon) {
    try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=de`);
        const d = await r.json();
        return d.address?.city || d.address?.town || d.address?.village || d.address?.county || '–';
    } catch { return '–'; }
}

async function getWeather(lat, lon) {
    try {
        const [weatherRes, city] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&wind_speed_unit=kmh&timezone=auto`),
            getCityName(lat, lon)
        ]);
        const data   = await weatherRes.json();
        const cur    = data.current;
        const temp   = Math.round(cur.temperature_2m);
        const code   = cur.weather_code;
        const icon   = WMO_ICONS[code] || 'fa-cloud';
        const desc   = WMO_DESC[code]  || 'Unbekannt';

        // Animierter Temperatur-Count-Up
        const tempEl = document.getElementById('temp');
        let current  = temp - 6;
        const countUp = () => {
            current++;
            tempEl.textContent = current + '°';
            if (current < temp) requestAnimationFrame(countUp);
        };
        requestAnimationFrame(countUp);

        document.getElementById('weather-desc').textContent = desc;
        document.getElementById('humidity').textContent     = cur.relative_humidity_2m + '%';
        document.getElementById('wind').textContent         = Math.round(cur.wind_speed_10m) + ' km/h';
        document.getElementById('city').textContent         = city;
        document.getElementById('w-icon').className         = `fas ${icon} weather-icon`;
    } catch(e) {
        document.getElementById('weather-desc').textContent = 'Nicht verfügbar';
        console.error('Wetter-Fehler:', e);
    }
}

function initWeather() {
    if (!navigator.geolocation) {
        getWeather(51.8947, 11.0414); // Fallback: Halberstadt
        return;
    }
    navigator.geolocation.getCurrentPosition(
        pos => getWeather(pos.coords.latitude, pos.coords.longitude),
        ()  => getWeather(51.8947, 11.0414)
    );
}

// ─── ZEIT ─────────────────────────────────────
function updateTime() {
    const now = new Date();
    document.getElementById('clock').textContent =
        now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('date').textContent =
        now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

// ─── THEME ────────────────────────────────────
function setTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    localStorage.setItem('theme', name);
    // Aktiven Button markieren
    document.querySelectorAll('.t-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.themeName === name);
    });
}

// ─── TODO ─────────────────────────────────────
let todos = JSON.parse(localStorage.getItem('todos') || '[]');

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
}

function renderTodos() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    const open = todos.filter(t => !t.done);
    document.getElementById('todo-count').textContent = open.length;

    todos.forEach((todo, i) => {
        const li = document.createElement('li');
        if (todo.done) li.classList.add('done');
        li.innerHTML = `
            <span style="flex:1" onclick="toggleTodo(${i})">${escapeHtml(todo.text)}</span>
            <button class="del-btn" onclick="deleteTodo(${i})"><i class="fas fa-xmark"></i></button>
        `;
        // Klick auf die Zeile selbst (außer del-btn)
        li.addEventListener('click', e => {
            if (!e.target.closest('.del-btn')) toggleTodo(i);
        });
        list.appendChild(li);
    });
}

function addTodo() {
    const input = document.getElementById('todo-in');
    const val = input.value.trim();
    if (!val) return;
    todos.unshift({ text: val, done: false });
    saveTodos();
    renderTodos();
    input.value = '';
    input.focus();
}

function toggleTodo(i) {
    todos[i].done = !todos[i].done;
    saveTodos();
    renderTodos();
}

function deleteTodo(i) {
    todos.splice(i, 1);
    saveTodos();
    renderTodos();
}

// ─── LINKS ────────────────────────────────────
let links = JSON.parse(localStorage.getItem('links') || '[]');

function saveLinks() {
    localStorage.setItem('links', JSON.stringify(links));
}

function getFavicon(url) {
    try {
        const host = new URL(url.startsWith('http') ? url : 'https://' + url).hostname;
        return `https://www.google.com/s2/favicons?domain=${host}&sz=32`;
    } catch {
        return null;
    }
}

function normalizeUrl(url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return 'https://' + url;
    }
    return url;
}

function renderLinks() {
    const grid = document.getElementById('links-grid');
    const listModal = document.getElementById('link-list');
    grid.innerHTML = '';
    listModal.innerHTML = '';

    links.forEach((link, i) => {
        const url = normalizeUrl(link.url);
        const favicon = getFavicon(url);

        // Chip im Dashboard
        const chip = document.createElement('a');
        chip.className = 'link-chip';
        chip.href = url;
        chip.target = '_blank';
        chip.rel = 'noopener';
        chip.innerHTML = `
            ${favicon ? `<img src="${favicon}" onerror="this.style.display='none'" alt="">` : '<i class="fas fa-link" style="font-size:0.75rem"></i>'}
            ${escapeHtml(link.name)}
            <button class="link-chip-del" onclick="deleteLink(event,${i})"><i class="fas fa-xmark"></i></button>
        `;
        grid.appendChild(chip);

        // Zeile im Modal
        const item = document.createElement('div');
        item.className = 'link-list-item';
        item.innerHTML = `
            ${favicon ? `<img src="${favicon}" onerror="this.style.display='none'" style="width:18px;height:18px;border-radius:4px" alt="">` : ''}
            <a href="${url}" target="_blank" rel="noopener">${escapeHtml(link.name)}</a>
            <span style="color:var(--text-dim);font-size:0.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px">${escapeHtml(link.url)}</span>
            <button onclick="deleteLink(event,${i})"><i class="fas fa-trash"></i></button>
        `;
        listModal.appendChild(item);
    });
}

function addLink() {
    const name = document.getElementById('link-name').value.trim();
    const url  = document.getElementById('link-url').value.trim();
    if (!name || !url) return;
    links.push({ name, url });
    saveLinks();
    renderLinks();
    document.getElementById('link-name').value = '';
    document.getElementById('link-url').value = '';
}

function deleteLink(e, i) {
    e.preventDefault();
    e.stopPropagation();
    links.splice(i, 1);
    saveLinks();
    renderLinks();
}

// ─── MODAL ────────────────────────────────────
function toggleModal(id) {
    const m = document.getElementById(id);
    const isOpen = m.classList.contains('open');
    // Alle schließen
    document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('open'));
    if (!isOpen) m.classList.add('open');
}

function closeOnOverlay(e, id) {
    if (e.target.id === id) toggleModal(id);
}

// Escape mit ESC-Taste
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('open'));
    }
});

// ─── HILFSFUNKTIONEN ──────────────────────────
function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

// ─── APP DEEP LINKS ───────────────────────────
// Versucht die App zu öffnen — schlägt es fehl, geht der Browser auf
function openApp(appScheme, webFallback) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) {
        window.open(webFallback, '_blank');
        return;
    }
    // Fallback nach 1.5 Sekunden falls App nicht installiert
    const fallbackTimer = setTimeout(() => {
        window.open(webFallback, '_blank');
    }, 1500);
    // App öffnen
    window.location.href = appScheme;
    // Wenn App sich öffnet verliert die Seite den Focus → Timer stoppen
    window.addEventListener('blur', () => {
        clearTimeout(fallbackTimer);
    }, { once: true });
}

// ─── PARALLAX MOUSEMOVE ───────────────────────
function initParallax() {
    let mouseX = 0, mouseY = 0;
    let currentX = 0, currentY = 0;

    document.addEventListener('mousemove', e => {
        mouseX = (e.clientX / window.innerWidth  - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    });

    // Smooth lerp loop for the background orbs
    function lerpOrbs() {
        currentX += (mouseX - currentX) * 0.06;
        currentY += (mouseY - currentY) * 0.06;
        const ox = currentX * 30;
        const oy = currentY * 30;
        document.body.style.setProperty('--orb-x', `${ox}px`);
        document.body.style.setProperty('--orb-y', `${oy}px`);
        requestAnimationFrame(lerpOrbs);
    }
    lerpOrbs();
}

// ─── 3D CARD TILT ─────────────────────────────
function initCardTilt() {
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect   = card.getBoundingClientRect();
            const cx     = rect.left + rect.width  / 2;
            const cy     = rect.top  + rect.height / 2;
            const dx     = (e.clientX - cx) / (rect.width  / 2);
            const dy     = (e.clientY - cy) / (rect.height / 2);
            const tiltX  = dy * -8;   // max 8deg
            const tiltY  = dx *  8;
            card.style.transform = `translateY(-6px) scale(1.01) perspective(600px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ─── INIT ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Zeit
    updateTime();
    setInterval(updateTime, 1000);

    // Wetter (alle 10 Minuten neu laden)
    initWeather();
    setInterval(initWeather, 600_000);

    // Theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTheme(savedTheme);

    // Todos & Links
    renderTodos();
    renderLinks();

    // Enter im Link-Modal
    ['link-name', 'link-url'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', e => {
            if (e.key === 'Enter') addLink();
        });
    });

    // Animationen
    initParallax();
    initCardTilt();

});

// ─── SUCHE & VERLAUF ──────────────────────────
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const historyCont = document.getElementById('search-history');

function saveSearch(query) {
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    // Filtert Duplikate raus und setzt das neue Element nach vorne
    history = [query, ...history.filter(item => item !== query)].slice(0, 5);
    localStorage.setItem('searchHistory', JSON.stringify(history));
    renderSearchHistory();
}

function renderSearchHistory() {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    if (history.length === 0) {
        historyCont.innerHTML = "";
        return;
    }
    
    historyCont.innerHTML = history.map(item => `
        <div class="history-item" onclick="executeSearch('${item}')">
            <i class="fas fa-history"></i>
            <span>${item}</span>
        </div>
    `).join('');
}

function executeSearch(query) {
    if (!query) return;
    saveSearch(query);
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank');
    
    // Feld leeren - das war dein Hauptwunsch!
    searchInput.value = "";
    searchInput.blur(); // Optional: Fokus vom Feld nehmen
}

// Event Listener für das Formular
searchForm?.addEventListener('submit', (e) => {
    e.preventDefault(); // Verhindert das Neuladen der Seite
    executeSearch(searchInput.value.trim());
});

// Initialisierung beim Laden (in deinen DOMContentLoaded-Block einfügen)
renderSearchHistory();

