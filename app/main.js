// NusaStat — router and views. Hash routes: #/ (dashboard), #/population,
// #/economy, #/labour, #/prices, #/regions, #/regions/<slug>, #/about.
// Every view renders real figures from data.js and draws its charts with charts.js.
// All controls (search, sort, filters, metric switches) work without any network.

import { YEARS, SERIES, KPI_2024, AGE_GROUPS, GDP_SECTORS, CPI_GROUPS, LABOUR, PROVINCES, provinceBySlug } from './data.js';
import { drawLineChart, drawBarChart, drawDonut, drawHorizontalBars } from './charts.js';

const app = document.getElementById('app');
let pendingCharts = [];

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function setActiveNav(route) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const key = a.getAttribute('data-nav');
    a.classList.toggle('active', key === route || (route === 'home' && key === 'home'));
  });
}

function sourceLine(text) {
  return `<p class="source-line">Source: ${esc(text)}</p>`;
}

function chartCard(title, canvasId, note, height) {
  return `<section class="card"><h2>${esc(title)}</h2>
    <canvas id="${canvasId}"${height ? ` data-height="${height}"` : ''} role="img" aria-label="${esc(title)} chart"></canvas>
    <p class="chart-note">${esc(note)}</p></section>`;
}

function kpiCards() {
  return `<div class="kpis">${KPI_2024.map((k) => `
    <div class="kpi"><a href="#/${k.key === 'population' ? 'population' : k.key === 'gdpGrowth' || k.key === 'gdpPerCapita' ? 'economy' : k.key === 'inflation' ? 'prices' : k.key === 'unemployment' ? 'labour' : 'population'}">
      <div class="kpi-value">${esc(k.value)}</div>
      <div class="kpi-label">${esc(k.note)}</div>
      <div class="kpi-detail">${esc(k.detail)}</div>
    </a></div>`).join('')}</div>`;
}

function topProvincesTable(limit, sortKey) {
  const rows = [...PROVINCES].sort((a, b) => b[sortKey] - a[sortKey]).slice(0, limit);
  return `<table><thead><tr><th>Province</th><th>Island</th><th class="num">Population (m)</th><th class="num">Poverty (%)</th></tr></thead>
  <tbody>${rows.map((p) => `<tr><td><a href="#/regions/${p.slug}">${esc(p.name)}</a></td><td>${esc(p.island)}</td><td class="num">${p.pop.toFixed(2)}</td><td class="num">${p.poverty.toFixed(1)}</td></tr>`).join('')}</tbody></table>`;
}

function viewHome() {
  setActiveNav('home');
  app.innerHTML = `
  <div class="page-head">
    <p class="eyebrow">Indonesia · Data year 2024</p>
    <h1>Indonesia in numbers</h1>
    <p class="lede">281.6 million people, the world's fourth-largest population, spread across 38 provinces
    and 17,000 islands. Explore the figures behind the country — population, economy, jobs, prices and regions.</p>
  </div>
  ${kpiCards()}
  <div class="grid-2-wide">
    <div>
      ${chartCard('Population, 2015–2024', 'ch-pop', 'Population grew by 26 million people in a decade — about 1% a year.')}
      ${chartCard('Real GDP growth, 2015–2024', 'ch-gdp', 'Growth stayed near 5% a year, except the pandemic contraction of −2.07% in 2020.')}
    </div>
    <div>
      <section class="card"><h2>Key findings — 2024</h2>
        <ul class="findings">
          <li><strong>Growth held at 5.03%</strong> with GDP of Rp 22,139 trillion, driven by manufacturing and domestic consumption.</li>
          <li><strong>Inflation fell to 1.57%</strong>, the lowest in the decade, inside Bank Indonesia's 2.5% ± 1 target.</li>
          <li><strong>Unemployment hit 4.76%</strong>, the lowest since the 1998 crisis, with 144.9 million people employed.</li>
          <li><strong>Poverty dropped to 8.57%</strong> — 24.06 million people, down from 9.36% a year earlier.</li>
          <li><strong>Java holds 56% of the population</strong> on 7% of the land; West Java alone has 49.9 million people.</li>
        </ul>
        ${sourceLine('BPS, 2024 releases. See Sources & methods for the full list.')}
      </section>
      <section class="card"><h2>Largest provinces</h2>
        ${topProvincesTable(5, 'pop')}
        <p class="chart-note"><a href="#/regions">See all 38 provinces →</a></p>
      </section>
    </div>
  </div>`;
  pendingCharts = [
    () => drawLineChart(document.getElementById('ch-pop'), YEARS, SERIES.population.values, { format: (v) => v.toFixed(0) + ' m' }),
    () => drawBarChart(document.getElementById('ch-gdp'), YEARS, SERIES.gdpGrowth.values, { format: (v) => v.toFixed(2) + '%' }),
  ];
  runCharts();
}

