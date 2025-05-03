

import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// ========== Globals ==========
let query = '';
let selectedIndex = -1;

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
const searchInput = document.querySelector('.searchBar');

renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

// ========== Search Handler ==========
searchInput.addEventListener('change', (event) => {
  query = event.target.value;

  const filteredProjects = projects.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});

// ========== Render Pie Chart ==========
function renderPieChart(projectsGiven) {
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year
  );

  const data = rolledData.map(([year, count]) => ({
    value: count,
    label: year,
  }));

  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcData = sliceGenerator(data);
  const arcs = arcData.map((d) => arcGenerator(d));

  const colors = d3.scaleOrdinal(d3.schemeTableau10);

  // === Clear previous chart & legend ===
  const svg = d3.select('#projects-pie-plot');
  svg.selectAll('path').remove();

  const legend = d3.select('.legend');
  legend.selectAll('li').remove();

  // === Draw wedges ===
  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(i))
      .attr('class', i === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === i ? -1 : i;

        svg.selectAll('path')
          .attr('class', (_, idx) => (idx === selectedIndex ? 'selected' : ''));

        legend.selectAll('li')
          .attr('class', (_, idx) => (
            idx === selectedIndex ? 'legend-item selected' : 'legend-item'
          ));

          let searchFiltered = projects.filter((project) => {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query.toLowerCase());
          });

        //   if (selectedIndex === -1) {
        //     // No wedge is selected, so show all projects
        //     renderProjects(projects, projectsContainer, 'h2');
        //   } else {
        //     // Show only projects from the selected year
        //     let selectedYear = data[selectedIndex].label;
        //     let filteredByYear = projects.filter(p => p.year === selectedYear);
        //     renderProjects(filteredByYear, projectsContainer, 'h2'); // ==> THIS LINE IS THE FAULT!!!!!!!!!!!
        //   }

        if (selectedIndex === -1) {
            renderProjects(searchFiltered, projectsContainer, 'h2');
          } else {
            let selectedYear = data[selectedIndex].label;
            let finalFiltered = searchFiltered.filter(p => p.year === selectedYear);
            renderProjects(finalFiltered, projectsContainer, 'h2');
          }
      });
  });

  // === Draw legend ===
  data.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });

  
}