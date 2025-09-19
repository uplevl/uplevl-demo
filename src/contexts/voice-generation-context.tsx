"use client";

import { createContext, useContext, useState } from "react";

interface VoiceGenerationContextType {
  isGenerating: boolean;
  currentGroupId: string | null;
  setGenerating: (groupId: string | null) => void;
}

const VoiceGenerationContext = createContext<VoiceGenerationContextType | undefined>(undefined);

interface VoiceGenerationProviderProps {
  children: React.ReactNode;
}

export function VoiceGenerationProvider({ children }: VoiceGenerationProviderProps) {
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  const setGenerating = (groupId: string | null) => {
    setCurrentGroupId(groupId);
  };

  const value = {
    isGenerating: currentGroupId !== null,
    currentGroupId,
    setGenerating,
  };

  return <VoiceGenerationContext.Provider value={value}>{children}</VoiceGenerationContext.Provider>;
}

export function useVoiceGeneration() {
  const context = useContext(VoiceGenerationContext);
  if (context === undefined) {
    throw new Error("useVoiceGeneration must be used within a VoiceGenerationProvider");
  }
  return context;
}
