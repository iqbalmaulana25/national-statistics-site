// NusaStat charts — small hand-rolled canvas charts, no libraries.
// Every chart draws from the data passed in and labels its axes, so a screenshot
// always shows real figures. Charts re-draw on resize via ResizeObserver in main.js.

const PALETTE = ['#0b5fa5', '#e07b39', '#2e8b6a', '#7a4fa3', '#c0392b', '#8a6d1b', '#3d7ea6', '#5b8c5a'];

function setupCanvas(canvas, height) {
  const dpr = window.devicePixelRatio || 1;
  const width = canvas.clientWidth || canvas.parentElement.clientWidth || 600;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.height = height + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  return { ctx, width, height };
}

function niceTicks(min, max, count = 4) {
  const span = max - min || 1;
  const step = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step)));
  const norm = step / mag;
  const nice = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  const tick = nice * mag;
  const start = Math.floor(min / tick) * tick;
  const ticks = [];
  for (let v = start; v <= max + tick * 0.001; v += tick) ticks.push(v);
  return ticks;
}

export function drawLineChart(canvas, labels, values, opts = {}) {
  const height = opts.height || 260;
  const { ctx, width, height: h } = setupCanvas(canvas, height);
  const padL = 52, padR = 14, padT = 14, padB = 28;
  const min = Math.min(...values), max = Math.max(...values);
  const lo = opts.min !== undefined ? opts.min : min - (max - min) * 0.12;
  const hi = opts.max !== undefined ? opts.max : max + (max - min) * 0.12;
  const ticks = niceTicks(lo, hi);
  const x = (i) => padL + (i * (width - padL - padR)) / (labels.length - 1);
  const y = (v) => padT + ((hi - v) / (hi - lo)) * (h - padT - padB);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#5b6b7a';
  ctx.strokeStyle = '#dbe4ec';
  ctx.lineWidth = 1;
  for (const t of ticks) {
    ctx.beginPath(); ctx.moveTo(padL, y(t)); ctx.lineTo(width - padR, y(t)); ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillText(opts.format ? opts.format(t) : t.toLocaleString('en-US'), padL - 6, y(t) + 4);
  }
  ctx.textAlign = 'center';
  labels.forEach((lab, i) => {
    if (i % 2 === 0 || labels.length <= 6) ctx.fillText(String(lab), x(i), h - 8);
  });
  // Area fill.
  ctx.beginPath();
  values.forEach((v, i) => { i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v)); });
  ctx.lineTo(x(values.length - 1), h - padB); ctx.lineTo(x(0), h - padB); ctx.closePath();
  ctx.fillStyle = 'rgba(11,95,165,0.10)';
  ctx.fill();
  // Line + points + last value label.
  ctx.beginPath();
  values.forEach((v, i) => { i === 0 ? ctx.moveTo(x(i), y(v)) : ctx.lineTo(x(i), y(v)); });
  ctx.strokeStyle = opts.color || '#0b5fa5';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.fillStyle = opts.color || '#0b5fa5';
  values.forEach((v, i) => { ctx.beginPath(); ctx.arc(x(i), y(v), 3.2, 0, Math.PI * 2); ctx.fill(); });
  const last = values[values.length - 1];
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillStyle = '#12324a';
  ctx.textAlign = 'left';
  ctx.fillText(opts.format ? opts.format(last) : String(last), Math.min(x(values.length - 1) + 8, width - 70), y(last) - 8);
}

