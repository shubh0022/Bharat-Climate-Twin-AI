import { initHeroGlobe } from './globe.js';
import { gsap } from 'gsap';

document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Initialize full-screen WebGL Earth
  const globe = initHeroGlobe('globeCanvas');
  
  // Set initial slow spin & position
  if (globe) {
    globe.globeGroup.rotation.y = 1.35;
    globe.globeGroup.rotation.x = 0.35;
    
    // Slow down rotation on login page for cinematic feel
    // (globe.js animate loop has rotation.y = elapsedTime * 0.02, which is fine)
  }

  // 2. Cursor tracking lighting on Glass Card
  const card = document.getElementById('loginCard');
  const glow = document.getElementById('cardGlow');
  
  if (card && glow) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Update glow positions
      glow.style.left = `${x}px`;
      glow.style.top = `${y}px`;
    });
  }

  // 3. Button Magnetism (Hover reaction)
  const btn = document.getElementById('btnSignIn');
  if (btn) {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Magnetic pull to center
      gsap.to(btn, {
        x: x * 0.25,
        y: y * 0.25,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
    
    btn.addEventListener('mouseleave', () => {
      // Reset position
      gsap.to(btn, {
        x: 0,
        y: 0,
        duration: 0.5,
        ease: 'elastic.out(1, 0.3)'
      });
    });
  }

  // 4. Form Submit Sequencer (Cinematic onboarding)
  const form = document.getElementById('loginForm');
  const loader = document.getElementById('loadingScreen');
  
  const statusLines = [
    { id: 'status-auth', delay: 400 },
    { id: 'status-models', delay: 400 },
    { id: 'status-satellite', delay: 500, action: triggerSatelliteLaunch },
    { id: 'status-grid', delay: 400, action: triggerGridConnect },
    { id: 'status-twin', delay: 400 },
    { id: 'status-engine', delay: 300 }
  ];

  // Callback action to zoom camera deep into India in WebGL space
  function triggerSatelliteLaunch() {
    if (!globe) return;
    
    // Zoom in WebGL camera from Z=11 to Z=5.8
    gsap.to(globe.camera.position, {
      x: 0,
      y: 0.15,
      z: 5.6,
      duration: 1.8,
      ease: 'power3.inOut'
    });

    // Precise rotation alignment to center India on view
    gsap.to(globe.globeGroup.rotation, {
      x: 0.38,
      y: 1.45,
      duration: 1.8,
      ease: 'power3.inOut'
    });

    // Expand satellite orbits
    if (globe.satelliteGroup) {
      gsap.to(globe.satelliteGroup.scale, {
        x: 1.35,
        y: 1.35,
        z: 1.35,
        duration: 1.5,
        ease: 'power2.out'
      });
    }
  }

  // Callback action to illuminate and pulse the neural connections
  function triggerGridConnect() {
    if (!globe) return;

    // Pulse the beacons and links in the beaconsGroup
    if (globe.beaconsGroup) {
      gsap.to(globe.beaconsGroup.scale, {
        x: 1.1,
        y: 1.1,
        z: 1.1,
        duration: 0.5,
        yoyo: true,
        repeat: 3,
        ease: 'sine.inOut'
      });
    }
  }

  // Sequencer loop
  async function runSequence() {
    for (let i = 0; i < statusLines.length; i++) {
      const step = statusLines[i];
      const element = document.getElementById(step.id);
      
      if (element) {
        element.classList.add('active');
        
        // Run optional callback hooks
        if (step.action) {
          step.action();
        }
        
        // Wait specified duration
        await new Promise(resolve => setTimeout(resolve, step.delay));
        
        element.classList.remove('active');
        element.classList.add('done');
      }
    }
    
    // Smooth fade out of loading screen before redirect
    gsap.to(loader, {
      opacity: 0,
      duration: 0.4,
      onComplete: () => {
        // Redirect to main Climate Twin dashboard index.html
        window.location.href = '/';
      }
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Prevent double submissions
      btn.classList.add('loading');
      const btnSpan = btn.querySelector('span');
      if (btnSpan) btnSpan.textContent = 'CONNECTING PROTOCOL...';
      
      // Reveal the glass terminal sequencer screen
      loader.classList.add('active');
      gsap.fromTo(loader, 
        { opacity: 0 }, 
        { opacity: 1, duration: 0.5 }
      );
      
      // Start the onboarding status sequencer
      runSequence();
    });
  }
});
