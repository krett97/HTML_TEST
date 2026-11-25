// Simulador de balance: un bot juega partidas seguidas (tocando donde hay más slimes) y compra lo más
// barato del árbol entre partidas. Si pierde un nivel, juega el anterior para juntar oro y reintenta.
// Imprime cada partida, el nivel alcanzado por minuto y cuándo compra cada talento.
// Uso: npm run simular
import { TALENTS } from '../src/core/datos';
import { playAndShop } from '../src/core/bot';
import { createMeta } from '../src/core/meta';

const meta = createMeta();
let segundos = 0;
const hitos = new Map<string, string>();
const porMinuto = new Map<number, number>();
const PAUSA = 6; // segundos entre partidas (fin y árbol)
let perdidas = 0;
let muros = 0;
const perdidasPorTramo = [0, 0, 0, 0, 0];
console.log('partida  minuto  nivel  resultado  tiempo  reventados  oro+premio  compras');
for (let i = 1; i <= 200 && segundos < 45 * 60; i++) {
  const r = playAndShop(meta, i * 7919);
  segundos += r.segundos + PAUSA;
  if (r.muroCaido) muros++;
  if (!r.gano) {
    perdidas++;
    perdidasPorTramo[Math.min(4, Math.floor((r.nivel - 1) / 10))]!++;
  }
  for (const id of r.compras) if (!hitos.has(id)) hitos.set(id, `nivel ${r.nivel} (min ${(segundos / 60).toFixed(1)})`);
  porMinuto.set(Math.floor(segundos / 60), meta.nivel - 1);
  if (i <= 30 || i % 10 === 0) {
    console.log(`${String(i).padStart(7)}  ${(segundos / 60).toFixed(1).padStart(6)}  ${String(r.nivel).padStart(5)}  ${(r.gano ? 'ganó' : 'perdió').padEnd(9)}  ${r.segundos.toFixed(0).padStart(5)}s  ${`${r.reventados}/${r.total}`.padStart(10)}  ${`${r.oro.toFixed(0)}+${r.premio}`.padStart(10)}  ${r.compras.length}`);
  }
}
console.log(`\nPartidas perdidas: ${perdidas} (niveles 1-10: ${perdidasPorTramo[0]}, 11-20: ${perdidasPorTramo[1]}, 21-30: ${perdidasPorTramo[2]}, 31-40: ${perdidasPorTramo[3]}, 41+: ${perdidasPorTramo[4]})`);
console.log(`Partidas en que cayó la muralla: ${muros}`);
console.log('\nNivel superado al final de cada minuto:');
console.log([5, 10, 15, 20, 30, 45].map((m) => `min ${m}: ${porMinuto.get(m - 1) ?? '-'}`).join(' · '));
console.log('\nPrimera compra de cada talento:');
for (const t of TALENTS) console.log(`  ${t.id.padEnd(12)} ${hitos.get(t.id) ?? 'nunca'}`);
