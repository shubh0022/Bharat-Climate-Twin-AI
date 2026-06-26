import { gsap } from 'gsap';

// Sparkline helper using HTML5 2D Canvas
class Sparkline {
  constructor(canvasId, maxPoints = 20, strokeColor = '#06b6d4') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.maxPoints = maxPoints;
    this.strokeColor = strokeColor;
    this.data = [];

    for (let i = 0; i < maxPoints; i++) {
      this.data.push(Math.random() * 40 + 30);
    }

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.draw();
  }

  push(value) {
    this.data.push(value);
    if (this.data.length > this.maxPoints) {
      this.data.shift();
    }
    this.draw();
  }

  draw() {
    if (!this.canvas || !this.ctx) return;
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    ctx.clearRect(0, 0, width, height);

    if (this.data.length < 2) return;

    const min = Math.min(...this.data);
    const max = Math.max(...this.data);
    const range = max - min === 0 ? 1 : max - min;

    ctx.beginPath();
    
    for (let i = 0; i < this.data.length; i++) {
      const x = (i / (this.data.length - 1)) * width;
      const y = height - ((this.data[i] - min) / range) * (height - 8) - 4;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.strokeStyle = this.strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, this.strokeColor + '15');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.fill();

    const lastX = width;
    const lastY = height - ((this.data[this.data.length - 1] - min) / range) * (height - 8) - 4;
    ctx.beginPath();
    ctx.arc(lastX - 2, lastY, 3, 0, Math.PI * 2);
    ctx.fillStyle = this.strokeColor;
    ctx.fill();
  }
}

// Counter animation helper
export function animateCounter(elementId, targetValue, suffix = '', duration = 1.2) {
  const element = document.getElementById(elementId);
  if (!element) return;

  const parser = parseFloat(targetValue);
  const isPercent = suffix === '%' || targetValue.toString().includes('%');
  const isSign = targetValue.toString().startsWith('+') || targetValue.toString().startsWith('-');

  let sign = '';
  if (isSign) {
    sign = targetValue.toString().charAt(0);
  }

  const obj = { value: 0 };
  
  gsap.to(obj, {
    value: parser,
    duration,
    ease: 'power3.out',
    onUpdate: () => {
      let formattedVal = obj.value.toFixed(1);
      if (Number.isInteger(parser)) {
        formattedVal = Math.round(obj.value);
      }
      element.textContent = `${sign}${formattedVal}${suffix}`;
    }
  });
}

// Map coordinate mappings to center Three.js globe
const REGION_COORDS = {
  'region-northwest': { lat: 26.5, lon: 74.0, station: 'JODHPUR' },
  'region-east': { lat: 23.5, lon: 86.0, station: 'PATNA' },
  'region-deccan': { lat: 15.5, lon: 78.5, station: 'HYDERABAD' },
  'region-west-ghats': { lat: 11.5, lon: 75.8, station: 'KOCHI' },
  'region-northeast': { lat: 26.0, lon: 93.0, station: 'GUWAHATI' }
};

