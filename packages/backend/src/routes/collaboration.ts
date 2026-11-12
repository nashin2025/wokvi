// Collaboration WebSocket Server
// Handles Yjs WebSocket connections for real-time collaboration

import { FastifyInstance } from 'fastify';
import { WebSocket, WebSocketServer } from 'ws';
import { setupWSConnection } from 'y-websocket/bin/utils';
import { getAuthUser } from '../utils/auth';

interface CollabRoom {
  doc: any; // Y.Doc
  connections: Set<WebSocket>;
  awareness: Map<number, any>;
}

const rooms = new Map<string, CollabRoom>();

export function registerCollaborationRoutes(app: FastifyInstance) {
  // WebSocket endpoint for collaboration
  app.get('/collab/:projectId', { websocket: true }, async (connection, request) => {
    const { projectId } = request.params as { projectId: string };
    const ws = connection.socket;

    // Verify authentication
    try {
      await request.jwtVerify();
    } catch {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const user = getAuthUser(request);
    if (!user) {
      ws.close(4001, 'User not found');
      return;
    }

    const roomName = `project-${projectId}`;

    // Get or create room
    let room = rooms.get(roomName);
    if (!room) {
      const Y = await import('yjs');
      room = {
        doc: new Y.Doc(),
        connections: new Set(),
        awareness: new Map(),
      };
      rooms.set(roomName, room);
    }

    // Add connection to room
    room.connections.add(ws);

    // Set up Yjs WebSocket connection
    setupWSConnection(ws, room.doc, {
      // Optional: custom authentication
      // auth: (message) => { return true; }
    });

    // Handle awareness
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        if (data.type === 'awareness') {
          // Broadcast awareness to other clients in room
          room.connections.forEach(client => {
            if (client !== ws && client.readyState === 1) {
              client.send(JSON.stringify({
                type: 'awareness',
                payload: data.payload,
                sender: user.userId,
              }));
            }
          });
        }
      } catch (err) {
        // Ignore invalid messages
      }
    });

    // Handle connection close
    ws.on('close', () => {
      room.connections.delete(ws);
      
      // Clean up empty rooms after delay
      if (room.connections.size === 0) {
        setTimeout(() => {
          const currentRoom = rooms.get(roomName);
          if (currentRoom && currentRoom.connections.size === 0) {
            rooms.delete(roomName);
            currentRoom.doc.destroy();
          }
        }, 60000); // Keep room for 1 minute after last user leaves
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // REST endpoint for room info
  app.get('/api/v1/collab/:projectId/info', { preHandler: [app.authenticate] }, async (request, reply) => {
    const { projectId } = request.params as { projectId: string };
    const user = getAuthUser(request);

    // Verify project access
    const project = await app.prisma.project.findFirst({
      where: {
        id: projectId,
        OR: [
          { ownerId: user.userId },
          { collaborators: { some: { userId: user.userId } } },
        ],
      },
    });

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    const roomName = `project-${projectId}`;
    const room = rooms.get(roomName);

    return reply.send({
      projectId,
      hasActiveRoom: !!room,
      connectedUsers: room?.connections.size || 0,
      awarenessStates: room ? Array.from(room.awareness.values()) : [],
    });
  });

  // Get active rooms (admin only)
  app.get('/api/v1/collab/rooms', { preHandler: [app.authenticate] }, async (request, reply) => {
    const user = getAuthUser(request);
    if (user.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'Admin only' });
    }

    const roomList = Array.from(rooms.entries()).map(([name, room]) => ({
      name,
      connections: room.connections.size,
      awarenessCount: room.awareness.size,
    }));

    return reply.send({ rooms: roomList });
  });
}

export { rooms };