// Mirofish Oil Trading Demo - 3D WebGL Core Application Script

// Global Application State
let state = {
  wtiPrice: 76.85,
  brentPrice: 81.20,
  wtiHistory: [74.5, 74.8, 75.2, 75.1, 75.6, 75.4, 76.0, 75.9, 76.2, 76.5, 76.3, 76.85],
  brentHistory: [78.9, 79.1, 79.5, 79.4, 79.9, 79.8, 80.4, 80.3, 80.6, 80.9, 80.8, 81.20],
  isMuted: false,
  isSimActive: true,
  simSpeed: 1, // 1x, 2x, 3x speed multiplier
  currentBlock: 19842504,
  cumulativeProfit: 586000,
  totalTrades: 16,
  wins: 14,
  losses: 2,
  sandbox: {
    hormuz: 15, // 0-100% tension
    opec: 40,   // 0-100% production cuts
    dxy: 102.5  // 95-110 US Dollar index
  },
  selectedNode: null,
  activeScenarioIndex: 0,
  currentSimTimeout: null,
  activeTab: 'prompt',
  autoOrbit: false,
  showSatellites: false
};


// Web Audio API Synthesizer (Zero-asset Terminal Audio)
const AudioEngine = {
  ctx: null,
  
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },

  playPing() {
    if (state.isMuted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5 high alert ping
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.25);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Web Audio failed:", e);
    }
  },

  playSweep() {
    if (state.isMuted) return;
    this.init();
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(560, this.ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.03, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.45);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.45);
    } catch (e) {
      console.warn("Web Audio failed:", e);
    }
  },

  playSuccess() {
    if (state.isMuted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      // Arpeggio of G major chord (retro terminal vibe)
      const freqs = [392.00, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.04, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.35);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.35);
      });
    } catch (e) {
      console.warn("Web Audio failed:", e);
    }
  },

  playLoss() {
    if (state.isMuted) return;
    this.init();
    try {
      const now = this.ctx.currentTime;
      const freqs = [349.23, 311.13, 277.18]; // F4, Eb4, C#4 minor fall
      freqs.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        gain.gain.setValueAtTime(0.04, now + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.1 + 0.45);
        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.45);
      });
    } catch (e) {
      console.warn("Web Audio failed:", e);
    }
  }
};

// Scenario Database
const scenarios = [
  {
    name: "Iran Tanker Seizure (Hormuz conflict)",
    headline: "BREAKING: Iran Revolutionary Guard detains British-flagged oil tanker near Strait of Hormuz citing 'marine violations.' Tensions escalate.",
    impactWti: 3.20,
    impactBrent: 3.65,
    isWin: true,
    profit: 245500,
    gasUsed: 84310,
    txType: "BUY LONG",
    details: {
      claudeContext: `Scraped OSINT raw articles: 14.
Vessel Telemetry: Stena Impero variant transiting latitude 26.33N, speed 0kts.
US 5th Fleet alert levels: raised to DEFCON 3 in Bahrain base.
Probability of disruption in Hormuz Strait: 34.5% (increase of +25%).`,
      claudePrompt: `[ROLE] Senior Commodity Strategist AI
[INPUT] Geopolitical news feed: Iran detains tanker in Hormuz.
[TASK] Calculate short-term WTI/Brent crude premium. Simulate oil tankers redirection routes around Cape of Good Hope.
[FORMULA] DeltaPrice = CurrentBase * ElasticityCoef * (DisruptedVolume / DailyMarketVolume)`,
      mirofishJson: `{
  "target": "CRUDE_OIL",
  "direction": "LONG",
  "disruption_volume_mbpd": 17.4,
  "duration_days": 12,
  "confidence_score": 0.92,
  "pricing_delta": {
    "WTI": 3.20,
    "Brent": 3.65
  },
  "trade_recommendation": {
    "action": "BUY_FUTURE_CONTRACT",
    "leverage": "5x",
    "stop_loss": 74.50
  }
}`
    }
  },
  {
    name: "OPEC+ Production Cut (Cartel action)",
    headline: "OPEC+ Surprise Decision: Cartel agrees to slash oil production quotas by 1.2M barrels/day to support market stability.",
    impactWti: 2.45,
    impactBrent: 2.90,
    isWin: true,
    profit: 182000,
    gasUsed: 92450,
    txType: "BUY LONG",
    details: {
      claudeContext: `Saudi Ministry Statement: 'Proactive measures to defend pricing floor.'
Aggregate production quotas shift: 41.2M bpd -> 40.0M bpd.
Compliance history analysis: average compliance coefficient: 94.2%.
Russian export tracking: seaport flows down 4% week-on-week.`,
      claudePrompt: `[ROLE] OPEC Production Compliance Modeler
[INPUT] OPEC official release document & press conference quotes.
[TASK] Evaluate supply deficit curves. Calculate physical barrel shortfall against US shale production elasticity.
[METRICS] ProductionCut: -1.2M bpd. OPEC compliance: 95%.`,
      mirofishJson: `{
  "target": "BRENT_CRUDE",
  "direction": "LONG",
  "disruption_volume_mbpd": 1.2,
  "duration_days": 90,
  "confidence_score": 0.88,
  "pricing_delta": {
    "WTI": 2.45,
    "Brent": 2.90
  },
  "trade_recommendation": {
    "action": "BUY_CALL_OPTION",
    "strike_price": 82.50,
    "expiration_days": 30
  }
}`
    }
  },
  {
    name: "US crude stockpile surplus (EIA report)",
    headline: "EIA Weekly Inventory: US Commercial crude stocks rise by 5.4M barrels, far exceeding expected 1.1M drop. Prices slip.",
    impactWti: -1.85,
    impactBrent: -1.60,
    isWin: true,
    profit: 212000,
    gasUsed: 78560,
    txType: "SELL SHORT",
    details: {
      claudeContext: `EIA Inventory Report: 448.2M barrels total.
Refinery utilization rate: dropped 1.2% to 88.5%.
Strategic Petroleum Reserve (SPR) changes: +0.2M barrels.
Cushing hub storage capacity: 62% filled (up from 58%).`,
      claudePrompt: `[ROLE] Inventory & Refinery Capacity Analyzer
[INPUT] EIA Weekly Petroleum Status Report (Raw XLS data).
[TASK] Predict physical stockpile pressure at Cushing hub and Gulf coast terminals. Parse refinery refinery utilization inputs.
[FORMULA] PricingDelta = -1 * (InventorySurplusMb / CushingCap)`,
      mirofishJson: `{
  "target": "WTI_CRUDE",
  "direction": "SHORT",
  "disruption_volume_mbpd": -0.6,
  "duration_days": 7,
  "confidence_score": 0.94,
  "pricing_delta": {
    "WTI": -1.85,
    "Brent": -1.60
  },
  "trade_recommendation": {
    "action": "SELL_FUTURE_CONTRACT",
    "leverage": "8x",
    "stop_loss": 78.50
  }
}`
    }
  },
  {
    name: "Hormuz drone rumors debunked (Stabilization)",
    headline: "STABILIZATION: Saudi authorities confirm drone activity rumors near Ras Tanura refinery are entirely 'false and unverified.'",
    impactWti: -2.30,
    impactBrent: -2.55,
    isWin: false,
    profit: -38000,
    gasUsed: 89400,
    txType: "BUY LONG",
    details: {
      claudeContext: `AIS Vessel telemetry: loading queues in Ju'aymah and Ras Tanura are moving regularly.
OSINT Geolocation: Rumored fire video matches a training exercise in Jubail from 2022.
Twitter sentiment: Panic index drops from 8.2 to 2.1 in 30 minutes.`,
      claudePrompt: `[ROLE] OSINT Verification Agent
[INPUT] Geolocation photos, Twitter hashtags, military radar feeds.
[TASK] Detect if drone rumor is a coordinated market manipulation scheme. Calculate risk correction timeline.
[VERDICT] 98% Probability rumor is fake. Market premium will deflate.`,
      mirofishJson: `{
  "target": "CRUDE_OIL",
  "direction": "FLAT_CORRECTION",
  "disruption_volume_mbpd": 0.0,
  "duration_days": 2,
  "confidence_score": 0.79,
  "pricing_delta": {
    "WTI": -2.30,
    "Brent": -2.55
  },
  "trade_recommendation": {
    "action": "CLOSE_LONG_EARLY",
    "status": "STOP_LOSS_HIT"
  }
}`
    }
  }
];