// ----------------------------------------------------
// DASHBOARD INITIALIZER
// ----------------------------------------------------
export function initDashboard() {
  const rainSpark = new Sparkline('rainMiniChart', 18, '#06b6d4');
  const tempSpark = new Sparkline('tempMiniChart', 18, '#ef4444');

  let baseRain = 8.2;
  let baseTemp = 31.2;

  const intervalId = setInterval(() => {
    baseRain += (Math.random() - 0.5) * 1.5;
    baseRain = Math.max(0.5, Math.min(25, baseRain));

    baseTemp += (Math.random() - 0.5) * 0.4;
    baseTemp = Math.max(15, Math.min(48, baseTemp));

    rainSpark.push(baseRain);
    tempSpark.push(baseTemp);

    const activeSelected = document.querySelector('#mapRegions path.selected');
    if (!activeSelected) {
      document.getElementById('valRain').innerHTML = `${baseRain.toFixed(1)}<span class="panel-unit">mm/hr</span>`;
      document.getElementById('valTemp').innerHTML = `${baseTemp.toFixed(1)}<span class="panel-unit">°C</span>`;
      
      const clockWeather = document.getElementById('clockWeather');
      if (clockWeather) {
        clockWeather.textContent = `NEW DELHI: ${baseTemp.toFixed(1)}°C`;
      }
    }
  }, 2000);

  // Initialize main metrics counters
  animateCounter('countStability', 88.4, '%');
  animateCounter('countRain', 12.3, 'mm');
  animateCounter('countTemp', 0.68, '°C');
  animateCounter('countDrought', 14.2, '%');
  animateCounter('countFlood', 28.5, '%');

  const paths = document.querySelectorAll('#mapRegions path');
  const readout = document.getElementById('selectedRegionReadout');

  paths.forEach(path => {
    path.addEventListener('click', (e) => {
      const isSelected = path.classList.contains('selected');
      paths.forEach(p => p.classList.remove('selected'));

      if (!isSelected) {
        path.classList.add('selected');
        
        const name = path.getAttribute('data-name');
        const temp = parseFloat(path.getAttribute('data-temp'));
        const rain = parseFloat(path.getAttribute('data-rain'));
        const risk = path.getAttribute('data-risk');

        // Update readouts
        readout.textContent = `SELECTED: ${name.toUpperCase()}`;
        document.getElementById('valTemp').innerHTML = `${temp.toFixed(1)}<span class="panel-unit">°C</span>`;
        
        let riskVal = 30.0;
        if (risk === 'LOW') riskVal = 22.4;
        if (risk === 'MODERATE') riskVal = 51.8;
        if (risk === 'HIGH') riskVal = 76.5;
        if (risk === 'CRITICAL') riskVal = 92.4;

        document.getElementById('valRisk').innerHTML = `${riskVal.toFixed(1)}<span class="panel-unit">/100</span>`;
        document.getElementById('riskMeterBar').style.width = `${riskVal}%`;

        const localRainRate = (rain / 200).toFixed(1);
        document.getElementById('valRain').innerHTML = `${localRainRate}<span class="panel-unit">mm/hr</span>`;

        // Update Navbar Clock weather block
        const regionMeta = REGION_COORDS[path.id];
        const clockWeather = document.getElementById('clockWeather');
        if (clockWeather && regionMeta) {
          clockWeather.textContent = `${regionMeta.station}: ${temp.toFixed(1)}°C`;
        }

        // Animate metrics counters
        animateCounter('countStability', 100 - riskVal, '%');
        animateCounter('countRain', rain - 1000, 'mm');
        animateCounter('countTemp', temp - 28.0, '°C');
        animateCounter('countDrought', risk === 'LOW' ? 8.2 : 45.4, '%');
        animateCounter('countFlood', riskVal, '%');

        // Dispatch selection event to refocus camera in main.js
        window.dispatchEvent(new CustomEvent('regionchange', {
          detail: {
            selected: true,
            lat: regionMeta ? regionMeta.lat : 22.0,
            lon: regionMeta ? regionMeta.lon : 77.0
          }
        }));

      } else {
        // Reset to national grid
        readout.textContent = 'SELECTED: ALL INDIA GRID';
        document.getElementById('valRain').innerHTML = `${baseRain.toFixed(1)}<span class="panel-unit">mm/hr</span>`;
        document.getElementById('valTemp').innerHTML = `${baseTemp.toFixed(1)}<span class="panel-unit">°C</span>`;
        document.getElementById('valRisk').innerHTML = `78.5<span class="panel-unit">/100</span>`;
        document.getElementById('riskMeterBar').style.width = '78%';

        const clockWeather = document.getElementById('clockWeather');
        if (clockWeather) {
          clockWeather.textContent = `NEW DELHI: ${baseTemp.toFixed(1)}°C`;
        }

        animateCounter('countStability', 88.4, '%');
        animateCounter('countRain', 12.3, 'mm');
        animateCounter('countTemp', 0.68, '°C');
        animateCounter('countDrought', 14.2, '%');
        animateCounter('countFlood', 28.5, '%');

        // Reset camera focus
        window.dispatchEvent(new CustomEvent('regionchange', {
          detail: {
            selected: false,
            lat: 22.0,
            lon: 77.0
          }
        }));
      }
    });
  });

  // Soft glowing node cards
  const infraCards = document.querySelectorAll('.infra-card');
  infraCards.forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('active-glow');
      const statusEl = card.querySelector('.infra-status-indicator');
      if (card.classList.contains('active-glow')) {
        statusEl.innerHTML = `<span class="ping-indicator" style="background-color: var(--color-secondary);"></span>Connected`;
      } else {
        statusEl.innerHTML = `<span class="ping-indicator" style="background-color: #ef4444; box-shadow: 0 0 8px #ef4444;"></span>Offline`;
      }
    });
  });

  return () => {
    clearInterval(intervalId);
  };
}
