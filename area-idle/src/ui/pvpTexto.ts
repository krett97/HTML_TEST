// Cuánto oro da el cofre de la tienda del PvP (15 minutos de lo que ganas jugando).
import { activeGoldPerMinute } from '../core/inactivo';
import type { Meta } from '../core/meta';
import { COFRE_MINUTOS } from '../core/pvp';

export const cofreOro = (meta: Meta): number => Math.round(activeGoldPerMinute(meta) * COFRE_MINUTOS);
