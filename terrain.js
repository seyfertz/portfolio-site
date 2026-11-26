const fallback = document.querySelector('#terrain-fallback');
const target = document.querySelector('#terrain');
const section = document.querySelector('.hero');
const motion = matchMedia('(prefers-reduced-motion: reduce)');
const TAU = Math.PI * 2;

function altitude(x, y, time = 0) {
  const pulse = Math.exp(-((x - 0.8) ** 2 + (y - 0.65) ** 2) * .13);
  const ridge = Math.exp(-((x + 3) ** 2 + (y + 1.2) ** 2) * .19);
  return pulse * (1.4 + .9 * Math.sin(x * .85 - y * 1.1 + time)) +
    ridge * (1.25 + .56 * Math.cos(y * 2 + time)) +
    Math.sin(x * .72 + y * 1.12 + time) * .38;
}

function drawFallback() {
  const ctx = fallback.getContext('2d');
  if (!ctx) return;
  const width = fallback.clientWidth;
  const height = fallback.clientHeight;
  if (!width || !height) return;
  const density = Math.min(devicePixelRatio, 2);
  fallback.width = width * density;
  fallback.height = height * density;
  ctx.setTransform(density, 0, 0, density, 0, 0);
  const unit = Math.min(width / 17, height / 8);
  const project = (x, y) => [
    width * .52 + (x + y * .42) * unit,
    height * .63 + (y * .36 - altitude(x, y) - x * .14) * unit,
  ];
  const glow = ctx.createRadialGradient(width * .54, height * .47, 0, width * .54, height * .47, width * .48);
  glow.addColorStop(0, '#91d94c2e');
  glow.addColorStop(1, '#91d94c00');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
  for (let row = 0; row < 43; row++) {
    const y = (row / 42 - .5) * 9.4;
    const gradient = ctx.createLinearGradient(0, 0, width, height * .45);
    gradient.addColorStop(0, '#abef7000');
    gradient.addColorStop(.35, '#88c55763');
    gradient.addColorStop(.62, row % 5 === 0 ? '#e6ffabf0' : '#a8e967a6');
    gradient.addColorStop(1, '#a8e96708');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = row % 5 === 0 ? 1.2 : .7;
    ctx.beginPath();
    for (let column = 0; column <= 75; column++) {
      const x = (column / 75 - .5) * 15;
      const [px, py] = project(x, y);
      if (column === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
      if (row % 4 === 0 && column % 11 === 0) {
        ctx.fillStyle = '#d6ff9a9c';
        ctx.fillRect(px, py, 1.6, 1.6);
      }
    }
    ctx.stroke();
  }
}

drawFallback();
const fallbackResize = new ResizeObserver(drawFallback);
fallbackResize.observe(fallback);

async function createTerrain() {
  const context = document.createElement('canvas').getContext('webgl2', { alpha: true, antialias: true });
  if (!context) return;
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 70);
  const renderer = new THREE.WebGLRenderer({ canvas: context.canvas, context, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.setClearColor(0x141914, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  target.append(renderer.domElement);
  const mesh = new THREE.Group();
  scene.add(mesh);
  const lines = [];
  const width = 71;
  const depth = 45;
  const xAt = (i) => (i / (width - 1) - .5) * 15.5;
  const yAt = (i) => (i / (depth - 1) - .5) * 9.4;
  for (let i = 0; i < depth; i++) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(width * 3);
    const colors = new Float32Array(width * 3);
    const y = yAt(i);
    for (let j = 0; j < width; j++) {
      const x = xAt(j);
      const boost = Math.exp(-((x - 1) ** 2 + y ** 2) * .068);
      const edge = Math.sin(Math.PI * j / (width - 1)) ** .8;
      const color = new THREE.Color().setRGB((.12 + .63 * boost) * edge, (.24 + .68 * boost) * edge, (.075 + .3 * boost) * edge);
      positions.set([x, altitude(x, y), y], j * 3);
      colors.set([color.r, color.g, color.b], j * 3);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const line = new THREE.Line(geometry, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: i % 6 === 0 ? .88 : .61,
    }));
    line.frustumCulled = false;
    mesh.add(line);
    lines.push({ positions, geometry, y });
  }
  const particlesBase = [];
  for (let i = 0; i < 112; i++) {
    const angle = i * 2.39996;
    const radius = 6 * Math.sqrt(i / 112);
    particlesBase.push([Math.cos(angle) * radius, Math.sin(angle) * radius * .66, .07 + (i % 9) * .07]);
  }
  const pts = new Float32Array(particlesBase.length * 3);
  const cloud = new THREE.BufferGeometry();
  cloud.setAttribute('position', new THREE.BufferAttribute(pts, 3).setUsage(THREE.DynamicDrawUsage));
  const points = new THREE.Points(cloud, new THREE.PointsMaterial({
    color: 0xcefa79, size: .043, transparent: true, opacity: .72, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  points.frustumCulled = false;
  mesh.add(points);
  let pointerX = 0;
  let pointerY = 0;
  let scroll = 0;
  let visible = true;
  let frame = 0;

  function draw(now) {
    const t = motion.matches ? 0 : (now * .00047) % TAU;
    mesh.rotation.y += ((.04 + pointerX * .16) - mesh.rotation.y) * .045;
    mesh.rotation.x += ((pointerY * -.08 + scroll * .11) - mesh.rotation.x) * .05;
    for (const { positions, geometry, y } of lines) {
      for (let j = 0; j < width; j++) positions[j * 3 + 1] = altitude(xAt(j), y, t);
      geometry.attributes.position.needsUpdate = true;
    }
    particlesBase.forEach(([x, y, lift], i) => {
      pts.set([x, altitude(x, y, t) + lift + Math.sin(i + t) * .12, y], i * 3);
    });
    cloud.attributes.position.needsUpdate = true;
    renderer.render(scene, camera);
  }

  function loop(now) {
    frame = 0;
    if (!visible || document.hidden || motion.matches) return;
    draw(now);
    frame = requestAnimationFrame(loop);
  }

  function updateLoop() {
    if (!frame && visible && !document.hidden && !motion.matches) frame = requestAnimationFrame(loop);
  }

  function resize() {
    const width = target.clientWidth;
    const height = target.clientHeight;
    camera.aspect = width / Math.max(height, 1);
    camera.position.set(3.6, 6.7, camera.aspect < 1.35 ? 17.9 : 15.9);
    camera.lookAt(.12, .55, .1);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    draw(0);
  }
  section.addEventListener('pointermove', (event) => {
    if (motion.matches) return;
    const bounds = section.getBoundingClientRect();
    pointerX = 2 * (event.clientX - bounds.left) / bounds.width - 1;
    pointerY = 2 * (event.clientY - bounds.top) / bounds.height - 1;
  }, { passive: true });
  section.addEventListener('pointerleave', () => { pointerX = pointerY = 0; });
  window.addEventListener('scroll', () => {
    scroll = motion.matches ? 0 : Math.min(window.scrollY / section.offsetHeight, 1);
  }, { passive: true });
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; updateLoop(); }).observe(section);
  new ResizeObserver(resize).observe(target);
  document.addEventListener('visibilitychange', updateLoop);
  motion.addEventListener('change', () => { draw(0); updateLoop(); });
  renderer.domElement.addEventListener('webglcontextlost', () => { fallback.hidden = false; drawFallback(); });
  renderer.domElement.addEventListener('webglcontextrestored', () => { fallback.hidden = true; updateLoop(); });
  resize();
  fallback.hidden = true;
  updateLoop();
}

createTerrain().catch(() => {
  // The Canvas illustration remains available without the CDN or WebGL.
});
