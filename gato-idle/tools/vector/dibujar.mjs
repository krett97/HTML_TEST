// Arte vectorial del juego, dibujado en código (sin herramientas de pago) y renderizado a PNG.
// Cada módulo dibuja su parte al importarse. Uso: node tools/vector/dibujar.mjs
//   → src/assets/vector/*.png (8 px por unidad) y src/assets/vector/iconos/*.png (64 × 64)
// Un solo módulo: node tools/vector/cocina.mjs
import './cocina.mjs';
import './personajes.mjs';
import './cuartos.mjs';
import './cuartos_casa.mjs';
import './cuartos_mansion.mjs';
import './cuartos_luna.mjs';
import './objetos.mjs';
import './objetos_casa.mjs';
import './objetos_mansion.mjs';
import './objetos_luna.mjs';
import './jefes.mjs';
import './iconos.mjs';
console.log('VECTOR-LISTO');
