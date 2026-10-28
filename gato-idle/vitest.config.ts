import { defineConfig } from 'vitest/config';

// Las pruebas cubren solo core/ y datos: lógica pura, sin Phaser ni DOM.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
