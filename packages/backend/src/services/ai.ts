import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { config } from '../config.js';

interface AIProvider {
  generateProject(prompt: string, board: string, components: ComponentInfo[]): Promise<AIProjectResponse>;
  chat(messages: ChatMessage[], context?: ProjectContext): Promise<string>;
  analyzeSchematic(components: ComponentInfo[], wires: WireInfo[]): Promise<AnalysisResult>;
  suggestComponents(requirements: string, currentComponents: string[], budget?: number): Promise<ComponentSuggestion[]>;
}

interface ComponentInfo {
  id: string;
  name: string;
  category: string;
  pins: PinInfo[];
  metadata: Record<string, unknown>;
}

interface PinInfo {
  id: string;
  name: string;
  type: string;
  position: { x: number; y: number };
}

interface WireInfo {
  id: string;
  from: { componentId: string; pinId: string };
  to: { componentId: string; pinId: string };
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ProjectContext {
  schematic?: { components: ComponentInfo[]; wires: WireInfo[] };
  code?: string;
  simulationState?: Record<string, unknown>;
}

interface AIProjectResponse {
  project: {
    name: string;
    description: string;
    board: string;
    components: PlacedComponent[];
    wires: WireInfo[];
    code: string;
    simulationConfig: SimulationConfig;
  };
  explanation: string;
  warnings: string[];
  suggestions: string[];
}

interface PlacedComponent {
  id: string;
  componentId: string;
  position: { x: number; y: number };
  rotation: 0 | 90 | 180 | 270;
  properties: Record<string, unknown>;
}

interface SimulationConfig {
  board: string;
  frequency: number;
  peripherals: PeripheralConfig[];
  virtualSensors: VirtualSensorConfig[];
}

interface PeripheralConfig {
  type: string;
  enabled: boolean;
  pins?: string[];
  config?: Record<string, unknown>;
}

interface VirtualSensorConfig {
  type: string;
  componentId: string;
  pin: string;
  config: Record<string, unknown>;
}

interface AnalysisResult {
  issues: { type: 'error' | 'warning' | 'info'; message: string; severity: 'high' | 'medium' | 'low' }[];
  suggestions: string[];
}

interface ComponentSuggestion {
  id: string;
  name: string;
  reason: string;
  price: number;
  category: string;
}

class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateProject(prompt: string, board: string, components: ComponentInfo[]): Promise<AIProjectResponse> {
    const componentList = components.map(c => `- ${c.name} (${c.category}): ${c.pins.map(p => p.name).join(', ')}`).join('\n');
    
    const systemPrompt = `You are an expert embedded systems engineer. Generate a complete, working project from a natural language description.

Return ONLY valid JSON matching this exact schema:
{
  "project": {
    "name": "string",
    "description": "string", 
    "board": "string",
    "components": [{"id": "string", "componentId": "string", "position": {"x": number, "y": number}, "rotation": 0|90|180|270, "properties": {}}],
    "wires": [{"id": "string", "from": {"componentId": "string", "pinId": "string"}, "to": {"componentId": "string", "pinId": "string"}, "path": [{"x": number, "y": number}]}],
    "code": "string (complete compilable C++/Arduino code)",
    "simulationConfig": {
      "board": "string",
      "frequency": number,
      "peripherals": [{"type": "string", "enabled": true, "pins": ["string"], "config": {}}],
      "virtualSensors": [{"type": "string", "componentId": "string", "pin": "string", "config": {}}]
    }
  },
  "explanation": "string",
  "warnings": ["string"],
  "suggestions": ["string"]
}

Available components:
${componentList}

Board: ${board}
Rules:
- Position components on a 800x600 canvas with 50px margins
- Use standard pin mappings for the board
- Include all necessary library includes
- Add proper pin definitions
- Implement realistic timing delays
- Add error handling for sensor initialization
- Return ONLY the JSON, no markdown, no explanation`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 8192,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(content);
  }

  async chat(messages: ChatMessage[], context?: ProjectContext): Promise<string> {
    const systemPrompt = `You are an expert embedded systems debugging assistant. Help the user with their project.
Context: ${context ? JSON.stringify(context, null, 2) : 'No project context'}
Be concise, practical, and provide actionable fixes.`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.3,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    return response.content[0].type === 'text' ? response.content[0].text : '';
  }

