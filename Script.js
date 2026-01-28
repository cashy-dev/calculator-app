const screen = document.getElementById("screen");
const historyLine = document.getElementById("historyLine");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");

let current = "0";
let operator = null;
let previous = null;
let justEvaluated = false;
let memory = 0;

const MAX_LEN = 18;

function formatNumber(str) {
  // avoid scientific formatting until really needed
  if (str === "Error") return str;
  if (!str.includes(".") && str.length <= MAX_LEN) return str;

  const num = Number(str);
  if (!Number.isFinite(num)) return "Error";

  // If too long, use precision
  const abs = Math.abs(num);
  const useExp = (abs !== 0 && (abs >= 1e12 || abs < 1e-6));
  const out = useExp ? num.toExponential(8) : num.toPrecision(12);
  return out.replace(/(?:\.0+|(\.\d+?)0+)$/, "$1");
}

function updateDisplay() {
  screen.textContent = formatNumber(current);
  const h = previous !== null && operator ? `${previous} ${operator}` : "";
  historyLine.textContent = h;
}

function resetAll() {
  current = "0";
  operator = null;
  previous = null;
  justEvaluated = false;
  updateDisplay();
}

function inputDigit(d) {
  if (justEvaluated) {
    current = d;
    justEvaluated = false;
    updateDisplay();
    return;
  }
  if (current === "0") current = d;
  else if (current.length < 24) current += d;
  updateDisplay();
}

function inputDot() {
  if (justEvaluated) {
    current = "0.";
    justEvaluated = false;
    updateDisplay();
    return;
  }
  if (!current.includes(".")) current += ".";
  updateDisplay();
}

function backspace() {
  if (justEvaluated) { current = "0"; justEvaluated = false; updateDisplay(); return; }
  if (current.length <= 1 || (current.length === 2 && current.startsWith("-"))) current = "0";
  else current = current.slice(0, -1);
  updateDisplay();
}

function toggleSign() {
  if (current === "0") return;
  current = current.startsWith("-") ? current.slice(1) : "-" + current;
  updateDisplay();
}

function percent() {
  const num = Number(current);
  if (!Number.isFinite(num)) return;
  // If there's a previous + operator, treat % as percent of previous (like physical calculators)
  if (previous !== null && operator && ["+", "−", "+", "-"].includes(operator)) {
    const base = Number(previous);
    if (!Number.isFinite(base)) return;
    current = String((base * num) / 100);
  } else {
    current = String(num / 100);
  }
  updateDisplay();
}

function setOperator(op) {
  // Normalize symbols
  if (op === "÷") op = "÷";
  if (op === "×") op = "×";
  if (op === "−") op = "-";

  if (operator && previous !== null && !justEvaluated) {
    evaluate(); // chain operations
  }
  previous = current;
  operator = op === "-" ? "−" : op; // show pretty minus in history
  justEvaluated = false;
  current = "0";
  updateDisplay();
}

function compute(a, b, op) {
  if (op === "+") return a + b;
  if (op === "−" || op === "-") return a - b;
  if (op === "×") return a * b;
  if (op === "÷") return b === 0 ? NaN : a / b;
  return b;
}

function evaluate() {
  if (operator === null || previous === null) return;

  const a = Number(previous);
  const b = Number(current);
  const op = operator;

  const result = compute(a, b, op);
  if (!Number.isFinite(result)) {
    current = "Error";
  } else {
    current = String(result);
    addToHistory(`${formatNumber(String(a))} ${op} ${formatNumber(String(b))} = ${formatNumber(String(result))}`, String(result));
  }

  operator = null;
  previous = null;
  justEvaluated = true;
  updateDisplay();
}

function addToHistory(text, value) {
  const li = document.createElement("li");
  li.textContent = text;
  li.title = "Click to reuse result";
  li.dataset.value = value;
  li.addEventListener("click", () => {
    current = li.dataset.value;
    operator = null;
    previous = null;
    justEvaluated = false;
    updateDisplay();
  });
  historyList.prepend(li);
}

function clearHistory() {
  historyList.innerHTML = "";
}

// Memory functions
function memClear() { memory = 0; }
function memRecall() { current = String(memory); justEvaluated = false; updateDisplay(); }
function memPlus() {
  const num = Number(current);
  if (Number.isFinite(num)) memory += num;
}
function memMinus() {
  const num = Number(current);
  if (Number.isFinite(num)) memory -= num;
}

document.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;

  const digit = btn.dataset.digit;
  const op = btn.dataset.op;
  const action = btn.dataset.action;

  if (digit !== undefined) inputDigit(digit);
  else if (op) setOperator(op);
  else if (action) {
    if (action === "dot") inputDot();
    if (action === "equals") evaluate();
    if (action === "clear") resetAll();
    if (action === "backspace") backspace();
    if (action === "sign") toggleSign();
    if (action === "percent") percent();

    if (action === "mc") { memClear(); }
    if (action === "mr") { memRecall(); }
    if (action === "mplus") { memPlus(); updateDisplay(); }
    if (action === "mminus") { memMinus(); updateDisplay(); }
  }
});

clearHistoryBtn.addEventListener("click", clearHistory);

// Keyboard support
document.addEventListener("keydown", (e) => {
  const k = e.key;

  if (k >= "0" && k <= "9") return inputDigit(k);
  if (k === ".") return inputDot();
  if (k === "Backspace") return backspace();
  if (k === "Escape") return resetAll();

  if (k === "Enter" || k === "=") { e.preventDefault(); return evaluate(); }

  if (k === "+") return setOperator("+");
  if (k === "-") return setOperator("−");
  if (k === "*" ) return setOperator("×");
  if (k === "/" ) return setOperator("÷");
  if (k === "%") return percent();
});

updateDisplay();
