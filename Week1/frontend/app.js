let mode = "BEFORE"; // BEFORE = before tax, AFTER = after tax
const presetTips = [0.15, 0.18, 0.20, 0.22];
let selectedTip = 0.18;

const beforeBtn = document.getElementById("beforeBtn");
const afterBtn = document.getElementById("afterBtn");
const amountInput = document.getElementById("amount");
const taxInput = document.getElementById("tax");
const citySelect = document.getElementById("city");
const taxNote = document.getElementById("taxNote");
const customTipInput = document.getElementById("customTip");
const errorBox = document.getElementById("error");
const tipGrid = document.getElementById("tipGrid");
const subtotalEl = document.getElementById("subtotal");
const taxAmountEl = document.getElementById("taxAmount");
const tipAmountEl = document.getElementById("tipAmount");
const grandTotalEl = document.getElementById("grandTotal");
const themeToggle = document.getElementById("themeToggle");

beforeBtn.onclick = () => setMode("BEFORE");
afterBtn.onclick = () => setMode("AFTER");

function setMode(m){
  mode = m;
  beforeBtn.classList.toggle("active", m === "BEFORE");
  afterBtn.classList.toggle("active", m === "AFTER");
  beforeBtn.setAttribute("aria-pressed", String(m === "BEFORE"));
  afterBtn.setAttribute("aria-pressed", String(m === "AFTER"));
  debouncedCalc();
}

function money(n){
  return "$" + n.toFixed(2);
}

function parseNumber(value){
  const cleaned = String(value).replace(/,/g, "").trim();
  return cleaned === "" ? NaN : parseFloat(cleaned);
}

function setError(msg){
  if (!msg){
    errorBox.style.display = "none";
    errorBox.textContent = "";
    return;
  }
  errorBox.textContent = msg;
  errorBox.style.display = "block";
}

function updateTaxFromCity(){
  const selected = citySelect.options[citySelect.selectedIndex];
  const taxValue = selected.getAttribute("data-tax");
  if (taxValue){
    taxInput.value = taxValue;
    taxInput.disabled = true;
    taxNote.textContent = `${selected.textContent} tax rate: ${taxValue}%`;
  } else {
    taxInput.disabled = false;
    taxNote.textContent = "Enter your local tax rate";
  }
}

function buildTips(){
  const tips = [...presetTips];
  const customRaw = parseNumber(customTipInput.value);
  if (!isNaN(customRaw) && customRaw > 0){
    const customTip = customRaw / 100;
    if (!tips.some(t => Math.abs(t - customTip) < 0.0001)){
      tips.push(customTip);
    }
  }
  return tips.sort((a, b) => a - b);
}

function ensureSelectedTip(tips){
  if (tips.includes(selectedTip)) return;
  if (tips.includes(0.18)){
    selectedTip = 0.18;
    return;
  }
  selectedTip = tips[0] || 0.18;
}

function renderTips(beforeTax, baseTotal, tips){
  tipGrid.textContent = "";
  tips.forEach(t => {
    const tipAmount = beforeTax == null ? null : beforeTax * t;
    const total = baseTotal == null ? null : baseTotal + tipAmount;

    const card = document.createElement("button");
    card.type = "button";
    card.className = "tip-card" + (t === selectedTip ? " active" : "");
    card.setAttribute("data-tip", String(t));

    const pct = document.createElement("div");
    pct.className = "tip-pct";
    pct.textContent = `${Math.round(t * 100)}%`;

    const amt = document.createElement("div");
    amt.className = "tip-amt";
    amt.textContent = tipAmount == null ? "—" : money(tipAmount);

    const totalEl = document.createElement("div");
    totalEl.className = "tip-total";
    totalEl.textContent = total == null ? "Total —" : `Total ${money(total)}`;

    card.appendChild(pct);
    card.appendChild(amt);
    card.appendChild(totalEl);

    card.addEventListener("click", () => {
      selectedTip = t;
      calculate();
    });

    tipGrid.appendChild(card);
  });
}

function renderSummary(beforeTax, tax, baseTotal){
  if (beforeTax == null){
    subtotalEl.textContent = "—";
    taxAmountEl.textContent = "—";
    tipAmountEl.textContent = "—";
    grandTotalEl.textContent = "—";
    return;
  }
  const tipAmount = beforeTax * selectedTip;
  const total = baseTotal + tipAmount;
  subtotalEl.textContent = money(beforeTax);
  taxAmountEl.textContent = money(tax);
  tipAmountEl.textContent = money(tipAmount);
  grandTotalEl.textContent = money(total);
}

function calculate(){
  const amount = parseNumber(amountInput.value);
  const taxRate = parseNumber(taxInput.value) / 100;

  if (isNaN(amount) || amount <= 0){
    setError("Enter a valid amount greater than 0.");
    const tips = buildTips();
    ensureSelectedTip(tips);
    renderTips(null, null, tips);
    renderSummary(null, null, null);
    return;
  }

  if (isNaN(taxRate) || taxRate < 0){
    setError("Enter a valid tax rate (0 or higher).");
    const tips = buildTips();
    ensureSelectedTip(tips);
    renderTips(null, null, tips);
    renderSummary(null, null, null);
    return;
  }

  setError("");

  const beforeTax =
    mode === "BEFORE"
      ? amount
      : amount / (1 + taxRate);

  const tax = beforeTax * taxRate;
  const baseTotal = beforeTax + tax;

  const tips = buildTips();
  ensureSelectedTip(tips);
  renderTips(beforeTax, baseTotal, tips);
  renderSummary(beforeTax, tax, baseTotal);
}

function debounce(fn, wait){
  let t;
  return () => {
    clearTimeout(t);
    t = setTimeout(fn, wait);
  };
}

const debouncedCalc = debounce(calculate, 180);

amountInput.addEventListener("input", debouncedCalc);
taxInput.addEventListener("input", debouncedCalc);
customTipInput.addEventListener("input", debouncedCalc);
citySelect.addEventListener("change", () => {
  updateTaxFromCity();
  debouncedCalc();
});

function setTheme(theme){
  document.body.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  themeToggle.textContent = theme === "dark" ? "Light mode" : "Dark mode";
}

function initTheme(){
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark"){
    setTheme(saved);
    return;
  }
  const prefersDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  setTheme(prefersDark ? "dark" : "light");
}

themeToggle.addEventListener("click", () => {
  const current = document.body.getAttribute("data-theme") || "light";
  setTheme(current === "dark" ? "light" : "dark");
});

updateTaxFromCity();
setMode("BEFORE");
initTheme();
calculate();