// 3D-Force-Graph Constellation Generator
let Graph;
const allNodes = [];
const allLinks = [];

const coreNodes = [
  { id: 'hormuz_shipping', label: 'Hormuz Shipping AIS', type: 'geopolitical', size: 14, color: '#ff3c5f', desc: 'AIS Transponders tracking shipping lanes in Strait of Hormuz.', isCore: true, isMajor: true },
  { id: 'opec_cartel', label: 'OPEC+ Production Quotas', type: 'geopolitical', size: 14, color: '#b64eff', desc: 'Tracks cartel compliance sheets and output limits.', isCore: true, isMajor: true },
  { id: 'dxy_index', label: 'US Dollar Index (DXY)', type: 'macro', size: 14, color: '#5eaeff', desc: 'Global currency index driving physical pricing.', isCore: true, isMajor: true },
  { id: 'osint', label: 'OSINT Parser Feed', type: 'stack', size: 14, color: '#ffaa00', desc: 'Natural language news parsing stream agent.', isCore: true, isMajor: true },
  { id: 'claude', label: 'Claude Data Ingester', type: 'stack', size: 14, color: '#b64eff', desc: 'Simulates datasets and parameters.', isCore: true, isMajor: true },
  { id: 'mirofish', label: 'Mirofish Engine', type: 'stack', size: 16, color: '#00f0ff', desc: 'Computes supply-demand shocks.', isCore: true, isMajor: true },
  { id: 'wti_crude', label: 'WTI Pricing vector', type: 'market', size: 14, color: '#ffe600', desc: 'West Texas Intermediate crude benchmark.', isCore: true, isMajor: true },
  { id: 'brent_crude', label: 'Brent Pricing vector', type: 'market', size: 14, color: '#ff7700', desc: 'Brent International crude benchmark.', isCore: true, isMajor: true },
  { id: 'smart_contract', label: 'Trade Router Contract', type: 'onchain', size: 14, color: '#00ff88', desc: 'Smart contract executing margin swaps.', isCore: true, isMajor: true },
  { id: 'on_chain_ledger', label: 'EVM Block EventLog', type: 'onchain', size: 14, color: '#00ffaa', desc: 'Block explorer events emitted on trade completion.', isCore: true, isMajor: true }
];

const coreEdges = [
  { source: 'hormuz_shipping', target: 'osint', label: 'AIS telemetry', id: 'e1' },
  { source: 'opec_cartel', target: 'osint', label: 'quota alerts', id: 'e2' },
  { source: 'osint', target: 'claude', label: 'headlines', id: 'e3' },
  { source: 'dxy_index', target: 'mirofish', label: 'DXY vector', id: 'e4' },
  { source: 'claude', target: 'mirofish', label: 'parameters', id: 'e5' },
  { source: 'mirofish', target: 'wti_crude', label: 'WTI forecast', id: 'e6' },
  { source: 'mirofish', target: 'brent_crude', label: 'Brent forecast', id: 'e7' },
  { source: 'wti_crude', target: 'smart_contract', label: 'oracle inputs', id: 'e8' },
  { source: 'brent_crude', target: 'smart_contract', label: 'oracle inputs', id: 'e9' },
  { source: 'smart_contract', target: 'on_chain_ledger', label: 'Event emit', id: 'e10' }
];

const clusters = [
  { coreId: 'hormuz_shipping', prefix: 'Tanker AIS', color: '#ff3c5f', type: 'geopolitical', desc: 'Cargo vessel telemetry tracking coordinates.' },
  { coreId: 'opec_cartel', prefix: 'OPEC Well', color: '#b64eff', type: 'geopolitical', desc: 'State oil extraction terminal monitor.' },
  { coreId: 'osint', prefix: 'OSINT Feed', color: '#ffaa00', type: 'stack', desc: 'Geopolitical alert intelligence stream feed.' },
  { coreId: 'dxy_index', prefix: 'DXY Currency', color: '#5eaeff', type: 'macro', desc: 'Macroeconomic currency fluctuation tracker.' },
  { coreId: 'on_chain_ledger', prefix: 'EVM Validator', color: '#00ffaa', type: 'onchain', desc: 'EVM blockchain node validating trading logs.' }
];

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getBaselineLinkColor(l) {
  if (l.isSatellite) {
    const cluster = clusters.find(c => c.coreId === l.cluster);
    return cluster ? hexToRgba(cluster.color, 0.05) : 'rgba(255,255,255,0.03)';
  } else if (l.isMajorLink) {
    const cluster = clusters.find(c => c.coreId === l.cluster);
    return cluster ? hexToRgba(cluster.color, 0.18) : 'rgba(255,255,255,0.12)';
  }
  return 'rgba(255,255,255,0.2)';
}

function generateConstellation() {
  // 1. Push core nodes
  coreNodes.forEach(n => allNodes.push({ ...n }));
  
  // 2. Push core edges
  coreEdges.forEach(e => allLinks.push({ ...e, width: 2, color: 'rgba(255,255,255,0.2)' }));
  
  // 3. Generate 190 Secondary Major nodes (38 per cluster) & 800 Satellites (160 per cluster)
  // Total: 10 Core + 190 Major + 800 Satellites = 1,000 nodes total
  
  clusters.forEach(c => {
    // Generate 38 Major nodes for this cluster
    for (let i = 1; i <= 38; i++) {
      const majorId = `${c.coreId}-major-${i}`;
      allNodes.push({
        id: majorId,
        label: `${c.prefix} Hub ${i}`,
        type: c.type,
        size: 6,
        color: c.color,
        desc: `${c.desc} Primary core pipeline agent.`,
        isCore: false,
        isMajor: true
      });
      // Link Major to Core parent
      allLinks.push({
        source: majorId,
        target: c.coreId,
        width: 1.2,
        color: hexToRgba(c.color, 0.18),
        isMajorLink: true,
        cluster: c.coreId
      });
    }

    // Generate 160 Satellite nodes for this cluster
    for (let j = 1; j <= 160; j++) {
      const satId = `${c.coreId}-sat-${j}`;
      allNodes.push({
        id: satId,
        label: `${c.prefix} Satellite ${j}`,
        type: c.type,
        size: 2,
        color: c.color,
        desc: `${c.desc} Background data source telemetry emitter.`,
        isCore: false,
        isMajor: false
      });
      // Link Satellite to one of the 38 Major nodes in its cluster in round-robin fashion
      const parentMajorId = `${c.coreId}-major-${((j - 1) % 38) + 1}`;
      allLinks.push({
        source: satId,
        target: parentMajorId,
        width: 0.5,
        color: hexToRgba(c.color, 0.05),
        isSatellite: true,
        cluster: c.coreId
      });
    }
  });
}

