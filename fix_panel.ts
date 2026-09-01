import fs from 'fs';
const content = `import React, { useState, useEffect, useRef } from 'react';
import { Network, Database, TrendingUp, Shield, RefreshCw, Brain, Focus, Fingerprint, Code2, Scissors, CheckCircle, XCircle } from 'lucide-react';
import * as d3 from 'd3';

export default function NeuralPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSubsystem, setActiveSubsystem] = useState('core_bayes');
  const [isSyncing, setIsSyncing] = useState(false);
  const [networkData, setNetworkData] = useState<{ nodes: any[], links: any[], telemetry: any }>({ nodes: [], links: [], telemetry: null });
  const [learningMetrics, setLearningMetrics] = useState<any>(null);
  
  const [isPruningMode, setIsPruningMode] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedPruneNode, setSelectedPruneNode] = useState<any>(null);

  const simulationRef = useRef<any>(null);
  const transformRef = useRef<any>(d3.zoomIdentity);
  const nodesRef = useRef<any[]>([]);
  const linksRef = useRef<any[]>([]);
  const particlesRef = useRef<any[]>([]);

  const fetchNetwork = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/neural/network');
      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setNetworkData({
        nodes: data.nodes || [],
        links: data.links || [],
        telemetry: data.telemetry || null
      });
      
      setLearningMetrics({
        autonomyScore: data.telemetry?.autonomyReadinessScore || 94,
        epoch: data.telemetry?.calibrationEpoch || 142,
        outcomesDigested: data.telemetry?.totalOutcomesDigested || 1250,
        activeWeights: ((data.nodes || []).length || 0) * 14 + 1024,
        confidenceGlobal: (data.telemetry?.nicheMap?.general?.confidenceScore || 0.89) * 100
      });
      
      if (data.nodes && data.links) {
        initSimulation(data.nodes, data.links);
      }
    } catch (e) {
      console.error('Failed to fetch network', e);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchNetwork();
    return () => {
      if (simulationRef.current) simulationRef.current.stop();
    };
  }, []);

  const initSimulation = (rawNodes: any[], rawLinks: any[]) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const width = container.offsetWidth;
    const height = container.offsetHeight;

    canvas.width = width;
    canvas.height = height;

    const nodes = rawNodes.map(d => ({ ...d }));
    const links = rawLinks.map(d => ({ ...d }));

    nodesRef.current = nodes;
    linksRef.current = links;

    if (simulationRef.current) simulationRef.current.stop();

    // Group-based focal points for domain clustering
    const forceX = d3.forceX((d: any) => {
      if (d.group === 1) return width * 0.2; // Bayes
      if (d.group === 2) return width * 0.8; // Objection
      if (d.group === 3) return width * 0.5; // Niche
      if (d.group === 4) return width * 0.8; // TimesFM
      if (d.group === 7) return width * 0.5; // Leads/Cells
      return width / 2;
    }).strength((d: any) => d.type === 'lead' ? 0.05 : 0.2);

    const forceY = d3.forceY((d: any) => {
      if (d.group === 1) return height * 0.2;
      if (d.group === 2) return height * 0.2;
      if (d.group === 3) return height * 0.5;
      if (d.group === 4) return height * 0.8;
      if (d.group === 7) return height * 0.5; 
      return height / 2;
    }).strength((d: any) => d.type === 'lead' ? 0.05 : 0.2);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance((d: any) => d.source.type === 'lead' ? 40 : 120).strength((d: any) => d.source.type === 'lead' ? 0.1 : 0.5))
      .force('charge', d3.forceManyBody().strength((d: any) => d.type === 'lead' ? -15 : -200))
      .force('x', forceX)
      .force('y', forceY)
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force('collide', d3.forceCollide().radius((d: any) => (d.size || 5) * 1.5))
      .on('tick', drawCanvas);

    simulationRef.current = simulation;

    // Zoom setup
    const zoom = d3.zoom()
      .scaleExtent([0.2, 8])
      .on('zoom', (e) => {
        transformRef.current = e.transform;
        drawCanvas();
      });

    d3.select(canvas).call(zoom as any);

    // Hover & Click detection
    d3.select(canvas).on('mousemove', (e) => {
      const transform = transformRef.current;
      // Invert transform to get simulation coordinates
      const [mx, my] = d3.pointer(e);
      const sx = transform.invertX(mx);
      const sy = transform.invertY(my);
      
      const node = simulation.find(sx, sy, 30 / transform.k);
      if (node) {
        setHoveredNode(node);
        setTooltipPos({ x: mx, y: my });
        canvas.style.cursor = (isPruningMode && node.type === 'decaying') ? 'crosshair' : 'pointer';
      } else {
        setHoveredNode(null);
        canvas.style.cursor = 'default';
      }
    });

    d3.select(canvas).on('click', (e) => {
      const transform = transformRef.current;
      const [mx, my] = d3.pointer(e);
      const sx = transform.invertX(mx);
      const sy = transform.invertY(my);
      const node = simulation.find(sx, sy, 30 / transform.k);
      
      if (node) {
        if (isPruningMode && node.type === 'decaying') {
          setSelectedPruneNode(node);
        } else {
          setActiveSubsystem(node.id);
        }
      } else {
         setSelectedPruneNode(null);
      }
    });
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.save();
    ctx.clearRect(0, 0, width, height);
    
    const transform = transformRef.current;
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.k, transform.k);

    linksRef.current.forEach(link => {
      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      
      const isWeak = link.source.type === 'decaying' || link.target.type === 'decaying';
      
      if (isWeak) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)'; // red
        ctx.setLineDash([5, 5]);
      } else {
        ctx.strokeStyle = \`rgba(16, 185, 129, \${Math.max(0.05, link.value / 15)})\`;
        ctx.setLineDash([]);
      }
      
      ctx.lineWidth = Math.min(2, Math.max(0.1, link.value / 4)) / transform.k;
      ctx.stroke();

      if (!isWeak && Math.random() > 0.98) {
        particlesRef.current.push({
          link,
          pos: 0,
          speed: Math.random() * 0.02 + 0.01,
          color: link.source.group === 1 ? '#ef4444' : '#10b981'
        });
      }
    });

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
      ctx.arc(px, py, 1.5 / transform.k, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 5 / transform.k;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    nodesRef.current.forEach(node => {
      const isZoomed = transform.k > 2.5;
      const isSuperZoomed = transform.k > 4;
      const r = node.size || 3;
      
      let color = '#3b82f6';
      if (node.type === 'core') color = '#f59e0b';
      else if (node.type === 'insight') color = '#10b981';
      else if (node.type === 'decaying') color = '#ef4444';
      else if (node.type === 'win') color = '#10b981';
      else if (node.type === 'loss') color = '#ef4444';
      else if (node.type === 'niche') color = '#8b5cf6';
      else if (node.type === 'lead') color = '#3b82f6';

      ctx.beginPath();
      
      // Cerebro Effect (Semantic Zoom)
      if (isZoomed && node.type === 'lead') {
        // Draw a tech cell box
        ctx.fillStyle = \`rgba(15, 23, 42, 0.9)\`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5 / transform.k;
        ctx.roundRect(node.x - 20, node.y - 10, 40, 20, 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = \`\${4}px monospace\`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isSuperZoomed) {
          ctx.fillText(node.label.substring(0, 10), node.x, node.y - 2);
          ctx.fillStyle = color;
          ctx.font = \`\${3}px monospace\`;
          ctx.fillText(node.status?.toUpperCase() || 'TARGET', node.x, node.y + 4);
        } else {
           ctx.fillText("CELL", node.x, node.y);
        }
      } else if (isZoomed && (node.type === 'core' || node.type === 'niche')) {
        ctx.fillStyle = \`rgba(15, 23, 42, 0.9)\`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1 / transform.k;
        ctx.roundRect(node.x - 30, node.y - 15, 60, 30, 4);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = \`\${6}px monospace\`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y - 2);
        
        ctx.fillStyle = color;
        ctx.font = \`\${4}px monospace\`;
        ctx.fillText(\`\${node.type.toUpperCase()} HUB\`, node.x, node.y + 6);
      } else {
        // Standard zoomed-out view (dot)
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        if (activeSubsystem === node.id || hoveredNode?.id === node.id) {
           ctx.shadowBlur = 15;
           ctx.shadowColor = color;
           ctx.fillStyle = '#fff';
        } else {
           ctx.fillStyle = color;
        }
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      if (!isZoomed && (node.type === 'core' || r > 8)) {
        ctx.font = \`\${10/transform.k}px monospace\`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + r + (12/transform.k));
      }
    });
    
    ctx.restore();
  };

  const handlePruneNode = () => {
    // Optimistic UI update
    setNetworkData(prev => ({
      ...prev,
      nodes: prev.nodes.filter(n => n.id !== selectedPruneNode.id),
      links: prev.links.filter(l => l.source.id !== selectedPruneNode.id && l.target.id !== selectedPruneNode.id)
    }));
    nodesRef.current = nodesRef.current.filter(n => n.id !== selectedPruneNode.id);
    linksRef.current = linksRef.current.filter(l => l.source.id !== selectedPruneNode.id && l.target.id !== selectedPruneNode.id);
    setSelectedPruneNode(null);
    setHoveredNode(null);
    if (simulationRef.current) {
      simulationRef.current.nodes(nodesRef.current);
      simulationRef.current.force('link').links(linksRef.current);
      simulationRef.current.alpha(1).restart();
    }
  };

  const SUBSYSTEMS = [
    { id: 'core_bayes', label: 'Bayesian Base', icon: Network, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'core_objection', label: 'Objection Graph', icon: Shield, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'core_niche', label: 'Niche Calibration', icon: Database, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'core_timesfm', label: 'TimesFM Prediction Layer', icon: TrendingUp, color: 'text-amber-500', bg: 'bg-amber-500/10' }
  ];

  return (
    <div className="h-full flex flex-col bg-bg-base overflow-hidden relative">
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
          <div className="flex items-center gap-2 px-3 py-1.5 bg-bg-overlay border border-border-dim rounded-lg mr-2">
            <Scissors className={\`w-4 h-4 \${isPruningMode ? 'text-red-500' : 'text-text-tertiary'}\`} />
            <span className="text-xs font-medium text-text-secondary mr-2">Manual Pruning</span>
            <button 
              onClick={() => setIsPruningMode(!isPruningMode)}
              className={\`relative inline-flex h-5 w-9 items-center rounded-full transition-colors \${isPruningMode ? 'bg-red-500' : 'bg-bg-raised border border-border-dim'}\`}
            >
              <span className={\`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform \${isPruningMode ? 'translate-x-4.5' : 'translate-x-1'}\`} />
            </button>
          </div>
          <button onClick={fetchNetwork} className="flex items-center gap-2 px-4 py-2 bg-bg-overlay border border-border-dim hover:border-accent text-text-secondary hover:text-accent rounded-lg text-sm font-medium transition-colors">
            <RefreshCw className={\`w-4 h-4 \${isSyncing ? 'animate-spin' : ''}\`} />
            Re-Calibrate
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r border-border-dim bg-bg-overlay overflow-y-auto shrink-0 flex flex-col">
          <div className="p-4 border-b border-border-dim">
            <h3 className="text-xs font-mono font-bold text-text-tertiary uppercase tracking-wider mb-3">Core Neural Hubs</h3>
            <div className="space-y-2">
              {SUBSYSTEMS.map(sys => {
                const nodeCount = (networkData.nodes || []).filter(n => 
                  n.id === sys.id || (networkData.links || []).some(l => (l.source.id === sys.id && l.target.id === n.id) || (l.target.id === sys.id && l.source.id === n.id))
                ).length;
                return (
                  <button key={sys.id} onClick={() => setActiveSubsystem(sys.id)} className={\`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left \${activeSubsystem === sys.id ? 'bg-bg-raised border-border-dim shadow-sm' : 'border-transparent hover:bg-bg-base text-text-secondary'}\`}>
                    <div className={\`p-1.5 rounded-md \${activeSubsystem === sys.id ? sys.bg : 'bg-bg-base'}\`}><sys.icon className={\`w-4 h-4 \${activeSubsystem === sys.id ? sys.color : 'text-text-tertiary'}\`} /></div>
                    <div><span className={\`block text-sm font-bold \${activeSubsystem === sys.id ? 'text-text-primary' : ''}\`}>{sys.label}</span><span className="block text-[10px] font-mono text-text-tertiary">{nodeCount} Connected Synapses</span></div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-4 space-y-4">
            <h3 className="text-xs font-mono font-bold text-text-tertiary uppercase tracking-wider">Matrix Live Telemetry</h3>
            <div className="bg-bg-base border border-border-dim rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center"><span className="text-[10px] font-mono text-text-secondary">Epoch</span><span className="text-xs font-mono font-bold text-text-primary">{learningMetrics?.epoch || '---'}</span></div>
              <div className="flex justify-between items-center"><span className="text-[10px] font-mono text-text-secondary">Digested Outcomes</span><span className="text-xs font-mono font-bold text-accent">{learningMetrics?.outcomesDigested || '---'}</span></div>
              <div className="flex justify-between items-center"><span className="text-[10px] font-mono text-text-secondary">Global Confidence</span><span className="text-xs font-mono font-bold text-green-400">{Number(learningMetrics?.confidenceGlobal || 0).toFixed(1)}%</span></div>
              <div className="flex justify-between items-center"><span className="text-[10px] font-mono text-text-secondary">Total Active Nodes</span><span className="text-xs font-mono font-bold text-text-primary">{(networkData.nodes || []).length}</span></div>
            </div>
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
              <div className="flex items-center gap-2 mb-2"><Focus className="w-4 h-4 text-accent" /><span className="text-xs font-bold text-accent">Self-Taught Autonomy</span></div>
              <div className="w-full bg-bg-raised rounded-full h-1.5 mb-1 overflow-hidden"><div className="bg-accent h-1.5 rounded-full" style={{ width: \`\${learningMetrics?.autonomyScore || 0}%\` }}></div></div>
              <span className="text-[10px] font-mono text-text-secondary">{learningMetrics?.autonomyScore || 0}% Execution Readiness</span>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#050505] relative overflow-hidden" ref={containerRef}>
          <div className="absolute top-4 left-4 z-10 space-y-2 pointer-events-none">
            <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded text-[10px] font-mono text-white/70 uppercase flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>Domain-Clustered Topology (Zoom for Detail)
            </div>
          </div>
          
          <canvas ref={canvasRef} className="w-full h-full mix-blend-screen outline-none" style={{ filter: 'contrast(1.2) brightness(1.1)' }} />
          
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black to-transparent pointer-events-none flex items-end p-6">
            <div className="w-full">
              <h4 className="text-xs font-mono font-bold text-white/50 uppercase mb-2 flex items-center gap-2"><Code2 className="w-3.5 h-3.5" /> Matrix Event Log</h4>
              <div className="font-mono text-[10px] text-accent/80 space-y-1.5 h-16 overflow-hidden opacity-70">
                {(networkData.nodes || []).filter(n => n.type === 'insight' || n.type === 'decaying').slice(0, 4).map((node, i) => (
                  <p key={i}>{">"} {node.type === 'decaying' ? '[CONNECTION BROKEN] Unlearnt low-confidence policy:' : '[SYNAPSE FORMED] Processed insight:'} {node.detail}</p>
                ))}
              </div>
            </div>
          </div>
          
          {/* Dynamic Tooltip */}
          {hoveredNode && !selectedPruneNode && (
             <div 
               className="absolute z-50 pointer-events-none bg-bg-raised border border-border-dim rounded-lg p-3 shadow-xl max-w-[250px]"
               style={{ left: tooltipPos.x + 15, top: Math.max(10, tooltipPos.y - 40) }}
             >
               <h4 className="text-xs font-bold text-text-primary mb-1 uppercase tracking-wider">{hoveredNode.label || 'Node'}</h4>
               {hoveredNode.detail && <p className="text-[10px] text-text-secondary mb-2 leading-tight">{hoveredNode.detail}</p>}
               
               <div className="space-y-1 mt-2 pt-2 border-t border-border-dim">
                  <div className="flex justify-between">
                    <span className="text-[9px] text-text-tertiary">TYPE</span>
                    <span className="text-[9px] text-text-primary font-mono">{hoveredNode.type.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[9px] text-text-tertiary">WEIGHT / STRENGTH</span>
                    <span className="text-[9px] text-accent font-mono">{(hoveredNode.size || hoveredNode.confidence * 10 || 5).toFixed(2)}</span>
                  </div>
                  {hoveredNode.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-[9px] text-text-tertiary">AGE</span>
                      <span className="text-[9px] text-text-primary font-mono">
                         {Math.floor((Date.now() - new Date(hoveredNode.createdAt).getTime()) / (1000 * 3600 * 24))} Days
                      </span>
                    </div>
                  )}
                  {isPruningMode && hoveredNode.type === 'decaying' && (
                    <div className="mt-2 text-[10px] font-bold text-red-500 animate-pulse text-center">
                       CLICK TO MANUAL PRUNE
                    </div>
                  )}
               </div>
             </div>
          )}

          {/* Pruning Verification Modal Overlay */}
          {selectedPruneNode && isPruningMode && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
               <div className="bg-bg-raised border border-red-500/30 rounded-xl p-6 shadow-2xl max-w-sm w-full relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
                  <Scissors className="w-8 h-8 text-red-500 mb-4" />
                  <h3 className="text-lg font-bold text-text-primary mb-2">Verify Synapse Pruning</h3>
                  <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                    This neural connection (<strong className="text-text-primary">{selectedPruneNode.label}</strong>) exhibits decaying confidence. 
                    Do you authorize manual pruning to sever this policy from the active matrix?
                  </p>
                  
                  <div className="bg-bg-overlay p-3 rounded-lg border border-border-dim mb-6 space-y-2 font-mono text-xs">
                     <div className="flex justify-between"><span className="text-text-tertiary">ID:</span><span className="text-text-secondary">{selectedPruneNode.id}</span></div>
                     <div className="flex justify-between"><span className="text-text-tertiary">Condition:</span><span className="text-red-400">Decaying / Deprecated</span></div>
                     <div className="flex justify-between"><span className="text-text-tertiary">Detail:</span><span className="text-text-secondary truncate ml-4">{selectedPruneNode.detail}</span></div>
                  </div>

                  <div className="flex gap-3">
                     <button onClick={handlePruneNode} className="flex-1 flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-2 rounded-lg text-sm font-bold transition-colors">
                        <CheckCircle className="w-4 h-4" /> Confirm Prune
                     </button>
                     <button onClick={() => setSelectedPruneNode(null)} className="flex-1 flex items-center justify-center gap-2 bg-bg-overlay hover:bg-bg-base text-text-secondary border border-border-dim py-2 rounded-lg text-sm font-bold transition-colors">
                        <XCircle className="w-4 h-4" /> Cancel
                     </button>
                  </div>
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
`

fs.writeFileSync('src/components/NeuralPanel.tsx', content);
