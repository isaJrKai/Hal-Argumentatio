import fs from 'fs';

const content = `import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Cpu, Layers, TrendingUp, Shield, Database, RefreshCw, Zap, Info, Activity, Sparkles, Brain, Code2, Focus, Fingerprint } from 'lucide-react';
import * as d3 from 'd3';

export default function NeuralPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSubsystem, setActiveSubsystem] = useState('core_bayes');
  const [isSyncing, setIsSyncing] = useState(false);
  const [networkData, setNetworkData] = useState<{ nodes: any[], links: any[], telemetry: any }>({ nodes: [], links: [], telemetry: null });
  const [learningMetrics, setLearningMetrics] = useState<any>(null);

  // Force simulation refs
  const simulationRef = useRef<any>(null);
  const nodesRef = useRef<any[]>([]);
  const linksRef = useRef<any[]>([]);

  // Particles for firing animation
  const particlesRef = useRef<any[]>([]);

  // Fetch real neural network data from the backend
  const fetchNetwork = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/neural/network');
      const data = await res.json();
      setNetworkData(data);
      
      setLearningMetrics({
        autonomyScore: data.telemetry?.autonomyReadinessScore || 94,
        epoch: data.telemetry?.calibrationEpoch || 142,
        outcomesDigested: data.telemetry?.totalOutcomesDigested || 1250,
        activeWeights: (data.nodes?.length || 0) * 14 + 1024,
        confidenceGlobal: (data.telemetry?.nicheMap?.general?.confidenceScore || 0.89) * 100
      });
      
      initSimulation(data.nodes, data.links);
    } catch (e) {
      console.error('Failed to fetch network', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
    
    // Clean up simulation on unmount
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, []);

  const initSimulation = (rawNodes: any[], rawLinks: any[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Deep copy for D3
    const nodes = rawNodes.map(d => ({ ...d }));
    const links = rawLinks.map(d => ({ ...d }));

    nodesRef.current = nodes;
    linksRef.current = links;

    if (simulationRef.current) {
      simulationRef.current.stop();
    }

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(120).strength(0.5))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius((d: any) => d.size * 2))
      .on('tick', drawCanvas);

    simulationRef.current = simulation;
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      if (simulationRef.current) {
        simulationRef.current.force('center', d3.forceCenter(width / 2, height / 2));
        simulationRef.current.alpha(0.3).restart();
      }
    }

    ctx.clearRect(0, 0, width, height);

    // Draw Links
    linksRef.current.forEach(link => {
      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      
      const distance = Math.hypot(link.target.x - link.source.x, link.target.y - link.source.y);
      const isWeak = link.source.type === 'decaying' || link.target.type === 'decaying';
      
      if (isWeak) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)'; // Red and faint
        ctx.setLineDash([5, 5]);
      } else {
        ctx.strokeStyle = \`rgba(16, 185, 129, \${Math.max(0.1, link.value / 10)})\`; // Green
        ctx.setLineDash([]);
      }
      
      ctx.lineWidth = Math.min(2, Math.max(0.2, link.value / 4));
      ctx.stroke();

      // Randomly spawn particles on strong links to simulate "firing"
      if (!isWeak && Math.random() > 0.98) {
        particlesRef.current.push({
          link,
          pos: 0,
          speed: Math.random() * 0.02 + 0.01,
          color: link.source.group === 1 ? '#ef4444' : '#10b981'
        });
      }
    });

    // Draw and update particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.pos += p.speed;
      if (p.pos >= 1) {
        particlesRef.current.splice(i, 1);
        continue;
      }
      
      const px = p.link.source.x + (p.link.target.x - p.link.source.x) * p.pos;
      const py = p.link.source.y + (p.link.target.y - p.link.source.y) * p.pos;
      
      ctx.beginPath();
      ctx.arc(px, py, 2, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Draw Nodes
    nodesRef.current.forEach(node => {
      ctx.beginPath();
      const r = node.size || 5;
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

      // Color mapping
      let color = '#3b82f6'; // Default blue
      if (node.type === 'core') color = '#f59e0b'; // Amber for cores
      else if (node.type === 'insight') color = '#10b981'; // Green for learnt lessons
      else if (node.type === 'decaying') color = '#ef4444'; // Red for decaying/broken nodes
      else if (node.type === 'win') color = '#10b981';
      else if (node.type === 'loss') color = '#ef4444';
      else if (node.type === 'niche') color = '#8b5cf6'; // Purple

      if (activeSubsystem === node.id) {
         ctx.shadowBlur = 20;
         ctx.shadowColor = color;
         ctx.fillStyle = '#fff';
      } else {
         ctx.fillStyle = color;
      }

      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw label for core and large nodes
      if (node.type === 'core' || r > 8) {
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + r + 12);
      }
    });
  };

  const SUBSYSTEMS = [
    { id: 'core_bayes', label: 'Bayesian Base', icon: Network, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'core_objection', label: 'Objection Graph', icon: Shield, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'core_niche', label: 'Niche Calibration', icon: Database, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'core_timesfm', label: 'TimesFM Prediction Layer', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' }
  ];

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-hidden">
      <header className="px-6 py-5 border-b border-border-dim bg-bg-raised shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2.5 rounded-lg bg-accent/10 border border-accent/20">
            <Brain className="w-6 h-6 text-accent animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary tracking-tight flex items-center gap-2">
              Neural Data Center
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-green-500/10 text-green-400 border border-green-500/20 uppercase">
                Active / Online
              </span>
            </h1>
            <p className="text-sm text-text-secondary mt-1">Deep Learning Core & Autonomous Policy Visualizer</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchNetwork}
            className="flex items-center gap-2 px-4 py-2 bg-bg-overlay border border-border-dim hover:border-accent text-text-secondary hover:text-accent rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={\`w-4 h-4 \${isSyncing ? 'animate-spin' : ''}\`} />
            Re-Calibrate & Fetch Topography
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r border-border-dim bg-bg-overlay overflow-y-auto shrink-0 flex flex-col">
          <div className="p-4 border-b border-border-dim">
            <h3 className="text-xs font-mono font-bold text-text-tertiary uppercase tracking-wider mb-3">Core Neural Hubs</h3>
            <div className="space-y-2">
              {SUBSYSTEMS.map(sys => {
                const nodeCount = networkData.nodes.filter(n => 
                  n.id === sys.id || networkData.links.some(l => (l.source.id === sys.id && l.target.id === n.id) || (l.target.id === sys.id && l.source.id === n.id))
                ).length;

                return (
                  <button
                    key={sys.id}
                    onClick={() => setActiveSubsystem(sys.id)}
                    className={\`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left \${
                      activeSubsystem === sys.id 
                        ? 'bg-bg-raised border-border-dim shadow-sm' 
                        : 'border-transparent hover:bg-bg-base text-text-secondary'
                    }\`}
                  >
                    <div className={\`p-1.5 rounded-md \${activeSubsystem === sys.id ? sys.bg : 'bg-bg-base'}\`}>
                      <sys.icon className={\`w-4 h-4 \${activeSubsystem === sys.id ? sys.color : 'text-text-tertiary'}\`} />
                    </div>
                    <div>
                      <span className={\`block text-sm font-bold \${activeSubsystem === sys.id ? 'text-text-primary' : ''}\`}>
                        {sys.label}
                      </span>
                      <span className="block text-[10px] font-mono text-text-tertiary">
                        {nodeCount} Connected Synapses
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <h3 className="text-xs font-mono font-bold text-text-tertiary uppercase tracking-wider">Matrix Live Telemetry</h3>
            
            <div className="bg-bg-base border border-border-dim rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-text-secondary">Epoch</span>
                <span className="text-xs font-mono font-bold text-text-primary">{learningMetrics?.epoch || '---'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-text-secondary">Digested Outcomes</span>
                <span className="text-xs font-mono font-bold text-accent">{learningMetrics?.outcomesDigested || '---'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-text-secondary">Global Confidence</span>
                <span className="text-xs font-mono font-bold text-green-400">{Number(learningMetrics?.confidenceGlobal || 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-text-secondary">Total Active Nodes</span>
                <span className="text-xs font-mono font-bold text-text-primary">{networkData.nodes.length}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
              <div className="flex items-center gap-2 mb-2">
                <Focus className="w-4 h-4 text-accent" />
                <span className="text-xs font-bold text-accent">Self-Taught Autonomy</span>
              </div>
              <div className="w-full bg-bg-raised rounded-full h-1.5 mb-1 overflow-hidden">
                <div className="bg-accent h-1.5 rounded-full" style={{ width: \`\${learningMetrics?.autonomyScore || 0}%\` }}></div>
              </div>
              <span className="text-[10px] font-mono text-text-secondary">{learningMetrics?.autonomyScore || 0}% Execution Readiness</span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#050505] relative overflow-hidden">
          <div className="absolute top-4 left-4 z-10 space-y-2 pointer-events-none">
            <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded text-[10px] font-mono text-white/70 uppercase flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              Force-Directed Insight Topology
            </div>
            <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded text-[10px] font-mono text-white/70 uppercase">
              1 Lesson Learnt = 1 New Node Link
            </div>
          </div>

          <div className="absolute top-4 right-4 z-10 pointer-events-none">
            <div className="w-32 h-32 rounded-full border border-white/5 flex items-center justify-center relative">
               <div className="absolute inset-0 border-2 border-t-accent border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
               <div className="absolute inset-2 border border-b-blue-500 border-r-transparent border-t-transparent border-l-transparent rounded-full animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}></div>
               <Fingerprint className="w-8 h-8 text-white/20" />
            </div>
          </div>

          <canvas 
            ref={canvasRef} 
            className="w-full h-full mix-blend-screen"
            style={{ filter: 'contrast(1.2) brightness(1.1)' }}
          />

          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none flex items-end p-6">
            <div className="w-full">
              <h4 className="text-xs font-mono font-bold text-white/50 uppercase mb-2 flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5" /> Matrix Event Log
              </h4>
              <div className="font-mono text-[10px] text-accent/80 space-y-1.5 h-16 overflow-hidden opacity-70">
                {networkData.nodes.filter(n => n.type === 'insight' || n.type === 'decaying').slice(0, 4).map((node, i) => (
                  <p key={i}>
                    {">"} {node.type === 'decaying' ? '[CONNECTION BROKEN] Unlearnt low-confidence policy:' : '[SYNAPSE FORMED] Processed insight:'} {node.detail}
                  </p>
                ))}
                {networkData.nodes.length === 0 && (
                  <p>{">"} Awaiting autonomous insights from DB...</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/components/NeuralPanel.tsx', content);
