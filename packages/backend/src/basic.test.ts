import { describe, it, expect } from 'vitest';

describe('Basic Tests', () => {
  it('should pass basic math', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle strings', () => {
    expect('hello').toContain('ell');
  });
});