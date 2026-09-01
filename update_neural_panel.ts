import fs from 'fs';

let content = `import React, { useState, useEffect, useRef } from 'react';
import { Network, Cpu, Layers, TrendingUp, Shield, Database, RefreshCw, Zap, Info, Activity, Sparkles, Brain, Code2, Focus, Fingerprint } from 'lucide-react';

const generateNeurons = (count: number) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    type: ['sensory', 'processing', 'memory', 'output'][Math.floor(Math.random() * 4)],
    pulseSpeed: Math.random() * 2 + 0.5,
    connections: Array.from({ length: Math.floor(Math.random() * 5) + 1 }).map(() => Math.floor(Math.random() * count))
  }));
};

const INITIAL_NEURONS = generateNeurons(180);

export function NeuralPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeSubsystem, setActiveSubsystem] = useState('bayes_calibration');
  const [isSyncing, setIsSyncing] = useState(false);
  const [neurons, setNeurons] = useState(INITIAL_NEURONS);
  const [learningMetrics, setLearningMetrics] = useState<any>(null);

  useEffect(() => {
    setLearningMetrics({
      autonomyScore: 94,
      epoch: 142,
      outcomesDigested: 1250,
      activeWeights: 2048,
      confidenceGlobal: 89.4
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.02;
      
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      ctx.clearRect(0, 0, width, height);
      
      ctx.lineWidth = 0.5;
      neurons.forEach(neuron => {
        const x1 = (neuron.x / 100) * width;
        const y1 = (neuron.y / 100) * height;
        
        const dx1 = x1 + Math.sin(time * neuron.pulseSpeed) * 3;
        const dy1 = y1 + Math.cos(time * neuron.pulseSpeed) * 3;

        neuron.connections.forEach(targetId => {
          const target = neurons[targetId];
          if (!target) return;
          const x2 = (target.x / 100) * width;
          const y2 = (target.y / 100) * height;
          
          const dx2 = x2 + Math.sin(time * target.pulseSpeed) * 3;
          const dy2 = y2 + Math.cos(time * target.pulseSpeed) * 3;

          const distance = Math.hypot(dx2 - dx1, dy2 - dy1);
          if (distance < 150) {
            const opacity = Math.max(0, 1 - (distance / 150));
            if (activeSubsystem === 'bayes_calibration') ctx.strokeStyle = \`rgba(239, 68, 68, \${opacity * 0.4})\`;
            else if (activeSubsystem === 'timesfm_forecasting') ctx.strokeStyle = \`rgba(59, 130, 246, \${opacity * 0.4})\`;
            else ctx.strokeStyle = \`rgba(16, 185, 129, \${opacity * 0.4})\`;
            
            ctx.beginPath();
            ctx.moveTo(dx1, dy1);
            ctx.lineTo(dx2, dy2);
            ctx.stroke();
            
            if (Math.random() > 0.98) {
              const packetPos = (time * 2) % 1;
              const px = dx1 + (dx2 - dx1) * packetPos;
              const py = dy1 + (dy2 - dy1) * packetPos;
              ctx.fillStyle = '#fff';
              ctx.beginPath();
              ctx.arc(px, py, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        });
      });

      neurons.forEach(neuron => {
        const x = (neuron.x / 100) * width;
        const y = (neuron.y / 100) * height;
        const dx = x + Math.sin(time * neuron.pulseSpeed) * 3;
        const dy = y + Math.cos(time * neuron.pulseSpeed) * 3;

        const pulse = Math.sin(time * neuron.pulseSpeed) * 0.5 + 0.5;
        const size = neuron.size + (pulse * 2);

        ctx.fillStyle = neuron.type === 'sensory' ? '#ef4444' : 
                        neuron.type === 'processing' ? '#3b82f6' : 
                        neuron.type === 'memory' ? '#10b981' : '#f59e0b';
        ctx.beginPath();
        ctx.arc(dx, dy, size, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 15;
        ctx.shadowColor = ctx.fillStyle;
        ctx.beginPath();
        ctx.arc(dx, dy, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [neurons, activeSubsystem]);

  const SUBSYSTEMS = [
    { id: 'bayes_calibration', label: 'Bayesian Calibration Network', icon: Network, color: 'text-red-500', bg: 'bg-red-500/10' },
    { id: 'timesfm_forecasting', label: 'TimesFM Prediction Layer', icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { id: 'objection_resolver', label: 'Objection Resolution Graph', icon: Shield, color: 'text-green-500', bg: 'bg-green-500/10' },
    { id: 'semantic_indexer', label: 'Semantic Extraction Core', icon: Database, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { id: 'deal_elasticity', label: 'Price Elasticity Analyzer', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-500/10' }
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
            onClick={() => {
              setIsSyncing(true);
              setNeurons(generateNeurons(250));
              setTimeout(() => setIsSyncing(false), 2000);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-bg-overlay border border-border-dim hover:border-accent text-text-secondary hover:text-accent rounded-lg text-sm font-medium transition-colors"
          >
            <RefreshCw className={\`w-4 h-4 \${isSyncing ? 'animate-spin' : ''}\`} />
            Re-Calibrate Weights
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-72 border-r border-border-dim bg-bg-overlay overflow-y-auto shrink-0 flex flex-col">
          <div className="p-4 border-b border-border-dim">
            <h3 className="text-xs font-mono font-bold text-text-tertiary uppercase tracking-wider mb-3">Active Neural Nodes</h3>
            <div className="space-y-2">
              {SUBSYSTEMS.map(sys => (
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
                      {Math.floor(Math.random() * 800 + 400)} Synapses
                    </span>
                  </div>
                </button>
              ))}
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
                <span className="text-xs font-mono font-bold text-green-400">{learningMetrics?.confidenceGlobal || '---'}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-text-secondary">Active Parameters</span>
                <span className="text-xs font-mono font-bold text-text-primary">{(learningMetrics?.activeWeights || 0).toLocaleString()}</span>
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
              Live Synaptic Pathway Rendering
            </div>
            <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 rounded text-[10px] font-mono text-white/70 uppercase">
              Nodes Connected: {neurons.reduce((acc, n) => acc + n.connections.length, 0)}
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
                <Code2 className="w-3.5 h-3.5" /> Matrix Output Stream
              </h4>
              <div className="font-mono text-[10px] text-accent/80 space-y-1.5 h-16 overflow-hidden opacity-70">
                <p>> Calibrating weights for node cluster [{activeSubsystem.toUpperCase()}]. Adjusted delta: +0.024</p>
                <p>> Backpropagating loss through Objection Node [obj_price_high]. Success rate updated to 42.1%.</p>
                <p>> Detected local variance. Scaling elasticity bands across {Math.floor(Math.random() * 50 + 10)} tensors.</p>
                <p>> Re-evaluating prior deal outcomes. Confidence global shift: +0.01. Ready for extraction.</p>
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
