import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';


// === GLOBAL STATE ===
let data = [];
let commits = [];
let xScale, yScale;
let commitProgress = 100;
let commitMaxTime;
let filteredCommits = [];
let timeScale;
let colors = d3.scaleOrdinal(d3.schemeTableau10);


// === LOAD AND PROCESS ===
async function loadData() {
  const raw = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: +row.line,
    depth: +row.depth,
    length: +row.length,
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  
  // Filter out the loc.csv file itself and any other meta files
  return raw.filter(row => 
    !row.file.endsWith('loc.csv') && 
    !row.file.includes('/meta/') &&
    !row.file.includes('\\meta\\') &&
    !row.file.includes('node_modules')
  );
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;

      let ret = {
        id: commit,
        url: 'https://github.com/Igosain08/Portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: false,
        configurable: false,
        enumerable: false,
      });

      return ret;
    });
}

// === RENDER SUMMARY STATS ===
function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  dl.append('dt').text('Number of files');
  dl.append('dd').text(d3.groups(data, d => d.file).length);

  dl.append('dt').text('Average line length');
  dl.append('dd').text(Math.round(d3.mean(data, d => d.length)));

  dl.append('dt').text('Max depth');
  dl.append('dd').text(d3.max(data, d => d.depth));
}

// === TOOLTIP ===
function renderTooltipContent(commit) {
  if (Object.keys(commit).length === 0) return;

  document.getElementById('commit-link').href = commit.url;
  document.getElementById('commit-link').textContent = commit.id.substring(0, 7); // Show short hash
  document.getElementById('commit-date').textContent = commit.datetime?.toLocaleDateString('en', { dateStyle: 'full' });
  document.getElementById('commit-tooltip-time').textContent = commit.time;

  document.getElementById('commit-author').textContent = commit.author;
  document.getElementById('commit-lines').textContent = commit.totalLines;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  tooltip.style.left = `${event.clientX + 15}px`;
  tooltip.style.top = `${event.clientY + 15}px`;
}

// === BRUSH SELECTION HELPERS ===
function isCommitSelected(selection, commit) {
  if (!selection) return false;
  const [[x0, y0], [x1, y1]] = selection;
  const cx = xScale(commit.datetime);
  const cy = yScale(commit.hourFrac);
  return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
}

function renderSelectionCount(selection) {
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];

  const countElement = document.querySelector('#selection-count');
  if (countElement) {
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  }

  return selectedCommits;
}

function renderLanguageBreakdown(selection) {
  const selectedCommits = selection
    ? commits.filter(d => isCommitSelected(selection, d))
    : [];
  const container = document.getElementById('language-breakdown');

  if (!container) return;

  if (selectedCommits.length === 0) {
    container.innerHTML = '';
    return;
  }

  const lines = selectedCommits.flatMap(d => d.lines);
  const breakdown = d3.rollup(lines, v => v.length, d => d.type);

  container.innerHTML = '';
  for (const [language, count] of breakdown) {
    const proportion = count / lines.length;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

function brushed(event) {
  const selection = event.selection;

  d3.selectAll('circle')
    .classed('selected', d => isCommitSelected(selection, d));

  renderSelectionCount(selection);
  renderLanguageBreakdown(selection);
}

function createBrushSelector(svg) {
  svg.call(d3.brush().on('start brush end', brushed));
  svg.selectAll('.dots, .overlay ~ *').raise(); // ensure dots aren't blocked
}

// === MAIN CHART ===
function renderScatterPlot(data, commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 10, right: 10, bottom: 30, left: 40 };

  const usableArea = {
    top: margin.top,
    right: width - margin.right,
    bottom: height - margin.bottom,
    left: margin.left,
    width: width - margin.left - margin.right,
    height: height - margin.top - margin.bottom,
  };

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Scales
  xScale = d3.scaleTime()
    .domain(d3.extent(commits, d => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  // Gridlines
  svg.append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

  // Dots
  const dots = svg.append('g').attr('class', 'dots');
  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  dots.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', d => d.hourFrac < 6 || d.hourFrac >= 18 ? 'steelblue' : 'orange')
    .style('fill-opacity', 0.7)
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget).style('fill-opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', updateTooltipPosition)
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget).style('fill-opacity', 0.7);
      updateTooltipVisibility(false);
    });

  // Axes
  svg.append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .attr('class', 'x-axis')
    .call(d3.axisBottom(xScale));

  svg.append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(d3.axisLeft(yScale)
      .tickFormat(d => String(d % 24).padStart(2, '0') + ':00'));

  // Brush
  createBrushSelector(svg);
}

function updateScatterPlot(data, commits) {
  const [minLines, maxLines] = d3.extent(commits, d => d.totalLines);
  const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([2, 30]);

  const svg = d3.select('#chart').select('svg');

  xScale.domain(d3.extent(commits, d => d.datetime));

  // Update x-axis
  const xAxis = d3.axisBottom(xScale);
  const xAxisGroup = svg.select('g.x-axis');
  xAxisGroup.selectAll('*').remove();
  xAxisGroup.call(xAxis);

  // Update dots
  const dots = svg.select('g.dots');
  const sortedCommits = d3.sort(commits, d => -d.totalLines);

  dots.selectAll('circle')
    .data(sortedCommits, d => d.id)
    .join('circle')
    .transition()
    .duration(500)
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', d => d.hourFrac < 6 || d.hourFrac >= 18 ? 'steelblue' : 'orange')
    .style('fill-opacity', 0.7);
}

