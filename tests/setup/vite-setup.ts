import { vi, afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';



// Extend Vitest's expect with DOM matchers
expect.extend(matchers);

// Declare the matchers for TypeScript
declare module 'vitest' {
  interface Assertion<T = any> extends matchers.TestingLibraryMatchers<T, void> {}
}

// Mock CSS modules
vi.mock('~/styles', () => ({}));

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