function viewPopulation() {
  setActiveNav('population');
  app.innerHTML = `
  <div class="page-head">
    <p class="eyebrow">People</p>
    <h1>Population</h1>
    <p class="lede">Indonesia's population reached 281.6 million in 2024. The median age is about 30, and
    68% of people are of working age (15–64) — a demographic dividend that peaks around 2030.</p>
  </div>
  <div class="controls" role="group" aria-label="Choose indicator">
    <span>Show:</span>
    <div class="chip-row" id="pop-chips">
      <button class="chip active" data-series="population">Population</button>
      <button class="chip" data-series="lifeExpectancy">Life expectancy</button>
      <button class="chip" data-series="hdi">Human Development Index</button>
    </div>
  </div>
  <div class="grid-2-wide">
    <div>${chartCard('Trend, 2015–2024', 'ch-pop-trend', 'Drag the chips above to switch indicators.')}</div>
    <div>${chartCard('Age structure, 2024 (% of population)', 'ch-age', 'Two in three Indonesians are of working age.')}</div>
  </div>
  <section class="card"><h2>Population by province, 2024</h2>
    <div class="controls">
      <label for="prov-search">Search province</label>
      <input type="search" id="prov-search" placeholder="e.g. Java, Papua…" autocomplete="off">
      <label for="prov-sort">Sort by</label>
      <select id="prov-sort">
        <option value="pop">Population (largest first)</option>
        <option value="poverty">Poverty rate (highest first)</option>
        <option value="name">Name (A–Z)</option>
      </select>
    </div>
    <div id="prov-table"></div>
    ${sourceLine('BPS mid-year estimates, 2024; poverty: BPS, September 2024.')}
  </section>`;
  const drawTrend = (key) => {
    const s = SERIES[key];
    drawLineChart(document.getElementById('ch-pop-trend'), YEARS, s.values, { format: s.format });
    document.querySelector('#ch-pop-trend').closest('.card').querySelector('.chart-note').textContent = s.label + ' — ' + s.source + '.';
  };
  let current = 'population';
  drawTrend(current);
  drawHorizontalBars(document.getElementById('ch-age'), AGE_GROUPS, { format: (v) => v.toFixed(1) + '%' });
  document.getElementById('pop-chips').addEventListener('click', (e) => {
    const b = e.target.closest('[data-series]');
    if (!b) return;
    document.querySelectorAll('#pop-chips .chip').forEach((c) => c.classList.remove('active'));
    b.classList.add('active');
    current = b.getAttribute('data-series');
    drawTrend(current);
  });
  const renderTable = () => {
    const q = (document.getElementById('prov-search').value || '').toLowerCase();
    const sort = document.getElementById('prov-sort').value;
    let rows = PROVINCES.filter((p) => p.name.toLowerCase().includes(q) || p.island.toLowerCase().includes(q));
    if (sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name));
    else rows.sort((a, b) => b[sort] - a[sort]);
    document.getElementById('prov-table').innerHTML = rows.length ? `<table><thead><tr><th>Province</th><th>Island</th><th class="num">Population (m)</th><th class="num">Poverty (%)</th><th class="num">Unemployment (%)</th></tr></thead>
    <tbody>${rows.map((p) => `<tr><td><a href="#/regions/${p.slug}">${esc(p.name)}</a></td><td>${esc(p.island)}</td><td class="num">${p.pop.toFixed(2)}</td><td class="num">${p.poverty.toFixed(1)}</td><td class="num">${p.unemp.toFixed(1)}</td></tr>`).join('')}</tbody></table>
    <p class="chart-note">${rows.length} of 38 provinces shown.</p>` : '<p>No provinces match your search.</p>';
  };
  document.getElementById('prov-search').addEventListener('input', renderTable);
  document.getElementById('prov-sort').addEventListener('change', renderTable);
  renderTable();
  pendingCharts = [() => { drawTrend(current); drawHorizontalBars(document.getElementById('ch-age'), AGE_GROUPS, { format: (v) => v.toFixed(1) + '%' }); }];
}

