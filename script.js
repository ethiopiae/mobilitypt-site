// Mobile menu
const menuBtn = document.getElementById('menu-btn');
const nav = document.getElementById('main-nav');
function setMenu(open) {
  nav.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menuBtn.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
}
menuBtn.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

// Clinic time (Pacific). Both clinics: Mon-Thu 8am-7pm.
const OPEN_DAYS = ['Mon', 'Tue', 'Wed', 'Thu'];
function pacificNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  return {
    weekday: get('weekday'),
    y: Number(get('year')), m: Number(get('month')), d: Number(get('day')),
    mins: (Number(get('hour')) % 24) * 60 + Number(get('minute')),
  };
}

// Open / closed badge
(function () {
  const now = pacificNow();
  let open = false;
  let text = 'Opens Monday 8 am';
  if (OPEN_DAYS.includes(now.weekday) && now.mins >= 480 && now.mins < 1140) {
    open = true;
    text = 'Open now until 7 pm';
  } else if (OPEN_DAYS.includes(now.weekday) && now.mins < 480) {
    text = 'Opens today 8 am';
  } else if (['Mon', 'Tue', 'Wed'].includes(now.weekday)) {
    text = 'Opens tomorrow 8 am';
  }
  document.querySelectorAll('[data-status]').forEach((el) => {
    el.textContent = text;
    el.classList.add(open ? 'is-open' : 'is-closed');
  });
})();

// Tabs
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => {
      const on = t === tab;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on);
      document.getElementById(t.dataset.tab).hidden = !on;
    });
  });
});

// Booking mockup: sample openings for the next 8 clinic days
const dayRow = document.getElementById('day-row');
const timeRow = document.getElementById('time-row');
const bookForm = document.getElementById('book-form');
const bookMsg = document.getElementById('book-msg');
const SLOTS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
let pick = { day: null, time: null };

function clinicDays(count) {
  const now = pacificNow();
  const days = [];
  const date = new Date(Date.UTC(now.y, now.m - 1, now.d, 12));
  while (days.length < count) {
    date.setUTCDate(date.getUTCDate() + 1);
    const wd = date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' });
    if (OPEN_DAYS.includes(wd)) days.push(new Date(date));
  }
  return days;
}
const fmtDay = (d) => d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' });
const fmtTime = (h) => `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'pm' : 'am'}`;
const clinic = () => bookForm.querySelector('input[name=clinic]:checked').value;

function slotTaken(dayIdx, h) {
  const seed = dayIdx * 13 + h * 17 + (clinic() === 'Tustin' ? 29 : 58);
  let t = seed + 0x6D2B79F5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) % 10 < 3;
}

function renderDays() {
  dayRow.innerHTML = '';
  clinicDays(8).forEach((d, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.setAttribute('aria-pressed', pick.day === i);
    b.innerHTML = `${d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' })}<small>${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}</small>`;
    b.addEventListener('click', () => { pick = { day: i, time: null, date: d }; renderDays(); renderTimes(); });
    dayRow.appendChild(b);
  });
}

function renderTimes() {
  if (pick.day === null) return;
  timeRow.innerHTML = '';
  SLOTS.forEach((h) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = fmtTime(h);
    b.disabled = slotTaken(pick.day, h);
    b.setAttribute('aria-pressed', pick.time === h);
    b.addEventListener('click', () => { pick.time = h; renderTimes(); });
    timeRow.appendChild(b);
  });
}

bookForm.querySelectorAll('input[name=clinic]').forEach((r) => r.addEventListener('change', () => {
  pick.time = null;
  renderTimes();
}));
renderDays();

function checkRequired(form) {
  let ok = true;
  form.querySelectorAll('[required]').forEach((input) => {
    const bad = !input.value.trim();
    input.setAttribute('aria-invalid', bad);
    if (bad) ok = false;
  });
  return ok;
}

bookForm.addEventListener('submit', (e) => {
  e.preventDefault();
  bookMsg.classList.remove('ok');
  if (pick.day === null || pick.time === null) {
    bookMsg.textContent = 'Please pick a day and a time.';
    return;
  }
  if (!checkRequired(bookForm)) {
    bookMsg.textContent = 'Please fill in your name and mobile phone.';
    return;
  }
  bookMsg.classList.add('ok');
  bookMsg.textContent = `You're booked at our ${clinic()} clinic on ${fmtDay(pick.date)} at ${fmtTime(pick.time)}. We'll call to confirm your insurance. (Mockup: nothing was sent.)`;
});

// Call-back form (mockup only)
const callForm = document.getElementById('call-form');
const callMsg = document.getElementById('call-msg');
callForm.addEventListener('submit', (e) => {
  e.preventDefault();
  callMsg.classList.remove('ok');
  if (!checkRequired(callForm)) {
    callMsg.textContent = 'Please fill in your name and phone number.';
    return;
  }
  callMsg.classList.add('ok');
  callMsg.textContent = 'Thanks! We will call you back during clinic hours. (Mockup: nothing was sent.)';
});
