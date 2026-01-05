// Mirofish Oil Trading Demo - Core Application Script

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
  activeTab: 'prompt'
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
Probability of escalation blocking shipping channel: 34.5% (increase of +25%).`,
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

// Cytoscape Knowledge Graph Setup
let cy;

function initCytoscape() {
  cy = cytoscape({
    container: document.getElementById('cy'),
    
    // Core Layout Options
    layout: {
      name: 'preset' // Using preset positions for optimal initial visual balance
    },
    
    // Interactive Capabilities
    boxSelectionEnabled: false,
    autounselectify: false,
    userZoomingEnabled: true,
    userPanningEnabled: true,

    // Graphic Elements definition
    elements: {
      nodes: [
        // Source variables
        { data: { id: 'hormuz_shipping', label: 'Hormuz Strait Shipping', type: 'geopolitical', weight: 4.5, desc: 'Tracks AIS telemetry of tankers transiting the crucial Hormuz chokepoint (20% of world oil).' }, position: { x: 100, y: 100 } },
        { data: { id: 'opec_cartel', label: 'OPEC+ Production Cartel', type: 'geopolitical', weight: 4.0, desc: 'Tracks production quotas, compliance sheets, and ministerial declarations from OPEC+ states.' }, position: { x: 100, y: 220 } },
        { data: { id: 'dxy_index', label: 'US Dollar (DXY)', type: 'macro', weight: 2.2, desc: 'US Dollar Index. An appreciating dollar typically puts downwards pressure on dollar-priced commodities.' }, position: { x: 100, y: 340 } },
        
        // Scraping & Parsing Layer
        { data: { id: 'osint', label: 'OSINT Parser Feed', type: 'stack', weight: 3.8, desc: 'Scrapes Twitter, news agencies, and government press rooms. Detects anomalies and alerts.' }, position: { x: 260, y: 120 } },
        
        // AI Simulation Layer
        { data: { id: 'claude', label: 'Claude Data Ingester', type: 'stack', weight: 5.0, desc: 'Claude digests parsed headlines, fetches historical data templates, and prepares mathematical scenarios.' }, position: { x: 420, y: 170 } },
        { data: { id: 'mirofish', label: 'Mirofish Simulation Engine', type: 'stack', weight: 5.5, desc: 'Computes economic elasticity formulas. Resolves supply-demand shock impacts on price targets.' }, position: { x: 580, y: 220 } },
        
        // Pricing outputs
        { data: { id: 'wti_crude', label: 'WTI Price target', type: 'market', weight: 4.8, desc: 'West Texas Intermediate crude oil pricing index output.' }, position: { x: 740, y: 140 } },
        { data: { id: 'brent_crude', label: 'Brent Price target', type: 'market', weight: 4.8, desc: 'Brent Crude pricing index output (benchmark for international supplies).' }, position: { x: 740, y: 300 } },
        
        // On-chain integration
        { data: { id: 'smart_contract', label: 'Trade Router (0x9f56...)', type: 'onchain', weight: 4.2, desc: 'EVM smart contract executing swaps, margins, and hedging on decentralized derivatives protocols.' }, position: { x: 900, y: 220 } },
        { data: { id: 'on_chain_ledger', label: 'On-Chain Ledger EventLog', type: 'onchain', weight: 3.5, desc: 'Blocks and event logs generated upon successful trade execution, guaranteeing transparent audits.' }, position: { x: 1060, y: 220 } }
      ],
      edges: [
        { data: { id: 'e1', source: 'hormuz_shipping', target: 'osint', label: 'feeds AIS anomalies' } },
        { data: { id: 'e2', source: 'opec_cartel', target: 'osint', label: 'monitors quotas' } },
        { data: { id: 'e3', source: 'osint', target: 'claude', label: 'sends raw context' } },
        { data: { id: 'e4', source: 'dxy_index', target: 'mirofish', label: 'provides macro index' } },
        { data: { id: 'e5', source: 'claude', target: 'mirofish', label: 'emits structured variables' } },
        { data: { id: 'e6', source: 'mirofish', target: 'wti_crude', label: 'updates WTI vector' } },
        { data: { id: 'e7', source: 'mirofish', target: 'brent_crude', label: 'updates Brent vector' } },
        { data: { id: 'e8', source: 'wti_crude', target: 'smart_contract', label: 'triggers long/short options' } },
        { data: { id: 'e9', source: 'brent_crude', target: 'smart_contract', label: 'feeds pricing feed' } },
        { data: { id: 'e10', source: 'smart_contract', target: 'on_chain_ledger', label: 'emits TradeEvent log' } }
      ]
    },

    style: [
      {
        selector: 'node',
        style: {
          'content': 'data(label)',
          'font-family': 'Outfit, sans-serif',
          'font-size': '11px',
          'font-weight': '600',
          'text-valign': 'center',
          'text-halign': 'center',
          'color': '#ffffff',
          'background-color': '#1a243d',
          'border-width': '2px',
          'border-color': 'rgba(255,255,255,0.2)',
          'width': '120px',
          'height': '40px',
          'shape': 'round-rectangle',
          'text-wrap': 'wrap',
          'text-max-width': '100px',
          'transition-property': 'background-color, border-color, box-shadow, text-shadow, width, height',
          'transition-duration': '0.3s'
        }
      },
      // Styling nodes based on type
      {
        selector: 'node[type="geopolitical"]',
        style: {
          'background-color': '#2a1a3d',
          'border-color': 'rgba(182, 78, 255, 0.4)'
        }
      },
      {
        selector: 'node[type="macro"]',
        style: {
          'background-color': '#1a323d',
          'border-color': 'rgba(0, 240, 255, 0.4)'
        }
      },
      {
        selector: 'node[type="stack"]',
        style: {
          'background-color': '#1a3d3a',
          'border-color': 'rgba(0, 255, 136, 0.4)',
          'shape': 'ellipse',
          'width': '80px',
          'height': '80px'
        }
      },
      {
        selector: 'node[type="market"]',
        style: {
          'background-color': '#3d2b1a',
          'border-color': 'rgba(255, 170, 0, 0.4)'
        }
      },
      {
        selector: 'node[type="onchain"]',
        style: {
          'background-color': '#1d3d1a',
          'border-color': 'rgba(0, 255, 136, 0.4)',
          'shape': 'hexagon',
          'width': '90px',
          'height': '60px'
        }
      },
      // Edges styling
      {
        selector: 'edge',
        style: {
          'width': 2.5,
          'line-color': 'rgba(255,255,255,0.12)',
          'target-arrow-color': 'rgba(255,255,255,0.2)',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'font-family': 'Outfit, sans-serif',
          'font-size': '8px',
          'color': '#718096',
          'text-rotation': 'autorotate',
          'text-margin-y': -8,
          'transition-property': 'line-color, width, target-arrow-color',
          'transition-duration': '0.3s'
        }
      },
      // Active states for animations
      {
        selector: 'node.highlighted',
        style: {
          'border-color': '#00f0ff',
          'border-width': '4px',
          'background-color': '#0f324d',
          'color': '#ffffff',
          'text-shadow': '0 0 8px rgba(0, 240, 255, 0.8)'
        }
      },
      {
        selector: 'node.highlighted-purple',
        style: {
          'border-color': '#b64eff',
          'border-width': '4px',
          'background-color': '#351252',
          'text-shadow': '0 0 8px rgba(182, 78, 255, 0.8)'
        }
      },
      {
        selector: 'node.highlighted-amber',
        style: {
          'border-color': '#ffaa00',
          'border-width': '4px',
          'background-color': '#523400',
          'text-shadow': '0 0 8px rgba(255, 170, 0, 0.8)'
        }
      },
      {
        selector: 'node.highlighted-green',
        style: {
          'border-color': '#00ff88',
          'border-width': '4px',
          'background-color': '#055227',
          'text-shadow': '0 0 8px rgba(0, 255, 136, 0.8)'
        }
      },
      {
        selector: 'edge.active-pulse',
        style: {
          'line-color': '#00f0ff',
          'width': 4.5,
          'target-arrow-color': '#00f0ff'
        }
      },
      {
        selector: 'edge.active-pulse-purple',
        style: {
          'line-color': '#b64eff',
          'width': 4.5,
          'target-arrow-color': '#b64eff'
        }
      },
      {
        selector: 'edge.active-pulse-green',
        style: {
          'line-color': '#00ff88',
          'width': 4.5,
          'target-arrow-color': '#00ff88'
        }
      }
    ]
  });

  // Tap Event listener to node
  cy.on('tap', 'node', function(evt){
    const node = evt.target;
    selectNode(node);
  });

  cy.on('tap', function(evt){
    if(evt.target === cy){
      deselectNode();
    }
  });
}

// Node selection handlers
function selectNode(node) {
  state.selectedNode = node;
  const data = node.data();
  
  const detailsBox = document.getElementById('node-details');
  const typeSpan = document.getElementById('node-detail-type');
  const titleH4 = document.getElementById('node-detail-title');
  const descP = document.getElementById('node-detail-description');
  const metricsBox = document.getElementById('node-detail-metrics');
  const weightSpan = document.getElementById('node-weight');
  const statusSpan = document.getElementById('node-status');
  
  typeSpan.innerText = data.type;
  typeSpan.className = `details-node-type type-${data.type}`;
  titleH4.innerText = data.label;
  descP.innerText = data.desc;
  weightSpan.innerText = data.weight.toFixed(1);
  
  // Custom status message based on state
  if(node.hasClass('highlighted') || node.hasClass('highlighted-purple') || node.hasClass('highlighted-amber') || node.hasClass('highlighted-green')) {
    statusSpan.innerText = 'PROCESSING DATA...';
    statusSpan.className = 'row-value text-glow-cyan';
  } else {
    statusSpan.innerText = 'STABLE (ONLINE)';
    statusSpan.className = 'row-value text-green';
  }
  
  metricsBox.style.display = 'block';
  detailsBox.classList.remove('hidden');
  
  AudioEngine.playPing();
}

function deselectNode() {
  state.selectedNode = null;
  const detailsBox = document.getElementById('node-details');
  detailsBox.classList.add('hidden');
}

// System clock updating
function updateClock() {
  const clockEl = document.getElementById('system-clock');
  const pad = (n) => n.toString().padStart(2, '0');
  
  const now = new Date();
  // Adjust clock to 2026-05-21 as requested in metadata
  now.setFullYear(2026, 4, 21); // Month is 0-indexed (May = 4)
  
  clockEl.innerText = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// Real-Time SVG Chart Implementation
function drawChart() {
  const chartEl = document.getElementById('oil-price-chart');
  const wtiPath = document.getElementById('wti-path');
  const brentPath = document.getElementById('brent-path');
  const wtiMarker = document.getElementById('wti-marker');
  const brentMarker = document.getElementById('brent-marker');
  
  const width = 440; // plotting width (leaving margins)
  const height = 160; // plotting height
  const xOffset = 50;
  const yOffset = 25;
  
  // Set bounds
  const minPrice = 70;
  const maxPrice = 90;
  const priceRange = maxPrice - minPrice;
  
  const getX = (index, total) => xOffset + (index / (total - 1)) * width;
  const getY = (price) => yOffset + height - ((price - minPrice) / priceRange) * height;
  
  // WTI Path
  let wtiCoords = [];
  const wtiLen = state.wtiHistory.length;
  for (let i = 0; i < wtiLen; i++) {
    const x = getX(i, wtiLen);
    const y = getY(state.wtiHistory[i]);
    wtiCoords.push(`${x},${y}`);
  }
  wtiPath.setAttribute('d', `M ${wtiCoords.join(' L ')}`);
  
  // Brent Path
  let brentCoords = [];
  const brentLen = state.brentHistory.length;
  for (let i = 0; i < brentLen; i++) {
    const x = getX(i, brentLen);
    const y = getY(state.brentHistory[i]);
    brentCoords.push(`${x},${y}`);
  }
  brentPath.setAttribute('d', `M ${brentCoords.join(' L ')}`);
  
  // Markers positioning at last element
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

// Log rows directly to the console terminal
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

// Log small actions in mini step consoles
function logMiniConsole(elementId, text, type) {
  const consoleEl = document.getElementById(elementId);
  consoleEl.innerHTML = `<div class="console-line text-${type}">> ${text}</div>`;
}

// Simulation Engine Delay Helpers
const getDelay = (baseDelay) => {
  return (baseDelay / state.simSpeed);
};

// Simulation Loop implementation
function executePipeline(scenarioIdx) {
  const scenario = scenarios[scenarioIdx];
  
  // Reset all graph node/edge active classes
  cy.nodes().removeClass('highlighted highlighted-purple highlighted-amber highlighted-green');
  cy.edges().removeClass('active-pulse active-pulse-purple active-pulse-green');
  
  logTerminal(`[PIPELINE START] Injecting market scenario: ${scenario.name}`, 'cyan');
  
  // STEP 1: OSINT headline scrapers triggered
  logMiniConsole('osint-console', 'Ingesting fresh news alerts...', 'amber');
  cy.nodes('#osint').addClass('highlighted-amber');
  if (scenarioIdx === 0 || scenarioIdx === 3) {
    cy.nodes('#hormuz_shipping').addClass('highlighted-purple');
    cy.edges('#e1').addClass('active-pulse-purple');
  } else if (scenarioIdx === 1) {
    cy.nodes('#opec_cartel').addClass('highlighted-purple');
    cy.edges('#e2').addClass('active-pulse-purple');
  }
  
  // Set OSINT console feed
  document.getElementById('osint-console').innerHTML = `<div class="console-line text-amber" style="white-space:normal; overflow:visible;">> ALERT: ${scenario.headline}</div>`;
  logTerminal(`[OSINT] parsed headline: "${scenario.headline}"`, 'amber');
  
  updateDrawerContent(scenario, 'context');
  AudioEngine.playPing();
  
  // STEP 2: Claude simulator ingestion (2s base delay)
  state.currentSimTimeout = setTimeout(() => {
    logMiniConsole('claude-console', 'Digesting news payload into parameters...', 'purple');
    cy.nodes('#claude').addClass('highlighted-purple');
    cy.edges('#e3').addClass('active-pulse');
    logTerminal(`[CLAUDE] Evaluating supply shock variables. Analyzing vessel speeds and OPEC quotas...`, 'purple');
    
    updateDrawerContent(scenario, 'prompt');
    AudioEngine.playSweep();
    
    // STEP 3: Mirofish simulation execution (2.5s base delay)
    state.currentSimTimeout = setTimeout(() => {
      logMiniConsole('mirofish-console', `Calculating pricing elasticity... Target: ${scenario.impactWti > 0 ? '+' : ''}${scenario.impactWti}`, 'cyan');
      cy.nodes('#mirofish').addClass('highlighted');
      cy.edges('#e5').addClass('active-pulse');
      cy.edges('#e4').addClass('active-pulse'); // DXY input edge pulse
      logTerminal(`[MIROFISH] Simulation complete. Net supply delta computed. Impact vector: WTI ${scenario.impactWti > 0 ? '+' : ''}$${scenario.impactWti}, Brent ${scenario.impactBrent > 0 ? '+' : ''}$${scenario.impactBrent}`, 'cyan');
      
      updateDrawerContent(scenario, 'mirofish-json');
      AudioEngine.playSweep();
      
      // STEP 4: Market prices shifts (2s base delay)
      state.currentSimTimeout = setTimeout(() => {
        // Shift Prices
        const prevWti = state.wtiPrice;
        const prevBrent = state.brentPrice;
        
        state.wtiPrice = parseFloat((state.wtiPrice + scenario.impactWti).toFixed(2));
        state.brentPrice = parseFloat((state.brentPrice + scenario.impactBrent).toFixed(2));
        
        state.wtiHistory.push(state.wtiPrice);
        state.brentHistory.push(state.brentPrice);
        
        if (state.wtiHistory.length > 20) state.wtiHistory.shift();
        if (state.brentHistory.length > 20) state.brentHistory.shift();
        
        // Update elements
        document.getElementById('wti-price-ticker').innerText = `$${state.wtiPrice.toFixed(2)}`;
        document.getElementById('brent-price-ticker').innerText = `$${state.brentPrice.toFixed(2)}`;
        
        cy.nodes('#wti_crude').addClass('highlighted-amber');
        cy.nodes('#brent_crude').addClass('highlighted-purple');
        cy.edges('#e6').addClass('active-pulse');
        cy.edges('#e7').addClass('active-pulse');
        
        logTerminal(`[MARKET] Price ticker updated. WTI: $${state.wtiPrice.toFixed(2)} (delta: $${scenario.impactWti.toFixed(2)}), Brent: $${state.brentPrice.toFixed(2)} (delta: $${scenario.impactBrent.toFixed(2)})`, 'amber');
        drawChart();
        AudioEngine.playSweep();
        
        // STEP 5: Smart contract trade router trigger (2s base delay)
        state.currentSimTimeout = setTimeout(() => {
          cy.nodes('#smart_contract').addClass('highlighted-green');
          cy.edges('#e8').addClass('active-pulse-green');
          cy.edges('#e9').addClass('active-pulse-green');
          
          logTerminal(`[ORACLE] Transmitting price feeds to EVM TradeRouter...`, 'green');
          
          // Show incoming trade notice in trade log
          const logContainer = document.getElementById('trade-log-container');
          const noTradesMsg = document.getElementById('no-trades-msg');
          if (noTradesMsg) noTradesMsg.style.display = 'none';
          
          const pendingCard = document.createElement('div');
          pendingCard.className = 'trade-card';
          pendingCard.id = 'pending-trade-card';
          pendingCard.innerHTML = `
            <div class="trade-card-glow glow-side-green"></div>
            <div class="trade-card-header">
              <span class="trade-tx-type tx-buy">PENDING TX...</span>
              <span class="trade-profit-badge text-glow-cyan"><i class="fa-solid fa-spinner fa-spin"></i></span>
            </div>
            <div class="trade-details-grid">
              <div class="trade-detail-item">
                <span class="trade-detail-label">Asset Pairs</span>
                <span class="trade-detail-value">WTI-1M-FUTURE</span>
              </div>
              <div class="trade-detail-item">
                <span class="trade-detail-label">Direction</span>
                <span class="trade-detail-value">${scenario.txType}</span>
              </div>
            </div>
          `;
          logContainer.insertBefore(pendingCard, logContainer.firstChild);
          
          // STEP 6: Ledger settlement & event log emissions (1.5s base delay)
          state.currentSimTimeout = setTimeout(() => {
            cy.nodes('#on_chain_ledger').addClass('highlighted-green');
            cy.edges('#e10').addClass('active-pulse-green');
            
            // Remove pending card, replace with concrete trade card
            if (pendingCard) pendingCard.remove();
            
            // Add on-chain block execution details
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
            
            // Render the final transaction block
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
                <a href="#" class="trade-tx-hash" onclick="event.preventDefault(); alert('Simulated EVM Block Explorer: tx hashes verified at height ${state.currentBlock}')">
                  <i class="fa-solid fa-link"></i> ${txHash.substring(0, 8)}...${txHash.substring(34)}
                </a>
                <span class="trade-gas-price">9 gwei</span>
              </div>
            `;
            logContainer.insertBefore(tradeCard, logContainer.firstChild);
            
            // Update Top Header Metrics
            document.getElementById('metric-profit').querySelector('.metric-value').innerText = `$${state.cumulativeProfit.toLocaleString()}`;
            document.getElementById('metric-trades').querySelector('.metric-value').innerHTML = `${state.totalTrades} <span class="sub-value">(${state.wins} W - ${state.losses} L)</span>`;
            
            const winRate = ((state.wins / state.totalTrades) * 100).toFixed(1);
            document.getElementById('metric-winrate').querySelector('.metric-value').innerText = `${winRate}%`;
            
            logTerminal(`[LEDGER] Trade published on-chain. block: #${state.currentBlock}, hash: ${txHash.substring(0, 16)}..., profit: ${profitFormatted}`, scenario.isWin ? 'green' : 'red');
            
            logMiniConsole('osint-console', 'Monitoring Twitter, Reuters...', 'amber');
            logMiniConsole('claude-console', 'Idle. Waiting for trigger...', 'dim');
            logMiniConsole('mirofish-console', 'Model idle. Sleep mode.', 'dim');
            
            // Set up next automatic iteration
            if (state.isSimActive) {
              const selectEl = document.getElementById('scenario-select');
              let nextIdx = (scenarioIdx + 1) % scenarios.length;
              selectEl.value = nextIdx;
              
              // Trigger loop after 10 seconds of idle
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

// Update Claude Drawer Context Tab Viewers
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

// Sandbox Mode adjustments recalculations
function recalculateSandbox() {
  // Tension raises price, OPEC cuts raise price, DXY drop raises price
  const tensionDelta = (state.sandbox.hormuz - 15) * 0.05; // Base is 15%
  const opecDelta = (state.sandbox.opec - 40) * 0.08;     // Base is 40%
  const dxyDelta = (102.5 - state.sandbox.dxy) * 0.15;     // Base is 102.5 (inverse)
  
  const totalDelta = tensionDelta + opecDelta + dxyDelta;
  const impactValEl = document.getElementById('sandbox-impact-val');
  
  impactValEl.innerText = `${totalDelta >= 0 ? '+' : ''}$${totalDelta.toFixed(2)} / bbl`;
  
  if (totalDelta >= 0) {
    impactValEl.className = 'impact-val text-glow-green';
  } else {
    impactValEl.className = 'impact-val text-glow-red';
  }
  
  // Briefly pulse cytoscape edges from sandbox sources to mirofish
  cy.edges('#e4, #e5, #e1, #e2').addClass('active-pulse');
  setTimeout(() => {
    cy.edges('#e4, #e5, #e1, #e2').removeClass('active-pulse');
  }, 400);
}

// Event Bindings and Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Init Clock
  updateClock();
  setInterval(updateClock, 1000);
  
  // Init Cytoscape graph
  initCytoscape();
  
  // Init Chart paths
  drawChart();
  
  // Sound Mute/Unmute
  const soundBtn = document.getElementById('sound-toggle-btn');
  soundBtn.addEventListener('click', () => {
    state.isMuted = !state.isMuted;
    if (state.isMuted) {
      soundBtn.classList.add('muted');
      logTerminal("[SYSTEM] Terminal sounds disabled.");
    } else {
      soundBtn.classList.remove('muted');
      AudioEngine.playPing();
      logTerminal("[SYSTEM] Terminal sounds enabled.");
    }
  });

  // Drawer slider control
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
  
  // Drawer tab bindings
  const drawerTabs = document.querySelectorAll('.drawer-tab');
  drawerTabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      drawerTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeTab = tab.dataset.tab;
      
      const currentScenario = scenarios[document.getElementById('scenario-select').value];
      updateDrawerContent(currentScenario);
      AudioEngine.playPing();
    });
  });

  // Cytoscape Layout Toolbar Button bindings
  const layoutBtns = document.querySelectorAll('.toolbar-btn[data-layout]');
  layoutBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      layoutBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const layoutName = btn.dataset.layout;
      
      if(layoutName === 'cose') {
        cy.layout({ name: 'cose', animate: true, padding: 30 }).run();
      } else {
        cy.layout({ name: layoutName, animate: true, padding: 30 }).run();
      }
      logTerminal(`[GRAPH] Graph layout redrawn: ${layoutName}`);
      AudioEngine.playPing();
    });
  });
  
  document.getElementById('fit-graph-btn').addEventListener('click', () => {
    cy.fit(30);
    logTerminal("[GRAPH] Viewport fitted to canvas.");
    AudioEngine.playPing();
  });
  
  const lockBtn = document.getElementById('lock-nodes-btn');
  let locked = false;
  lockBtn.addEventListener('click', () => {
    locked = !locked;
    if (locked) {
      cy.nodes().lock();
      lockBtn.querySelector('i').className = 'fa-solid fa-lock';
      lockBtn.classList.add('active');
      logTerminal("[GRAPH] Graph positions locked.");
    } else {
      cy.nodes().unlock();
      lockBtn.querySelector('i').className = 'fa-solid fa-lock-open';
      lockBtn.classList.remove('active');
      logTerminal("[GRAPH] Graph positions unlocked.");
    }
    AudioEngine.playPing();
  });

  // Search input binding
  const searchInput = document.getElementById('graph-search-input');
  const searchBtn = document.getElementById('graph-search-btn');
  
  const handleSearch = () => {
    const query = searchInput.value.toLowerCase().trim();
    if (!query) {
      cy.nodes().removeClass('highlighted');
      return;
    }
    
    let matched = false;
    cy.nodes().forEach(node => {
      const label = node.data('label').toLowerCase();
      if (label.includes(query)) {
        cy.animate({
          center: { elector: node },
          zoom: 1.5
        }, {
          duration: 300
        });
        selectNode(node);
        matched = true;
      }
    });
    
    if(!matched) {
      logTerminal(`[GRAPH] Search failed: no node containing "${query}"`, 'red');
    }
  };
  
  searchBtn.addEventListener('click', handleSearch);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
  });

  // Close overlay node detail button
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
    logTerminal("[SANDBOX] Slider variables restored to default benchmark values.");
    AudioEngine.playPing();
  });

  // Simulation speed control
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
      logTerminal("[SYSTEM] Auto loop resumed. Starting pipeline...");
      
      const selectEl = document.getElementById('scenario-select');
      executePipeline(parseInt(selectEl.value));
    } else {
      clearTimeout(state.currentSimTimeout);
      toggleSimBtn.className = "console-action-btn";
      toggleSimBtn.innerHTML = `<i class="fa-solid fa-play"></i> <span>RESUME AUTO</span>`;
      logTerminal("[SYSTEM] Auto-simulation cycle suspended. Manual trigger enabled.");
      
      // Stop all active spin icons
      cy.nodes().removeClass('highlighted highlighted-purple highlighted-amber highlighted-green');
      cy.edges().removeClass('active-pulse active-pulse-purple active-pulse-green');
      AudioEngine.playPing();
    }
  });

  // Automatically start the first scenario after 2 seconds
  setTimeout(() => {
    if (state.isSimActive) {
      executePipeline(0);
    }
  }, 2000);

});