function viewEconomy() {
  setActiveNav('economy');
  app.innerHTML = `
  <div class="page-head">
    <p class="eyebrow">Economy</p>
    <h1>Economy</h1>
    <p class="lede">Indonesia is Southeast Asia's largest economy: GDP of Rp 22,139 trillion (about US$1.39 trillion)
    in 2024, growing 5.03% in real terms. Manufacturing is the largest sector at 18.7% of GDP.</p>
  </div>
  <div class="grid-2">
    ${chartCard('Real GDP growth, 2015–2024 (%)', 'ch-growth', 'Growth averaged 5.0% a year outside the pandemic year.')}
    ${chartCard('GDP per capita, 2015–2024 (US$)', 'ch-gdppc', 'Income per person reached $4,919 in 2024.')}
  </div>
  <div class="grid-2">
    ${chartCard('GDP by sector, 2024 (% of GDP)', 'ch-sectors', 'Manufacturing, trade and agriculture together make up 44% of GDP.')}
    <section class="card"><h2>At a glance — 2024</h2>
      <ul class="stat-list">
        <li><span>Nominal GDP</span><b>Rp 22,139 trillion</b></li>
        <li><span>GDP (US$)</span><b>≈ $1.39 trillion</b></li>
        <li><span>Real GDP growth</span><b>5.03%</b></li>
        <li><span>GDP per capita</span><b>$4,919</b></li>
        <li><span>Investment (gross fixed capital)</span><b>29.9% of GDP</b></li>
        <li><span>Exports of goods &amp; services</span><b>≈ $264 billion</b></li>
        <li><span>Government debt</span><b>≈ 39% of GDP</b></li>
      </ul>
      ${sourceLine('BPS national accounts, 2024; Bank Indonesia; World Bank.')}
    </section>
  </div>
  <section class="card"><h2>Largest regional economies (GRDP share, 2024)</h2>
    <div id="grdp-bars"></div>
    ${sourceLine('BPS regional accounts, 2024. Jakarta, East Java and West Java together produce 45% of national GDP.')}
  </section>`;
  pendingCharts = [
    () => drawBarChart(document.getElementById('ch-growth'), YEARS, SERIES.gdpGrowth.values, { format: (v) => v.toFixed(2) + '%' }),
    () => drawLineChart(document.getElementById('ch-gdppc'), YEARS, SERIES.gdpPerCapita.values, { format: (v) => '$' + Math.round(v).toLocaleString('en-US') }),
    () => drawDonut(document.getElementById('ch-sectors'), GDP_SECTORS, { center: '100%', centerSub: 'of GDP' }),
    () => drawHorizontalBars(document.getElementById('grdp-bars'), [...PROVINCES].sort((a, b) => b.grdp - a.grdp).slice(0, 8).map((p) => ({ label: p.name, value: p.grdp })), { format: (v) => v.toFixed(1) + '%' }),
  ];
  runCharts();
}

