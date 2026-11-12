import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { Project, Mode, User, SimulationState, PlacedComponent, Wire, Component, BoardType } from '../types';

interface ProjectState {
  currentProject: Project | null;
  projects: Project[];
  mode: Mode;
  setMode: (mode: Mode) => void;
  setCurrentProject: (project: Project | null) => void;
  updateProject: (updates: Partial<Project>) => void;
  addComponent: (component: PlacedComponent) => void;
  removeComponent: (componentId: string) => void;
  updateComponent: (componentId: string, updates: Partial<PlacedComponent>) => void;
  addWire: (wire: Wire) => void;
  removeWire: (wireId: string) => void;
  updateWire: (wireId: string, updates: Partial<Wire>) => void;
  setCode: (code: string) => void;
  resetProject: () => void;
}

const createEmptyProject = (mode: Mode): Project => ({
  id: crypto.randomUUID(),
  name: 'Untitled Project',
  mode,
  board: 'esp32-devkit',
  components: [],
  wires: [],
  code: '',
  simulationConfig: {
    board: 'esp32-devkit',
    frequency: 240_000_000,
    peripherals: [],
    virtualSensors: [],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ownerId: '',
  collaborators: [],
  isPublic: false,
  tags: [],
});

export const useProjectStore = create<ProjectState>()(
  devtools(
    persist(
      (set, get) => ({
        currentProject: null,
        projects: [],
        mode: 'magic',

        setMode: (mode) => {
          const { currentProject } = get();
          if (currentProject) {
            set({ mode, currentProject: { ...currentProject, mode, updatedAt: new Date() } });
          } else {
            set({ mode, currentProject: createEmptyProject(mode) });
          }
        },

        setCurrentProject: (project) => set({ currentProject: project }),

        updateProject: (updates) => {
          const { currentProject } = get();
          if (currentProject) {
            set({
              currentProject: { ...currentProject, ...updates, updatedAt: new Date() },
            });
          }
        },

        addComponent: (component) => {
          const { currentProject } = get();
          if (currentProject) {
            set({
              currentProject: {
                ...currentProject,
                components: [...currentProject.components, component],
                updatedAt: new Date(),
              },
            });
          }
        },

        removeComponent: (componentId) => {
          const { currentProject } = get();
          if (currentProject) {
            set({
              currentProject: {
                ...currentProject,
                components: currentProject.components.filter((c) => c.id !== componentId),
                wires: currentProject.wires.filter(
                  (w) => w.from.componentId !== componentId && w.to.componentId !== componentId
                ),
                updatedAt: new Date(),
              },
            });
          }
        },

        updateComponent: (componentId, updates) => {
          const { currentProject } = get();
          if (currentProject) {
            set({
              currentProject: {
                ...currentProject,
                components: currentProject.components.map((c) =>
                  c.id === componentId ? { ...c, ...updates } : c
                ),
                updatedAt: new Date(),
              },
            });
          }
        },

        addWire: (wire) => {
          const { currentProject } = get();
          if (currentProject) {
            set({
              currentProject: {
                ...currentProject,
                wires: [...currentProject.wires, wire],
                updatedAt: new Date(),
              },
            });
          }
        },

        removeWire: (wireId) => {
          const { currentProject } = get();
          if (currentProject) {
            set({
              currentProject: {
                ...currentProject,
                wires: currentProject.wires.filter((w) => w.id !== wireId),
                updatedAt: new Date(),
              },
            });
          }
        },

        updateWire: (wireId, updates) => {
          const { currentProject } = get();
          if (currentProject) {
            set({
              currentProject: {
                ...currentProject,
                wires: currentProject.wires.map((w) =>
                  w.id === wireId ? { ...w, ...updates } : w
                ),
                updatedAt: new Date(),
              },
            });
          }
        },

        setCode: (code) => {
          const { currentProject } = get();
          if (currentProject) {
            set({
              currentProject: { ...currentProject, code, updatedAt: new Date() },
            });
          }
        },

        resetProject: () => set({ currentProject: createEmptyProject(get().mode) }),
      }),
      {
        name: 'wokvi-project',
        partialize: (state) => ({
          currentProject: state.currentProject,
          projects: state.projects,
          mode: state.mode,
        }),
      }
    ),
    { name: 'project-store' }
  )
);

interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  updatePreferences: (preferences: Partial<User['preferences']>) => void;
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        user: null,
        isAuthenticated: false,

        setUser: (user) => set({ user, isAuthenticated: !!user }),

        updatePreferences: (preferences) => {
          const { user } = useUserStore.getState();
          if (user) {
            set({ user: { ...user, preferences: { ...user.preferences, ...preferences } } });
          }
        },
      }),
      { name: 'wokvi-user' }
    ),
    { name: 'user-store' }
  )
);

interface SimulationStoreState {
  state: SimulationState;
  isConnected: boolean;
  setState: (state: Partial<SimulationState>) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
  addSerialMessage: (message: SimulationState['serialOutput'][0]) => void;
  addError: (error: SimulationState['errors'][0]) => void;
  toggleBreakpoint: (breakpoint: SimulationState['breakpoints'][0]) => void;
}

