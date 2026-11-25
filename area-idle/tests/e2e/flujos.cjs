// Pruebas de punta a punta: el juego real en Chromium (Playwright). Uso: npm run e2e
// (levanta `vite preview` en el puerto 4174 si no está corriendo). Sale con código 1 si algo falla.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const URL = 'http://localhost:4174/';
const results = [];

const reachable = () => new Promise((resolve) => http.get(URL, (res) => { res.resume(); resolve(true); }).on('error', () => resolve(false)));

async function server() {
  if (await reachable()) return null;
  const proc = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { cwd: path.resolve(__dirname, '../..'), stdio: 'ignore' });
  for (let i = 0; i < 40 && !(await reachable()); i++) await new Promise((r) => setTimeout(r, 250));
  return proc;
}

function check(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function fresh(browser, opts = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'es-MX', ...opts });
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto(opts.url ?? URL);
  await page.waitForTimeout(1200);
  page.tap = async (x = 0.5, y = 0.45) => { const box = await page.getByTestId('campo').boundingBox(); await page.mouse.click(box.x + box.width * x, box.y + box.height * y); };
  page.oro = async (n) => { await page.getByTestId('abrir-ajustes').click(); await page.getByTestId(`oro-${n}`).click(); await page.mouse.click(4, 4); await page.waitForTimeout(150); };
  page.comprar = async (id, veces = 1) => {
    const seccion = await page.evaluate((id) => ({ danio: 'jugador', radio: 'jugador', slimes: 'jugador', cadencia: 'jugador', botin: 'jugador', tiempo: 'jugador', mago: 'mago', arqueros: 'arqueros', multiflecha: 'arqueros' })[id], id);
    await page.getByTestId(`seccion-${seccion}`).click();
    await page.getByTestId(`talento-${id}`).click();
    for (let i = 0; i < veces; i++) await page.getByTestId('comprar').click();
  };
  return page;
}

async function flow(name, browser, fn, opts) {
  const page = await fresh(browser, opts);
  try {
    await fn(page);
    check(page.errors.length === 0, `errores en la consola: ${page.errors.join(' | ')}`);
    results.push([name, true]);
  } catch (e) {
    const where = (e.stack || '').split('\n').find((l) => l.includes('flujos.cjs'))?.match(/:(\d+):\d+\)?$/)?.[1];
    results.push([name, false, `${e.message.split('\n')[0]}${where ? ` (línea ${where})` : ''}`]);
  } finally {
    await page.context().close();
  }
}