function viewLabour() {
  setActiveNav('labour');
  app.innerHTML = `
  <div class="page-head">
    <p class="eyebrow">Jobs</p>
    <h1>Labour</h1>
    <p class="lede">The labour force reached 152.1 million people in August 2024. Unemployment fell to 4.76%,
    but 59.2% of workers are still in informal jobs without a formal contract or social protection.</p>
  </div>
  ${`<div class="kpis">
    <div class="kpi"><div class="kpi-value">152.1 m</div><div class="kpi-label">Labour force, Aug 2024</div><div class="kpi-detail">Participation rate 70.2%</div></div>
    <div class="kpi"><div class="kpi-value">144.9 m</div><div class="kpi-label">People employed</div><div class="kpi-detail">Up 4.8 million on a year earlier</div></div>
    <div class="kpi"><div class="kpi-value">59.2%</div><div class="kpi-label">Informal employment</div><div class="kpi-detail">85.8 million workers</div></div>
  </div>`}
  <div class="grid-2">
    ${chartCard('Unemployment rate, 2015–2024 (%)', 'ch-unemp', 'Unemployment spiked to 7.07% in 2020, then fell every year after.')}
    ${chartCard('Employment by sector, 2024 (% of workers)', 'ch-labsec', 'Trade and services employ almost half of all workers.')}
  </div>
  <section class="card"><h2>Unemployment by province, Aug 2024</h2>
    <div class="controls">
      <label for="lab-sort">Sort by</label>
      <select id="lab-sort">
        <option value="unemp">Unemployment (highest first)</option>
        <option value="unemp-asc">Unemployment (lowest first)</option>
        <option value="name">Name (A–Z)</option>
      </select>
    </div>
    <div id="lab-table"></div>
    ${sourceLine('BPS Sakernas, August 2024.')}
  </section>`;
  const renderLab = () => {
    const sort = document.getElementById('lab-sort').value;
    const rows = [...PROVINCES];
    if (sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'unemp-asc') rows.sort((a, b) => a.unemp - b.unemp);
    else rows.sort((a, b) => b.unemp - a.unemp);
    document.getElementById('lab-table').innerHTML = `<table><thead><tr><th>Province</th><th class="num">Unemployment (%)</th><th class="num">Population (m)</th></tr></thead>
    <tbody>${rows.slice(0, 12).map((p) => `<tr><td><a href="#/regions/${p.slug}">${esc(p.name)}</a></td><td class="num">${p.unemp.toFixed(1)}</td><td class="num">${p.pop.toFixed(2)}</td></tr>`).join('')}</tbody></table>
    <p class="chart-note">Top 12 of 38 provinces shown — change the sort to see the other end.</p>`;
  };
  document.getElementById('lab-sort').addEventListener('change', renderLab);
  renderLab();
  pendingCharts = [
    () => drawLineChart(document.getElementById('ch-unemp'), YEARS, SERIES.unemployment.values, { format: (v) => v.toFixed(2) + '%' }),
    () => drawHorizontalBars(document.getElementById('ch-labsec'), LABOUR.bySector, { format: (v) => v.toFixed(1) + '%' }),
  ];
  runCharts();
}

function viewPrices() {
  setActiveNav('prices');
  app.innerHTML = `
  <div class="page-head">
    <p class="eyebrow">Prices</p>
    <h1>Prices &amp; inflation</h1>
    <p class="lede">Consumer price inflation was 1.57% year on year in December 2024 — the lowest in a decade
    and inside Bank Indonesia's 2.5% ± 1 target band. Food is the largest CPI basket group at 25% weight.</p>
  </div>
  <div class="grid-2">
    ${chartCard('Inflation, 2015–2024 (% yoy)', 'ch-infl', 'The 2022 spike to 5.51% followed the fuel-price adjustment; it has fallen since.')}
    ${chartCard('Inflation by CPI group, 2024 (%)', 'ch-cpi', 'Health and restaurants ran hottest; transport coolest.')}
  </div>
  <section class="card"><h2>CPI basket — weights and 2024 inflation</h2>
    <table><thead><tr><th>Group</th><th class="num">Basket weight (%)</th><th class="num">Inflation 2024 (%)</th></tr></thead>
    <tbody>${CPI_GROUPS.map((g) => `<tr><td>${esc(g.label)}</td><td class="num">${g.weight.toFixed(1)}</td><td class="num">${g.inflation.toFixed(1)}</td></tr>`).join('')}</tbody></table>
    ${sourceLine('BPS CPI release, December 2024.')}
  </section>
  <div class="callout"><p><strong>What it means:</strong> with inflation at 1.57% and the policy rate at 6.00%,
  real interest rates are firmly positive — good news for savers, a headwind for borrowers. Food prices,
  the biggest household cost, rose only 1.9% over the year.</p></div>`;
  pendingCharts = [
    () => drawLineChart(document.getElementById('ch-infl'), YEARS, SERIES.inflation.values, { format: (v) => v.toFixed(2) + '%' }),
    () => drawBarChart(document.getElementById('ch-cpi'), CPI_GROUPS.map((g) => g.label.split(' ')[0]), CPI_GROUPS.map((g) => g.inflation), { format: (v) => v.toFixed(1) + '%' }),
  ];
  runCharts();
}

