// Shared types for Wokvi
// Used by both frontend and backend

import { z } from 'zod';

// ============================================
// Core Types
// ============================================

export type Mode = 'magic' | 'guided' | 'pro';

export type BoardType = 
  | 'arduino-uno'
  | 'arduino-nano'
  | 'esp32-devkit'
  | 'esp32-s3'
  | 'raspberry-pi-pico'
  | 'stm32-nucleo'
  | 'custom';

export type ComponentCategory = 
  | 'microcontroller'
  | 'sensor'
  | 'actuator'
  | 'display'
  | 'communication'
  | 'power'
  | 'passive'
  | 'other';

export type PinType = 
  | 'power'
  | 'ground'
  | 'gpio'
  | 'analog'
  | 'pwm'
  | 'i2c'
  | 'spi'
  | 'uart'
  | 'other';

export type SimulationStatus = 'stopped' | 'running' | 'paused' | 'error';

// ============================================
// Zod Schemas (for validation)
// ============================================

export const PinSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['power', 'ground', 'gpio', 'analog', 'pwm', 'i2c', 'spi', 'uart', 'other']),
  position: z.object({ x: z.number(), y: z.number() }),
  electricalType: z.enum(['input', 'output', 'bidirectional', 'power_in', 'power_out', 'passive']).optional(),
});

export const FootprintSchema = z.object({
  type: z.enum(['dip', 'soic', 'qfn', 'bga', 'through-hole', 'smd', 'module']),
  width: z.number(),
  height: z.number(),
  pinSpacing: z.number(),
  pins: z.number(),
  bodyColor: z.string().optional(),
  pinColor: z.string().optional(),
});

export const SimulationModelSchema = z.object({
  type: z.enum(['behavioral', 'spice', 'functional']),
  model: z.string().optional(),
  parameters: z.record(z.union([z.number(), z.string()])).optional(),
});

export const ComponentMetadataSchema = z.object({
  manufacturer: z.string().optional(),
  partNumber: z.string().optional(),
  description: z.string().optional(),
  datasheetUrl: z.string().url().optional(),
  voltage: z.object({ min: z.number(), max: z.number(), typical: z.number() }).optional(),
  current: z.object({ typical: z.number(), max: z.number() }).optional(),
  price: z.number().optional(),
});

export const ComponentSchema = z.object({
  id: z.string(),
  type: z.string(),
  name: z.string(),
  category: z.enum(['microcontroller', 'sensor', 'actuator', 'display', 'communication', 'power', 'passive', 'other']),
  pins: z.array(PinSchema),
  footprint: FootprintSchema,
  simulationModel: SimulationModelSchema.optional(),
  metadata: ComponentMetadataSchema,
});

export const WireSchema = z.object({
  id: z.string(),
  from: z.object({
    componentId: z.string(),
    pinId: z.string(),
  }),
  to: z.object({
    componentId: z.string(),
    pinId: z.string(),
  }),
  path: z.array(z.object({ x: z.number(), y: z.number() })),
  color: z.string().optional(),
});

export const PlacedComponentSchema = z.object({
  id: z.string(),
  componentId: z.string(),
  position: z.object({ x: z.number(), y: z.number() }),
  rotation: z.union([z.literal(0), z.literal(90), z.literal(180), z.literal(270)]),
  properties: z.record(z.unknown()),
});

export const PeripheralConfigSchema = z.object({
  type: z.enum(['gpio', 'uart', 'i2c', 'spi', 'adc', 'pwm', 'timer', 'wifi', 'ble']),
  enabled: z.boolean(),
  pins: z.array(z.string()).optional(),
  config: z.record(z.unknown()).optional(),
});

export const VirtualSensorConfigSchema = z.object({
  type: z.enum(['temperature', 'humidity', 'pressure', 'motion', 'light', 'distance', 'custom']),
  componentId: z.string(),
  pin: z.string(),
  config: z.record(z.unknown()),
});

export const SimulationConfigSchema = z.object({
  board: z.enum(['arduino-uno', 'arduino-nano', 'esp32-devkit', 'esp32-s3', 'raspberry-pi-pico', 'stm32-nucleo', 'custom']),
  frequency: z.number(),
  peripherals: z.array(PeripheralConfigSchema),
  virtualSensors: z.array(VirtualSensorConfigSchema),
});

export const CollaboratorSchema = z.object({
  userId: z.string(),
  role: z.enum(['owner', 'editor', 'viewer']),
  joinedAt: z.date(),
});

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  mode: z.enum(['magic', 'guided', 'pro']),
  board: z.enum(['arduino-uno', 'arduino-nano', 'esp32-devkit', 'esp32-s3', 'raspberry-pi-pico', 'stm32-nucleo', 'custom']),
  components: z.array(PlacedComponentSchema),
  wires: z.array(WireSchema),
  code: z.string(),
  simulationConfig: SimulationConfigSchema,
  createdAt: z.date(),
  updatedAt: z.date(),
  ownerId: z.string(),
  collaborators: z.array(CollaboratorSchema),
  isPublic: z.boolean(),
  tags: z.array(z.string()),
});

// ============================================
// TypeScript Types (inferred from schemas)
// ============================================

export type Pin = z.infer<typeof PinSchema>;
export type Footprint = z.infer<typeof FootprintSchema>;
export type SimulationModel = z.infer<typeof SimulationModelSchema>;
export type ComponentMetadata = z.infer<typeof ComponentMetadataSchema>;
export type Component = z.infer<typeof ComponentSchema>;
export type Wire = z.infer<typeof WireSchema>;
export type PlacedComponent = z.infer<typeof PlacedComponentSchema>;
export type PeripheralConfig = z.infer<typeof PeripheralConfigSchema>;
export type VirtualSensorConfig = z.infer<typeof VirtualSensorConfigSchema>;
export type SimulationConfig = z.infer<typeof SimulationConfigSchema>;
export type Collaborator = z.infer<typeof CollaboratorSchema>;
export type Project = z.infer<typeof ProjectSchema>;