function updateGraphData() {
  let nodesToRender;
  let linksToRender;
  
  if (state.showSatellites) {
    nodesToRender = allNodes;
    linksToRender = allLinks;
    const titleText = document.getElementById('graph-title-text');
    if (titleText) titleText.innerText = "1,000-Node Constellation Galaxy";
    const toggleBtn = document.getElementById('satellites-toggle-btn');
    if (toggleBtn) toggleBtn.classList.add('active');
  } else {
    nodesToRender = allNodes.filter(n => n.isMajor);
    
    // Create a Set of node IDs that are rendered for fast lookup
    const renderedNodeIds = new Set(nodesToRender.map(n => n.id));
    
    linksToRender = allLinks.filter(l => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
      const targetId = typeof l.target === 'object' ? l.target.id : l.target;
      return renderedNodeIds.has(sourceId) && renderedNodeIds.has(targetId);
    });
    
    const titleText = document.getElementById('graph-title-text');
    if (titleText) titleText.innerText = "200-Node Core Network";
    const toggleBtn = document.getElementById('satellites-toggle-btn');
    if (toggleBtn) toggleBtn.classList.remove('active');
  }
  
  Graph.graphData({ nodes: nodesToRender, links: linksToRender });
  
  // Adjust physics forces slightly depending on scale
  if (state.showSatellites) {
    Graph.d3Force('charge').strength(-30);
    Graph.d3Force('link').distance(link => link.isSatellite ? 12 : (link.isMajorLink ? 45 : 90));
  } else {
    Graph.d3Force('charge').strength(-80);
    Graph.d3Force('link').distance(link => link.isMajorLink ? 50 : 100);
  }
}


