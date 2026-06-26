import * as THREE from 'three';

// Global helper to convert lat/lon to 3D Cartesian coordinates on a sphere of radius R
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.sin(theta));
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.cos(theta);

  return new THREE.Vector3(x, y, z);
}

// ----------------------------------------------------
// 1. HERO GLOBE VISUALIZER
// ----------------------------------------------------
export function initHeroGlobe(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x02040a, 0.12);

  const camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 0, 11);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const globeGroup = new THREE.Group();
  scene.add(globeGroup);

  // Focus India frontward
  globeGroup.rotation.y = 1.35;
  globeGroup.rotation.x = 0.35;

  // --- CREATING DOTTED GLOBE ---
  const globeRadius = 4.0;
  const particlesCount = 7000;
  const positions = new Float32Array(particlesCount * 3);
  const colors = new Float32Array(particlesCount * 3);
  const isIndiaArr = new Uint8Array(particlesCount); // track India particles

  const isIndia = (lat, lon) => {
    return lat >= 7.0 && lat <= 38.0 && lon >= 68.0 && lon <= 98.0;
  };

  // Generate particles uniformly distributed on the sphere
  for (let i = 0; i < particlesCount; i++) {
    const y = 1 - (i / (particlesCount - 1)) * 2; 
    const radiusAtY = Math.sqrt(1 - y * y);
    const theta = i * 2.39996;

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    const lat = Math.asin(y) * (180 / Math.PI);
    const lon = Math.atan2(z, x) * (180 / Math.PI);

    const posVec = new THREE.Vector3(x, y, z).multiplyScalar(globeRadius);
    positions[i * 3] = posVec.x;
    positions[i * 3 + 1] = posVec.y;
    positions[i * 3 + 2] = posVec.z;

    isIndiaArr[i] = isIndia(lat, lon) ? 1 : 0;
  }

  const globeGeometry = new THREE.BufferGeometry();
  globeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  globeGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const pointsMaterial = new THREE.PointsMaterial({
    size: 0.085,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true
  });

  const globePoints = new THREE.Points(globeGeometry, pointsMaterial);
  globeGroup.add(globePoints);

  // --- CITY BEACONS & NEURAL NETWORK ---
  const cities = [
    { name: 'New Delhi', lat: 28.6139, lon: 77.2090 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
    { name: 'Guwahati', lat: 26.1445, lon: 91.7362 },
    { name: 'Srinagar', lat: 34.0837, lon: 74.7973 }
  ];

  const beaconsGroup = new THREE.Group();
  globeGroup.add(beaconsGroup);

  const beaconGeo = new THREE.SphereGeometry(0.05, 16, 16);
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0x10b981,
    transparent: true,
    opacity: 0.95
  });

  const beaconMeshes = [];
  const cityVectors = [];

  cities.forEach(city => {
    const pos = latLonToVector3(city.lat, city.lon, globeRadius);
    const mesh = new THREE.Mesh(beaconGeo, beaconMat);
    mesh.position.copy(pos);
    beaconsGroup.add(mesh);
    beaconMeshes.push(mesh);
    cityVectors.push(pos);
  });

  // Neural Connection Lines
  const linkPoints = [];
  // Connect Delhi to everyone, Mumbai to South/East, Kolkata to Northeast
  const connectList = [
    [0, 1], [0, 3], [0, 4], [0, 5],
    [1, 2], [2, 3], [3, 4], [1, 5]
  ];

  connectList.forEach(pair => {
    linkPoints.push(cityVectors[pair[0]]);
    linkPoints.push(cityVectors[pair[1]]);
  });

  const linkGeometry = new THREE.BufferGeometry().setFromPoints(linkPoints);
  const linkMaterial = new THREE.LineBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.25
  });
  const neuralLinks = new THREE.LineSegments(linkGeometry, linkMaterial);
  beaconsGroup.add(neuralLinks);

  // --- SATELLITES (INSAT SYSTEM) ---
  const satelliteGroup = new THREE.Group();
  globeGroup.add(satelliteGroup);

  // Polar Orbit
  const createOrbitLine = (radius, inclinationRad) => {
    const points = [];
    for (let i = 0; i <= 64; i++) {
      const angle = (i / 64) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const vec = new THREE.Vector3(x, 0, z);
      vec.applyAxisAngle(new THREE.Vector3(1, 0, 0), inclinationRad);
      points.push(vec);
    }
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.15
    });
    const line = new THREE.Line(geom, mat);
    satelliteGroup.add(line);
    return line;
  };

  createOrbitLine(5.2, 0.4);
  createOrbitLine(4.8, 0.05);

  const satGeo = new THREE.BoxGeometry(0.08, 0.08, 0.12);
  const satMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const sat1 = new THREE.Mesh(satGeo, satMat);
  const sat2 = new THREE.Mesh(satGeo, satMat);
  satelliteGroup.add(sat1);
  satelliteGroup.add(sat2);

  // --- PROCEDURAL CLOUDS LAYER ---
  const cloudsCount = 1000;
  const cloudPositions = new Float32Array(cloudsCount * 3);
  for (let i = 0; i < cloudsCount; i++) {
    const y = 1 - (i / (cloudsCount - 1)) * 2;
    const rY = Math.sqrt(1 - y * y);
    const theta = i * 2.39996;
    
    // Position slightly above land (R = 4.15)
    const pos = new THREE.Vector3(Math.cos(theta) * rY, y, Math.sin(theta) * rY).multiplyScalar(4.15);
    cloudPositions[i * 3] = pos.x;
    cloudPositions[i * 3 + 1] = pos.y;
    cloudPositions[i * 3 + 2] = pos.z;
  }
  const cloudGeo = new THREE.BufferGeometry();
  cloudGeo.setAttribute('position', new THREE.BufferAttribute(cloudPositions, 3));
  const cloudMat = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xffffff,
    transparent: true,
    opacity: 0.15,
    sizeAttenuation: true
  });
  const clouds = new THREE.Points(cloudGeo, cloudMat);
  globeGroup.add(clouds);

  // --- RADAR SWEEP EFFECT ---
  const radarGeo = new THREE.ConeGeometry(4.2, 8, 32, 1, true);
  const radarMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.04,
    wireframe: true,
    side: THREE.DoubleSide
  });
  const radarSweep = new THREE.Mesh(radarGeo, radarMat);
  radarSweep.rotation.x = Math.PI / 2;
  globeGroup.add(radarSweep);

  // Ambient lighting
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 3, 5);
  scene.add(dirLight);

  const ambientLight = new THREE.AmbientLight(0x0a0f24, 0.4);
  scene.add(ambientLight);

  // --- THEME SYNC ENGINE ---
  const updateColors = (isLight) => {
    // Modify clear color & fog
    const clearCol = isLight ? 0xf5f5f7 : 0x02040a;
    scene.fog.color.setHex(clearCol);
    renderer.setClearColor(clearCol, 1);

    // Swap particles color palette
    const colorSpace = new THREE.Color(isLight ? '#d1d5db' : '#0b2447'); // OCEAN/SPACE
    const colorIndia = new THREE.Color(isLight ? '#0891b2' : '#06b6d4'); // LAND/INDIA

    const colorAttr = globeGeometry.attributes.color;
    for (let i = 0; i < particlesCount; i++) {
      const isInd = isIndiaArr[i] === 1;
      const col = isInd ? colorIndia : colorSpace;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }
    colorAttr.needsUpdate = true;

    // Line segment swaps
    linkMaterial.color.setHex(isLight ? 0x0891b2 : 0x06b6d4);
    linkMaterial.opacity = isLight ? 0.35 : 0.25;

    radarMat.color.setHex(isLight ? 0x0891b2 : 0x06b6d4);
    radarMat.opacity = isLight ? 0.06 : 0.04;

    satMat.color.setHex(isLight ? 0x0891b2 : 0x06b6d4);
    cloudMat.opacity = isLight ? 0.25 : 0.15; // brighter clouds in light mode
  };

  // Run initial default color mapping
  updateColors(false);

  // Animation Loop
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Rotate earth
    globeGroup.rotation.y = elapsedTime * 0.02 + 1.35;

    // Rotate clouds slightly faster for drift effect
    clouds.rotation.y = elapsedTime * 0.005;

    // Pulse beacons
    const pulseFactor = Math.sin(elapsedTime * 4) * 0.4 + 1.0;
    beaconMeshes.forEach(mesh => {
      mesh.scale.set(pulseFactor, pulseFactor, pulseFactor);
    });

    // Satellites
    const angle1 = elapsedTime * 0.15;
    const pos1 = new THREE.Vector3(Math.cos(angle1) * 5.2, 0, Math.sin(angle1) * 5.2);
    pos1.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.4);
    sat1.position.copy(pos1);

    const angle2 = -elapsedTime * 0.22;
    const pos2 = new THREE.Vector3(Math.cos(angle2) * 4.8, 0, Math.sin(angle2) * 4.8);
    pos2.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.05);
    sat2.position.copy(pos2);

    // Sweep radar
    radarSweep.rotation.y = elapsedTime * 0.18;

    renderer.render(scene, camera);
  }

  animate();

  const handleResize = () => {
    if (!canvas) return;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  };
  window.addEventListener('resize', handleResize);

  return {
    camera,
    globeGroup,
    beaconsGroup,
    satelliteGroup,
    updateTheme: updateColors,
    destroy: () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    }
  };
}