export function drawBarChart(canvas, labels, values, opts = {}) {
  const height = opts.height || 260;
  const { ctx, width, height: h } = setupCanvas(canvas, height);
  const padL = 52, padR = 14, padT = 14, padB = 30;
  const max = Math.max(...values, 0);
  const min = Math.min(...values, 0);
  const lo = min < 0 ? min * 1.15 : 0;
  const hi = max * 1.12;
  const ticks = niceTicks(lo, hi);
  const slot = (width - padL - padR) / labels.length;
  const y = (v) => padT + ((hi - v) / (hi - lo)) * (h - padT - padB);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#5b6b7a';
  ctx.strokeStyle = '#dbe4ec';
  for (const t of ticks) {
    ctx.beginPath(); ctx.moveTo(padL, y(t)); ctx.lineTo(width - padR, y(t)); ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillText(opts.format ? opts.format(t) : t.toLocaleString('en-US'), padL - 6, y(t) + 4);
  }
  const bw = Math.min(slot * 0.62, 46);
  labels.forEach((lab, i) => {
    const v = values[i];
    const bx = padL + slot * i + (slot - bw) / 2;
    ctx.fillStyle = v < 0 ? '#c0392b' : (opts.colors ? opts.colors[i % opts.colors.length] : PALETTE[i % PALETTE.length]);
    const top = y(Math.max(v, 0)), bottom = y(Math.min(v, 0));
    ctx.fillRect(bx, top, bw, Math.max(bottom - top, 2));
    ctx.fillStyle = '#12324a';
    ctx.textAlign = 'center';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText(opts.format ? opts.format(v) : String(v), bx + bw / 2, (v < 0 ? bottom + 14 : top - 6));
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillStyle = '#5b6b7a';
    const short = String(lab).length > 9 ? String(lab).slice(0, 8) + '…' : String(lab);
    ctx.fillText(short, bx + bw / 2, h - 10);
  });
}

export function drawDonut(canvas, items, opts = {}) {
  const height = opts.height || 240;
  const { ctx, width, height: h } = setupCanvas(canvas, height);
  const cx = opts.legend === false ? width / 2 : Math.min(width * 0.32, 150);
  const cy = h / 2;
  const r = Math.min(h / 2 - 16, 96);
  const total = items.reduce((s, it) => s + it.value, 0);
  let a = -Math.PI / 2;
  items.forEach((it, i) => {
    const sweep = (it.value / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, a, a + sweep);
    ctx.closePath();
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.fill();
    a += sweep;
  });
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillStyle = '#12324a';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(opts.center || '', cx, cy - 2);
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillStyle = '#5b6b7a';
  ctx.fillText(opts.centerSub || '', cx, cy + 15);
  if (opts.legend !== false) {
    const lx = cx + r + 24;
    ctx.textAlign = 'left';
    ctx.font = '12px system-ui, sans-serif';
    items.forEach((it, i) => {
      const ly = 26 + i * 22;
      if (ly > h - 8) return;
      ctx.fillStyle = PALETTE[i % PALETTE.length];
      ctx.fillRect(lx, ly - 9, 10, 10);
      ctx.fillStyle = '#24384a';
      ctx.fillText(it.label + ' — ' + it.value.toFixed(1) + '%', lx + 16, ly);
    });
  }
}

export function drawHorizontalBars(canvas, items, opts = {}) {
  const rowH = 30;
  const height = Math.max(120, items.length * rowH + 20);
  const { ctx, width, height: h } = setupCanvas(canvas, height);
  const max = Math.max(...items.map((it) => it.value));
  const labelW = opts.labelWidth || 150;
  ctx.font = '12px system-ui, sans-serif';
  items.forEach((it, i) => {
    const y = 14 + i * rowH;
    ctx.fillStyle = '#24384a';
    ctx.textAlign = 'left';
    ctx.fillText(it.label, 4, y + 12);
    const bx = labelW;
    const bw = ((width - labelW - 64) * it.value) / max;
    ctx.fillStyle = PALETTE[i % PALETTE.length];
    ctx.fillRect(bx, y, Math.max(bw, 2), 16);
    ctx.fillStyle = '#12324a';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(opts.format ? opts.format(it.value) : it.value.toFixed(1), bx + Math.max(bw, 2) + 6, y + 13);
    ctx.font = '12px system-ui, sans-serif';
  });
}