function viewRegions(slug) {
  if (slug) return viewProvince(slug);
  setActiveNav('regions');
  app.innerHTML = `
  <div class="page-head">
    <p class="eyebrow">38 provinces</p>
    <h1>Regions</h1>
    <p class="lede">Every province, from Aceh to Highland Papua. Search, filter by island group, or sort —
    then open a province for its full profile.</p>
  </div>
  <section class="card">
    <div class="controls">
      <label for="reg-search">Search</label>
      <input type="search" id="reg-search" placeholder="Province or island…" autocomplete="off">
      <label for="reg-island">Island group</label>
      <select id="reg-island">
        <option value="">All islands</option>
        <option>Sumatra</option><option>Java</option><option>Bali &amp; Nusa Tenggara</option>
        <option>Kalimantan</option><option>Sulawesi</option><option>Maluku &amp; Papua</option>
      </select>
      <label for="reg-sort">Sort by</label>
      <select id="reg-sort">
        <option value="pop">Population</option>
        <option value="poverty">Poverty rate</option>
        <option value="grdp">GRDP share</option>
        <option value="unemp">Unemployment</option>
      </select>
      <button type="button" id="reg-csv">Download table as CSV</button>
    </div>
    <div id="reg-table"></div>
    ${sourceLine('BPS, 2024. Population: mid-year estimates. Poverty: September 2024. GRDP share: regional accounts 2024. Unemployment: Sakernas August 2024.')}
  </section>`;
  const render = () => {
    const q = (document.getElementById('reg-search').value || '').toLowerCase();
    const island = document.getElementById('reg-island').value;
    const sort = document.getElementById('reg-sort').value;
    let rows = PROVINCES.filter((p) => (!q || p.name.toLowerCase().includes(q) || p.island.toLowerCase().includes(q)) && (!island || p.island === island));
    rows.sort((a, b) => b[sort] - a[sort]);
    const maxPop = Math.max(...PROVINCES.map((p) => p.pop));
    document.getElementById('reg-table').innerHTML = rows.length ? `<table><thead><tr><th>Province</th><th>Island</th><th class="num">Population (m)</th><th class="num">Poverty (%)</th><th class="num">GRDP (%)</th><th class="num">Unemp. (%)</th></tr></thead>
    <tbody>${rows.map((p) => `<tr><td><a href="#/regions/${p.slug}">${esc(p.name)}</a></td><td>${esc(p.island)}</td><td class="num"><span class="bar-cell"><span class="bar-track"><span class="bar-fill" style="width:${Math.round((p.pop / maxPop) * 100)}%"></span></span>${p.pop.toFixed(2)}</span></td><td class="num">${p.poverty.toFixed(1)}</td><td class="num">${p.grdp.toFixed(1)}</td><td class="num">${p.unemp.toFixed(1)}</td></tr>`).join('')}</tbody></table>
    <p class="chart-note">${rows.length} of 38 provinces shown.</p>` : '<p>No provinces match your filters.</p>';
  };
  ['reg-search', 'reg-island', 'reg-sort'].forEach((id) => {
    document.getElementById(id).addEventListener(id === 'reg-search' ? 'input' : 'change', render);
  });
  render();
  document.getElementById('reg-csv').addEventListener('click', () => {
    const header = 'Province,Island,Population (million),Poverty rate (%),GRDP share (%),Unemployment (%)\n';
    const body = PROVINCES.map((p) => [p.name, p.island, p.pop.toFixed(2), p.poverty.toFixed(1), p.grdp.toFixed(1), p.unemp.toFixed(1)].join(',')).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nusastat-provinces-2024.csv';
    a.click();
    URL.revokeObjectURL(url);
  });
}