// ----------------------------------------------------
// 2. CLOSE-UP TOPOGRAPHY TERRAIN (DIGITAL TWIN)
// ----------------------------------------------------
export function initTwinTerrain(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const scene = new THREE.Scene();
  scene.background = null;

  const camera = new THREE.PerspectiveCamera(40, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.set(0, 5, 8);
  camera.lookAt(0, -0.5, 0);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  const gridWidth = 35;
  const gridHeight = 35;
  const size = 5;

  const geometry = new THREE.PlaneGeometry(size, size, gridWidth, gridHeight);
  
  const posAttribute = geometry.attributes.position;
  for (let i = 0; i < posAttribute.count; i++) {
    const x = posAttribute.getX(i);
    const y = posAttribute.getY(i);
    let height = 0;
    
    // Himalayas (North)
    if (y > 0.8) {
      height += Math.pow(y - 0.8, 1.8) * 1.5;
      height += Math.sin(x * 12) * Math.cos(y * 12) * 0.08;
    }
    // Western Ghats
    if (x < -0.8 && y < 0.5) {
      height += Math.pow(Math.abs(x + 0.8), 1.2) * 0.35;
      height += Math.cos(y * 8) * 0.05;
    }
    // Eastern Ghats
    if (x > 0.8 && y < 0.5) {
      height += Math.pow(x - 0.8, 1.2) * 0.25;
      height += Math.sin(y * 8) * 0.03;
    }
    height += Math.sin(x * 4) * Math.cos(y * 4) * 0.05;
    posAttribute.setZ(i, height);
  }

  geometry.computeVertexNormals();

  const terrainGroup = new THREE.Group();
  scene.add(terrainGroup);

  terrainGroup.rotation.x = -Math.PI / 2.3;
  terrainGroup.rotation.z = 0.2;

  // Palette states
  let isLightTheme = false;
  let activeOverlayType = 'rain';

  const darkColors = {
    rain: new THREE.Color('#06b6d4'),
    temp: new THREE.Color('#ef4444'),
    wind: new THREE.Color('#10b981')
  };

  const lightColors = {
    rain: new THREE.Color('#0891b2'),
    temp: new THREE.Color('#db2777'),
    wind: new THREE.Color('#059669')
  };

  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    wireframe: true,
    transparent: true,
    opacity: 0.15
  });

  const pointsMaterial = new THREE.PointsMaterial({
    size: 0.07,
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.8
  });

  const mesh = new THREE.Mesh(geometry, wireframeMaterial);
  const points = new THREE.Points(geometry, pointsMaterial);
  
  terrainGroup.add(mesh);
  terrainGroup.add(points);

  // Flowing Particles
  const streamlinesCount = 4;
  const streamlinePoints = [];
  const streamlineMeshes = [];

  for (let i = 0; i < streamlinesCount; i++) {
    const pointsPath = [];
    const startY = -2.5;
    const endY = 2.5;
    const startX = -2 + Math.random() * 4;
    const midX = -1 + Math.random() * 3;
    const endX = startX + (Math.random() - 0.5) * 1.5;

    pointsPath.push(new THREE.Vector3(startX, 0.1, startY));
    pointsPath.push(new THREE.Vector3(midX, 0.4, 0));
    pointsPath.push(new THREE.Vector3(endX, 0.6, endY));

    const curve = new THREE.QuadraticBezierCurve3(pointsPath[0], pointsPath[1], pointsPath[2]);
    streamlinePoints.push(curve);

    const flowGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const flowMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.8
    });
    const flowMesh = new THREE.Mesh(flowGeo, flowMat);
    terrainGroup.add(flowMesh);
    streamlineMeshes.push(flowMesh);
  }

  // Beam
  const beamGeo = new THREE.CylinderGeometry(0, 0.8, 4, 32, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.02,
    side: THREE.DoubleSide
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, 2, 0);
  terrainGroup.add(beam);

  // Sync mesh color based on active overlay + active theme
  const syncColors = () => {
    const palette = isLightTheme ? lightColors : darkColors;
    const col = palette[activeOverlayType];

    mesh.material.color.copy(col);
    points.material.color.copy(col);
    beam.material.color.copy(col);
    streamlineMeshes.forEach(mesh => {
      mesh.material.color.copy(col);
    });
  };

  syncColors();

  // Tick loop
  let clock = new THREE.Clock();

  function animate() {
    requestAnimationFrame(animate);

    const elapsedTime = clock.getElapsedTime();

    // Rotate terrain
    terrainGroup.rotation.z = elapsedTime * 0.04 + 0.2;

    // Float beam
    beam.position.y = 2 + Math.sin(elapsedTime * 2) * 0.15;

    // Animate flow along splines
    streamlineMeshes.forEach((mesh, index) => {
      const curve = streamlinePoints[index];
      const t = ((elapsedTime * 0.2) + (index / streamlinesCount)) % 1;
      const point = curve.getPointAt(t);
      mesh.position.copy(point);
    });

    // Ripple
    const position = geometry.attributes.position;
    for (let i = 0; i < position.count; i++) {
      const currentZ = position.getZ(i);
      const wave = Math.sin(position.getX(i) * 3 + elapsedTime * 1.5) * Math.cos(position.getY(i) * 3 + elapsedTime * 1.5) * 0.015;
      position.setZ(i, currentZ + wave);
    }
    position.needsUpdate = true;

    renderer.render(scene, camera);
  }

  animate();

  const handleResize = () => {
    if (!canvas) return;
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  };
  window.addEventListener('resize', handleResize);

  return {
    setOverlay: (type) => {
      activeOverlayType = type;
      syncColors();
    },
    updateTheme: (isLight) => {
      isLightTheme = isLight;
      syncColors();
    },
    destroy: () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    }
  };
}
