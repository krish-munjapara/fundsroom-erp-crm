/** Compute human-readable Y-axis ticks that fit the actual data range. */
export function computeNiceAxisScale(
  maxValue: number,
  mode: 'revenue' | 'orders',
  tickCount = 4
): { domain: [number, number]; ticks: number[] } {
  if (maxValue <= 0) {
    if (mode === 'orders') {
      return { domain: [0, 2], ticks: [0, 1, 2] };
    }
    return { domain: [0, 1000], ticks: [0, 250, 500, 750, 1000] };
  }

  if (mode === 'orders') {
    const niceMax = Math.max(Math.ceil(maxValue * 1.2), maxValue + 1, 2);
    const ticks: number[] = [];
    for (let i = 0; i <= niceMax; i += 1) {
      ticks.push(i);
      if (ticks.length > 6) break;
    }
    if (ticks[ticks.length - 1] < niceMax) ticks.push(niceMax);
    return { domain: [0, ticks[ticks.length - 1]], ticks };
  }

  const paddedMax = maxValue * 1.15;
  const roughStep = paddedMax / tickCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;

  let niceStep = magnitude;
  if (normalized <= 1) niceStep = magnitude;
  else if (normalized <= 2) niceStep = 2 * magnitude;
  else if (normalized <= 5) niceStep = 5 * magnitude;
  else niceStep = 10 * magnitude;

  const niceMax = Math.ceil(paddedMax / niceStep) * niceStep;
  const ticks: number[] = [];
  for (let v = 0; v <= niceMax + niceStep * 0.001; v += niceStep) {
    ticks.push(Math.round(v * 100) / 100);
  }

  return { domain: [0, niceMax], ticks };
}
