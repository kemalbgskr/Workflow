
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('Utility Functions', () => {
  describe('cn', () => {
    it('should merge class names correctly', () => {
      expect(cn('bg-red-500', 'text-white')).toBe('bg-red-500 text-white');
    });

    it('should handle conditional classes', () => {
      const condition = true;
      expect(cn('base', condition && 'active')).toBe('base active');
      expect(cn('base', !condition && 'inactive')).toBe('base');
    });

    it('should merge tailwind classes properly', () => {
      // tailwind-merge should resolve conflicts
      expect(cn('p-4', 'p-2')).toBe('p-2');
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
    });

    it('should handle arrays and objects if supported by clsx', () => {
       expect(cn(['a', 'b'])).toBe('a b');
       expect(cn({ 'c': true, 'd': false })).toBe('c');
    });
  });
});
