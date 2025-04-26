import { fetchJSON, renderProjects } from './global.js';

async function displayLatestProjects() {
  try {
    // Fetch the data from projects.json
    const projects = await fetchJSON('../lib/projects.json');

    // Get the first 3 projects
    const latestProjects = projects.slice(0, 3);

    // Get the container element where the projects will be rendered
    const projectsContainer = document.querySelector('.projects');
    

    // Render each project using the renderProjects function
    latestProjects.forEach(project => {
      renderProjects(project, projectsContainer, 'h2');
    });
  } catch (error) {
    console.error('Error loading projects:', error);
  }
}

// Call the function to display the latest projects
displayLatestProjects();
import { fetchGitHubData } from './global.js';

// Function to display GitHub profile stats
async function displayGitHubProfileStats() {
  const githubData = await fetchGitHubData('Igosain08'); // Replace with your GitHub username

  // Select the elements where stats will be shown
  const publicRepos = document.getElementById('public-repos');
  const publicGists = document.getElementById('public-gists');
  const followers = document.getElementById('followers');
  const following = document.getElementById('following');

  if (githubData) {
    // Display GitHub data in the respective <dd> elements
    publicRepos.textContent = githubData.public_repos;
    publicGists.textContent = githubData.public_gists;
    followers.textContent = githubData.followers;
    following.textContent = githubData.following;
  }
}

// Call the function to display the stats
displayGitHubProfileStats();