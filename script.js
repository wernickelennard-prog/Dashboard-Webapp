/* ============================================
   DASHBOARD — script.js
   ============================================ */

const WMO_ICONS = { 0:'fa-sun', 1:'fa-sun', 2:'fa-cloud-sun', 3:'fa-cloud', 45:'fa-smog', 51:'fa-cloud-rain', 61:'fa-cloud-rain', 71:'fa-snowflake', 80:'fa-cloud-rain', 95:'fa-bolt' };
const WMO_DESC = { 0:'Klarer Himmel', 1:'Überwiegend klar', 2:'Teilweise bewölkt', 3:'Bedeckt', 45:'Nebel', 51:'Leichter Niesel', 61:'Regen', 71:'Schnee', 80:'Schauer', 95:'Gewitter' };

async function getCityName(lat, lon) {
    try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=de`);
        const d = await r.json();
        return d.address?.city || d.address?.town || d.address?.village || '–';
    } catch { return '–'; }
}

async function getWeather(lat, lon) {
    try {
        const [weatherRes, city] = await Promise.all([
            fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`),
            getCityName(lat, lon)
        ]);
        const data = await weatherRes.json();
        const cur = data.current;
        document.getElementById('temp').textContent = Math.round(cur.temperature_2m) + '°';
        document.getElementById('weather-desc').textContent = WMO_DESC[cur.weather_code] || 'Unbekannt';
        document.getElementById('humidity').textContent = cur.relative_humidity_2m + '%';
        document.getElementById('wind').textContent = Math.round(cur.wind_speed_10m) + ' km/h';
        document.getElementById('city').textContent = city;
        document.getElementById('w-icon').className = `fas ${WMO_ICONS[cur.weather_code] || 'fa-cloud'} weather-icon`;
    } catch(e) { console.error(e); }
}

function initWeather() {
    navigator.geolocation.getCurrentPosition(
        pos => getWeather(pos.coords.latitude, pos.coords.longitude),
        () => getWeather(51.8947, 11.0414)
    );
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
function addTodo() { const input = document.getElementById('todo-in'); if(!input.value.trim()) return; todos.unshift({text:input.value.trim(), done:false}); localStorage.setItem('todos', JSON.stringify(todos)); renderTodos(); input.value = ''; }
function toggleTodo(i) { todos[i].done = !todos[i].done; localStorage.setItem('todos', JSON.stringify(todos)); renderTodos(); }
function deleteTodo(i) { todos.splice(i,1); localStorage.setItem('todos', JSON.stringify(todos)); renderTodos(); }

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
function addLink() { const n = document.getElementById('link-name'); const u = document.getElementById('link-url'); if(!n.value || !u.value) return; links.push({name:n.value, url:u.value}); localStorage.setItem('links', JSON.stringify(links)); renderLinks(); n.value=''; u.value=''; }
function deleteLink(e, i) { e.preventDefault(); e.stopPropagation(); links.splice(i,1); localStorage.setItem('links', JSON.stringify(links)); renderLinks(); }

function toggleModal(id) { const m = document.getElementById(id); m.classList.toggle('open'); }
function closeOnOverlay(e, id) { if(e.target.id === id) toggleModal(id); }

function openApp(appScheme, webFallback) {
    if(!/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) { window.open(webFallback, '_blank'); return; }
    const t = setTimeout(() => window.open(webFallback, '_blank'), 1500);
    window.location.href = appScheme;
    window.addEventListener('blur', () => clearTimeout(t), {once:true});
}

function initParallax() {
    let mx=0, my=0, cx=0, cy=0;
    document.addEventListener('mousemove', e => { mx=(e.clientX/window.innerWidth-0.5)*2; my=(e.clientY/window.innerHeight-0.5)*2; });
    function loop() { cx+=(mx-cx)*0.06; cy+=(my-cy)*0.06; document.body.style.setProperty('--orb-x', `${cx*30}px`); document.body.style.setProperty('--orb-y', `${cy*30}px`); requestAnimationFrame(loop); }
    loop();
}

function initCardTilt() {
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const r=card.getBoundingClientRect(), dx=(e.clientX-(r.left+r.width/2))/(r.width/2), dy=(e.clientY-(r.top+r.height/2))/(r.height/2);
            card.style.transform = `translateY(-6px) scale(1.01) perspective(600px) rotateX(${dy*-8}deg) rotateY(${dx*8}deg)`;
        });
        card.addEventListener('mouseleave', () => card.style.transform = '');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateTime(); setInterval(updateTime, 1000);
    initWeather(); setTheme(localStorage.getItem('theme') || 'dark');
    renderTodos(); renderLinks();
    initParallax(); initCardTilt();

    // SUCHE: LEEREN NACH ENTER
    const f = document.getElementById('search-form'), i = document.getElementById('search-input');
    f?.addEventListener('submit', e => {
        e.preventDefault();
        if(i.value.trim()) {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(i.value.trim())}`, '_blank');
            i.value = ''; i.blur();
        }
    });
});
