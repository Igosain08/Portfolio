console.log("IT’S ALIVE!");

// Define all site pages
const pages = [
  { url: 'index.html', title: 'Home' },
  { url: 'projects/index.html', title: 'Projects' },
  { url: 'contact/index.html', title: 'Contact' },
  { url: 'resume/index.html', title: 'Resume' },
  { url: 'https://github.com/Igosain08', title: 'GitHub' },
];

// Detect environment: localhost or GitHub Pages
const BASE_PATH = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "/"
  : "/Portfolio/"; // 🔁 Replace with your actual GitHub repo name

// Create and insert nav
let nav = document.createElement('nav');
document.body.prepend(nav);

// Loop through pages and build links
for (let p of pages) {
  let url = p.url;
  let title = p.title;

  // Add BASE_PATH to relative URLs
  if (!url.startsWith('http')) {
    url = BASE_PATH + url;
  }

  // Create <a> tag
  let a = document.createElement('a');
  a.href = url;
  a.textContent = title;

  // Add "current" class if this is the current page
  a.classList.toggle(
    'current',
    a.host === location.host && a.pathname === location.pathname
  );

  // Open external links in a new tab
  a.toggleAttribute('target', a.host !== location.host);

  // Add to nav
  nav.append(a);
}
document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select>
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );
  const isDarkMode = matchMedia('(prefers-color-scheme: dark)').matches;
  console.log(`Your system prefers ${isDarkMode ? 'Dark' : 'Light'} mode`);
// STEP 4: Dark mode switch functionality
const select = document.querySelector('.color-scheme select');

function setColorScheme(colorScheme) {
  // Set the CSS property
  document.documentElement.style.setProperty('color-scheme', colorScheme);

  // Update dropdown
  select.value = colorScheme;

  // Save to localStorage
  localStorage.colorScheme = colorScheme;
}

// On change → update color scheme
select.addEventListener('input', (event) => {
  setColorScheme(event.target.value);
});

// On page load → use saved preference if it exists
if ("colorScheme" in localStorage) {
  setColorScheme(localStorage.colorScheme);
}
const form = document.querySelector('form');

form?.addEventListener('submit', function (event) {
  event.preventDefault(); // prevent weird default mailto behavior

  const data = new FormData(form);
  const params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  const mailtoURL = `${form.action}?${params.join('&')}`;
  console.log("Opening email with:", mailtoURL);

  location.href = mailtoURL;
});

