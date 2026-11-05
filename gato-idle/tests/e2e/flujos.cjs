// Pruebas de punta a punta: el juego real en Chromium (Playwright), con el modo pruebas para saltar
// etapas. Uso: npm run build && npm run e2e   (levanta `vite preview` si no está corriendo).
// Requiere Playwright: npm i -g playwright && npx playwright install chromium.
// Cada flujo revisa lo que se ve y que no haya errores en la consola. Sale con código 1 si algo falla.
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const { chromium } = require('playwright');

const URL = 'http://localhost:4173/';
const results = [];

function reachable() {
  return new Promise((resolve) => {
    http.get(URL, (res) => { res.resume(); resolve(true); }).on('error', () => resolve(false));
  });
}

async function server() {
  if (await reachable()) return null;
  const proc = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { cwd: path.resolve(__dirname, '../..'), stdio: 'ignore' });
  for (let i = 0; i < 40 && !(await reachable()); i++) await new Promise((r) => setTimeout(r, 250));
  return proc;
}

function check(cond, msg) {
  if (!cond) throw new Error(msg);
}

/** Una página nueva (partida nueva: cada contexto tiene su propio almacenamiento). */
async function fresh(browser, opts = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, locale: 'es-MX', ...opts });
  const page = await context.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  await page.goto(URL);
  await page.waitForTimeout(1200);
  const pruebas = async (fn) => {
    await page.getByTestId('abrir-pruebas').click();
    await page.waitForTimeout(200);
    await fn();
    await page.mouse.click(3, 3);
    await page.waitForTimeout(300);
  };
  page.pruebas = pruebas;
  page.go = (obj) => pruebas(async () => { await page.getByTestId('objeto-meta').selectOption(obj); await page.getByTestId('jugar-hasta').click(); });
  page.tapScene = async (n = 1) => {
    const box = await page.locator('canvas').boundingBox();
    for (let i = 0; i < n; i++) { await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.6); await page.waitForTimeout(60); }
  };
  page.closeAd = async () => { await page.waitForTimeout(3500); await page.locator('.ad-mock__close').click(); await page.waitForTimeout(600); };
  page.mudanza = async () => {
    await pruebas(async () => page.getByTestId('dinero-infinito').click());
    for (let i = 0; i < 3; i++) { await page.getByTestId('comprar-valor').click({ force: true }); await page.waitForTimeout(120); }
    await pruebas(async () => page.getByTestId('probar-mudanza').click());
    for (let i = 0; i < 4; i++) { await page.getByTestId('comprar-valor').click({ force: true }); await page.waitForTimeout(120); }
    await page.waitForTimeout(2500);
    await pruebas(async () => page.getByTestId('dinero-infinito').click());
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

const money = async (page) => page.getByTestId('dinero').textContent();

(async () => {
  const proc = await server();
  const browser = await chromium.launch();

  await flow('tutorial: tocar, monedas y primera compra', browser, async (page) => {
    check(await page.getByTestId('tutorial-tocar').count(), 'no sale el primer paso del tutorial');
    for (let i = 0; i < 60 && !(await page.getByTestId('tutorial-monedas').count()); i++) await page.tapScene(1);
    check(await page.getByTestId('tutorial-monedas').count(), 'el tutorial no avanzó al romper el vaso');
    await page.getByTestId('tutorial-ok').click();
    for (let i = 0; i < 200 && !(await page.getByTestId('tutorial-fuerza').count()); i++) await page.tapScene(1);
    check(await page.getByTestId('tutorial-fuerza').count(), 'no llegó el paso de Fuerza');
    await page.getByTestId('comprar-fuerza').click({ force: true });
    await page.waitForTimeout(300);
    check(!(await page.getByTestId('tutorial-fuerza').count()), 'comprar Fuerza no completó el paso');
    // El paso siguiente sale al rato de jugar: se sigue rompiendo hasta que aparece y se salta.
    for (let i = 0; i < 200 && !(await page.getByTestId('saltar-tutorial').count()); i++) await page.tapScene(1);
    await page.getByTestId('saltar-tutorial').click();
    await page.waitForTimeout(200);
    check(!(await page.getByTestId('tutorial').count()), 'saltar el tutorial no lo cerró');
  });

  await flow('canal: subir video, árbol en pantalla completa', browser, async (page) => {
    await page.getByTestId('saltar-tutorial').click();
    await page.go('refri');
    await page.getByRole('tab', { name: /Canal/ }).click();
    await page.waitForTimeout(300);
    await page.getByTestId('subir-video').click({ force: true });
    await page.getByTestId('subir-video').click({ force: true });
    await page.waitForTimeout(800);
    await page.getByRole('tab', { name: /Canal/ }).click();
    const seguidores = Number((await page.getByTestId('seguidores').textContent()).replace(/\D/g, ''));
    check(seguidores > 0, 'subir el video no dio seguidores');
    await page.getByTestId('abrir-arbol').click();
    check(await page.getByTestId('arbol-pantalla').count(), 'el árbol no se abrió en pantalla completa');
    await page.getByTestId('nodo-embestida').click({ force: true });
    await page.getByTestId('comprar-habilidad').click({ force: true });
    await page.waitForTimeout(200);
    check((await page.getByTestId('nodo-embestida').textContent()).includes('1/'), 'no se compró la embestida');
    await page.getByRole('tab', { name: /Mejoras/ }).click();
    check(!(await page.getByTestId('arbol-pantalla').count()), 'tocar una pestaña no cerró el árbol');
  });

  await flow('maquinita: girar con ficha y con anuncio', browser, async (page) => {
    await page.getByTestId('saltar-tutorial').click();
    await page.go('lavadora');
    await page.getByTestId('abrir-maquinita').click();
    const before = Number(await page.getByTestId('fichas').textContent());
    await page.getByTestId('girar-ficha').click();
    await page.waitForTimeout(1800);
    check((await page.getByTestId('maquinita-mensaje').textContent()).includes('+'), 'el giro no dio premio');
    if (await page.getByTestId('doble-o-nada').count()) await page.getByTestId('doble-o-nada').click();
    check(Number(await page.getByTestId('fichas').textContent()) === before - 1, 'el giro no gastó una ficha');
    await page.getByTestId('girar-anuncio').click();
    await page.closeAd();
    await page.waitForTimeout(1500);
    check((await page.getByTestId('maquinita-mensaje').textContent()).includes('+'), 'el giro con anuncio no dio premio');
  });

  await flow('turbo con anuncio', browser, async (page) => {
    await page.getByTestId('saltar-tutorial').click();
    await page.go('refri');
    await page.getByTestId('turbo').click();
    await page.closeAd();
    check((await page.getByTestId('turbo').textContent()).includes('×1.5'), 'el turbo no se prendió');
  });

  await flow('jefe: perder, revancha y ganar', browser, async (page) => {
    await page.getByTestId('saltar-tutorial').click();
    await page.go('refri');
    check(await page.getByTestId('retar-jefe').count(), 'no aparece la Escoba Furiosa en el refri');
    await page.getByTestId('retar-jefe').click({ force: true });
    await page.waitForTimeout(300);
    check(await page.getByTestId('pelea-jefe').count(), 'no empezó la pelea');
    await page.waitForTimeout(31500);
    check(await page.getByTestId('revancha').count(), 'tras perder no hay espera de revancha');
    await page.getByTestId('revancha-ya').click();
    await page.closeAd();
    await page.pruebas(async () => page.getByTestId('danio-infinito').click());
    await page.getByTestId('retar-jefe').click({ force: true });
    await page.tapScene(5);
    await page.waitForTimeout(1500);
    check(!(await page.getByTestId('pelea-jefe').count()), 'con daño infinito la pelea no terminó');
    check(!(await page.getByTestId('retar-jefe').count()), 'el jefe vencido sigue apareciendo');
  });

  await flow('mudanza, ranking y guardado al recargar', browser, async (page) => {
    await page.getByTestId('saltar-tutorial').click();
    await page.go('refri');
    await page.mudanza();
    check(await page.getByTestId('abrir-ranking').count(), 'el ranking no se abrió con la segunda casa');
    await page.getByTestId('abrir-ranking').click();
    await page.getByTestId('nombre-gato').fill('Michi E2E');
    await page.getByRole('button', { name: 'Guardar' }).click();
    check((await page.getByTestId('ranking-tuyo').textContent()).includes('Michi E2E'), 'el nombre no se guardó');
    await page.mouse.click(3, 3);
    await page.getByRole('tab', { name: /Ajustes/ }).click();
    await page.getByRole('button', { name: /Guardar ahora/ }).click();
    await page.getByRole('tab', { name: /Mejoras/ }).click();
    const objeto = await page.getByTestId('objeto').textContent();
    await page.reload();
    await page.waitForTimeout(1500);
    check((await page.getByTestId('objeto').textContent()) === objeto, `al recargar cambió el objeto (${objeto})`);
    check(await page.getByTestId('abrir-ranking').count(), 'al recargar se perdió la casa');
  });

  await flow('mientras no estabas ×2', browser, async (page) => {
    await page.getByTestId('saltar-tutorial').click();
    await page.go('cafetera');
    await page.getByTestId('abrir-pruebas').click();
    await page.getByText('Simular 1 h fuera').click();
    await page.waitForTimeout(800);
    check(await page.getByTestId('offline').count(), 'no salió la ventana de bienvenida');
    const before = await money(page);
    await page.getByTestId('offline-doble').click();
    await page.closeAd();
    check(!(await page.getByTestId('offline').count()) && (await money(page)) !== before, 'el ×2 no cobró');
  });

  for (const [name, w, h] of [['320×568', 320, 568], ['390×844', 390, 844], ['768×1024', 768, 1024]]) {
    await flow(`pantalla ${name}: sin desbordes en ninguna pestaña`, browser, async (page) => {
      await page.getByTestId('saltar-tutorial').click();
      await page.go('refri');
      for (const tab of ['Mejoras', 'Aliados', 'Investigación', 'Canal', 'Ajustes']) {
        await page.getByRole('tab', { name: new RegExp(tab) }).click();
        await page.waitForTimeout(250);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        check(over <= 1, `${tab}: la página se desborda ${over}px a lo ancho`);
      }
    }, { viewport: { width: w, height: h } });
  }

  await flow('versión de tienda: sin modo pruebas', browser, async (page) => {
    const file = path.resolve(__dirname, '../../dist-archivo/swat-to-the-moon.html');
    if (!require('fs').existsSync(file)) throw new Error('falta dist-archivo (npm run build:compartir)');
    // build:compartir compila con __PRUEBAS__ = false: ni el botón 🛠 ni "Probar anuncio".
    await page.goto('file://' + file);
    await page.waitForTimeout(1500);
    check((await page.getByTestId('abrir-pruebas').count()) === 0, 'la versión para compartir trae el modo pruebas');
    await page.getByTestId('saltar-tutorial').click();
    await page.getByRole('tab', { name: /Ajustes/ }).click().catch(() => {});
  });

  await browser.close();
  proc?.kill();
  let failed = 0;
  for (const [name, ok, why] of results) {
    console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ` — ${why}`}`);
    if (!ok) failed++;
  }
  console.log(`\n${results.length - failed}/${results.length} flujos bien`);
  process.exit(failed ? 1 : 0);
})();