  async analyzeSchematic(components: ComponentInfo[], wires: WireInfo[]): Promise<AnalysisResult> {
    const systemPrompt = `Analyze this schematic for electrical issues. Return JSON:
{
  "issues": [{"type": "error|warning|info", "message": "string", "severity": "high|medium|low"}],
  "suggestions": ["string"]
}
Check for: pin conflicts, missing pull-ups, power issues, signal integrity, incorrect connections.`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.2,
      system: systemPrompt,
      messages: [{ role: 'user', content: JSON.stringify({ components, wires }, null, 2) }],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(content);
  }

  async suggestComponents(requirements: string, currentComponents: string[], budget?: number): Promise<ComponentSuggestion[]> {
    const systemPrompt = `Suggest components for: ${requirements}. Current: ${currentComponents.join(', ') || 'none'}. Budget: ${budget || 'unlimited'}.
Return JSON array: [{"id": "string", "name": "string", "reason": "string", "price": number, "category": "string"}]
Prioritize: integration ease, availability, cost-effectiveness.`;

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      temperature: 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: requirements }],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    return JSON.parse(content);
  }
}

class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateProject(prompt: string, board: string, components: ComponentInfo[]): Promise<AIProjectResponse> {
    const componentList = components.map(c => `- ${c.name} (${c.category}): ${c.pins.map(p => p.name).join(', ')}`).join('\n');
    
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 8192,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert embedded systems engineer. Generate a complete, working project from a natural language description.

Return ONLY valid JSON matching this exact schema:
{
  "project": {
    "name": "string",
    "description": "string", 
    "board": "string",
    "components": [{"id": "string", "componentId": "string", "position": {"x": number, "y": number}, "rotation": 0|90|180|270, "properties": {}}],
    "wires": [{"id": "string", "from": {"componentId": "string", "pinId": "string"}, "to": {"componentId": "string", "pinId": "string"}, "path": [{"x": number, "y": number}]}],
    "code": "string (complete compilable C++/Arduino code)",
    "simulationConfig": {
      "board": "string",
      "frequency": number,
      "peripherals": [{"type": "string", "enabled": true, "pins": ["string"], "config": {}}],
      "virtualSensors": [{"type": "string", "componentId": "string", "pin": "string", "config": {}}]
    }
  },
  "explanation": "string",
  "warnings": ["string"],
  "suggestions": ["string"]
}

Available components:
${componentList}

Board: ${board}
Rules:
- Position components on a 800x600 canvas with 50px margins
- Use standard pin mappings for the board
- Include all necessary library includes
- Add proper pin definitions
- Implement realistic timing delays
- Add error handling for sensor initialization
- Return ONLY the JSON, no markdown, no explanation`
        },
        { role: 'user', content: prompt }
      ],
    });

    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content);
  }

  async chat(messages: ChatMessage[], context?: ProjectContext): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 4096,
      messages: [
        { role: 'system', content: `You are an expert embedded systems debugging assistant. Context: ${context ? JSON.stringify(context, null, 2) : 'No project context'}. Be concise, practical, and provide actionable fixes.` },
        ...messages.map(m => ({ role: m.role, content: m.content }))
      ],
    });

    return response.choices[0].message.content || '';
  }

  async analyzeSchematic(components: ComponentInfo[], wires: WireInfo[]): Promise<AnalysisResult> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.2,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Analyze this schematic for electrical issues. Return JSON: {"issues": [{"type": "error|warning|info", "message": "string", "severity": "high|medium|low"}], "suggestions": ["string"]}. Check for: pin conflicts, missing pull-ups, power issues, signal integrity, incorrect connections.' },
        { role: 'user', content: JSON.stringify({ components, wires }, null, 2) }
      ],
    });

    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content);
  }

  async suggestComponents(requirements: string, currentComponents: string[], budget?: number): Promise<ComponentSuggestion[]> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `Suggest components for: ${requirements}. Current: ${currentComponents.join(', ') || 'none'}. Budget: ${budget || 'unlimited'}. Return JSON array: [{"id": "string", "name": "string", "reason": "string", "price": number, "category": "string"}]. Prioritize: integration ease, availability, cost-effectiveness.` },
        { role: 'user', content: requirements }
      ],
    });

    const content = response.choices[0].message.content || '[]';
    return JSON.parse(content);
  }
}

export function createAIProvider(): AIProvider | null {
  if (config.anthropicApiKey) {
    return new AnthropicProvider(config.anthropicApiKey);
  }
  if (config.openaiApiKey) {
    return new OpenAIProvider(config.openaiApiKey);
  }
  return null;
}