(async () => {
  const proc = await server();
  const browser = await chromium.launch();

  await flow('primera partida: se juega directo, se toca, se acaba el tiempo y se abre el árbol', browser, async (page) => {
    check(await page.getByTestId('reloj').count(), 'no empezó la partida');
    check(await page.getByTestId('pista').count(), 'no sale la pista de tocar');
    // Toca donde hay un slime (como lo haría alguien que juega).
    const blanco = await page.evaluate(() => { const e = window.juego.run.enemies[0]; return { x: e.x / 360, y: e.y / window.juego.run.h }; });
    await page.tap(blanco.x, blanco.y);
    await page.waitForTimeout(300);
    check(!(await page.getByTestId('pista').count()), 'la pista no se fue al tocar');
    const cursor = await page.evaluate(() => window.juego.run.cursor);
    check(Math.abs(cursor.x - blanco.x * 360) < 3, `el círculo no fue a donde se tocó (${cursor.x})`);
    await page.waitForTimeout(2500);
    const reventados = await page.evaluate(() => window.juego.run.reventados);
    check(reventados > 0, 'en 2.5 s no reventó ningún slime');
    await page.getByTestId('terminar').click();
    await page.waitForTimeout(500);
    check(await page.getByTestId('perdio').count(), 'no salió "se acabó el tiempo"');
    check((await page.getByTestId('fin-reventados').textContent()).trim() === `${reventados}/15`, 'reventados no cuadra');
    check(await page.getByTestId('reintentar').count() && !(await page.getByTestId('anterior').count()), 'en el nivel 1 debe ofrecer reintentar y no el anterior');
    await page.getByTestId('mejorar').click();
    check(await page.getByTestId('arbol').count(), 'no abrió el árbol');
    check(await page.getByTestId('talento-danio').count(), 'no se ve Daño');
    check(!(await page.getByTestId('talento-radio').count()), 'Área se ve antes de tiempo');
    await page.getByTestId('seccion-mago').click();
    check(await page.getByTestId('talento-mago').count(), 'no se ve el mago (con candado)');
  });

  await flow('árbol: comprar abre lo siguiente y la partida usa lo comprado', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.oro(100);
    await page.comprar('danio', 2);
    check((await page.getByTestId('efecto').textContent()).includes('3 → 4'), 'el efecto de Daño no dice 3 → 4');
    check(await page.getByTestId('talento-radio').count(), 'no se abrió Área');
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(300);
    const danio = await page.evaluate(() => window.juego.run.stats.danio);
    check(danio === 3, `la partida no usa el daño comprado (${danio})`);
    check((await page.getByTestId('reloj').textContent()).includes('00:2'), 'el reloj no arrancó en 20 s');
  });

  await flow('tres secciones: mago con rectángulos y arqueros con flechas', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.oro(1000000);
    await page.comprar('danio', 3);
    await page.comprar('cadencia', 3);
    await page.comprar('mago');
    await page.comprar('arqueros');
    await page.comprar('multiflecha');
    await page.getByTestId('jugar').click();
    await page.waitForTimeout(400);
    const stats = await page.evaluate(() => window.juego.run.stats);
    check(stats.mago.activo, 'el mago no está en la partida');
    check(stats.arqueros.cantidad === 1 && stats.arqueros.objetivos === 2, 'arqueros mal configurados');
    let flechas = 0;
    let magia = 0;
    await page.evaluate(() => { window.__magia = 0; window.juego.onEvents((evs) => { for (const e of evs) if (e.type === 'impact' && e.fuente === 'mago' && e.forma.tipo === 'rect') window.__magia++; }); });
    for (let i = 0; i < 30; i++) {
      flechas = Math.max(flechas, await page.evaluate(() => window.juego.run.arrows.length));
      await page.waitForTimeout(100);
    }
    magia = await page.evaluate(() => window.__magia);
    check(flechas > 0, 'los arqueros no tiraron flechas');
    check(magia > 0, 'el mago no reventó ningún rectángulo');
  });

  await flow('niveles: ganar abre el siguiente; perder ofrece reintentar o el anterior para juntar oro', browser, async (page) => {
    check((await page.getByTestId('nivel-partida').textContent()).includes('Nivel 1'), 'no dice Nivel 1');
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.oro(1000000);
    for (const [id, n] of [['danio', 5], ['radio', 3], ['cadencia', 4], ['slimes', 3], ['tiempo', 3], ['arqueros', 1], ['multiflecha', 2]]) await page.comprar(id, n);
    await page.getByTestId('jugar').click();
    for (let i = 0; i < 60 && !(await page.getByTestId('fin').count()); i++) {
      // Toca donde haya un slime, como alguien que juega.
      const b = await page.evaluate(() => { const r = window.juego.run; const e = r && r.enemies[0]; return e ? { x: e.x / 360, y: e.y / r.h } : null; });
      if (b) await page.tap(b.x, b.y);
      await page.waitForTimeout(500);
    }
    check(await page.getByTestId('gano').count(), 'no ganó el nivel 1 con todo comprado');
    check(Number((await page.getByTestId('fin-premio').textContent()).replace(/\D/g, '')) > 0, 'sin premio');
    await page.getByTestId('siguiente').click();
    await page.waitForTimeout(300);
    check((await page.getByTestId('nivel-partida').textContent()).includes('Nivel 2'), 'no pasó al nivel 2');
    await page.getByTestId('terminar').click();
    await page.waitForTimeout(300);
    check(await page.getByTestId('perdio').count(), 'terminar antes de tiempo debe perder');
    await page.getByTestId('anterior').click();
    await page.waitForTimeout(300);
    check((await page.getByTestId('nivel-partida').textContent()).includes('Nivel 1'), 'el anterior no es el nivel 1');
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    check((await page.getByTestId('nivel-actual').textContent()).includes('Nivel 1'), 'el árbol no recuerda el nivel elegido');
    await page.getByTestId('nivel-mas').click();
    check((await page.getByTestId('nivel-actual').textContent()).includes('Nivel 2'), 'no deja volver al nivel 2');
    check(await page.getByTestId('nivel-mas').isDisabled(), 'deja ir más allá del nivel abierto');
  });

  await flow('glosario: tipos de daño y enemigos (el azul, oculto hasta abrirlo)', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.getByTestId('abrir-glosario').click();
    for (const tipo of ['fisico', 'fuego', 'hielo', 'energia', 'muerte', 'luz']) check(await page.getByTestId(`tipo-${tipo}`).count(), `falta el tipo ${tipo}`);
    const verde = await page.getByTestId('enemigo-verde').textContent();
    check(verde.includes('Slime verde') && verde.includes('No ataca') && verde.includes('×1.5'), `el verde no muestra sus datos: ${verde}`);
    check((await page.getByTestId('enemigo-azul').textContent()).includes('???'), 'el azul se ve antes de abrirlo');
    await page.mouse.click(4, 4);
    // Los azules salen desde el nivel 4.
    await page.getByTestId('abrir-ajustes').click();
    for (let i = 0; i < 3; i++) await page.getByTestId('mas-nivel').click();
    await page.mouse.click(4, 4);
    await page.getByTestId('abrir-glosario').click();
    const azul = await page.getByTestId('enemigo-azul').textContent();
    check(azul.includes('Slime azul') && azul.includes('×0.5'), `el azul no se reveló: ${azul}`);
  });

  await flow('guardado: al recargar se queda el oro y el árbol, y se llega al árbol', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.oro(100);
    await page.comprar('danio', 1);
    const oro = await page.getByTestId('oro-total').textContent();
    await page.reload();
    await page.waitForTimeout(1200);
    check(await page.getByTestId('arbol').count(), 'al volver no se llega al árbol');
    check((await page.getByTestId('oro-total').textContent()) === oro, 'el oro no se guardó');
    await page.getByTestId('talento-danio').click();
    check((await page.getByTestId('detalle').textContent()).includes('1/40'), 'el nivel de Daño no se guardó');
  });

  await flow('reiniciar desde cero', browser, async (page) => {
    await page.getByTestId('terminar').click();
    await page.getByTestId('mejorar').click();
    await page.oro(100);
    await page.comprar('danio', 2);
    await page.getByTestId('abrir-ajustes').click();
    await page.getByTestId('reiniciar').click();
    await page.getByTestId('reiniciar').click();
    await page.waitForTimeout(300);
    check((await page.getByTestId('oro-total').textContent()).trim() === '0', 'quedó oro');
    await page.getByTestId('talento-danio').click();
    check((await page.getByTestId('detalle').textContent()).includes('0/40'), 'quedó nivel de Daño');
    await page.reload();
    await page.waitForTimeout(1200);
    check(await page.getByTestId('reloj').count(), 'tras reiniciar no empieza jugando como nuevo');
  });

  for (const [w, h] of [[320, 568], [390, 844], [768, 1024]]) {
    await flow(`pantalla ${w}×${h}: nada se sale`, browser, async (page) => {
      const desborda = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth || document.documentElement.scrollHeight > innerHeight);
      check(!(await desborda()), 'la partida se desborda');
      await page.getByTestId('terminar').click();
      await page.waitForTimeout(300);
      check(!(await desborda()), 'el fin se desborda');
      await page.getByTestId('mejorar').click();
      await page.oro(1000000);
      for (const id of ['danio', 'radio', 'slimes', 'cadencia']) await page.comprar(id, 3);
      for (const sec of ['jugador', 'mago', 'arqueros']) {
        await page.getByTestId(`seccion-${sec}`).click();
        const fuera = await page.$$eval('[data-testid^="talento-"], [data-testid="jugar"]', (els) => els.filter((e) => { const r = e.getBoundingClientRect(); return r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > innerHeight; }).map((e) => e.dataset.testid));
        check(fuera.length === 0, `en ${sec} se salen: ${fuera.join(', ')}`);
      }
      check(!(await desborda()), 'el árbol se desborda');
    }, { viewport: { width: w, height: h } });
  }

  await flow('versión para compartir: sin botones de pruebas', browser, async (page) => {
    check(await page.getByTestId('reloj').count(), 'el archivo no arrancó');
    check(!(await page.getByTestId('terminar').count()), 'trae el botón de terminar de pruebas');
  }, { url: 'file://' + path.resolve(__dirname, '../../dist-archivo/campo-de-slimes.html') });

  await browser.close();
  if (proc) proc.kill();
  for (const [name, ok, msg] of results) console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `\n    ${msg}`}`);
  const fails = results.filter((r) => !r[1]).length;
  console.log(`\n${results.length - fails}/${results.length} flujos bien`);
  process.exit(fails ? 1 : 0);
})();