function init3DGraph() {
  const container = document.getElementById('3d-graph');
  
  const initialNodes = allNodes.filter(n => n.isMajor);
  const initialNodeIds = new Set(initialNodes.map(n => n.id));
  const initialLinks = allLinks.filter(l => {
    const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
    const targetId = typeof l.target === 'object' ? l.target.id : l.target;
    return initialNodeIds.has(sourceId) && initialNodeIds.has(targetId);
  });

  Graph = ForceGraph3D()(container)
    .graphData({ nodes: initialNodes, links: initialLinks })
    .backgroundColor('rgba(6, 9, 19, 0)') // transparent background so our CSS backgrounds show through
    .showNavInfo(false)
    .nodeVal(node => node.size)
    .nodeLabel(node => `<div class="graph-info-msg"><strong>${node.label}</strong><br>${node.desc}</div>`)
    .linkWidth(link => link.width)
    .linkColor(link => link.color)
    
    // Premium 3D Custom WebGL node structures (Spheres & Torus rings)
    .nodeThreeObject(node => {
      const THREE = window.THREE;
      if (!THREE) return null;
      
      let obj;
      if (node.isCore) {
        const group = new THREE.Group();
        
        // Inner glowing PBR core sphere (lower emissiveIntensity for shading depth)
        const sphereGeo = new THREE.SphereGeometry(node.size * 0.85, 32, 32);
        const sphereMat = new THREE.MeshStandardMaterial({
          color: node.color,
          metalness: 0.9,
          roughness: 0.15,
          emissive: node.color,
          emissiveIntensity: 0.25, // allow 3D shading
          transparent: true,
          opacity: 0.95
        });
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
        group.add(sphereMesh);
        
        // Outer rotating orbital rings (Torus geometries)
        const torusMat = new THREE.MeshStandardMaterial({
          color: node.color,
          metalness: 0.9,
          roughness: 0.1,
          emissive: node.color,
          emissiveIntensity: 0.3
        });
        
        const ring1Geo = new THREE.TorusGeometry(node.size * 1.5, node.size * 0.08, 8, 48);
        const ring1 = new THREE.Mesh(ring1Geo, torusMat);
        ring1.rotation.x = Math.PI / 2; // flatten horizontally
        group.add(ring1);
        
        const ring2Geo = new THREE.TorusGeometry(node.size * 1.55, node.size * 0.08, 8, 48);
        const ring2 = new THREE.Mesh(ring2Geo, torusMat);
        ring2.rotation.y = Math.PI / 4; // tilt vertically
        group.add(ring2);
        
        // Continuous independent ring rotations
        ring1.onBeforeRender = () => {
          ring1.rotation.z += 0.015;
        };
        
        ring2.onBeforeRender = () => {
          ring2.rotation.x += 0.01;
          ring2.rotation.y += 0.01;
        };
        
        obj = group;
      } else if (node.isMajor) {
        // Major Hubs: Shiny, reflective PBR sphere (increased segments for smoother circles)
        const geo = new THREE.SphereGeometry(node.size, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
          color: node.color,
          metalness: 0.95,
          roughness: 0.1,
          emissive: node.color,
          emissiveIntensity: 0.15 // lower emissive for beautiful 3D shading
        });
        obj = new THREE.Mesh(geo, mat);
      } else {
        // Satellites: Small spherical glowing beads (increased segments for smoother circles)
        const geo = new THREE.SphereGeometry(node.size * 1.3, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
          color: node.color,
          metalness: 0.85,
          roughness: 0.15,
          emissive: node.color,
          emissiveIntensity: 0.1 // lower emissive for depth
        });
        obj = new THREE.Mesh(geo, mat);
      }
      
      node.__threeObj = obj;
      return obj;
    })
    
    // Directional Particle setup
    .linkDirectionalParticles(link => link.particles || 0)
    .linkDirectionalParticleSpeed(link => link.particleSpeed || 0.01)
    .linkDirectionalParticleWidth(link => link.particleWidth || 1.5)
    .linkDirectionalParticleColor(link => link.particleColor || '#ffffff')
    
    // Dynamic physics configurations
    .cooldownTicks(60) // stop simulation after 60 ticks to settle static layout quickly
    .onNodeClick(node => {
      selectNode(node);
    })
    
    // DRAG ANIMATIONS - Custom WebGL scaling & particle injection
    .onNodeDrag((node) => {
      if (node.__threeObj) {
        node.__threeObj.scale.set(2.0, 2.0, 2.0);
      }
      
      // Inject particle stream along connected links
      const activeLinks = Graph.graphData().links;
      activeLinks.forEach(l => {
        const isConnected = (typeof l.source === 'object' ? l.source.id === node.id : l.source === node.id) ||
                            (typeof l.target === 'object' ? l.target.id === node.id : l.target === node.id);
        if (isConnected) {
          l.particles = 8;
          l.particleSpeed = 0.04;
          l.particleWidth = 3;
          l.particleColor = node.color;
          l.color = node.color;
        }
      });
      
      Graph.linkColor(l => l.color);
      Graph.linkDirectionalParticles(l => l.particles);
    })
    
    // DRAG RELEASE ANIMATION - Reset scale, emit particle wave & settle
    .onNodeDragEnd((node) => {
      if (node.__threeObj) {
        node.__threeObj.scale.set(1.0, 1.0, 1.0);
      }
      
      // Emit a fast ripple along connected edges
      const activeLinks = Graph.graphData().links;
      activeLinks.forEach(l => {
        const isConnected = (typeof l.source === 'object' ? l.source.id === node.id : l.source === node.id) ||
                            (typeof l.target === 'object' ? l.target.id === node.id : l.target === node.id);
        if (isConnected) {
          l.particles = 15;
          l.particleSpeed = 0.09;
          l.particleWidth = 4;
          l.particleColor = '#ffffff';
        }
      });
      
      Graph.linkDirectionalParticles(l => l.particles);
      
      // Fade out blast after 1s
      setTimeout(() => {
        const currentLinks = Graph.graphData().links;
        currentLinks.forEach(l => {
          const isConnected = (typeof l.source === 'object' ? l.source.id === node.id : l.source === node.id) ||
                              (typeof l.target === 'object' ? l.target.id === node.id : l.target === node.id);
          if (isConnected) {
            l.particles = 0;
            l.color = getBaselineLinkColor(l);
          }
        });
        Graph.linkColor(l => l.color);
        Graph.linkDirectionalParticles(l => l.particles);
      }, 1000);
      
      AudioEngine.playSweep();
      logTerminal(`[GRAPH] Manual signal wave injected from node: ${node.label}`, 'cyan');
    });

  // Customize D3 forces to arrange clusters neatly in 3D Space
  Graph.d3Force('charge').strength(-80);
  Graph.d3Force('link').distance(link => link.isMajorLink ? 50 : 100);

  // Add custom offset lights for realistic 3D specular highlight and shading
  const scene = Graph.scene();
  if (scene && window.THREE) {
    const THREE = window.THREE;
    
    // Primary key light (bright white from top-right-front)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    keyLight.position.set(300, 400, 300);
    scene.add(keyLight);
    
    // Fill light (subtle cyan from bottom-left-back for futuristic styling)
    const fillLight = new THREE.DirectionalLight(0x00f0ff, 0.6);
    fillLight.position.set(-300, -400, -300);
    scene.add(fillLight);
    
    // Back light (warm amber rim light from behind)
    const rimLight = new THREE.DirectionalLight(0xffaa00, 0.4);
    rimLight.position.set(0, 200, -500);
    scene.add(rimLight);
  }

  // Sync zoom slider with mouse wheel zoom
  setInterval(() => {
    const cam = Graph.cameraPosition();
    const dist = Math.sqrt(cam.x * cam.x + cam.y * cam.y + cam.z * cam.z);
    const slider = document.getElementById('zoom-slider');
    if (slider) {
      slider.value = Math.round(dist);
    }
  }, 400);

  // Initialize Orbit Rotation
  let cameraAngle = 0;
  setInterval(() => {
    if (state.autoOrbit) {
      cameraAngle += 0.003;
      const sliderVal = parseInt(document.getElementById('zoom-slider').value) || 600;
      Graph.cameraPosition({
        x: sliderVal * Math.sin(cameraAngle),
        y: sliderVal * Math.cos(cameraAngle) * 0.25, // tilt
        z: sliderVal * Math.cos(cameraAngle)
      }, { x: 0, y: 0, z: 0 });
    }
  }, 35);
  
  // Ambient noise particle signals (continuous low frequency feeds)
  setInterval(() => {
    const activeLinks = Graph.graphData().links;
    if (activeLinks.length === 0) return;
    
    // Pick 8 random links to stream 1 particle
    const linksToUpdate = [];
    for (let i = 0; i < 8; i++) {
      const idx = Math.floor(Math.random() * activeLinks.length);
      const link = activeLinks[idx];
      if (link) {
        link.particles = 1;
        link.particleSpeed = 0.008;
        link.particleWidth = 1.0;
        link.particleColor = link.color || '#ffffff';
        linksToUpdate.push(link);
      }
    }
    Graph.linkDirectionalParticles(l => l.particles);
    
    // Remove after particle finishes
    setTimeout(() => {
      linksToUpdate.forEach(link => {
        link.particles = 0;
      });
      Graph.linkDirectionalParticles(l => l.particles);
    }, 3000);
  }, 1200);
}


// Node selection detail overlays
function selectNode(node) {
  state.selectedNode = node;
  
  const detailsBox = document.getElementById('node-details');
  const typeSpan = document.getElementById('node-detail-type');
  const titleH4 = document.getElementById('node-detail-title');
  const descP = document.getElementById('node-detail-description');
  const metricsBox = document.getElementById('node-detail-metrics');
  const weightSpan = document.getElementById('node-weight');
  const statusSpan = document.getElementById('node-status');
  
  typeSpan.innerText = node.type;
  typeSpan.className = `details-node-type type-${node.type}`;
  titleH4.innerText = node.label;
  descP.innerText = node.desc;
  
  weightSpan.innerText = node.isCore ? 'Core Pipeline Hub' : 'Constellation Satellite';
  
  statusSpan.innerText = 'STABLE (ACTIVE)';
  statusSpan.className = 'row-value text-green';
  
  metricsBox.style.display = 'block';
  detailsBox.classList.remove('hidden');
  
  // Center camera to clicked node
  Graph.cameraPosition({ x: node.x * 1.5, y: node.y * 1.5, z: node.z * 1.5 + 200 }, node, 600);
  
  AudioEngine.playPing();
}

function deselectNode() {
  state.selectedNode = null;
  const detailsBox = document.getElementById('node-details');
  detailsBox.classList.add('hidden');
}

