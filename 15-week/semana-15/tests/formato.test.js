// PROBLEMA 3 — Testing: 2 pruebas unitarias de formatearCoordenadas()
import { describe, it, expect } from 'vitest';
import { formatearCoordenadas } from '../src/utils/formato.js';

describe('formatearCoordenadas', () => {
  // Prueba 1: el "camino feliz".
  // Verifica que los signos se conviertan en la letra de hemisferio correcta
  // (negativo -> S / O, positivo -> N / E) y que se redondee a 4 decimales.
  it('convierte coordenadas en texto con hemisferios y 4 decimales', () => {
    // Neiva, Huila: latitud norte (+), longitud oeste (-)
    expect(formatearCoordenadas(2.927312, -75.281889)).toBe('2.9273° N, 75.2819° O');
    // Sídney: latitud sur (-), longitud este (+)
    expect(formatearCoordenadas(-33.86882, 151.20929)).toBe('33.8688° S, 151.2093° E');
  });

  // Prueba 2: casos inválidos.
  // Verifica que la función NO devuelva un texto engañoso cuando recibe datos
  // imposibles (fuera de rango o que no son número), sino que lance RangeError.
  it('lanza RangeError si la latitud o la longitud están fuera de rango', () => {
    expect(() => formatearCoordenadas(91, 0)).toThrow(RangeError);
    expect(() => formatearCoordenadas(0, -181)).toThrow(RangeError);
    expect(() => formatearCoordenadas(NaN, 10)).toThrow(RangeError);
  });
});
