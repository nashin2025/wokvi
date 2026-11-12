// Collaboration Service - Yjs + WebSocket + WebRTC
// Provides real-time multiplayer editing for projects

import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { WebrtcProvider } from 'y-webrtc';
import { useProjectStore } from '../store';
import { useUIStore } from '../store';

export interface CollaborationConfig {
  projectId: string;
  userId: string;
  userName: string;
  userColor: string;
  serverUrl?: string;
  signalingServers?: string[];
  useWebRTC?: boolean;
}

export interface AwarenessState {
  user: {
    id: string;
    name: string;
    color: string;
  };
  cursor?: {
    x: number;
    y: number;
    componentId?: string;
  };
  selection?: string[];
  viewport?: { x: number; y: number; zoom: number };
}

class CollaborationService {
  private doc: Y.Doc | null = null;
  private websocketProvider: WebsocketProvider | null = null;
  private webrtcProvider: WebrtcProvider | null = null;
  private awareness: any = null;
  private config: CollaborationConfig | null = null;
  private isConnected = false;
  private callbacks: Map<string, Function[]> = new Map();

  // Yjs shared types
  public componentsMap: Y.Map<any> | null = null;
  public wiresMap: Y.Map<any> | null = null;
  public codeText: Y.Text | null = null;
  public metadataMap: Y.Map<any> | null = null;

  initialize(config: CollaborationConfig) {
    this.config = config;
    
    // Create Yjs document
    this.doc = new Y.Doc();
    
    // Initialize shared types
    this.componentsMap = this.doc.getMap('components');
    this.wiresMap = this.doc.getMap('wires');
    this.codeText = this.doc.getText('code');
    this.metadataMap = this.doc.getMap('metadata');

    // Set up awareness
    this.awareness = this.doc.get('awareness', new Map()) as Map<number, AwarenessState>;
    this.setupAwareness();

    // Connect to WebSocket server
    this.connectWebSocket();

    // Optionally connect WebRTC for peer-to-peer
    if (config.useWebRTC !== false) {
      this.connectWebRTC();
    }

    // Sync local project state to Yjs
    this.syncLocalToYjs();

    // Listen for remote changes
    this.setupRemoteListeners();

    return this;
  }

