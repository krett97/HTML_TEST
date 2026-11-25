// Simulador de balance: un bot juega partidas seguidas (tocando donde hay más enemigos) y compra lo
// más barato del árbol entre partidas. Imprime cada partida y cuándo llega cada hito.
// Uso: npm run simular
import { TALENTS } from '../src/core/datos';
import { playAndShop } from '../src/core/bot';
import { createMeta, levelOf, stats } from '../src/core/meta';

const meta = createMeta();
let segundos = 0;
const hitos = new Map<string, string>();
const PAUSA = 8; // segundos en el árbol entre partidas
console.log('partida  minuto  duración  oro ganado  reventados  máx. vivos  compras');
for (let i = 1; i <= 80; i++) {
  const s = stats(meta);
  const r = playAndShop(meta, i * 7919);
  segundos += s.duracion + PAUSA;
  for (const id of r.compras) if (!hitos.has(id)) hitos.set(id, `partida ${i} (min ${(segundos / 60).toFixed(1)})`);
  if (i <= 25 || i % 5 === 0) {
    console.log(`${String(i).padStart(7)}  ${(segundos / 60).toFixed(1).padStart(6)}  ${String(s.duracion).padStart(7)}s  ${r.oro.toFixed(0).padStart(10)}  ${String(r.reventados).padStart(10)}  ${String(r.maxVivos).padStart(10)}  ${r.compras.length}`);
  }
  if (TALENTS.every((t) => levelOf(meta, t.id) >= t.max)) {
    console.log(`Árbol completo en la partida ${i}, minuto ${(segundos / 60).toFixed(1)}`);
    break;
  }
}
console.log('\nPrimera compra de cada talento:');
for (const t of TALENTS) console.log(`  ${t.id.padEnd(12)} ${hitos.get(t.id) ?? 'nunca'}`);
