console.log("IT'S ALIVE!");


function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}


let pages = [
  { url: "", title: "Home" },
  { url: "projects/", title: "Projects" },
  { url: "contact/", title: "Contact" },
  { url: "resume/", title: "Resume" },
  { url: "Meta/", title: 'Meta'},
  { url: "https://github.com/Igosain08", title: "GitHub" }
];

const BASE_PATH =
  location.hostname === "localhost" || location.hostname === "127.0.0.1"
    ? "/"
    : "/Portfolio/"; // 

let nav = document.createElement("nav");
document.body.prepend(nav);

for (let p of pages) {
    let url = p.url;
    let title = p.title;
  
    url = !url.startsWith("http") ? BASE_PATH + url : url;
  
    let a = document.createElement("a");
    a.href = url;
    a.textContent = title;
  
    a.classList.toggle(
      "current",
      a.host === location.host && a.pathname === location.pathname
    );
  
    if (a.host !== location.host) {
      a.target = "_blank";
    }
  
    nav.append(a);
  }

  document.body.insertAdjacentHTML(
    'afterbegin',
    `
    <label class="color-scheme">
      Theme:
      <select id="theme-select">
        <option value="light dark">Automatic</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    `
  );

  const select = document.querySelector("#theme-select");

if ("colorScheme" in localStorage) {
  const savedScheme = localStorage.colorScheme;
  document.documentElement.style.setProperty("color-scheme", savedScheme);
  select.value = savedScheme;
}

select.addEventListener("input", function (event) {
  const value = event.target.value;
  console.log("Color scheme changed to", value);
  document.documentElement.style.setProperty("color-scheme", value);
  localStorage.colorScheme = value;
});

const form = document.querySelector("form");

form?.addEventListener("submit", function (event) {
  event.preventDefault(); 

  const data = new FormData(form);
  let url = form.action + "?";
  const params = [];

  for (let [name, value] of data) {
    params.push(`${name}=${encodeURIComponent(value)}`);
  }

  url += params.join("&");

  location.href = url;
});

export async function fetchJSON(url) {
  try {
    // Fetch the JSON file from the given URL
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch projects: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching or parsing JSON data:', error);
  }
}

export function renderProjects(projects, containerElement, headingLevel = 'h2') {
  containerElement.innerHTML = '';

  const countDisplay = document.querySelector('.projects-title');
  if (countDisplay) {
    countDisplay.textContent = projects.length;
  }
  
  for (const project of projects) {
    const article = document.createElement('article');

    if (project.link) {
      // For projects with links, wrap the entire card
      article.innerHTML = `
      <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="project-link">
        <${headingLevel}>${project.title}</${headingLevel}>
        <img src="${project.image}" alt="${project.title}">
        <div>
          <p>${project.description}</p>
          <p class="year">c. ${project.year}</p>
          <p class="view-project">🔗 View Project</p>
        </div>
      </a>
      `;
    } else {
      // For projects without links, use standard layout
      article.innerHTML = `
        <${headingLevel}>${project.title}</${headingLevel}>
        <img src="${project.image}" alt="${project.title}">
        <div>
          <p>${project.description}</p>
          <p class="year">c. ${project.year}</p>
        </div>
      `;
    }

    containerElement.appendChild(article);
  }
}

export async function fetchGitHubData() {
  return fetchJSON(`https://api.github.com/users/Igosain08`);
}