function viewProvince(slug) {
  const p = provinceBySlug(slug);
  if (!p) { app.innerHTML = '<h1>Province not found</h1><p><a href="#/regions">Back to all provinces</a></p>'; return; }
  setActiveNav('regions');
  const share = ((p.pop / 281.6) * 100).toFixed(1);
  const rank = [...PROVINCES].sort((a, b) => b.pop - a.pop).findIndex((x) => x.slug === slug) + 1;
  app.innerHTML = `
  <div class="page-head">
    <p class="eyebrow"><a href="#/regions">Regions</a> · ${esc(p.island)}</p>
    <h1>${esc(p.name)}</h1>
    <p class="lede">Province profile — 2024. Ranked #${rank} of 38 provinces by population, with ${share}% of Indonesia's people.</p>
  </div>
  <div class="kpis">
    <div class="kpi"><div class="kpi-value">${p.pop.toFixed(2)} m</div><div class="kpi-label">Population, 2024</div><div class="kpi-detail">Rank #${rank} of 38 · ${share}% of Indonesia</div></div>
    <div class="kpi"><div class="kpi-value">${p.poverty.toFixed(1)}%</div><div class="kpi-label">Poverty rate, Sep 2024</div><div class="kpi-detail">National: 8.57%</div></div>
    <div class="kpi"><div class="kpi-value">${p.grdp.toFixed(1)}%</div><div class="kpi-label">Share of national GDP</div><div class="kpi-detail">GRDP, regional accounts 2024</div></div>
    <div class="kpi"><div class="kpi-value">${p.unemp.toFixed(1)}%</div><div class="kpi-label">Unemployment, Aug 2024</div><div class="kpi-detail">National: 4.76%</div></div>
  </div>
  <div class="grid-2">
    ${chartCard('National context — population trend', 'ch-prov', 'Indonesia’s population grew from 255.6 m (2015) to 281.6 m (2024).')}
    <section class="card"><h2>How ${esc(p.name)} compares</h2>
      <ul class="stat-list">
        <li><span>Population vs national average (7.4 m)</span><b>${p.pop > 7.4 ? 'Above' : 'Below'} average</b></li>
        <li><span>Poverty vs national (8.57%)</span><b>${p.poverty > 8.57 ? 'Above' : 'Below'} national</b></li>
        <li><span>Unemployment vs national (4.76%)</span><b>${p.unemp > 4.76 ? 'Above' : 'Below'} national</b></li>
        <li><span>Island group</span><b>${esc(p.island)}</b></li>
      </ul>
      <p class="chart-note"><a href="#/regions">← Back to all provinces</a></p>
      ${sourceLine('BPS, 2024.')}
    </section>
  </div>`;
  pendingCharts = [
    () => drawLineChart(document.getElementById('ch-prov'), YEARS, SERIES.population.values, { format: (v) => v.toFixed(0) + ' m' }),
  ];
  runCharts();
}

function viewAbout() {
  setActiveNav('about');
  app.innerHTML = `
  <div class="page-head">
    <p class="eyebrow">Transparency</p>
    <h1>Sources &amp; methods</h1>
    <p class="lede">Every figure on NusaStat comes from a published official source. This page lists them,
    explains the methods, and states what is rounded or estimated.</p>
  </div>
  <section class="card"><h2>Sources</h2>
    <ul class="findings">
      <li><strong>BPS — Statistics Indonesia.</strong> Population mid-year estimates; national accounts (GDP); consumer price index; Sakernas labour force survey (August 2024); poverty statistics (September 2024); Human Development Index 2024. All figures labelled BPS, 2024 unless a range is shown.</li>
      <li><strong>Bank Indonesia.</strong> Policy rate 6.00% and inflation target 2.5% ± 1, 2024.</li>
      <li><strong>World Bank.</strong> GDP per capita in US dollars, 2015–2024 series, cross-checked against BPS.</li>
    </ul>
  </section>
  <section class="card"><h2>Methods &amp; notes</h2>
    <ul class="findings">
      <li>Provincial populations are BPS mid-year estimates, rounded to two decimals (millions). Their sum (281.6 m) matches the national estimate.</li>
      <li>Poverty rates use BPS's September 2024 release; unemployment uses Sakernas, August 2024.</li>
      <li>GRDP shares are each province's share of national GDP from BPS regional accounts, 2024.</li>
      <li>Growth, inflation and unemployment series are annual published values, 2015–2024; the 2020 GDP contraction (−2.07%) is the pandemic year.</li>
      <li>Charts are drawn in your browser from the data files shipped with this site — no network request is made.</li>
    </ul>
  </section>
  <section class="card"><h2>About NusaStat</h2>
    <p>NusaStat is an independent explorer built to make Indonesia's official statistics easy to browse:
    one dashboard, five topic pages, and a profile for every province. It is not affiliated with BPS,
    Bank Indonesia or the World Bank. Figures are rounded for readability; for exact values, consult the
    publications listed above.</p>
    <p><a class="btn" href="#/">Back to the dashboard</a></p>
  </section>`;
}

const ROUTES = {
  '': viewHome, home: viewHome, population: viewPopulation, economy: viewEconomy,
  labour: viewLabour, prices: viewPrices, regions: viewRegions, about: viewAbout,
};

function runCharts() {
  const fns = pendingCharts;
  pendingCharts = [];
  requestAnimationFrame(() => fns.forEach((fn) => { try { fn(); } catch (e) { /* chart already drawn */ } }));
}

function route() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const [page, param] = hash.split('/');
  const view = ROUTES[page] || ROUTES[''];
  if (page === 'regions') viewRegions(param || null);
  else view();
  window.scrollTo(0, 0);
}

let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(route, 200);
});
window.addEventListener('hashchange', route);
route();
