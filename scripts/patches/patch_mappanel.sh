sed -i "s/const \[showHeatmap, setShowHeatmap\] = useState<boolean>(false);/const [activeOverlay, setActiveOverlay] = useState<string>('none');/" src/components/MapPanel.tsx
