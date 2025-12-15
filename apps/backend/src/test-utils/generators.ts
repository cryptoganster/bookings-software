import * as fc from 'fast-check';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generador de UUIDs v4 válidos para property-based testing
 * 
 * fast-check v4 genera UUIDs v6 por defecto, pero uuid v9 tiene validación
 * más estricta. Este generador asegura que siempre se generen UUIDs v4 válidos.
 */
export const uuidV4 = (): fc.Arbitrary<string> => {
  return fc.constant(null).map(() => uuidv4());
};
