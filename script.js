/* ============================================
    DASHBOARD — script.js
    ============================================ */

const WMO_ICONS = { 0:'fa-sun', 1:'fa-sun', 2:'fa-cloud-sun', 3:'fa-cloud', 45:'fa-smog', 48:'fa-smog', 51:'fa-cloud-rain', 53:'fa-cloud-rain', 55:'fa-cloud-rain', 61:'fa-cloud-rain', 63:'fa-cloud-rain', 65:'fa-cloud-showers-heavy', 71:'fa-snowflake', 73:'fa-snowflake', 75:'fa-snowflake', 77:'fa-snowflake', 80:'fa-cloud-rain', 81:'fa-cloud-rain', 82:'fa-cloud-showers-heavy', 85:'fa-snowflake', 86:'fa-snowflake', 95:'fa-bolt', 96:'fa-bolt', 99:'fa-bolt' };
const WMO_DESC = { 0:'Klarer Himmel', 1:'Überwiegend klar', 2:'Teilweise bewölkt', 3:'Bedeckt', 45:'Nebel', 48:'Eisnebel', 51:'Leichter Nieselregen', 53:'Nieselregen', 55:'Starker Nieselregen', 61:'Leichter Regen', 63:'Regen', 65:'Starker Regen', 71:'Leichter Schnee', 73:'Schneefall', 75:'Starker Schneefall', 77:'Schneekörner', 80:'Leichte Schauer', 81:'Schauer', 82:'Starke Schauer', 85:'Leichte Schneeschauer', 86:'Schneeschauer', 95:'Gewitter', 96:'Gewitter mit Hagel', 99:'Starkes Gewitter' };

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
        const data = await weatherRes.json();
        const cur = data.current;
        const temp = Math.round(cur.temperature_2m);
        const icon = WMO_ICONS[cur.weather_code] || 'fa-cloud';
        const desc = WMO_DESC[cur.weather_code] || 'Unbekannt';

        const tempEl = document.getElementById('temp');
        let current = temp - 6;
        const countUp = () => {
            current++;
            tempEl.textContent = current + '°';
            if (current < temp) requestAnimationFrame(countUp);
        };
        requestAnimationFrame(countUp);

        document.getElementById('weather-desc').textContent = desc;
        document.getElementById('humidity').textContent = cur.relative_humidity_2m + '%';
        document.getElementById('wind').textContent = Math.round(cur.wind_speed_10m) + ' km/h';
        document.getElementById('city').textContent = city;
        document.getElementById('w-icon').className = `fas ${icon} weather-icon`;
    } catch(e) { console.error(e); }
}

function initWeather() {
    if (!navigator.geolocation) { getWeather(51.8947, 11.0414); return; }
    navigator.geolocation.getCurrentPosition(pos => getWeather(pos.coords.latitude, pos.coords.longitude), () => getWeather(51.8947, 11.0414));
}

function updateTime() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('date').textContent = now.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

function setTheme(name) {
    document.documentElement.setAttribute('data-theme', name);
    localStorage.setItem('theme', name);
    document.querySelectorAll('.t-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.themeName === name));
}

let todos = JSON.parse(localStorage.getItem('todos') || '[]');
function renderTodos() {
    const list = document.getElementById('todo-list');
    list.innerHTML = '';
    document.getElementById('todo-count').textContent = todos.filter(t => !t.done).length;
    todos.forEach((todo, i) => {
        const li = document.createElement('li');
        if (todo.done) li.classList.add('done');
        li.innerHTML = `<span style="flex:1" onclick="toggleTodo(${i})">${todo.text}</span><button class="del-btn" onclick="deleteTodo(${i})"><i class="fas fa-xmark"></i></button>`;
        list.appendChild(li);
    });
}
function addTodo() { const input = document.getElementById('todo-in'); const val = input.value.trim(); if (!val) return; todos.unshift({ text: val, done: false }); localStorage.setItem('todos', JSON.stringify(todos)); renderTodos(); input.value = ''; input.focus(); }
function toggleTodo(i) { todos[i].done = !todos[i].done; localStorage.setItem('todos', JSON.stringify(todos)); renderTodos(); }
function deleteTodo(i) { todos.splice(i, 1); localStorage.setItem('todos', JSON.stringify(todos)); renderTodos(); }

let links = JSON.parse(localStorage.getItem('links') || '[]');
function renderLinks() {
    const grid = document.getElementById('links-grid');
    const listModal = document.getElementById('link-list');
    grid.innerHTML = ''; listModal.innerHTML = '';
    links.forEach((link, i) => {
        const url = link.url.startsWith('http') ? link.url : 'https://' + link.url;
        const chip = document.createElement('a');
        chip.className = 'link-chip'; chip.href = url; chip.target = '_blank';
        chip.innerHTML = `<img src="https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32" onerror="this.style.display='none'"> ${link.name} <button class="link-chip-del" onclick="deleteLink(event,${i})"><i class="fas fa-xmark"></i></button>`;
        grid.appendChild(chip);
    });
}
function addLink() { const name = document.getElementById('link-name').value.trim(); const url = document.getElementById('link-url').value.trim(); if (!name || !url) return; links.push({ name, url }); localStorage.setItem('links', JSON.stringify(links)); renderLinks(); document.getElementById('link-name').value = ''; document.getElementById('link-url').value = ''; }
function deleteLink(e, i) { e.preventDefault(); e.stopPropagation(); links.splice(i, 1); localStorage.setItem('links', JSON.stringify(links)); renderLinks(); }

function toggleModal(id) { const m = document.getElementById(id); m.classList.toggle('open'); }
function closeOnOverlay(e, id) { if (e.target.id === id) toggleModal(id); }

function openApp(appScheme, webFallback) {
    if (!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) { window.open(webFallback, '_blank'); return; }
    const fallbackTimer = setTimeout(() => { window.open(webFallback, '_blank'); }, 1500);
    window.location.href = appScheme;
    window.addEventListener('blur', () => { clearTimeout(fallbackTimer); }, { once: true });
}

function initParallax() {
    let mx = 0, my = 0, cx = 0, cy = 0;
    document.addEventListener('mousemove', e => { mx = (e.clientX / window.innerWidth - 0.5) * 2; my = (e.clientY / window.innerHeight - 0.5) * 2; });
    function lerpOrbs() { cx += (mx - cx) * 0.06; cy += (my - cy) * 0.06; document.body.style.setProperty('--orb-x', `${cx * 30}px`); document.body.style.setProperty('--orb-y', `${cy * 30}px`); requestAnimationFrame(lerpOrbs); }
    lerpOrbs();
}

function initCardTilt() {
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r = card.getBoundingClientRect(); const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
            const dx = (e.clientX - cx) / (r.width / 2); const dy = (e.clientY - cy) / (r.height / 2);
            card.style.transform = `translateY(-6px) scale(1.01) perspective(600px) rotateX(${dy * -8}deg) rotateY(${dx * 8}deg)`;
        });
        card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
}

function escapeHtml(str) { const div = document.createElement('div'); div.appendChild(document.createTextNode(str)); return div.innerHTML; }

document.addEventListener('DOMContentLoaded', () => {
    updateTime(); setInterval(updateTime, 1000);
    initWeather(); setTheme(localStorage.getItem('theme') || 'dark');
    renderTodos(); renderLinks();
    initParallax(); initCardTilt();

    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    form?.addEventListener('submit', () => { setTimeout(() => { input.value = ''; input.blur(); }, 10); });
});
