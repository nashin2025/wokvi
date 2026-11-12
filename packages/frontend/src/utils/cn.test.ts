import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'conditional')).toBe('base conditional');
      expect(cn('base', false && 'conditional')).toBe('base');
    });

    it('should handle tailwind merge', () => {
      expect(cn('p-2', 'p-4')).toBe('p-4');
    });
  });
});