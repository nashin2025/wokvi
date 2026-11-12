import { FastifyRequest } from 'fastify';
import { JwtPayload } from '../plugins';

// Type guard for authenticated requests
export function assertAuthenticated(request: FastifyRequest): asserts request is FastifyRequest & { user: JwtPayload } {
  if (!request.user) {
    throw new Error('Authentication required');
  }
}

// Helper to get authenticated user
export function getAuthUser(request: FastifyRequest): JwtPayload {
  if (!request.user) {
    throw new Error('Authentication required');
  }
  return request.user;
}