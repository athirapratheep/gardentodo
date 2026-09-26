(() => {
  const CATEGORIES = {
    work:     { label: 'Work',     color: 'var(--work)',     hex: '#E8935F', flower: 'marigold' },
    health:   { label: 'Health',   color: 'var(--health)',   hex: '#D65B7A', flower: 'cosmos'   },
    personal: { label: 'Personal', color: 'var(--personal)', hex: '#7B9FE0', flower: 'bluebell' },
    study:    { label: 'Study',    color: 'var(--study)',    hex: '#B98FD1', flower: 'lavender' },
    other:    { label: 'Other',    color: 'var(--other)',    hex: '#F2C14E', flower: 'daisy'    }
  };

  let state = { tasks: [] };
  let currentDate = toDateKey(new Date());

  // ---------- helpers ----------

  function toDateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function offsetDateKey(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return toDateKey(d);
  }

  function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h;
  }

  function tasksForDate(date) {
    return state.tasks
      .filter((t) => t.date === date)
      .sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'));
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- flower graphics ----------

  function flowerSVG(type, hex) {
    const stem = `<path class="sway-part" d="M23 76 L23 34" stroke="#4F6B53" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    const leaf = `<path d="M23 58 Q10 54 9 44 Q20 46 23 58 Z" fill="#6B8F71"/>`;
    let head = '';
    switch (type) {
      case 'marigold':
        head = `<g class="sway-part">
          ${Array.from({ length: 8 }).map((_, i) => {
            const angle = i * 45;
            return `<ellipse cx="23" cy="34" rx="6" ry="13" fill="${hex}" transform="rotate(${angle} 23 34)"/>`;
          }).join('')}
          <circle cx="23" cy="34" r="7" fill="#F6D77A"/>
        </g>`;
        break;
      case 'cosmos':
        head = `<g class="sway-part">
          ${Array.from({ length: 5 }).map((_, i) => {
            const angle = i * 72;
            return `<ellipse cx="23" cy="26" rx="5" ry="12" fill="${hex}" transform="rotate(${angle} 23 34)"/>`;
          }).join('')}
          <circle cx="23" cy="34" r="5" fill="#F6D77A"/>
        </g>`;
        break;
      case 'bluebell':
        head = `<g class="sway-part">
          <path d="M23 30 Q10 34 10 46 Q23 44 23 30 Z" fill="${hex}"/>
          <path d="M23 22 Q34 28 30 40 Q22 36 23 22 Z" fill="${hex}" opacity="0.85"/>
          <path d="M23 20 Q14 24 16 36 Q24 32 23 20 Z" fill="${hex}" opacity="0.7"/>
        </g>`;
        break;
      case 'lavender':
        head = `<g class="sway-part">
          ${Array.from({ length: 6 }).map((_, i) => `<circle cx="${19 + (i % 2) * 8}" cy="${14 + i * 6}" r="4.5" fill="${hex}"/>`).join('')}
        </g>`;
        break;
      case 'daisy':
      default:
        head = `<g class="sway-part">
          ${Array.from({ length: 10 }).map((_, i) => {
            const angle = i * 36;
            return `<ellipse cx="23" cy="30" rx="4" ry="11" fill="#FFFFFF" stroke="#E7E7D9" stroke-width="0.5" transform="rotate(${angle} 23 34)"/>`;
          }).join('')}
          <circle cx="23" cy="34" r="6.5" fill="${hex}"/>
        </g>`;
        break;
    }
    return `<svg viewBox="0 0 46 76" xmlns="http://www.w3.org/2000/svg">${stem}${leaf}${head}</svg>`;
  }

  // ---------- rendering ----------

  function renderPlannerHeader() {
    const label = document.getElementById('plannerDateLabel');
    const today = toDateKey(new Date());
    const tomorrow = offsetDateKey(1);
    if (currentDate === today) label.textContent = "Today's plan";
    else if (currentDate === tomorrow) label.textContent = "Tomorrow's plan";
    else {
      const d = new Date(currentDate + 'T00:00:00');
      label.textContent = d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) + "'s plan";
    }
    document.querySelectorAll('.day-btn').forEach((btn) => {
      const off = Number(btn.dataset.offset);
      btn.classList.toggle('active', offsetDateKey(off) === currentDate);
    });
    document.getElementById('customDate').value = currentDate;
  }

  function renderTaskList() {
    const dayTasks = tasksForDate(currentDate);
    const list = document.getElementById('taskList');
    const planner = document.querySelector('.planner');
    list.innerHTML = '';
    planner.classList.toggle('is-empty', dayTasks.length === 0);

    for (const task of dayTasks) {
      const cat = CATEGORIES[task.category] || CATEGORIES.other;
      const li = document.createElement('li');
      li.className = 'task-row' + (task.completed ? ' done' : '');
      li.dataset.id = task.id;
      li.innerHTML = `
        <button class="task-check ${task.completed ? 'done' : ''}" aria-label="Mark complete">
          <svg viewBox="0 0 24 24" fill="none"><path d="M4 12l6 6L20 6" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <div class="task-main">
          <div class="task-title">${escapeHtml(task.title)}</div>
          <div class="task-meta">
            <span class="cat-dot" style="background:${cat.color}"></span>
            <span>${cat.label}</span>
            ${task.time ? `<span>&middot; ${task.time}</span>` : ''}
          </div>
        </div>
        <button class="task-delete" aria-label="Delete task">&times;</button>
      `;
      li.querySelector('.task-check').addEventListener('click', () => onToggleTask(task));
      li.querySelector('.task-delete').addEventListener('click', () => onDeleteTask(task));
      list.appendChild(li);
    }

    const done = dayTasks.filter((t) => t.completed).length;
    const progressText = document.getElementById('progressText');
    const progressFill = document.getElementById('progressFill');
    if (dayTasks.length === 0) {
      progressText.textContent = 'No tasks yet';
      progressFill.style.width = '0%';
    } else {
      progressText.textContent = `${done} of ${dayTasks.length} task${dayTasks.length === 1 ? '' : 's'} done`;
      progressFill.style.width = `${Math.round((done / dayTasks.length) * 100)}%`;
    }
  }

  function renderGarden(newlyCompletedId) {
    const dayTasks = tasksForDate(currentDate).filter((t) => t.completed);
    const bed = document.getElementById('flowerBed');
    const sub = document.getElementById('gardenSub');
    bed.innerHTML = '';
    sub.textContent = dayTasks.length === 0
      ? 'Finish a task to plant your first flower.'
      : `${dayTasks.length} flower${dayTasks.length === 1 ? '' : 's'} planted so far.`;

    dayTasks.forEach((task, i) => {
      const cat = CATEGORIES[task.category] || CATEGORIES.other;
      const h = hashString(task.id);
      const leftPct = 4 + (h % 92);
      const bottomPct = (h >> 8) % 18;
      const scale = 0.85 + ((h >> 4) % 30) / 100;

      const el = document.createElement('div');
      el.className = 'flower' + (task.id === newlyCompletedId ? ' growing' : '');
      el.style.left = `${leftPct}%`;
      el.style.bottom = `${bottomPct}%`;
      el.style.transform = `scale(${scale})`;
      el.style.zIndex = String(100 + i);
      el.title = task.title;
      el.innerHTML = flowerSVG(cat.flower, cat.hex);
      bed.appendChild(el);
    });
  }

  function render(newlyCompletedId) {
    renderPlannerHeader();
    renderTaskList();
    renderGarden(newlyCompletedId);
  }

  // ---------- actions ----------

  async function onToggleTask(task) {
    if (task.completed) {
      state = await window.pywebview.api.uncomplete_task(task.id);
      render();
    } else {
      state = await window.pywebview.api.complete_task(task.id);
      render(task.id);
      const cat = CATEGORIES[task.category] || CATEGORIES.other;
      showToast(`You grew a ${cat.flower} for "${task.title}" \u{1F331}`);
    }
  }

  async function onDeleteTask(task) {
    state = await window.pywebview.api.delete_task(task.id);
    render();
  }

  let toastTimer = null;
  function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
  }

  // ---------- init ----------

  async function init() {
    state = await window.pywebview.api.get_state();
    render();

    document.getElementById('addForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('taskTitle').value.trim();
      if (!title) return;
      const time = document.getElementById('taskTime').value;
      const category = document.getElementById('taskCategory').value;

      state = await window.pywebview.api.add_task({ title, time, category, date: currentDate });
      document.getElementById('taskTitle').value = '';
      document.getElementById('taskTime').value = '';
      render();
    });

    document.querySelectorAll('.day-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        currentDate = offsetDateKey(Number(btn.dataset.offset));
        render();
      });
    });

    document.getElementById('customDate').addEventListener('change', (e) => {
      if (e.target.value) {
        currentDate = e.target.value;
        render();
      }
    });
  }

  // pywebview injects window.pywebview slightly after the page loads.
  window.addEventListener('pywebviewready', init);
})();
