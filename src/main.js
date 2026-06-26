import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initHeroGlobe, initTwinTerrain } from './globe.js';
import { initDashboard } from './dashboard.js';
import { initScenarioLab } from './scenario.js';
import { initCopilot } from './copilot.js';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// Local lat/lon helper to direct coordinates
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return { x, y, z };
}

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Initialize Lenis Smooth Scroll
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true
  });

  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Sync scroll triggers with Lenis
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  // 2. Initialize 3D WebGL Engines
  const heroGlobe = initHeroGlobe('globeCanvas');
  const twinTerrain = initTwinTerrain('twinCanvas');

  // 3. Initialize Clock & Weather Telemetry
  const updateClock = () => {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dateStr = `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
    
    const clockTime = document.getElementById('clockTime');
    const consoleTime = document.getElementById('consoleTime');

    if (clockTime) {
      clockTime.textContent = `${dateStr} • ${timeStr}`;
    }
    if (consoleTime) {
      consoleTime.textContent = `REF_TIME: ${timeStr}`;
    }
  };
  setInterval(updateClock, 1000);
  updateClock();

  // 4. Light & Dark Theme Swapper
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeToggleIcon = document.getElementById('themeToggleIcon');

  if (themeToggleBtn && themeToggleIcon) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme');
      const nextTheme = activeTheme === 'light' ? 'dark' : 'light';
      
      document.documentElement.setAttribute('data-theme', nextTheme);

      // Swap SVG markup
      if (nextTheme === 'light') {
        themeToggleIcon.innerHTML = `
          <circle cx="12" cy="12" r="4"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="M4.93 4.93l1.41 1.41"></path>
          <path d="M17.66 17.66l1.41 1.41"></path>
          <path d="M2 12h2"></path>
          <path d="M20 12h2"></path>
          <path d="M6.34 17.66l-1.41 1.41"></path>
          <path d="M19.07 4.93l-1.41 1.41"></path>
        `;
      } else {
        themeToggleIcon.innerHTML = `
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        `;
      }

      // Sync color palettes on WebGL renderers
      if (heroGlobe) heroGlobe.updateTheme(nextTheme === 'light');
      if (twinTerrain) twinTerrain.updateTheme(nextTheme === 'light');
    });
  }

  // 5. Initialize UI Modules
  const destroyDashboard = initDashboard();
  initScenarioLab();
  initCopilot();

  // 6. Custom Map Selection Camera Tweens
  window.addEventListener('regionchange', (e) => {
    if (!heroGlobe) return;
    const { selected, lat, lon } = e.detail;
    
    if (selected) {
      // Offset camera slightly to focus on lat/lon
      const coords = latLonToVector3(lat, lon, 4.0); // Globe radius is 4
      
      // Calculate a comfortable target camera position
      const targetCamX = coords.x * 2.0;
      const targetCamY = coords.y * 2.0 + 1.5;
      const targetCamZ = coords.z * 2.0;

      gsap.to(heroGlobe.camera.position, {
        x: targetCamX,
        y: targetCamY,
        z: targetCamZ,
        duration: 1.5,
        ease: 'power3.out',
        onUpdate: () => {
          heroGlobe.camera.lookAt(heroGlobe.globeGroup.position);
        }
      });
    } else {
      // Reset camera to standard perspective
      gsap.to(heroGlobe.camera.position, {
        x: 0,
        y: 0,
        z: 11,
        duration: 1.5,
        ease: 'power3.out',
        onUpdate: () => {
          heroGlobe.camera.lookAt(heroGlobe.globeGroup.position);
        }
      });
    }
  });

  // 7. Digital Twin Overlay Controls
  const btnRain = document.getElementById('btnRainOverlay');
  const btnTemp = document.getElementById('btnTempOverlay');
  const btnWind = document.getElementById('btnWindOverlay');

  const setLayerActive = (activeBtn, type) => {
    [btnRain, btnTemp, btnWind].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
    if (twinTerrain) {
      twinTerrain.setOverlay(type);
    }
  };

  if (btnRain) btnRain.addEventListener('click', () => setLayerActive(btnRain, 'rain'));
  if (btnTemp) btnTemp.addEventListener('click', () => setLayerActive(btnTemp, 'temp'));
  if (btnWind) btnWind.addEventListener('click', () => setLayerActive(btnWind, 'wind'));

  // 8. 7-STAGE SCROLL-DRIVEN CAMERA STORYTELLING
  if (heroGlobe) {
    const camera = heroGlobe.camera;
    const globe = heroGlobe.globeGroup;
    const satellites = heroGlobe.satelliteGroup;

    const scrollTl = gsap.timeline({
      scrollTrigger: {
        trigger: 'body',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 1.2
      }
    });

    // Stage 1 -> Stage 2 (Hero down to Digital Twin)
    scrollTl.to(camera.position, {
      x: 0,
      y: 0.5,
      z: 7.2, // Zoom in
      ease: 'none'
    }, 0);
    scrollTl.to(globe.rotation, {
      x: 0.45,
      y: 1.3, // Focus on India
      ease: 'none'
    }, 0);

    // Stage 2 -> Stage 3 (Digital Twin to Forecasting)
    scrollTl.to(camera.position, {
      x: 1.2,
      y: 0.2,
      z: 7.5, // Pan right
      ease: 'none'
    }, 1);
    scrollTl.to(globe.rotation, {
      x: 0.2,
      y: 1.6, // Rotate slightly
      ease: 'none'
    }, 1);

    // Stage 3 -> Stage 4 (Forecasting to Scenario Lab)
    scrollTl.to(camera.position, {
      x: -1.2,
      y: -0.4,
      z: 6.8, // Pan left, get oblique view
      ease: 'none'
    }, 2);
    scrollTl.to(globe.rotation, {
      x: 0.55,
      y: 1.1,
      ease: 'none'
    }, 2);

    // Stage 4 -> Stage 5 (Scenario Lab to Dashboard)
    scrollTl.to(camera.position, {
      x: 0,
      y: 0,
      z: 8.5, // Center view
      ease: 'none'
    }, 3);
    scrollTl.to(globe.rotation, {
      x: 0.35,
      y: 1.35,
      ease: 'none'
    }, 3);
    scrollTl.to(satellites.scale, {
      x: 1.4,
      y: 1.4,
      z: 1.4, // expand satellite orbits
      ease: 'none'
    }, 3);

    // Stage 5 -> Stage 6 (Dashboard to AI Copilot)
    scrollTl.to(camera.position, {
      x: 0.6,
      y: 0.6,
      z: 7.0, // Zoom close
      ease: 'none'
    }, 4);
    scrollTl.to(globe.rotation, {
      x: 0.25,
      y: 1.5,
      ease: 'none'
    }, 4);

    // Stage 6 -> Stage 7 (AI Copilot to Footer / Deep Space zoom out)
    scrollTl.to(camera.position, {
      x: 0,
      y: 0,
      z: 13.0, // zoom out far
      ease: 'none'
    }, 5);
    scrollTl.to(globe.rotation, {
      x: 0.1,
      y: 1.9,
      ease: 'none'
    }, 5);
  }

  // 9. Simple Scroll-triggered Reveals on Headers/Cards
  const headers = document.querySelectorAll('.section-header');
  headers.forEach(header => {
    gsap.from(header, {
      scrollTrigger: {
        trigger: header,
        start: 'top 85%',
        toggleActions: 'play none none none'
      },
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    });
  });

  const cards = document.querySelectorAll('.forecast-card, .infra-card, .metric-dashboard-card, .prompt-suggestion-box');
  cards.forEach(card => {
    gsap.from(card, {
      scrollTrigger: {
        trigger: card,
        start: 'top 90%',
        toggleActions: 'play none none none'
      },
      y: 35,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    });
  });

  // 10. Clean up event pings
  window.addEventListener('beforeunload', () => {
    if (heroGlobe) heroGlobe.destroy();
    if (twinTerrain) twinTerrain.destroy();
    if (destroyDashboard) destroyDashboard();
  });
});
