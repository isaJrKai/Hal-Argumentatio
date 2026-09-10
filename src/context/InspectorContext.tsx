import React, { createContext, useContext, useState, useRef, useCallback, useMemo, ReactNode } from 'react';

export type InspectorEntityType = 'email_block' | 'lead' | 'campaign' | 'artifact' | 'metric' | null;

export interface InspectorState {
  type: InspectorEntityType;
  title: string;
  data: any;
  activeTab: 'content' | 'style' | 'settings';
  isOpen: boolean;
}

interface InspectorContextType {
  inspectorState: InspectorState;
  openInspector: (type: InspectorEntityType, title: string, data: any) => void;
  closeInspector: () => void;
  toggleInspector: () => void;
  setInspectorTab: (tab: 'content' | 'style' | 'settings') => void;
  updateInspectorData: (newData: any) => void;
  registerDataChangeCallback: (cb: (newData: any) => void) => void;
}

const defaultState: InspectorState = {
  type: null,
  title: 'Workspace Inspector',
  data: null,
  activeTab: 'content',
  isOpen: true
};

const InspectorContext = createContext<InspectorContextType | undefined>(undefined);

export const InspectorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inspectorState, setInspectorState] = useState<InspectorState>(defaultState);
  const changeCallbackRef = useRef<((newData: any) => void) | null>(null);

  const openInspector = useCallback((type: InspectorEntityType, title: string, data: any) => {
    setInspectorState({
      type,
      title,
      data,
      activeTab: 'content',
      isOpen: true
    });
  }, []);

  const closeInspector = useCallback(() => {
    setInspectorState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const toggleInspector = useCallback(() => {
    setInspectorState(prev => ({ ...prev, isOpen: !prev.isOpen }));
  }, []);

  const setInspectorTab = useCallback((tab: 'content' | 'style' | 'settings') => {
    setInspectorState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const updateInspectorData = useCallback((newData: any) => {
    setInspectorState(prev => ({ ...prev, data: newData }));
    if (changeCallbackRef.current) {
      changeCallbackRef.current(newData);
    }
  }, []);

  const registerDataChangeCallback = useCallback((cb: (newData: any) => void) => {
    changeCallbackRef.current = cb;
  }, []);

  const contextValue = useMemo(() => ({
    inspectorState,
    openInspector,
    closeInspector,
    toggleInspector,
    setInspectorTab,
    updateInspectorData,
    registerDataChangeCallback
  }), [
    inspectorState,
    openInspector,
    closeInspector,
    toggleInspector,
    setInspectorTab,
    updateInspectorData,
    registerDataChangeCallback
  ]);

  return (
    <InspectorContext.Provider value={contextValue}>
      {children}
    </InspectorContext.Provider>
  );
};

export const useInspector = () => {
  const context = useContext(InspectorContext);
  if (!context) {
    throw new Error('useInspector must be used within an InspectorProvider');
  }
  return context;
};

