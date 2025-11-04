
const state = {
  rows: [],
  totals: [],
  sortKey: 'country',
  sortDir: 'asc',
  filter: '',
  selectedCountries: []
};

const el = {
  tableBody: document.querySelector('#co2-table tbody'),
  totalsGrid: document.querySelector('#totals-grid'),
  status: document.querySelector('#status'),
  search: document.querySelector('#search'),
  sortButtons: document.querySelectorAll('#co2-table thead [data-sort]'),
  quickButtons: document.querySelectorAll('[data-action]'),
  compareButtonsWrap: document.querySelector('#compare-buttons'),
  compareWrapper: document.querySelector('#compare-wrapper'),
  compareHint: document.querySelector('#compare-hint'),
  compareLeft: document.querySelector('#compare-left'),
  compareRight: document.querySelector('#compare-right'),
  compareBody: document.querySelector('#compare-body'),
  layoutRow: document.querySelector('#layoutRow')
};

fetch('data/countries.json')
  .then((res) => res.json())
  .then((data) => {
    state.rows = data;
    state.totals = buildTotals(data);
    renderTotals();
    buildCompareButtons();
    updateSortButtons();
    renderTable();
    el.status.textContent = `${data.length} Datensätze geladen`;
  })
  .catch(() => {
    el.status.textContent = 'Fehler beim Laden der Daten';
  });

if (el.search) {
  el.search.addEventListener('input', (event) => {
    state.filter = event.target.value.trim().toLowerCase();
    renderTable();
  });
}

el.sortButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-sort');
    if (state.sortKey === key) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortKey = key;
      state.sortDir = 'asc';
    }
    updateSortButtons();
    renderTable();
  });
});

el.quickButtons.forEach((btn) => {
  btn.addEventListener('click', () => handleQuickAction(btn.getAttribute('data-action')));
});

function handleQuickAction(action) {
  switch (action) {
    case 'sort-country':
      state.sortKey = 'country';
      state.sortDir = 'asc';
      updateSortButtons();
      renderTable();
      break;
    case 'sort-company':
      state.sortKey = 'company';
      state.sortDir = 'asc';
      updateSortButtons();
      renderTable();
      if (el.search) {
        el.search.focus();
      }
      break;
    case 'focus-filter':
      if (el.search) {
        el.search.focus();
      }
      break;
    case 'set-rtl':
      document.documentElement.setAttribute('dir', 'rtl');
      if (el.layoutRow) {
        el.layoutRow.classList.add('rtl-active');
      }
      break;
    case 'set-ltr':
      document.documentElement.setAttribute('dir', 'ltr');
      if (el.layoutRow) {
        el.layoutRow.classList.remove('rtl-active');
      }
      break;
    default:
      break;
  }
}

function renderTable() {
  if (!el.tableBody) return;

  const rows = applyFilterAndSort();
  el.tableBody.innerHTML = '';

  rows.forEach((row) => {
    const tr = document.createElement('tr');

    const tdCountry = document.createElement('td');
    tdCountry.textContent = row.country;

    const tdCompany = document.createElement('td');
    tdCompany.textContent = row.company;

    const tdValue = document.createElement('td');
    tdValue.className = 'text-end fw-semibold';
    tdValue.textContent = formatNumber(row.emissions_mio_t);

    tr.append(tdCountry, tdCompany, tdValue);
    el.tableBody.appendChild(tr);
  });

  if (rows.length === 0) {
    const empty = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 3;
    cell.className = 'text-center text-muted py-3';
    cell.textContent = 'Keine Einträge gefunden.';
    empty.appendChild(cell);
    el.tableBody.appendChild(empty);
  }

  if (rows.length === state.rows.length || state.filter === '') {
    el.status.textContent = `${rows.length} von ${state.rows.length} Einträgen`;
  } else {
    el.status.textContent = `${rows.length} Treffer (von ${state.rows.length})`;
  }
}

function applyFilterAndSort() {
  let result = [...state.rows];
  if (state.filter) {
    result = result.filter((row) => {
      return (
        row.country.toLowerCase().includes(state.filter) ||
        row.company.toLowerCase().includes(state.filter)
      );
    });
  }

  const dir = state.sortDir === 'asc' ? 1 : -1;
  result.sort((a, b) => {
    if (state.sortKey === 'emissions_mio_t') {
      return (Number(a.emissions_mio_t) - Number(b.emissions_mio_t)) * dir;
    }
    return String(a[state.sortKey]).localeCompare(String(b[state.sortKey]), 'de') * dir;
  });
  return result;
}