// ============================================
// Simulation Types
// ============================================

export const BreakpointSchema = z.object({
  id: z.string(),
  address: z.number(),
  enabled: z.boolean(),
  condition: z.string().optional(),
});

export const SerialMessageSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  data: z.string(),
  direction: z.enum(['tx', 'rx']),
});

export const SimulationErrorSchema = z.object({
  id: z.string(),
  timestamp: z.number(),
  type: z.enum(['warning', 'error', 'fatal']),
  message: z.string(),
  componentId: z.string().optional(),
  address: z.number().optional(),
});

export const SimulationStateSchema = z.object({
  status: z.enum(['stopped', 'running', 'paused', 'error']),
  currentTime: z.number(),
  speed: z.number(),
  breakpoints: z.array(BreakpointSchema),
  registers: z.record(z.number()),
  memory: z.instanceof(Uint8Array),
  gpioState: z.record(z.boolean()),
  serialOutput: z.array(SerialMessageSchema),
  errors: z.array(SimulationErrorSchema),
});

export type Breakpoint = z.infer<typeof BreakpointSchema>;
export type SerialMessage = z.infer<typeof SerialMessageSchema>;
export type SimulationError = z.infer<typeof SimulationErrorSchema>;
export type SimulationState = z.infer<typeof SimulationStateSchema>;

// ============================================
// AI Types
// ============================================

export const AIProjectRequestSchema = z.object({
  prompt: z.string(),
  board: z.enum(['arduino-uno', 'arduino-nano', 'esp32-devkit', 'esp32-s3', 'raspberry-pi-pico', 'stm32-nucleo', 'custom']).optional(),
  constraints: z.array(z.string()).optional(),
});

export const AIProjectResponseSchema = z.object({
  project: ProjectSchema.partial(),
  explanation: z.string(),
  warnings: z.array(z.string()),
  suggestions: z.array(z.string()),
});

export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.date(),
  metadata: z.object({
    actionType: z.enum(['fix', 'explanation', 'suggestion']).optional(),
    targetComponentId: z.string().optional(),
    codeSnippet: z.string().optional(),
  }).optional(),
});

export type AIProjectRequest = z.infer<typeof AIProjectRequestSchema>;
export type AIProjectResponse = z.infer<typeof AIProjectResponseSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

// ============================================
// User Types
// ============================================

export const UserPreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  mode: z.enum(['magic', 'guided', 'pro']),
  autoSave: z.boolean(),
  showTips: z.boolean(),
  keyboardShortcuts: z.boolean(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatar: z.string().optional(),
  role: z.enum(['user', 'educator', 'admin']),
  preferences: UserPreferencesSchema,
  createdAt: z.date(),
});

export type UserPreferences = z.infer<typeof UserPreferencesSchema>;
export type User = z.infer<typeof UserSchema>;

// ============================================
// Classroom Types
// ============================================

export const ExpectedBehaviorSchema = z.object({
  id: z.string(),
  description: z.string(),
  checkType: z.enum(['serial-output', 'gpio-state', 'variable-value', 'timing']),
  expectedValue: z.unknown(),
  tolerance: z.number().optional(),
});

export const AssignmentSchema = z.object({
  id: z.string(),
  classroomId: z.string(),
  title: z.string(),
  description: z.string(),
  starterProjectId: z.string().optional(),
  expectedBehavior: z.array(ExpectedBehaviorSchema),
  dueDate: z.date().optional(),
  maxScore: z.number(),
});

export const ClassroomStudentSchema = z.object({
  userId: z.string(),
  joinedAt: z.date(),
  progress: z.record(z.object({
    assignmentId: z.string(),
    status: z.enum(['not-started', 'in-progress', 'submitted', 'graded']),
    score: z.number().optional(),
    submittedAt: z.date().optional(),
    simulationLog: SimulationStateSchema.optional(),
  })),
});

export const ClassroomSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  teacherId: z.string(),
  students: z.array(ClassroomStudentSchema),
  assignments: z.array(AssignmentSchema),
  createdAt: z.date(),
});

export type ExpectedBehavior = z.infer<typeof ExpectedBehaviorSchema>;
export type Assignment = z.infer<typeof AssignmentSchema>;
export type ClassroomStudent = z.infer<typeof ClassroomStudentSchema>;
export type Classroom = z.infer<typeof ClassroomSchema>;

// ============================================
// Validation Helpers
// ============================================

export function validateProject(data: unknown): Project {
  return ProjectSchema.parse(data);
}

export function validateComponent(data: unknown): Component {
  return ComponentSchema.parse(data);
}

export function validateSimulationConfig(data: unknown): SimulationConfig {
  return SimulationConfigSchema.parse(data);
}

// ============================================
// API Request/Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// WebSocket Message Types
// ============================================

export interface WSMessage {
  type: string;
  payload: unknown;
  requestId?: string;
}

export interface WSSimulationMessage extends WSMessage {
  type: 'simulation:start' | 'simulation:stop' | 'simulation:pause' | 'simulation:step' | 'simulation:state';
  payload: {
    sessionId?: string;
    projectId?: string;
    state?: SimulationState;
  };
}

export interface WSAIChatMessage extends WSMessage {
  type: 'ai:chat' | 'ai:analyze' | 'ai:suggest';
  payload: {
    message: string;
    projectId?: string;
    context?: Record<string, unknown>;
  };
}