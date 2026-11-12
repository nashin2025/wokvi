export type Mode = 'magic' | 'guided' | 'pro';

export type ComponentCategory = 
  'microcontroller' | 'sensor' | 'actuator' | 'display' | 'communication' | 'power' | 'passive' | 'other';

export type BoardType = 
  'arduino-uno' | 'arduino-nano' | 'esp32-devkit' | 'esp32-s3' | 'raspberry-pi-pico' | 'stm32-nucleo' | 'custom';

export interface Component {
  id: string;
  type: string;
  name: string;
  category: 'microcontroller' | 'sensor' | 'actuator' | 'display' | 'communication' | 'power' | 'passive' | 'other';
  pins: Pin[];
  footprint: Footprint;
  simulationModel?: SimulationModel;
  metadata: {
    manufacturer?: string;
    partNumber?: string;
    description?: string;
    datasheetUrl?: string;
    voltage?: { min: number; max: number; typical: number };
    current?: { typical: number; max: number };
    price?: number;
  };
}

export interface Pin {
  id: string;
  name: string;
  type: 'power' | 'ground' | 'gpio' | 'analog' | 'pwm' | 'i2c' | 'spi' | 'uart' | 'other';
  position: { x: number; y: number };
  electricalType?: 'input' | 'output' | 'bidirectional' | 'power_in' | 'power_out' | 'passive';
}

export interface Footprint {
  type: 'dip' | 'soic' | 'qfn' | 'bga' | 'through-hole' | 'smd' | 'module';
  width: number;
  height: number;
  pinSpacing: number;
  pins: number;
  bodyColor?: string;
  pinColor?: string;
}

export interface SimulationModel {
  type: 'behavioral' | 'spice' | 'functional';
  model?: string;
  parameters?: Record<string, number | string>;
}

export interface Wire {
  id: string;
  from: { componentId: string; pinId: string };
  to: { componentId: string; pinId: string };
  path: { x: number; y: number }[];
  color?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  mode: Mode;
  board: BoardType;
  components: PlacedComponent[];
  wires: Wire[];
  code: string;
  simulationConfig: SimulationConfig;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  collaborators: Collaborator[];
  isPublic: boolean;
  tags: string[];
}

export interface PlacedComponent {
  id: string;
  componentId: string;
  position: { x: number; y: number };
  rotation: 0 | 90 | 180 | 270;
  properties: Record<string, unknown>;
}

export type BoardType = 'arduino-uno' | 'arduino-nano' | 'esp32-devkit' | 'esp32-s3' | 'raspberry-pi-pico' | 'stm32-nucleo' | 'custom';

export interface SimulationConfig {
  board: BoardType;
  frequency: number;
  peripherals: PeripheralConfig[];
  virtualSensors: VirtualSensorConfig[];
}

export interface PeripheralConfig {
  type: 'gpio' | 'uart' | 'i2c' | 'spi' | 'adc' | 'pwm' | 'timer' | 'wifi' | 'ble';
  enabled: boolean;
  pins?: string[];
  config?: Record<string, unknown>;
}

export interface VirtualSensorConfig {
  type: 'temperature' | 'humidity' | 'pressure' | 'motion' | 'light' | 'distance' | 'custom';
  componentId: string;
  pin: string;
  config: Record<string, unknown>;
}

export interface Collaborator {
  userId: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: Date;
}

export interface SimulationState {
  status: 'stopped' | 'running' | 'paused' | 'error';
  currentTime: number;
  speed: number;
  breakpoints: Breakpoint[];
  registers: Record<string, number>;
  memory: Uint8Array;
  gpioState: Record<string, boolean>;
  serialOutput: SerialMessage[];
  errors: SimulationError[];
}

export interface Breakpoint {
  id: string;
  address: number;
  enabled: boolean;
  condition?: string;
}

export interface SerialMessage {
  id: string;
  timestamp: number;
  data: string;
  direction: 'tx' | 'rx';
}

export interface SimulationError {
  id: string;
  timestamp: number;
  type: 'warning' | 'error' | 'fatal';
  message: string;
  componentId?: string;
  address?: number;
}

export interface AIProjectRequest {
  prompt: string;
  board?: BoardType;
  constraints?: string[];
}

export interface AIProjectResponse {
  project: Partial<Project>;
  explanation: string;
  warnings: string[];
  suggestions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    actionType?: 'fix' | 'explanation' | 'suggestion';
    targetComponentId?: string;
    codeSnippet?: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'educator' | 'admin';
  preferences: UserPreferences;
  createdAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  mode: Mode;
  autoSave: boolean;
  showTips: boolean;
  keyboardShortcuts: boolean;
}

export interface Classroom {
  id: string;
  name: string;
  description?: string;
  teacherId: string;
  students: ClassroomStudent[];
  assignments: Assignment[];
  createdAt: Date;
}

export interface ClassroomStudent {
  userId: string;
  joinedAt: Date;
  progress: Record<string, AssignmentProgress>;
}

export interface Assignment {
  id: string;
  classroomId: string;
  title: string;
  description: string;
  starterProjectId?: string;
  expectedBehavior: ExpectedBehavior[];
  dueDate?: Date;
  maxScore: number;
}

export interface ExpectedBehavior {
  id: string;
  description: string;
  checkType: 'serial-output' | 'gpio-state' | 'variable-value' | 'timing';
  expectedValue: unknown;
  tolerance?: number;
}

export interface AssignmentProgress {
  assignmentId: string;
  status: 'not-started' | 'in-progress' | 'submitted' | 'graded';
  score?: number;
  submittedAt?: Date;
  simulationLog?: SimulationState;
}