  private setupAwareness() {
    if (!this.awareness || !this.config) return;

    // Set local user awareness
    const localState: AwarenessState = {
      user: {
        id: this.config.userId,
        name: this.config.userName,
        color: this.config.userColor,
      },
      cursor: { x: 0, y: 0 },
      selection: [],
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    this.awareness.setLocalState(localState);

    // Listen for awareness changes
    this.awareness.on('change', () => {
      this.emit('awareness-change', this.getAwarenessStates());
    });
  }

  private connectWebSocket() {
    if (!this.doc || !this.config) return;

    const serverUrl = this.config.serverUrl || 'ws://localhost:4001/collab';
    const roomName = `project-${this.config.projectId}`;

    this.websocketProvider = new WebsocketProvider(
      serverUrl,
      roomName,
      this.doc,
      {
        connect: true,
        maxBackoffTime: 30000,
      }
    );

    this.websocketProvider.on('status', (event: { status: string }) => {
      this.isConnected = event.status === 'connected';
      this.emit('connection-change', this.isConnected);
    });

    this.websocketProvider.on('sync', (isSynced: boolean) => {
      this.emit('sync-change', isSynced);
    });

    this.websocketProvider.awareness.on('change', () => {
      this.emit('awareness-change', this.getAwarenessStates());
    });
  }

  private connectWebRTC() {
    if (!this.doc || !this.config) return;

    const signalingServers = this.config.signalingServers || [
      'wss://signaling.yjs.dev',
      'wss://webrtc.yjs.dev',
    ];

    this.webrtcProvider = new WebrtcProvider(
      `project-${this.config.projectId}`,
      this.doc,
      { signaling: signalingServers }
    );

    this.webrtcProvider.on('status', (event: { connected: boolean }) => {
      this.emit('webrtc-change', event.connected);
    });
  }

  private syncLocalToYjs() {
    const { currentProject } = useProjectStore.getState();
    if (!currentProject || !this.componentsMap || !this.wiresMap || !this.codeText) return;

    // Sync components
    this.doc.transact(() => {
      currentProject.components.forEach((comp: any) => {
        this.componentsMap!.set(comp.id, comp);
      });

      currentProject.wires.forEach((wire: any) => {
        this.wiresMap!.set(wire.id, wire);
      });

      this.codeText.replace(0, this.codeText.length, currentProject.code);

      this.metadataMap!.set('board', currentProject.board);
      this.metadataMap!.set('mode', currentProject.mode);
    });
  }

  private setupRemoteListeners() {
    if (!this.componentsMap || !this.wiresMap || !this.codeText) return;

    // Listen for component changes
    this.componentsMap.observe((event: Y.YMapEvent<any>) => {
      event.changes.keys.forEach((change: any, key: string) => {
        const { action, newValue } = change;
        this.emit('component-change', { key, action, value: newValue });
      });
    });

    // Listen for wire changes
    this.wiresMap.observe((event: Y.YMapEvent<any>) => {
      event.changes.keys.forEach((change: any, key: string) => {
        const { action, newValue } = change;
        this.emit('wire-change', { key, action, value: newValue });
      });
    });

    // Listen for code changes
    this.codeText.observe((event: Y.YTextEvent) => {
      this.emit('code-change', this.codeText!.toString());
    });
  }

  // Public API

  updateAwareness(state: Partial<AwarenessState>) {
    if (!this.awareness) return;
    
    const currentState = this.awareness.getLocalState() || {};
    this.awareness.setLocalState({ ...currentState, ...state });
  }

  updateCursor(x: number, y: number, componentId?: string) {
    this.updateAwareness({ cursor: { x, y, componentId } });
  }

  updateSelection(componentIds: string[]) {
    this.updateAwareness({ selection: componentIds });
  }

  updateViewport(x: number, y: number, zoom: number) {
    this.updateAwareness({ viewport: { x, y, zoom } });
  }

  getAwarenessStates(): AwarenessState[] {
    if (!this.awareness) return [];
    
    const states: AwarenessState[] = [];
    this.awareness.getStates().forEach((state: any, clientId: number) => {
      if (state && state.user) {
        states.push({ ...state, clientId });
      }
    });
    return states;
  }

  // Local operations that sync to remote
  addComponent(component: any) {
    if (!this.componentsMap) return;
    this.doc.transact(() => {
      this.componentsMap!.set(component.id, component);
    });
  }

  removeComponent(componentId: string) {
    if (!this.componentsMap) return;
    this.doc.transact(() => {
      this.componentsMap!.delete(componentId);
    });
  }

  updateComponent(componentId: string, updates: any) {
    if (!this.componentsMap) return;
    const existing = this.componentsMap.get(componentId);
    if (existing) {
      this.doc.transact(() => {
        this.componentsMap!.set(componentId, { ...existing, ...updates });
      });
    }
  }

  addWire(wire: any) {
    if (!this.wiresMap) return;
    this.doc.transact(() => {
      this.wiresMap!.set(wire.id, wire);
    });
  }

  removeWire(wireId: string) {
    if (!this.wiresMap) return;
    this.doc.transact(() => {
      this.wiresMap!.delete(wireId);
    });
  }

  setCode(code: string) {
    if (!this.codeText) return;
    this.doc.transact(() => {
      this.codeText!.replace(0, this.codeText!.length, code);
    });
  }

  // Event system
  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach(cb => cb(data));
    }
  }

  // Connection status
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Cleanup
  destroy() {
    if (this.websocketProvider) {
      this.websocketProvider.destroy();
      this.websocketProvider = null;
    }
    if (this.webrtcProvider) {
      this.webrtcProvider.destroy();
      this.webrtcProvider = null;
    }
    if (this.doc) {
      this.doc.destroy();
      this.doc = null;
    }
    this.callbacks.clear();
  }
}

// Singleton instance
let collaborationInstance: CollaborationService | null = null;

export function getCollaborationService(): CollaborationService {
  if (!collaborationInstance) {
    collaborationInstance = new CollaborationService();
  }
  return collaborationInstance;
}

export function initCollaboration(config: CollaborationConfig): CollaborationService {
  const service = getCollaborationService();
  return service.initialize(config);
}

export function destroyCollaboration() {
  if (collaborationInstance) {
    collaborationInstance.destroy();
    collaborationInstance = null;
  }
}

// React hook for easy integration
export function useCollaboration(config?: CollaborationConfig) {
  const service = getCollaborationService();
  
  if (config && !service.doc) {
    service.initialize(config);
  }

  return {
    service,
    isConnected: service.getConnectionStatus(),
    awareness: service.getAwarenessStates(),
    on: service.on.bind(service),
    off: service.off.bind(service),
    updateCursor: service.updateCursor.bind(service),
    updateSelection: service.updateSelection.bind(service),
    updateViewport: service.updateViewport.bind(service),
    addComponent: service.addComponent.bind(service),
    removeComponent: service.removeComponent.bind(service),
    updateComponent: service.updateComponent.bind(service),
    addWire: service.addWire.bind(service),
    removeWire: service.removeWire.bind(service),
    setCode: service.setCode.bind(service),
    destroy: service.destroy.bind(service),
  };
}