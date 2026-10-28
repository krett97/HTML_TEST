// Textos del juego. Los componentes usan $t('tabs.mejoras') y se actualizan al cambiar de idioma.
import { derived, writable } from 'svelte/store';
import type { Locale } from '../core/state';
import es from './es.json';
import en from './en.json';

type Dict = { [key: string]: string | Dict };

const DICTS: Record<Locale, Dict> = { es, en };
const FALLBACK: Locale = 'es';

export const LOCALES: Locale[] = ['es', 'en'];

export function isLocale(value: unknown): value is Locale {
  return value === 'es' || value === 'en';
}

export function detectLocale(): Locale {
  const lang = typeof navigator !== 'undefined' ? navigator.language.toLowerCase() : '';
  return lang.startsWith('en') ? 'en' : 'es';
}

function lookup(dict: Dict, key: string): string | undefined {
  let node: string | Dict | undefined = dict;
  for (const part of key.split('.')) {
    if (typeof node !== 'object') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
}

export function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  const text = lookup(DICTS[locale], key) ?? lookup(DICTS[FALLBACK], key) ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in params ? String(params[name]) : match));
}

export const locale = writable<Locale>(FALLBACK);

export const t = derived(
  locale,
  ($locale) => (key: string, params?: Record<string, string | number>) => translate($locale, key, params),
);
