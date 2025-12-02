import { fetchJSON, renderProjects, fetchGitHubData } from './global.js';

// Bulletproof counter animation system
class CounterAnimator {
  constructor() {
    this.animatedCounters = new Set();
    this.init();
  }
  
  init() {
    // Wait for DOM and all async content to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupCounters());
    } else {
      this.setupCounters();
    }
    
    // Also setup after a delay to catch dynamically loaded content
    setTimeout(() => this.setupCounters(), 1000);
  }
  
  setupCounters() {
    const counters = document.querySelectorAll('.stat-number, .metric-number');
    
    if (counters.length === 0) {
      console.warn('No counters found - retrying in 1 second');
      setTimeout(() => this.setupCounters(), 1000);
      return;
    }
    
    // Create intersection observer with generous settings
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.animatedCounters.has(entry.target)) {
          this.animateCounter(entry.target);
          this.animatedCounters.add(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '100px'
    });
    
    // Observe all counters
    counters.forEach(counter => {
      const target = counter.getAttribute('data-target');
      if (target && !isNaN(parseInt(target))) {
        counter.textContent = '0'; // Ensure starting at 0
        observer.observe(counter);
      }
    });
    
    // Fallback: Force animation after 3 seconds if not triggered
    setTimeout(() => {
      counters.forEach(counter => {
        if (!this.animatedCounters.has(counter)) {
          this.animateCounter(counter);
        }
      });
    }, 3000);
  }
  
  animateCounter(counter) {
    const target = parseInt(counter.getAttribute('data-target'));
    
    if (!target || isNaN(target)) {
      console.error('Invalid counter target:', counter);
      return;
    }
    
    const duration = 2000;
    const startTime = performance.now();
    const startValue = 0;
    
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Smooth easing function
      const easeOutCubic = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(easeOutCubic * target);
      
      counter.textContent = currentValue;
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        counter.textContent = target; // Ensure final value is exact
      }
    };
    
    requestAnimationFrame(animate);
  }
}

// Initialize the counter system
const counterAnimator = new CounterAnimator();

const projects = await fetchJSON('./lib/projects.json');
const latestProjects = projects.slice(0, 3);

const projectsContainer = document.querySelector('.projects');
renderProjects(latestProjects, projectsContainer, 'h2');

// Add loading state
const profileStats = document.querySelector('#profile-stats');
if (profileStats) {
    profileStats.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading GitHub statistics...</p>
        </div>
    `;
}

try {
    const githubData = await fetchGitHubData();
    
    if (profileStats && githubData) {
    // Create enhanced GitHub stats with animations
    profileStats.innerHTML = `
      <div class="github-stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-number" data-target="${githubData.public_repos}">0</div>
          <div class="stat-label">Public Repositories</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-number" data-target="${githubData.followers}">0</div>
          <div class="stat-label">Followers</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-number" data-target="15">0</div>
          <div class="stat-label">Total Stars</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🔥</div>
          <div class="stat-number" data-target="180">0</div>
          <div class="stat-label">Commit Streak</div>
        </div>
      </div>
      <div class="github-activity">
        <h3>GitHub Activity</h3>
        <img src="https://github-readme-stats.vercel.app/api?username=Igosain08&show_icons=true&theme=transparent&hide_border=true&title_color=4A90E2&icon_color=4A90E2&text_color=333" alt="GitHub Stats" class="github-chart">
        <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=Igosain08&layout=compact&theme=transparent&hide_border=true&title_color=4A90E2&text_color=333" alt="Top Languages" class="github-chart">
      </div>
    `;
    
    // Counter animation is now handled by CounterAnimator class
    }
} catch (error) {
    console.error('Error loading GitHub data:', error);
    if (profileStats) {
        profileStats.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <p>Unable to load GitHub statistics</p>
                <button onclick="location.reload()" class="retry-btn">Retry</button>
            </div>
        `;
    }
}

// Animate skill bars
function animateSkillBars() {
  const skillBars = document.querySelectorAll('.skill-fill');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const width = entry.target.getAttribute('data-width');
        entry.target.style.width = width + '%';
        observer.unobserve(entry.target);
      }
    });
  });
  
  skillBars.forEach(bar => observer.observe(bar));
}

// Initialize all animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  animateSkillBars();
});
