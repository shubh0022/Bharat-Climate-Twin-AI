import { animateCounter } from './dashboard';

export function initScenarioLab() {
  const sliderTemp = document.getElementById('sliderTemp');
  const sliderRain = document.getElementById('sliderRain');
  const sliderHumidity = document.getElementById('sliderHumidity');
  const sliderMonsoon = document.getElementById('sliderMonsoon');

  const readoutTemp = document.getElementById('readoutTemp');
  const readoutRain = document.getElementById('readoutRain');
  const readoutHumidity = document.getElementById('readoutHumidity');
  const readoutMonsoon = document.getElementById('readoutMonsoon');

  const simFloodVal = document.getElementById('simFloodVal');
  const simWaterVal = document.getElementById('simWaterVal');
  const simStabilityVal = document.getElementById('simStabilityVal');
  const simCropVal = document.getElementById('simCropVal');
  const analysisText = document.getElementById('scenarioAnalysisText');
  const outputPanel = document.getElementById('scenarioOutputPanel');

  if (!sliderTemp || !sliderRain || !sliderHumidity || !sliderMonsoon) return;

  function runSimulation() {
    // 1. Get raw input values
    const T = parseFloat(sliderTemp.value);
    const R = parseFloat(sliderRain.value);
    const H = parseFloat(sliderHumidity.value);
    const M = parseFloat(sliderMonsoon.value);

    // 2. Update slider readout texts
    readoutTemp.textContent = (T >= 0 ? '+' : '') + T.toFixed(1) + '°C';
    readoutRain.textContent = (R >= 0 ? '+' : '') + Math.round(R) + '%';
    readoutHumidity.textContent = (H >= 0 ? '+' : '') + Math.round(H) + '%';
    readoutMonsoon.textContent = (M >= 0 ? '+' : '') + Math.round(M) + ' Days';

    // 3. Compute Climate Models
    // Flood Vulnerability
    let flood = 28.5 + (12 * T) + (0.6 * R) + (0.15 * H);
    flood = Math.max(2, Math.min(100, flood));

    // Water Stress
    let water = 42.1 + (8.5 * T) - (0.45 * R) + (0.18 * M);
    water = Math.max(5, Math.min(100, water));

    // Stability Margin
    let stability = 88.4 - (7.5 * Math.abs(T)) - (0.2 * Math.abs(R)) - (0.35 * Math.abs(M));
    stability = Math.max(10, Math.min(100, stability));

    // Projected Crop Yield Change (optimum at T=0.2, R=10)
    let crop = 0.0 - (6.5 * Math.pow(T - 0.2, 2)) + (0.15 * (R - 5)) - (0.3 * Math.abs(M));
    crop = Math.max(-60, Math.min(25, crop));

    // 4. Update UI Values (use animating counters or instant writes)
    simFloodVal.textContent = flood.toFixed(1) + '%';
    simWaterVal.textContent = water.toFixed(1) + '%';
    simStabilityVal.textContent = stability.toFixed(1) + '%';
    simCropVal.textContent = (crop >= 0 ? '+' : '') + crop.toFixed(1) + '%';

    // Apply alert coloring based on risk levels
    if (flood > 65 || water > 70 || stability < 50) {
      outputPanel.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      outputPanel.style.background = 'rgba(239, 68, 68, 0.01)';
      simFloodVal.className = 'impact-value danger';
      simWaterVal.className = 'impact-value danger';
    } else {
      outputPanel.style.borderColor = 'var(--color-border)';
      outputPanel.style.background = 'rgba(6, 182, 212, 0.02)';
      simFloodVal.className = 'impact-value';
      simWaterVal.className = 'impact-value';
    }

    // 5. Generate Procedural Analysis Text
    let analysis = '';
    if (T >= 2.5) {
      analysis += 'CRITICAL HYPERTHERMIA: Severe wet-bulb anomalies modeled in Northwestern and Central basins. Crop failures likely in wheat belt. ';
    }
    if (R >= 50) {
      analysis += 'FLOOD CRITICAL ALERT: Out-of-bank river spills predicted on Bramhaputra, Mahanadi and Ganga networks. Coastal discharge buffers overloaded. ';
    }
    if (R <= -30) {
      analysis += 'SEVERE ARID STATE: Rapid reservoir evaporation and subsoil drought threshold breached. Irrigation networks require load shedding. ';
    }
    if (M > 15) {
      analysis += 'MONSOON DELAY ANOMALY: Sowing windows delayed by 2 weeks. Ground water extraction will rise by 38%. ';
    }
    if (M < -10) {
      analysis += 'MONSOON PREMATURE ARRIVAL: Flash flood hazard risk rises in Western Ghats and Narmada basin. ';
    }

    if (!analysis) {
      analysis = 'OPERATIONAL STEADY STATE: Climate stability indices are within standard deviations. INSAT thermal signatures indicate normal vegetative canopy transpiration.';
    }

    analysisText.textContent = analysis;
  }

  // Bind event listeners to input elements for real-time calculation
  sliderTemp.addEventListener('input', runSimulation);
  sliderRain.addEventListener('input', runSimulation);
  sliderHumidity.addEventListener('input', runSimulation);
  sliderMonsoon.addEventListener('input', runSimulation);

  // Run initial simulation calculation
  runSimulation();
}