const initialSimulationState: SimulationState = {
  status: 'stopped',
  currentTime: 0,
  speed: 1,
  breakpoints: [],
  registers: {},
  memory: new Uint8Array(0),
  gpioState: {},
  serialOutput: [],
  errors: [],
};

export const useSimulationStore = create<SimulationStoreState>()(
  devtools(
    (set) => ({
      state: initialSimulationState,
      isConnected: false,

      setState: (updates) =>
        set((state) => ({ state: { ...state.state, ...updates } })),

      setConnected: (connected) => set({ isConnected: connected }),

      reset: () => set({ state: initialSimulationState }),

      addSerialMessage: (message) =>
        set((state) => ({
          state: {
            ...state.state,
            serialOutput: [...state.state.serialOutput, message].slice(-1000),
          },
        })),

      addError: (error) =>
        set((state) => ({
          state: {
            ...state.state,
            errors: [...state.state.errors, error].slice(-100),
          },
        })),

      toggleBreakpoint: (breakpoint) =>
        set((state) => {
          const exists = state.state.breakpoints.find((b) => b.id === breakpoint.id);
          return {
            state: {
              ...state.state,
              breakpoints: exists
                ? state.state.breakpoints.map((b) =>
                    b.id === breakpoint.id ? { ...b, enabled: !b.enabled } : b
                  )
                : [...state.state.breakpoints, { ...breakpoint, enabled: true }],
            },
          };
        }),
    }),
    { name: 'simulation-store' }
  )
);

interface ComponentLibraryState {
  components: Component[];
  categories: string[];
  searchQuery: string;
  selectedCategory: string | null;
  setComponents: (components: Component[]) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: string | null) => void;
  getComponents: (category?: string, query?: string) => Component[];
}

export const useComponentLibraryStore = create<ComponentLibraryState>()(
  devtools(
    (set, get) => ({
      components: [],
      categories: [
        'microcontroller',
        'sensor',
        'actuator',
        'display',
        'communication',
        'power',
        'passive',
        'other',
      ],
      searchQuery: '',
      selectedCategory: null,

      setComponents: (components) => set({ components }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      getComponents: (category, query) => {
        const { components, searchQuery, selectedCategory } = get();
        const cat = category ?? selectedCategory;
        const q = (query ?? searchQuery).toLowerCase();
        return components.filter((c) => {
          const matchesCategory = !cat || c.category === cat;
          const matchesQuery = !q || c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
          return matchesCategory && matchesQuery;
        });
      },
    }),
    { name: 'component-library-store' }
  )
);

interface UIState {
  sidebarOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  activeBottomTab: 'terminal' | 'debug' | 'console' | 'ai' | 'collab';
  theme: 'light' | 'dark' | 'system';
  collabOpen: boolean;
  collabConnected: boolean;
  collabUsers: any[];
  aiMessages: any[];
  aiInput: string;
  aiLoading: boolean;
  expandedCategories: Record<string, boolean>;
  setSidebarOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setBottomPanelOpen: (open: boolean) => void;
  setActiveBottomTab: (tab: UIState['activeBottomTab']) => void;
  setTheme: (theme: UIState['theme']) => void;
  setCollabOpen: (open: boolean) => void;
  setCollabConnected: (connected: boolean) => void;
  setCollabUsers: (users: any[]) => void;
  setAiMessages: (messages: any[]) => void;
  setAiInput: (input: string) => void;
  setAiLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  toggleCollab: () => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
(set, get) => ({
        sidebarOpen: true,
        rightPanelOpen: false,
        bottomPanelOpen: true,
        activeBottomTab: 'terminal',
        theme: 'system',
        collabOpen: false,
        collabConnected: false,
        collabUsers: [],
        aiMessages: [],
        aiInput: '',
        aiLoading: false,
        expandedCategories: {},

        setSidebarOpen: (open) => set({ sidebarOpen: open }),
        setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
        setBottomPanelOpen: (open) => set({ bottomPanelOpen: open }),
        setActiveBottomTab: (tab) => set({ activeBottomTab: tab }),
        setTheme: (theme) => set({ theme }),
        setCollabOpen: (open) => set({ collabOpen: open }),
        setCollabConnected: (connected) => set({ collabConnected: connected }),
        setCollabUsers: (users) => set({ collabUsers: users }),
        setAiMessages: (messages) => set({ aiMessages: messages }),
        setAiInput: (input) => set({ aiInput: input }),
        setAiLoading: (loading) => set({ aiLoading: loading }),

        toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
        toggleBottomPanel: () => set((state) => ({ bottomPanelOpen: !state.bottomPanelOpen })),
        toggleCollab: () => set((state) => ({ collabOpen: !state.collabOpen })),
      }),
      { name: 'wokvi-ui' }
    ),
  { name: 'ui-store' }
  )
);

export { useModeStore } from './modeStore';