// Clock updates
function updateClock() {
  const clockEl = document.getElementById('system-clock');
  const pad = (n) => n.toString().padStart(2, '0');
  
  const now = new Date();
  now.setFullYear(2026, 4, 21); // Keep it relative to the dataset timestamp
  
  clockEl.innerText = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// Custom responsive SVG Chart implementation
function drawChart() {
  const wtiPath = document.getElementById('wti-path');
  const brentPath = document.getElementById('brent-path');
  const wtiMarker = document.getElementById('wti-marker');
  const brentMarker = document.getElementById('brent-marker');
  
  const width = 440; 
  const height = 160; 
  const xOffset = 50;
  const yOffset = 25;
  
  const minPrice = 70;
  const maxPrice = 90;
  const priceRange = maxPrice - minPrice;
  
  const getX = (index, total) => xOffset + (index / (total - 1)) * width;
  const getY = (price) => yOffset + height - ((price - minPrice) / priceRange) * height;
  
  let wtiCoords = [];
  const wtiLen = state.wtiHistory.length;
  for (let i = 0; i < wtiLen; i++) {
    const x = getX(i, wtiLen);
    const y = getY(state.wtiHistory[i]);
    wtiCoords.push(`${x},${y}`);
  }
  wtiPath.setAttribute('d', `M ${wtiCoords.join(' L ')}`);
  
  let brentCoords = [];
  const brentLen = state.brentHistory.length;
  for (let i = 0; i < brentLen; i++) {
    const x = getX(i, brentLen);
    const y = getY(state.brentHistory[i]);
    brentCoords.push(`${x},${y}`);
  }
  brentPath.setAttribute('d', `M ${brentCoords.join(' L ')}`);
  
  if (wtiLen > 0) {
    const lastWtiX = getX(wtiLen - 1, wtiLen);
    const lastWtiY = getY(state.wtiHistory[wtiLen - 1]);
    wtiMarker.setAttribute('cx', lastWtiX);
    wtiMarker.setAttribute('cy', lastWtiY);
    wtiMarker.style.display = 'block';
  }
  
  if (brentLen > 0) {
    const lastBrentX = getX(brentLen - 1, brentLen);
    const lastBrentY = getY(state.brentHistory[brentLen - 1]);
    brentMarker.setAttribute('cx', lastBrentX);
    brentMarker.setAttribute('cy', lastBrentY);
    brentMarker.style.display = 'block';
  }
}

// Log directly into terminal console
function logTerminal(message, type = 'dim') {
  const container = document.getElementById('terminal-text-container');
  const row = document.createElement('div');
  row.className = `terminal-row text-${type}`;
  
  const now = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const timestamp = `[${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}]`;
  
  row.innerText = `${timestamp} ${message}`;
  container.appendChild(row);
  container.scrollTop = container.scrollHeight;
}

function logMiniConsole(elementId, text, type) {
  const consoleEl = document.getElementById(elementId);
  consoleEl.innerHTML = `<div class="console-line text-${type}">> ${text}</div>`;
}

// Speed adjust
const getDelay = (baseDelay) => {
  return (baseDelay / state.simSpeed);
};

// Fluid wave scenarios - shoots particles from satellites converging to parents
function executePipeline(scenarioIdx) {
  const scenario = scenarios[scenarioIdx];
  
  // Auto-enable satellites when simulation runs so user sees the full signal stream
  if (!state.showSatellites) {
    state.showSatellites = true;
    updateGraphData();
    logTerminal(`[SYSTEM] Activating satellite constellation for simulation pipeline signal tracking...`, 'green');
  }
  
  // Clear previous link particles
  allLinks.forEach(l => {
    l.particles = 0;
    l.color = getBaselineLinkColor(l);
  });
  Graph.linkDirectionalParticles(l => l.particles);
  Graph.linkColor(l => l.color);
  
  logTerminal(`[PIPELINE START] Injecting market scenario: ${scenario.name}`, 'cyan');
  
  // STEP 1: OSINT headline alerts (Satellites stream particles to Core nodes)
  logMiniConsole('osint-console', 'Consolidating geopolitical satellite inputs...', 'amber');
  logTerminal(`[OSINT] parsed headline alert: "${scenario.headline}"`, 'amber');
  
  // Target active satellite clusters based on scenario
  let targetCluster = 'osint';
  if (scenarioIdx === 0 || scenarioIdx === 3) {
    targetCluster = 'hormuz_shipping';
  } else if (scenarioIdx === 1) {
    targetCluster = 'opec_cartel';
  }
  
  // Stream particles from 20 random satellites in the target category to the core node
  allLinks.forEach(l => {
    if (l.isSatellite && l.cluster === targetCluster && Math.random() < 0.2) {
      l.particles = 5;
      l.particleSpeed = 0.03;
      l.particleColor = '#ffaa00';
      l.color = 'rgba(255, 170, 0, 0.4)';
    }
  });
  
  // Also highlight core OSINT edge
  const e1_2 = allLinks.find(l => l.id === 'e1' || l.id === 'e2');
  if (e1_2) {
    e1_2.particles = 8;
    e1_2.particleSpeed = 0.04;
    e1_2.particleColor = '#ffaa00';
    e1_2.color = '#ffaa00';
  }
  
  document.getElementById('osint-console').innerHTML = `<div class="console-line text-amber" style="white-space:normal; overflow:visible;">> ALERT: ${scenario.headline}</div>`;
  updateDrawerContent(scenario, 'context');
  Graph.linkDirectionalParticles(l => l.particles);
  Graph.linkColor(l => l.color);
  AudioEngine.playPing();
  
  // STEP 2: Ingest by Claude (2s base delay)
  state.currentSimTimeout = setTimeout(() => {
    // Clear satellites
    allLinks.forEach(l => {
      if (l.isSatellite) {
        l.particles = 0;
        l.color = 'rgba(255,255,255,0.03)';
      }
    });
    
    logMiniConsole('claude-console', 'Digesting news context to parameter vectors...', 'purple');
    logTerminal(`[CLAUDE] Evaluating supply shocks. Formulating prompt context...`, 'purple');
    
    // Ingest edge particles
    const e3 = allLinks.find(l => l.id === 'e3');
    if (e3) {
      e3.particles = 15;
      e3.particleSpeed = 0.05;
      e3.particleColor = '#b64eff';
      e3.color = '#b64eff';
    }
    
    updateDrawerContent(scenario, 'prompt');
    Graph.linkDirectionalParticles(l => l.particles);
    Graph.linkColor(l => l.color);
    AudioEngine.playSweep();
    
    // STEP 3: Mirofish Engine Simulation (2.5s base delay)
    state.currentSimTimeout = setTimeout(() => {
      // Clear e3
      if (e3) e3.particles = 0;
      
      logMiniConsole('mirofish-console', `Re-evaluating elasticity models... WTI delta: ${scenario.impactWti}`, 'cyan');
      logTerminal(`[MIROFISH] Modeling complete. Shock coefficient verified. WTI Delta: ${scenario.impactWti > 0 ? '+' : ''}$${scenario.impactWti}`, 'cyan');
      
      // Ingest from Claude to Mirofish + DXY to Mirofish
      const e4 = allLinks.find(l => l.id === 'e4');
      const e5 = allLinks.find(l => l.id === 'e5');
      [e4, e5].forEach(l => {
        if (l) {
          l.particles = 15;
          l.particleSpeed = 0.05;
          l.particleColor = '#00f0ff';
          l.color = '#00f0ff';
        }
      });
      
      updateDrawerContent(scenario, 'mirofish-json');
      Graph.linkDirectionalParticles(l => l.particles);
      Graph.linkColor(l => l.color);
      AudioEngine.playSweep();
      
      // STEP 4: Market prices shifts (2s base delay)
      state.currentSimTimeout = setTimeout(() => {
        // Clear previous
        [e4, e5].forEach(l => { if (l) l.particles = 0; });
        
        const prevWti = state.wtiPrice;
        const prevBrent = state.brentPrice;
        
        state.wtiPrice = parseFloat((state.wtiPrice + scenario.impactWti).toFixed(2));
        state.brentPrice = parseFloat((state.brentPrice + scenario.impactBrent).toFixed(2));
        
        state.wtiHistory.push(state.wtiPrice);
        state.brentHistory.push(state.brentPrice);
        if (state.wtiHistory.length > 20) state.wtiHistory.shift();
        if (state.brentHistory.length > 20) state.brentHistory.shift();
        
        // Update labels
        document.getElementById('wti-price-ticker').innerText = `$${state.wtiPrice.toFixed(2)}`;
        document.getElementById('brent-price-ticker').innerText = `$${state.brentPrice.toFixed(2)}`;
        
        // Shoot price particles
        const e6 = allLinks.find(l => l.id === 'e6');
        const e7 = allLinks.find(l => l.id === 'e7');
        [e6, e7].forEach(l => {
          if (l) {
            l.particles = 15;
            l.particleSpeed = 0.05;
            l.particleColor = '#ffe600';
            l.color = '#ffe600';
          }
        });
        
        logTerminal(`[MARKET] Volatility indexes triggered. WTI: $${state.wtiPrice.toFixed(2)} (delta: $${scenario.impactWti.toFixed(2)})`, 'amber');
        drawChart();
        Graph.linkDirectionalParticles(l => l.particles);
        Graph.linkColor(l => l.color);
        AudioEngine.playSweep();
        
        // STEP 5: Smart contract execution route (2s base delay)
        state.currentSimTimeout = setTimeout(() => {
          // Clear previous
          [e6, e7].forEach(l => { if (l) l.particles = 0; });
          
          logTerminal(`[ORACLE] Broadcasting margin oracle inputs to EVM Smart contracts...`, 'green');
          
          // Oracle to smart contract
          const e8 = allLinks.find(l => l.id === 'e8');
          const e9 = allLinks.find(l => l.id === 'e9');
          [e8, e9].forEach(l => {
            if (l) {
              l.particles = 15;
              l.particleSpeed = 0.06;
              l.particleColor = '#00ff88';
              l.color = '#00ff88';
            }
          });
          
          const logContainer = document.getElementById('trade-log-container');
          const noTradesMsg = document.getElementById('no-trades-msg');
          if (noTradesMsg) noTradesMsg.style.display = 'none';
          
          const pendingCard = document.createElement('div');
          pendingCard.className = 'trade-card';
          pendingCard.id = 'pending-trade-card';
          pendingCard.innerHTML = `
            <div class="trade-card-glow glow-side-green"></div>
            <div class="trade-card-header">
              <span class="trade-tx-type tx-buy">PENDING ORDER...</span>
              <span class="trade-profit-badge text-glow-cyan"><i class="fa-solid fa-spinner fa-spin"></i></span>
            </div>
            <div class="trade-details-grid">
              <div class="trade-detail-item">
                <span class="trade-detail-label">Asset Pairs</span>
                <span class="trade-detail-value">WTI-1M-FUTURE</span>
              </div>
              <div class="trade-detail-item">
                <span class="trade-detail-label">Pipeline</span>
                <span class="trade-detail-value">${scenario.txType}</span>
              </div>
            </div>
          `;
          logContainer.insertBefore(pendingCard, logContainer.firstChild);
          
          Graph.linkDirectionalParticles(l => l.particles);
          Graph.linkColor(l => l.color);
          
          // STEP 6: Ledger final block emission (1.5s base delay)
          state.currentSimTimeout = setTimeout(() => {
            // Clear previous
            [e8, e9].forEach(l => { if (l) l.particles = 0; });
            
            if (pendingCard) pendingCard.remove();
            
            state.currentBlock += 1;
            document.getElementById('current-block').innerText = state.currentBlock.toLocaleString();
            state.totalTrades += 1;
            
            if (scenario.isWin) {
              state.wins += 1;
              state.cumulativeProfit += scenario.profit;
              AudioEngine.playSuccess();
            } else {
              state.losses += 1;
              state.cumulativeProfit += scenario.profit;
              AudioEngine.playLoss();
            }
            
            // Trade card prepends
            const txHash = '0x' + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join('');
            const profitFormatted = scenario.profit > 0 
              ? `+$${(scenario.profit/1000).toFixed(1)}K` 
              : `-$${(Math.abs(scenario.profit)/1000).toFixed(1)}K`;
            const profitClass = scenario.isWin ? 'profit-plus' : 'profit-minus';
            const glowClass = scenario.isWin ? 'glow-side-green' : 'glow-side-red';
            const txClass = scenario.txType === 'BUY LONG' ? 'tx-buy' : 'tx-sell';
            
            const tradeCard = document.createElement('div');
            tradeCard.className = 'trade-card';
            tradeCard.innerHTML = `
              <div class="trade-card-glow ${glowClass}"></div>
              <div class="trade-card-header">
                <span class="trade-tx-type ${txClass}">${scenario.txType}</span>
                <span class="trade-profit-badge ${profitClass}">${profitFormatted}</span>
              </div>
              <div class="trade-details-grid">
                <div class="trade-detail-item">
                  <span class="trade-detail-label">Underlying Asset</span>
                  <span class="trade-detail-value">WTI / BRENT Crude</span>
                </div>
                <div class="trade-detail-item">
                  <span class="trade-detail-label">Entry / Exit</span>
                  <span class="trade-detail-value">$${prevWti.toFixed(2)} / $${state.wtiPrice.toFixed(2)}</span>
                </div>
                <div class="trade-detail-item">
                  <span class="trade-detail-label">Contract Gas</span>
                  <span class="trade-detail-value">${scenario.gasUsed.toLocaleString()} gas</span>
                </div>
                <div class="trade-detail-item">
                  <span class="trade-detail-label">Block Execution</span>
                  <span class="trade-detail-value">#${state.currentBlock}</span>
                </div>
              </div>
              <div class="trade-card-footer">
                <a href="#" class="trade-tx-hash" onclick="event.preventDefault(); alert('Simulated EVM Block Explorer')">
                  <i class="fa-solid fa-link"></i> ${txHash.substring(0, 8)}...${txHash.substring(34)}
                </a>
                <span class="trade-gas-price">9 gwei</span>
              </div>
            `;
            logContainer.insertBefore(tradeCard, logContainer.firstChild);
            
            // Block validation emission: Shoot particles OUT to all 200 ledger validators
            const e10 = allLinks.find(l => l.id === 'e10');
            if (e10) {
              e10.particles = 15;
              e10.particleSpeed = 0.06;
              e10.particleColor = '#00ffaa';
              e10.color = '#00ffaa';
            }
            
            allLinks.forEach(l => {
              if (l.isSatellite && l.cluster === 'on_chain_ledger' && Math.random() < 0.25) {
                // Shoot particles OUTWARDS (invert direction concept by utilizing speed)
                l.particles = 5;
                l.particleSpeed = -0.04; // moving outwards to satellite nodes
                l.particleColor = '#00ffaa';
                l.color = 'rgba(0, 255, 170, 0.4)';
              }
            });
            
            // UI refresh
            document.getElementById('metric-profit').querySelector('.metric-value').innerText = `$${state.cumulativeProfit.toLocaleString()}`;
            document.getElementById('metric-trades').querySelector('.metric-value').innerHTML = `${state.totalTrades} <span class="sub-value">(${state.wins} W - ${state.losses} L)</span>`;
            const winRate = ((state.wins / state.totalTrades) * 100).toFixed(1);
            document.getElementById('metric-winrate').querySelector('.metric-value').innerText = `${winRate}%`;
            
            logTerminal(`[LEDGER] Event emitted. block: #${state.currentBlock}, tx: ${txHash.substring(0, 10)}... settled. Net profit: ${profitFormatted}`, scenario.isWin ? 'green' : 'red');
            
            Graph.linkDirectionalParticles(l => l.particles);
            Graph.linkColor(l => l.color);
            
            logMiniConsole('osint-console', 'Monitoring 200 geopolitical nodes...', 'amber');
            logMiniConsole('claude-console', 'Stack idle. Ingestion ready.', 'dim');
            logMiniConsole('mirofish-console', 'Engine sleep. Models static.', 'dim');
            
            // Revert all blocks to stable
            setTimeout(() => {
              if (e10) e10.particles = 0;
              allLinks.forEach(l => {
                if (l.isSatellite) {
                  l.particles = 0;
                  l.color = getBaselineLinkColor(l);
                }
              });
              Graph.linkDirectionalParticles(l => l.particles);
              Graph.linkColor(l => l.color);
            }, 2000);
            
            // Automatically queue next scenario
            if (state.isSimActive) {
              const selectEl = document.getElementById('scenario-select');
              let nextIdx = (scenarioIdx + 1) % scenarios.length;
              selectEl.value = nextIdx;
              
              state.currentSimTimeout = setTimeout(() => {
                if (state.isSimActive) executePipeline(nextIdx);
              }, getDelay(12000));
            }
            
          }, getDelay(1500));
        }, getDelay(2000));
      }, getDelay(2000));
    }, getDelay(2500));
  }, getDelay(2000));
}

// Update Claude Drawer Context tab
function updateDrawerContent(scenario, forceTab = null) {
  const tabs = document.querySelectorAll('.drawer-tab');
  const codePre = document.getElementById('drawer-pre-code');
  
  if (forceTab) {
    tabs.forEach(t => t.classList.remove('active'));
    document.querySelector(`.drawer-tab[data-tab="${forceTab}"]`).classList.add('active');
    state.activeTab = forceTab;
  }
  
  if (!scenario) return;
  
  if (state.activeTab === 'prompt') {
    codePre.innerText = scenario.details.claudePrompt;
  } else if (state.activeTab === 'context') {
    codePre.innerText = scenario.details.claudeContext;
  } else if (state.activeTab === 'mirofish-json') {
    codePre.innerText = scenario.details.mirofishJson;
  }
}

// Sandbox recalculation
function recalculateSandbox() {
  const tensionDelta = (state.sandbox.hormuz - 15) * 0.05; 
  const opecDelta = (state.sandbox.opec - 40) * 0.08;     
  const dxyDelta = (102.5 - state.sandbox.dxy) * 0.15;     
  
  const totalDelta = tensionDelta + opecDelta + dxyDelta;
  const impactValEl = document.getElementById('sandbox-impact-val');
  
  impactValEl.innerText = `${totalDelta >= 0 ? '+' : ''}$${totalDelta.toFixed(2)} / bbl`;
  
  if (totalDelta >= 0) {
    impactValEl.className = 'impact-val text-glow-green';
  } else {
    impactValEl.className = 'impact-val text-glow-red';
  }
  
  // Stream continuous particles from active sandbox categories while editing
  const targets = [];
  if (state.sandbox.hormuz > 15) targets.push('hormuz_shipping');
  if (state.sandbox.opec > 40) targets.push('opec_cartel');
  if (state.sandbox.dxy !== 102.5) targets.push('dxy_index');
  
  allLinks.forEach(l => {
    if (state.showSatellites && l.isSatellite && targets.includes(l.cluster) && Math.random() < 0.15) {
      l.particles = 4;
      l.particleSpeed = 0.02;
      l.particleColor = '#00f0ff';
      
      setTimeout(() => {
        l.particles = 0;
        Graph.linkDirectionalParticles(l => l.particles);
      }, 1000);
    }
  });
  Graph.linkDirectionalParticles(l => l.particles);
}


// Bind event listeners
document.addEventListener('DOMContentLoaded', () => {
  updateClock();
  setInterval(updateClock, 1000);
  
  // Generate 1,000 nodes dataset
  generateConstellation();
  
  // Init 3D Viewport
  init3DGraph();
  
  // Satellite Toggle Button binding
  const satToggleBtn = document.getElementById('satellites-toggle-btn');
  if (satToggleBtn) {
    satToggleBtn.addEventListener('click', () => {
      state.showSatellites = !state.showSatellites;
      updateGraphData();
      if (state.showSatellites) {
        logTerminal("[3D GRAPH] Activated satellite constellation nodes (+800 channels).", "green");
      } else {
        logTerminal("[3D GRAPH] Disengaged satellite nodes. Viewing core 200 pipeline hubs.", "cyan");
      }
      AudioEngine.playPing();
    });
  }
  
  // Log startup message about loading 200 major nodes
  logTerminal("[SYSTEM] Loaded 200 core infrastructure & major pipeline nodes.", "cyan");
  logTerminal("[SYSTEM] 800 background satellite emitters in standby.", "dim");
  
  // Chart render
  drawChart();

  
  // Sound Mute
  const soundBtn = document.getElementById('sound-toggle-btn');
  soundBtn.addEventListener('click', () => {
    state.isMuted = !state.isMuted;
    if (state.isMuted) {
      soundBtn.classList.add('muted');
      logTerminal("[SYSTEM] Terminal sonification sound disabled.");
    } else {
      soundBtn.classList.remove('muted');
      AudioEngine.playPing();
      logTerminal("[SYSTEM] Terminal sonification sound active.");
    }
  });

  // Prompt Drawer bindings
  const openDrawerBtn = document.getElementById('open-drawer-btn');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const promptDrawer = document.getElementById('prompt-drawer');
  
  openDrawerBtn.addEventListener('click', () => {
    promptDrawer.classList.add('open');
    AudioEngine.playPing();
  });
  
  closeDrawerBtn.addEventListener('click', () => {
    promptDrawer.classList.remove('open');
  });
  
  const drawerTabs = document.querySelectorAll('.drawer-tab');
  drawerTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      drawerTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeTab = tab.dataset.tab;
      
      const currentScenario = scenarios[document.getElementById('scenario-select').value];
      updateDrawerContent(currentScenario);
      AudioEngine.playPing();
    });
  });

  // 3D Toolbar buttons
  document.getElementById('reset-cam-btn').addEventListener('click', () => {
    Graph.cameraPosition({ x: 0, y: 0, z: 700 }, { x: 0, y: 0, z: 0 }, 500);
    logTerminal("[3D GRAPH] Camera position reset.");
    AudioEngine.playPing();
  });
  
  const orbitBtn = document.getElementById('orbit-btn');
  orbitBtn.addEventListener('click', () => {
    state.autoOrbit = !state.autoOrbit;
    if (state.autoOrbit) {
      orbitBtn.classList.add('active');
      logTerminal("[3D GRAPH] Auto camera orbiting resumed.");
    } else {
      orbitBtn.classList.remove('active');
      logTerminal("[3D GRAPH] Auto camera orbiting suspended.");
    }
    AudioEngine.playPing();
  });

  // Zoom Slider input binding
  const zoomSlider = document.getElementById('zoom-slider');
  zoomSlider.addEventListener('input', (e) => {
    const distVal = parseInt(e.target.value);
    
    // Maintain auto orbit angles if orbiting, otherwise zoom directly
    const cam = Graph.cameraPosition();
    const currentDist = Math.sqrt(cam.x * cam.x + cam.y * cam.y + cam.z * cam.z);
    
    // Scale vectors
    const factor = distVal / currentDist;
    Graph.cameraPosition({
      x: cam.x * factor,
      y: cam.y * factor,
      z: cam.z * factor
    }, { x: 0, y: 0, z: 0 }, 100);
  });

  // Search input binding
  const searchInput = document.getElementById('graph-search-input');
  const searchBtn = document.getElementById('graph-search-btn');
  
  const handleSearch = () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) return;
    
    const activeNodes = Graph.graphData().nodes;
    const matchedNode = activeNodes.find(n => n.label.toLowerCase().includes(query));
    if (matchedNode) {
      selectNode(matchedNode);
      logTerminal(`[3D GRAPH] Located node: "${matchedNode.label}"`, 'cyan');
    } else {
      const matchedInAll = allNodes.find(n => n.label.toLowerCase().includes(query));
      if (matchedInAll) {
        state.showSatellites = true;
        updateGraphData();
        setTimeout(() => {
          const reMatchedNode = Graph.graphData().nodes.find(n => n.id === matchedInAll.id);
          if (reMatchedNode) {
            selectNode(reMatchedNode);
            logTerminal(`[3D GRAPH] Activated satellite constellation & located node: "${reMatchedNode.label}"`, 'cyan');
          }
        }, 150);
      } else {
        logTerminal(`[3D GRAPH] Search failed: no node containing "${query}"`, 'red');
      }
    }
  };
  
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  document.getElementById('close-detail-btn').addEventListener('click', deselectNode);

  // Sandbox inputs
  const sliderHormuz = document.getElementById('slider-hormuz');
  const sliderOpec = document.getElementById('slider-opec');
  const sliderDxy = document.getElementById('slider-dxy');
  const resetSandbox = document.getElementById('reset-sandbox-btn');
  
  sliderHormuz.addEventListener('input', (e) => {
    state.sandbox.hormuz = parseInt(e.target.value);
    document.getElementById('val-hormuz').innerText = `${state.sandbox.hormuz}%`;
    recalculateSandbox();
  });
  
  sliderOpec.addEventListener('input', (e) => {
    state.sandbox.opec = parseInt(e.target.value);
    document.getElementById('val-opec').innerText = `${state.sandbox.opec}%`;
    recalculateSandbox();
  });
  
  sliderDxy.addEventListener('input', (e) => {
    state.sandbox.dxy = parseFloat((parseInt(e.target.value) / 10).toFixed(1));
    document.getElementById('val-dxy').innerText = state.sandbox.dxy.toFixed(1);
    recalculateSandbox();
  });
  
  resetSandbox.addEventListener('click', () => {
    sliderHormuz.value = 15;
    sliderOpec.value = 40;
    sliderDxy.value = 1025;
    state.sandbox.hormuz = 15;
    state.sandbox.opec = 40;
    state.sandbox.dxy = 102.5;
    document.getElementById('val-hormuz').innerText = "15%";
    document.getElementById('val-opec').innerText = "40%";
    document.getElementById('val-dxy').innerText = "102.5";
    recalculateSandbox();
    logTerminal("[SANDBOX] Geopolitical parameters reset to base levels.");
    AudioEngine.playPing();
  });

  // Sim speed controls
  const speedBtns = document.querySelectorAll('.speed-btn');
  speedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      speedBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.simSpeed = parseInt(btn.dataset.speed);
      logTerminal(`[SYSTEM] Simulation processing speed set to ${state.simSpeed}x`);
      AudioEngine.playPing();
    });
  });

  // Force Trigger Scenario Button
  const triggerBtn = document.getElementById('trigger-scenario-btn');
  triggerBtn.addEventListener('click', () => {
    clearTimeout(state.currentSimTimeout);
    const selectIdx = parseInt(document.getElementById('scenario-select').value);
    executePipeline(selectIdx);
  });

  // Pause / Resume System
  const toggleSimBtn = document.getElementById('toggle-sim-btn');
  toggleSimBtn.addEventListener('click', () => {
    state.isSimActive = !state.isSimActive;
    if (state.isSimActive) {
      toggleSimBtn.className = "console-action-btn pulse-action-btn";
      toggleSimBtn.innerHTML = `<i class="fa-solid fa-pause"></i> <span>PAUSE SYSTEM</span>`;
      logTerminal("[SYSTEM] Auto loop resumed. Initiating pipeline...");
      executePipeline(parseInt(document.getElementById('scenario-select').value));
    } else {
      clearTimeout(state.currentSimTimeout);
      toggleSimBtn.className = "console-action-btn";
      toggleSimBtn.innerHTML = `<i class="fa-solid fa-play"></i> <span>RESUME AUTO</span>`;
      logTerminal("[SYSTEM] Auto loop suspended. Manual triggers enabled.");
      AudioEngine.playPing();
    }
  });

  // Fullscreen bindings
  const fsBtn = document.getElementById('fullscreen-btn');
  const wrapper = document.querySelector('.cytoscape-wrapper');
  
  if (fsBtn && wrapper) {
    fsBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        wrapper.requestFullscreen().catch(err => {
          logTerminal(`[ERROR] Fullscreen failed: ${err.message}`, 'red');
        });
      } else {
        document.exitFullscreen();
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const isFullscreen = !!document.fullscreenElement;
      if (isFullscreen) {
        fsBtn.innerHTML = '<i class="fa-solid fa-compress"></i> Exit Fullscreen';
        fsBtn.classList.add('active');
        logTerminal("[3D GRAPH] Switched to fullscreen mode.", "cyan");
      } else {
        fsBtn.innerHTML = '<i class="fa-solid fa-expand"></i> Fullscreen';
        fsBtn.classList.remove('active');
        logTerminal("[3D GRAPH] Exited fullscreen mode.", "cyan");
      }
      
      if (Graph) {
        setTimeout(() => {
          Graph.width(wrapper.clientWidth);
          Graph.height(wrapper.clientHeight);
        }, 150);
      }
      AudioEngine.playPing();
    });
  }

  // Start initial pipeline sequence after 2.5 seconds
  setTimeout(() => {
    if (state.isSimActive) {
      executePipeline(0);
    }
  }, 2500);

});
