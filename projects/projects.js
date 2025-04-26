// projects.js
// projects.js
// projects.js
// projects.js

import { renderProjects, fetchJSON } from '../global.js';

// Fetch and display projects
async function loadProjects() {
  try {
    // Fetch the projects data from the projects.json file
    const projects = await fetchJSON('../lib/projects.json');

    // Get the container element where the projects will be rendered
    const projectsContainer = document.querySelector('.projects');

    // Render each project using the renderProjects function
    projects.forEach(project => {
      renderProjects(project, projectsContainer);
    });

    // Update the project count in the title
    const projectCount = projects.length;
    const projectsTitle = document.querySelector('.projects-title');
    projectsTitle.textContent = `(${projectCount} projects)`; // Display project count
  } catch (error) {
    console.error("Error loading projects:", error);
  }
}

// Call the function to load and render the projects
loadProjects();