function onTimeSliderChange() {
  const slider = document.getElementById('commit-progress');
  commitProgress = +slider.value;
  commitMaxTime = timeScale.invert(commitProgress);

  // Filter commits
  filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

  // Update scatter plot
  updateScatterPlot(data, filteredCommits);

  // Clear and re-render stats
  d3.select('#stats').selectAll('*').remove();
  renderCommitInfo(data, filteredCommits);
  
  // Update file display
  d3.select('#files').selectAll('*').remove();
  updateFileDisplay(filteredCommits);

  // Update time label
  const timeLabel = document.getElementById('time-label');
  if (timeLabel) {
    timeLabel.textContent = commitMaxTime.toLocaleDateString('en', { dateStyle: 'medium' });
  }
}

function updateFileDisplay(filteredCommits) {
  const lines = filteredCommits.flatMap((d) => d.lines);

  const files = d3.groups(lines, (d) => d.file)
    .map(([name, lines]) => ({ name, lines }))
    .sort((a, b) => b.lines.length - a.lines.length);

  const filesContainer = d3
    .select('#files')
    .selectAll('div')
    .data(files, (d) => d.name)
    .join((enter) =>
      enter.append('div').call((div) => {
        div.append('dt').append('code');
        div.append('dd');
      })
    );

  filesContainer.select('dt > code').html((d) => `${d.name} <small>${d.lines.length} lines</small>`);

  filesContainer
    .select('dd')
    .selectAll('div')
    .data((d) => d.lines)
    .join('div')
    .attr('class', 'loc')
    .style('background', (d) => colors(d.type));
}

function onStepEnter(response) {
  const commit = response.element.__data__;
  const datetime = commit.datetime;

  // Update progress based on step
  const progress = timeScale(datetime);
  const slider = document.getElementById('commit-progress');
  if (slider) {
    slider.value = progress;
  }

  commitMaxTime = datetime;
  filteredCommits = commits.filter((d) => d.datetime <= commitMaxTime);

  updateScatterPlot(data, filteredCommits);
  d3.select('#files').selectAll('*').remove();
  updateFileDisplay(filteredCommits);
  
  // Update stats
  d3.select('#stats').selectAll('*').remove();
  renderCommitInfo(data, filteredCommits);
}

// === EXECUTION ===
async function init() {
  try {
    data = await loadData();
    commits = processCommits(data);

    if (commits.length === 0) {
      console.error('No commits found in data');
      return;
    }

    timeScale = d3.scaleTime()
      .domain(d3.extent(commits, d => d.datetime))
      .range([0, 100]);

    commitMaxTime = timeScale.invert(commitProgress);
    filteredCommits = commits.filter(d => d.datetime <= commitMaxTime);

    // Create scatter story steps
    d3.select('#scatter-story')
      .selectAll('.step')
      .data(commits)
      .join('div')
      .attr('class', 'step')
      .html(
        (d, i) => `
          On ${d.datetime.toLocaleString('en', {
            dateStyle: 'full',
            timeStyle: 'short',
          })}, I made <a href="${d.url}" target="_blank">${
            i > 0 ? 'another glorious commit' : 'my first commit, and it was glorious'
          }</a>. I edited ${d.totalLines} lines across ${
          d3.rollups(d.lines, D => D.length, d => d.file).length
        } files. Then I looked over all I had made, and I saw that it was very good.
        `
      );

    // Create file story steps
    d3.select('#file-story')
      .selectAll('.step')
      .data(commits)
      .join('div')
      .attr('class', 'step')
      .html((d, i) => `
        <h3>Commit ${i + 1}</h3>
        <p>At this point, the codebase had grown to include ${
          d3.rollups(filteredCommits.slice(0, i + 1).flatMap(c => c.lines), D => D.length, d => d.file).length
        } files with a total of ${
          filteredCommits.slice(0, i + 1).reduce((sum, c) => sum + c.totalLines, 0)
        } lines of code.</p>
      `);

    // Initial renders
    renderCommitInfo(data, filteredCommits);
    renderScatterPlot(data, commits);
    updateFileDisplay(filteredCommits);

    // Event listeners
    document.getElementById('commit-progress')?.addEventListener('input', onTimeSliderChange);

    // Scrollama setup
    const scroller = scrollama();
    scroller
      .setup({
        container: '#scrolly-1',
        step: '#scrolly-1 .step',
        offset: 0.5,
      })
      .onStepEnter(onStepEnter);

    const scroller2 = scrollama();
    scroller2
      .setup({
        container: '#scrolly-2',
        step: '#scrolly-2 .step',
        offset: 0.5,
      })
      .onStepEnter(onStepEnter);

  } catch (error) {
    console.error('Error initializing visualization:', error);
  }
}

// Run initialization
init();