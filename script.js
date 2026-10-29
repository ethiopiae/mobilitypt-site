// Mobile menu
const menuBtn = document.getElementById('menu-btn');
const nav = document.getElementById('main-nav');
menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', open);
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  menuBtn.querySelector('use').setAttribute('href', open ? '#i-close' : '#i-menu');
});
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    nav.classList.remove('open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.querySelector('use').setAttribute('href', '#i-menu');
  }
});

// Open / closed badge, using clinic time (Pacific). Both clinics: Mon-Thu 8am-7pm.
function clinicStatus() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t).value;
  const day = get('weekday');
  const mins = (Number(get('hour')) % 24) * 60 + Number(get('minute'));
  const openDays = ['Mon', 'Tue', 'Wed', 'Thu'];
  if (openDays.includes(day) && mins >= 8 * 60 && mins < 19 * 60) {
    return { open: true, text: 'Open until 7 pm' };
  }
  let next = 'Opens Monday 8 am';
  if (openDays.includes(day) && mins < 8 * 60) next = 'Opens today 8 am';
  else if (['Mon', 'Tue', 'Wed'].includes(day)) next = 'Opens tomorrow 8 am';
  return { open: false, text: next };
}
const status = clinicStatus();
document.querySelectorAll('[data-status]').forEach((el) => {
  el.textContent = status.text;
  el.classList.add(status.open ? 'is-open' : 'is-closed');
});

// Request form (mockup only: not connected yet)
const form = document.getElementById('req-form');
const msg = document.getElementById('form-msg');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  let ok = true;
  form.querySelectorAll('[required]').forEach((input) => {
    const bad = !input.value.trim();
    input.setAttribute('aria-invalid', bad);
    if (bad) ok = false;
  });
  msg.textContent = ok
    ? 'Mockup only: this form is not connected yet. On the live site, the clinic would get this request.'
    : 'Please fill in your name and phone number.';
});
