// Gráficos de la tienda: el banner (1024×500) y capturas de 1080×1920 del juego real.
// Uso: npm run build && npx vite preview --port 4173 (en otra terminal) y luego
//      node tools/tienda/capturas.cjs docs/tienda
const path = require('path');
const { chromium } = require('playwright');
const OUT = process.argv[2] || 'docs/tienda';
(async () => {
  const browser = await chromium.launch();
  const banner = await browser.newPage({ viewport: { width: 1024, height: 500 } });
  await banner.goto('file://' + path.resolve(__dirname, 'banner.html'));
  await banner.waitForTimeout(800);
  await banner.screenshot({ path: `${OUT}/banner-1024x500.png` });
  for (const lang of ['es', 'en']) {
    const page = await browser.newPage({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 3, locale: lang === 'es' ? 'es-MX' : 'en-US' });
    await page.goto('http://localhost:4173/');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}/${lang}-1-inicio.png` });
    await page.getByTestId('saltar-tutorial').click();
    const pruebas = async (fn) => { await page.getByTestId('abrir-pruebas').click(); await page.waitForTimeout(200); await fn(); await page.mouse.click(3, 3); await page.waitForTimeout(300); };
    const go = (obj) => pruebas(async () => { await page.getByTestId('objeto-meta').selectOption(obj); await page.getByTestId('jugar-hasta').click(); });
    await go('lavadora'); await page.waitForTimeout(2500);
    const box = await page.locator('canvas').boundingBox();
    for (let i = 0; i < 12; i++) { await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.6); await page.waitForTimeout(60); }
    await page.screenshot({ path: `${OUT}/${lang}-2-pandilla.png` });
    await page.getByTestId('abrir-maquinita').click(); await page.waitForTimeout(300);
    await page.getByTestId('girar-ficha').click(); await page.waitForTimeout(1800);
    await page.screenshot({ path: `${OUT}/${lang}-3-maquinita.png` });
    await page.mouse.click(3, 3); await page.waitForTimeout(300);
    await go('refri'); await page.waitForTimeout(2000);
    await pruebas(async () => { await page.getByTestId('regalo-canal').click(); await page.getByTestId('regalo-canal').click(); await page.getByTestId('regalo-canal').click(); });
    await page.getByRole('tab', { name: lang === 'es' ? /Canal/ : /Channel/ }).click(); await page.waitForTimeout(300);
    await page.getByTestId('abrir-arbol').click(); await page.waitForTimeout(400);
    await page.screenshot({ path: `${OUT}/${lang}-4-arbol.png` });
    await page.getByTestId('cerrar-arbol').click();
    await page.getByRole('tab', { name: lang === 'es' ? /Mejoras/ : /Upgrades/ }).click();
    await pruebas(async () => { await page.getByTestId('probar-jefe').click(); });
    await page.waitForTimeout(900);
    for (let i = 0; i < 10; i++) { await page.mouse.click(box.x + box.width / 2, box.y + box.height * 0.6); await page.waitForTimeout(80); }
    await page.screenshot({ path: `${OUT}/${lang}-5-jefe.png` });
    await page.close();
  }
  await browser.close();
  console.log('listo:', OUT);
})();
