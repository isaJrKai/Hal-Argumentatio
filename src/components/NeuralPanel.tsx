import React, { useState, useEffect, useRef } from 'react';
import { Network, Database, TrendingUp, Shield, RefreshCw, Brain, Focus, Fingerprint, Code2, Scissors, CheckCircle, XCircle, ZoomIn, ZoomOut, Maximize, Activity, Clock } from 'lucide-react';
import * as d3 from 'd3';

export default function NeuralPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [activeSubsystem, setActiveSubsystem] = useState('core_bayes');
  const [isSyncing, setIsSyncing] = useState(false);
  const [networkData, setNetworkData] = useState<{ nodes: any[], links: any[], telemetry: any }>({ nodes: [], links: [], telemetry: null });
  const [learningMetrics, setLearningMetrics] = useState<any>(null);
  
  // New features state
  const [isPruningMode, setIsPruningMode] = useState(false);
  const [showInfluence, setShowInfluence] = useState(false);
  const [timelineScrub, setTimelineScrub] = useState(100);
  
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedPruneNode, setSelectedPruneNode] = useState<any>(null);

  const simulationRef = useRef<any>(null);
  const zoomRef = useRef<any>(null);
  const transformRef = useRef<any>(d3.zoomIdentity);
  
  // Refs for animation loop without dependency closure issues
  const nodesRef = useRef<any[]>([]);
  const linksRef = useRef<any[]>([]);
  const particlesRef = useRef<any[]>([]);
  const scrubRef = useRef(100);
  const influenceRef = useRef(false);
  const drawRef = useRef<() => void>(() => {});

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

  // Resize Observer to fix canvas stretch and bounds
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (!containerRef.current || !canvasRef.current) return;
      const w = containerRef.current.offsetWidth;
      const h = containerRef.current.offsetHeight;
      canvasRef.current.width = w;
      canvasRef.current.height = h;
      
      if (simulationRef.current) {
         simulationRef.current.force('center', d3.forceCenter(w / 2, h / 2).strength(0.05));
         simulationRef.current.alpha(0.3).restart();
      }
      drawRef.current();
    });
    
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    influenceRef.current = showInfluence;
    scrubRef.current = timelineScrub;
    drawRef.current();
  }, [showInfluence, timelineScrub]);

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

    // Reapply saved positions from localStorage
    try {
      const savedLayout = localStorage.getItem('hal_neural_layout');
      if (savedLayout) {
        const layoutData = JSON.parse(savedLayout);
        nodes.forEach(node => {
          if (layoutData[node.id]) {
            node.x = layoutData[node.id].x;
            node.y = layoutData[node.id].y;
            node.fx = layoutData[node.id].fx;
            node.fy = layoutData[node.id].fy;
          }
        });
      }
    } catch(e) {
      console.warn("Failed to parse saved neural layout", e);
    }

    nodesRef.current = nodes;
    linksRef.current = links;

    if (simulationRef.current) simulationRef.current.stop();

    // Domain Clustering Forces
    const forceX = d3.forceX((d: any) => {
      if (d.group === 1) return width * 0.25; // Marketing
      if (d.group === 2) return width * 0.75; // Financials
      if (d.group === 3) return width * 0.50; // Operations
      if (d.group === 4) return width * 0.75; // Prediction Layer
      if (d.group === 7) return width * 0.50; // Cells/Leads center
      return width / 2;
    }).strength((d: any) => d.type === 'lead' ? 0.05 : 0.15);

    const forceY = d3.forceY((d: any) => {
      if (d.group === 1) return height * 0.3; // Marketing
      if (d.group === 2) return height * 0.3; // Financials
      if (d.group === 3) return height * 0.6; // Operations
      if (d.group === 4) return height * 0.8; // Prediction Layer
      if (d.group === 7) return height * 0.5; // Cells/Leads center
      return height / 2;
    }).strength((d: any) => d.type === 'lead' ? 0.05 : 0.15);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance((d: any) => d.source.type === 'lead' ? 60 : 120).strength((d: any) => d.source.type === 'lead' ? 0.05 : 0.4))
      .force('charge', d3.forceManyBody().strength((d: any) => d.type === 'lead' ? -15 : -250))
      .force('x', forceX)
      .force('y', forceY)
      .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
      .force('collide', d3.forceCollide().radius((d: any) => (d.size || 5) * 1.5))
      .on('tick', () => drawRef.current());

    simulationRef.current = simulation;

    // Zoom setup
    const zoom = d3.zoom()
      .scaleExtent([0.2, 8])
      .on('zoom', (e) => {
        transformRef.current = e.transform;
        drawRef.current();
      });

    zoomRef.current = zoom;
    d3.select(canvas).call(zoom as any);

    // Hover & Click detection
    d3.select(canvas).on('mousemove', (e) => {
      const transform = transformRef.current;
      const [mx, my] = d3.pointer(e);
      const sx = transform.invertX(mx);
      const sy = transform.invertY(my);
      
      // Only find visible nodes based on timeline scrub
      const maxNodes = Math.max(1, Math.ceil(nodesRef.current.length * (scrubRef.current / 100)));
      const visibleNodes = nodesRef.current.slice(0, maxNodes);
      
      let closestNode = null;
      let minDist = Infinity;
      const searchRadius = 30 / transform.k;
      
      for (const node of visibleNodes) {
        const dx = node.x - sx;
        const dy = node.y - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < searchRadius && dist < minDist) {
           minDist = dist;
           closestNode = node;
        }
      }
      
      if (closestNode) {
        setHoveredNode(closestNode);
        setTooltipPos({ x: mx, y: my });
        canvas.style.cursor = (isPruningMode && closestNode.type === 'decaying') ? 'crosshair' : 'pointer';
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
      
      const maxNodes = Math.max(1, Math.ceil(nodesRef.current.length * (scrubRef.current / 100)));
      const visibleNodes = nodesRef.current.slice(0, maxNodes);
      
      let closestNode = null;
      let minDist = Infinity;
      for (const node of visibleNodes) {
        const dx = node.x - sx;
        const dy = node.y - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < (30 / transform.k) && dist < minDist) {
           minDist = dist;
           closestNode = node;
        }
      }
      
      if (closestNode) {
        if (isPruningMode && closestNode.type === 'decaying') {
          setSelectedPruneNode(closestNode);
        } else {
          setActiveSubsystem(closestNode.id);
        }
      } else {
         setSelectedPruneNode(null);
      }
    });

    const drag = d3.drag<HTMLCanvasElement, any>()
      .subject((e) => {
        const transform = transformRef.current;
        const [mx, my] = d3.pointer(e, canvas);
        const sx = transform.invertX(mx);
        const sy = transform.invertY(my);
        
        let closestNode = null;
        let minDist = Infinity;
        for (const node of nodesRef.current) {
          const dx = node.x - sx;
          const dy = node.y - sy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < (30 / transform.k) && dist < minDist) {
             minDist = dist;
             closestNode = node;
          }
        }
        return closestNode;
      })
      .on('start', (e) => {
        if (!e.active) simulation.alphaTarget(0.3).restart();
        e.subject.fx = e.subject.x;
        e.subject.fy = e.subject.y;
      })
      .on('drag', (e) => {
        e.subject.fx = e.x;
        e.subject.fy = e.y;
      })
      .on('end', (e) => {
        if (!e.active) simulation.alphaTarget(0);
        // Persist node positions locally so they retain structure
        const layout: Record<string, {x: number, y: number, fx: number, fy: number}> = {};
        nodesRef.current.forEach((n: any) => {
          layout[n.id] = { x: n.x, y: n.y, fx: n.fx, fy: n.fy };
        });
        localStorage.setItem('hal_neural_layout', JSON.stringify(layout));
        
        // Also fire off background persist to DB API
        fetch('/api/neural/network/layout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token')}`
          },
          body: JSON.stringify({ layout })
        }).catch(err => console.warn('Background layout sync failed', err));
      });
      
    d3.select(canvas).call(drag);
  };

  drawRef.current = () => {
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

    // Draw Domain Clustering Background Labels
    if (transform.k < 1.5) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      ctx.font = `bold ${40 / transform.k}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("MARKETING HUB", width * 0.25, height * 0.3);
      ctx.fillText("FINANCIALS", width * 0.75, height * 0.3);
      ctx.fillText("OPERATIONS", width * 0.50, height * 0.6);
      ctx.fillText("PREDICTION", width * 0.75, height * 0.8);
    }

    const timelineCount = Math.max(1, Math.ceil(nodesRef.current.length * (scrubRef.current / 100)));
    const visibleNodesMap = new Set(nodesRef.current.slice(0, timelineCount).map(n => n.id));

    linksRef.current.forEach(link => {
      if (!visibleNodesMap.has(link.source.id) || !visibleNodesMap.has(link.target.id)) return;

      ctx.beginPath();
      ctx.moveTo(link.source.x, link.source.y);
      ctx.lineTo(link.target.x, link.target.y);
      
      const isWeak = link.source.type === 'decaying' || link.target.type === 'decaying';
      const isCrossDomain = link.source.group !== link.target.group;
      
      if (influenceRef.current && isCrossDomain) {
         // Global Influence Overlay Active
         ctx.strokeStyle = `rgba(168, 85, 247, ${Math.max(0.3, link.value / 8)})`; // Violet glow
         ctx.setLineDash([]);
         ctx.lineWidth = Math.min(3, Math.max(0.5, link.value / 3)) / transform.k;
      } else if (isWeak) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.2)'; // Red
        ctx.setLineDash([5, 5]);
        ctx.lineWidth = 1 / transform.k;
      } else {
        // Normal
        const opacity = influenceRef.current ? 0.05 : Math.max(0.05, link.value / 15);
        ctx.strokeStyle = `rgba(16, 185, 129, ${opacity})`;
        ctx.setLineDash([]);
        ctx.lineWidth = Math.min(2, Math.max(0.1, link.value / 4)) / transform.k;
      }
      
      ctx.stroke();

      // Flow Animations
      let spawnRate = 0.98;
      if (influenceRef.current && isCrossDomain) spawnRate = 0.90; // higher density when highlighted

      if (!isWeak && Math.random() > spawnRate) {
        particlesRef.current.push({
          link,
          pos: 0,
          speed: (Math.random() * 0.02 + 0.01) * (influenceRef.current && isCrossDomain ? 2 : 1),
          color: (influenceRef.current && isCrossDomain) ? '#d946ef' : (link.source.group === 1 ? '#ef4444' : '#10b981')
        });
      }
    });

    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      if (!visibleNodesMap.has(p.link.source.id) || !visibleNodesMap.has(p.link.target.id)) {
         particlesRef.current.splice(i, 1);
         continue;
      }
      
      p.pos += p.speed;
      if (p.pos >= 1) {
        particlesRef.current.splice(i, 1);
        continue;
      }
      const px = p.link.source.x + (p.link.target.x - p.link.source.x) * p.pos;
      const py = p.link.source.y + (p.link.target.y - p.link.source.y) * p.pos;
      ctx.beginPath();
      ctx.arc(px, py, (influenceRef.current ? 2.5 : 1.5) / transform.k, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = (influenceRef.current ? 10 : 5) / transform.k;
      ctx.shadowColor = p.color;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    nodesRef.current.forEach(node => {
      if (!visibleNodesMap.has(node.id)) return;

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

      if (influenceRef.current && node.type !== 'core' && node.type !== 'niche') {
         color = 'rgba(255,255,255,0.3)';
      }

      ctx.beginPath();
      
      // Cerebro Effect (Semantic Zoom)
      if (isZoomed && node.type === 'lead') {
        const boxW = 50 / transform.k;
        const boxH = 20 / transform.k;
        
        ctx.fillStyle = `rgba(15, 23, 42, 0.95)`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5 / transform.k;
        ctx.roundRect(node.x - boxW/2, node.y - boxH/2, boxW, boxH, 2 / transform.k);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = `${5 / transform.k}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (isSuperZoomed) {
          ctx.fillText((node.label || '').substring(0, 12), node.x, node.y - (3/transform.k));
          ctx.fillStyle = color;
          ctx.font = `${3.5 / transform.k}px monospace`;
          ctx.fillText(node.status?.toUpperCase() || 'TARGET', node.x, node.y + (3/transform.k));
        } else {
           ctx.fillText("CELL", node.x, node.y);
        }
      } else if (isZoomed && (node.type === 'core' || node.type === 'niche')) {
        const boxW = 80 / transform.k;
        const boxH = 30 / transform.k;
        ctx.fillStyle = `rgba(15, 23, 42, 0.95)`;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1 / transform.k;
        ctx.roundRect(node.x - boxW/2, node.y - boxH/2, boxW, boxH, 4 / transform.k);
        ctx.fill();
        ctx.stroke();
        
        ctx.fillStyle = '#fff';
        ctx.font = `${7 / transform.k}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y - (4/transform.k));
        
        ctx.fillStyle = color;
        ctx.font = `${4.5 / transform.k}px monospace`;
        ctx.fillText(`${node.type.toUpperCase()} HUB`, node.x, node.y + (5/transform.k));
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
        ctx.font = `${10/transform.k}px monospace`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x, node.y + r + (12/transform.k));
      }
    });
    
    ctx.restore();
  };

  const handlePruneNode = async () => {
    if (!selectedPruneNode) return;
    
    // Call the backend to persist pruning
    try {
      await fetch(`/api/neural/network/prune/${selectedPruneNode.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('halbiz_auth_token') || localStorage.getItem('token')}`
        }
      });
    } catch (e) {
      console.error('Failed to prune node on backend', e);
    }
    
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

  const handleZoom = (factor: number) => {
    if (canvasRef.current && zoomRef.current) {
      d3.select(canvasRef.current).transition().duration(300).call(zoomRef.current.scaleBy, factor);
    }
  };

  const handleZoomReset = () => {
    if (canvasRef.current && zoomRef.current) {
      d3.select(canvasRef.current).transition().duration(500).call(zoomRef.current.transform, d3.zoomIdentity);
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
            <Scissors className={`w-4 h-4 ${isPruningMode ? 'text-red-500' : 'text-text-tertiary'}`} />
            <span className="text-xs font-medium text-text-secondary mr-2">Manual Pruning</span>
            <button 
              onClick={() => setIsPruningMode(!isPruningMode)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${isPruningMode ? 'bg-red-500' : 'bg-bg-raised border border-border-dim'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${isPruningMode ? 'translate-x-4.5' : 'translate-x-1'}`} />
            </button>
          </div>
          <button onClick={fetchNetwork} className="flex items-center gap-2 px-4 py-2 bg-bg-overlay border border-border-dim hover:border-accent text-text-secondary hover:text-accent rounded-lg text-sm font-medium transition-colors">
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Re-Calibrate
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r border-border-dim bg-bg-overlay overflow-y-auto shrink-0 flex flex-col z-20 shadow-xl">
          <div className="p-4 border-b border-border-dim">
            <h3 className="text-xs font-mono font-bold text-text-tertiary uppercase tracking-wider mb-3">Core Neural Hubs</h3>
            <div className="space-y-2">
              {SUBSYSTEMS.map(sys => {
                const nodeCount = (networkData.nodes || []).filter(n => 
                  n.id === sys.id || (networkData.links || []).some(l => (l.source.id === sys.id && l.target.id === n.id) || (l.target.id === sys.id && l.source.id === n.id))
                ).length;
                return (
                  <button key={sys.id} onClick={() => setActiveSubsystem(sys.id)} className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${activeSubsystem === sys.id ? 'bg-bg-raised border-border-dim shadow-sm' : 'border-transparent hover:bg-bg-base text-text-secondary'}`}>
                    <div className={`p-1.5 rounded-md ${activeSubsystem === sys.id ? sys.bg : 'bg-bg-base'}`}><sys.icon className={`w-4 h-4 ${activeSubsystem === sys.id ? sys.color : 'text-text-tertiary'}`} /></div>
                    <div><span className={`block text-sm font-bold ${activeSubsystem === sys.id ? 'text-text-primary' : ''}`}>{sys.label}</span><span className="block text-[10px] font-mono text-text-tertiary">{nodeCount} Synapses</span></div>
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
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 bg-bg-base overflow-hidden">
          {/* Main Interactive Canvas Area */}
          <div className="flex-1 bg-[#050505] relative min-h-0 overflow-hidden" ref={containerRef}>
            {/* Zoom Controls */}
            <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
               <button onClick={() => handleZoom(1.5)} className="p-2 bg-bg-raised border border-border-dim rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors shadow-lg">
                  <ZoomIn className="w-5 h-5" />
               </button>
               <button onClick={() => handleZoom(0.66)} className="p-2 bg-bg-raised border border-border-dim rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors shadow-lg">
                  <ZoomOut className="w-5 h-5" />
               </button>
               <button onClick={handleZoomReset} className="p-2 bg-bg-raised border border-border-dim rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-overlay transition-colors shadow-lg mt-2" title="Reset Zoom">
                  <Maximize className="w-5 h-5" />
               </button>
            </div>

            {/* Overlays Left */}
            <div className="absolute top-4 left-4 z-10 space-y-3 pointer-events-none">
              <div className="px-3 py-1.5 bg-black/60 backdrop-blur-md border border-white/10 rounded text-[10px] font-mono text-white/70 uppercase flex items-center gap-2 w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>Domain-Clustered Topology Active
              </div>
              
              <button 
                 onClick={() => setShowInfluence(!showInfluence)}
                className={`pointer-events-auto px-3 py-1.5 backdrop-blur-md border rounded text-[10px] font-mono uppercase flex items-center gap-2 transition-colors w-fit ${showInfluence ? 'bg-purple-900/40 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-black/60 border-white/10 text-white/70 hover:bg-white/5'}`}
              >
                <Activity className={`w-3.5 h-3.5 ${showInfluence ? 'text-purple-400' : ''}`} />
                Global Influence Mode
              </button>
            </div>
            
            <canvas ref={canvasRef} className="absolute inset-0 outline-none block cursor-grab active:cursor-grabbing" style={{ filter: 'contrast(1.2) brightness(1.1)' }} />
          </div>
          
          {/* Bottom Event Log & Timeline */}
          <div className="h-28 shrink-0 bg-bg-raised border-t border-border-dim z-20 pointer-events-auto flex flex-row items-center justify-between gap-6 p-4 relative">
            
            {/* Matrix Event Log (Bottom Left) */}
            <div className="flex-1 max-w-xl bg-bg-overlay border border-border-dim rounded-lg p-3 shadow-sm hover:bg-bg-base transition-colors h-full flex flex-col justify-center">
              <h4 className="text-[10px] font-mono font-bold text-text-secondary uppercase mb-2 flex items-center gap-1.5"><Code2 className="w-3.5 h-3.5 text-text-tertiary" /> Matrix Event Log</h4>
              <div className="font-mono text-[9px] text-accent/90 space-y-1 h-10 overflow-hidden leading-relaxed">
                {(networkData.nodes || [])
                  .filter(n => n.type === 'insight' || n.type === 'decaying')
                  .slice(0, 2)
                  .map((node, i) => (
                  <p key={i} className="truncate">{">"} {node.type === 'decaying' ? '[BROKEN]' : '[FORMED]'} {node.detail}</p>
                ))}
              </div>
            </div>

            {/* Timeline Scrubber (Bottom Right) */}
            <div className="flex-1 max-w-md bg-bg-overlay border border-border-dim p-3 rounded-lg shadow-sm hover:bg-bg-base transition-colors h-full flex flex-col justify-center">
               <div className="flex items-center justify-between mb-3">
                 <h4 className="text-[10px] font-mono font-bold text-text-secondary uppercase flex items-center gap-1.5">
                   <Clock className="w-3.5 h-3.5 text-text-tertiary" /> Historical State
                 </h4>
                 <span className="text-[10px] font-mono text-accent font-bold">{timelineScrub}% Visible</span>
               </div>
               <input 
                  type="range" 
                  min="5" 
                  max="100" 
                  value={timelineScrub}
                  onChange={(e) => setTimelineScrub(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-border-dim rounded-lg appearance-none cursor-pointer accent-accent"
               />
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
