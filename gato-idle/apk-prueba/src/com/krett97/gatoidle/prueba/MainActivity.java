package com.krett97.gatoidle.prueba;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;

/** Muestra el juego (assets/index.html) a pantalla completa en un WebView. */
public class MainActivity extends Activity {
    private static final int FONDO = Color.rgb(0x1e, 0x14, 0x24);

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(FONDO);
        getWindow().setNavigationBarColor(FONDO);

        web = new WebView(this);
        web.setBackgroundColor(FONDO);
        web.setOverScrollMode(View.OVER_SCROLL_NEVER);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        // localStorage: ahí se guarda la partida.
        settings.setDomStorageEnabled(true);
        // El tamaño de letra del sistema no debe deformar la interfaz del juego.
        settings.setTextZoom(100);

        setContentView(web);
        web.loadUrl("file:///android_asset/index.html");
    }

    // Al pausar, la página pasa a "oculta" y el juego guarda la partida.
    @Override
    protected void onPause() {
        web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
    }

    @Override
    protected void onDestroy() {
        web.destroy();
        super.onDestroy();
    }
}
