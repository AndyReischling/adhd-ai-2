import { create } from 'zustand';
import { Company, DoomsdayScenario, ProjectPhase } from '@/types';

interface ProjectState {
  company: Company | null;
  scenarios: DoomsdayScenario[];
  selectedScenarios: DoomsdayScenario[];
  currentPhase: ProjectPhase;
  setCompany: (company: Company) => void;
  setScenarios: (scenarios: DoomsdayScenario[]) => void;
  selectScenario: (scenario: DoomsdayScenario) => void;
  deselectScenario: (scenarioId: string) => void;
  setPhase: (phase: ProjectPhase) => void;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  company: null,
  scenarios: [],
  selectedScenarios: [],
  currentPhase: 'search',

  setCompany: (company) => set({ company }),

  setScenarios: (scenarios) => set({ scenarios }),

  selectScenario: (scenario) =>
    set((state) => {
      if (state.selectedScenarios.length >= 3) return state;
      if (state.selectedScenarios.find((s) => s.id === scenario.id))
        return state;
      return { selectedScenarios: [...state.selectedScenarios, scenario] };
    }),

  deselectScenario: (scenarioId) =>
    set((state) => ({
      selectedScenarios: state.selectedScenarios.filter(
        (s) => s.id !== scenarioId
      ),
    })),

  setPhase: (phase) => set({ currentPhase: phase }),

  reset: () =>
    set({
      company: null,
      scenarios: [],
      selectedScenarios: [],
      currentPhase: 'search',
    }),
}));