function updateSortButtons() {
  el.sortButtons.forEach((btn) => {
    const key = btn.getAttribute('data-sort');
    const base = btn.getAttribute('data-label') || btn.textContent;
    const arrow = state.sortKey === key ? (state.sortDir === 'asc' ? ' ↑' : ' ↓') : '';
    btn.textContent = base + arrow;
  });

  el.quickButtons.forEach((btn) => {
    const action = btn.getAttribute('data-action');
    const isCountry = action === 'sort-country' && state.sortKey === 'country';
    const isCompany = action === 'sort-company' && state.sortKey === 'company';
    btn.classList.toggle('active', isCountry || isCompany);
  });
}

function buildTotals(rows) {
  const totals = new Map();
  rows.forEach((row) => {
    if (!totals.has(row.country)) {
      totals.set(row.country, 0);
    }
    totals.set(row.country, totals.get(row.country) + Number(row.emissions_mio_t));
  });

  return Array.from(totals.entries()).map(([country, total]) => ({
    country,
    total
  }));
}

function renderTotals() {
  if (!el.totalsGrid) return;
  el.totalsGrid.innerHTML = '';

  state.totals.forEach((row) => {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-xl-3';

    const card = document.createElement('article');
    card.className = 'totals-card';

    const heading = document.createElement('h3');
    heading.className = 'h6 mb-1';
    heading.textContent = row.country;

    const value = document.createElement('p');
    value.className = 'fw-semibold';
    value.textContent = `${formatNumber(row.total, 1)} Mio. t CO₂`;

    card.append(heading, value);
    col.appendChild(card);
    el.totalsGrid.appendChild(col);
  });
}

function buildCompareButtons() {
  if (!el.compareButtonsWrap) return;
  el.compareButtonsWrap.innerHTML = '';
  const countries = Array.from(new Set(state.rows.map((row) => row.country)));
  countries.sort((a, b) => a.localeCompare(b, 'de'));

  countries.forEach((country) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-outline-secondary btn-sm';
    btn.textContent = country;
    btn.dataset.country = country;
    btn.addEventListener('click', () => toggleCountry(country, btn));
    el.compareButtonsWrap.appendChild(btn);
  });
}

function toggleCountry(country) {
  const index = state.selectedCountries.indexOf(country);
  if (index >= 0) {
    state.selectedCountries.splice(index, 1);
  } else {
    if (state.selectedCountries.length === 2) {
      state.selectedCountries.shift();
    }
    state.selectedCountries.push(country);
  }
  updateCompareButtons();
  renderComparison();
}

function updateCompareButtons() {
  if (!el.compareButtonsWrap) return;
  const buttons = el.compareButtonsWrap.querySelectorAll('button');
  buttons.forEach((btn) => {
    btn.classList.toggle('active', state.selectedCountries.includes(btn.dataset.country));
  });
}

function renderComparison() {
  if (!el.compareBody || !el.compareWrapper || !el.compareHint) return;

  if (state.selectedCountries.length !== 2) {
    el.compareWrapper.hidden = true;
    el.compareHint.hidden = false;
    el.compareBody.innerHTML = '';
    return;
  }

  const [leftName, rightName] = state.selectedCountries;
  const left = state.totals.find((row) => row.country === leftName);
  const right = state.totals.find((row) => row.country === rightName);

  el.compareLeft.textContent = leftName;
  el.compareRight.textContent = rightName;
  el.compareBody.innerHTML = '';

  const rows = [
    {
      label: 'Gesamtemissionen (Mio. t)',
      left: left.total,
      right: right.total,
      digits: 1
    },
    {
      label: 'Durchschnitt pro Unternehmen',
      left: left.total / countCompanies(leftName),
      right: right.total / countCompanies(rightName),
      digits: 1
    }
  ];

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = row.label;

    const tdLeft = document.createElement('td');
    tdLeft.textContent = formatNumber(row.left, row.digits);

    const tdRight = document.createElement('td');
    tdRight.textContent = formatNumber(row.right, row.digits);

    const tdDiff = document.createElement('td');
    tdDiff.className = 'text-end';
    tdDiff.textContent = formatDiff(row.left - row.right, row.digits);

    tr.append(th, tdLeft, tdRight, tdDiff);
    el.compareBody.appendChild(tr);
  });

  el.compareWrapper.hidden = false;
  el.compareHint.hidden = true;
}

function countCompanies(country) {
  return state.rows.filter((row) => row.country === country).length;
}

function formatNumber(value, digits = 1) {
  const number = Number(value);
  return number.toLocaleString('de-DE', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function formatDiff(value, digits = 1) {
  const prefix = value >= 0 ? '+' : '-';
  return `${prefix}${formatNumber(Math.abs(value), digits)}`;
}