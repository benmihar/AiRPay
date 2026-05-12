const {
  catalog,
  formatMoney,
  createBankRequest,
  getTransactions,
  getBankSession,
  isBankSessionActive,
} = window.EduPayData;

const initialState = () => ({
  screen: "welcome",
  category: null,
  provider: null,
  serviceAccount: "",
  amount: 0,
  fee: 0,
  total: 0,
  pendingTransactionId: "",
});

let state = initialState();
let sessionSeconds = 120;
let sessionInterval = null;
let pendingInterval = null;

const elements = {
  screenPanels: [...document.querySelectorAll("[data-screen]")],
  steps: [...document.querySelectorAll("[data-step-indicator]")],
  categoryGrid: document.getElementById("categoryGrid"),
  providerList: document.getElementById("providerList"),
  providerHint: document.getElementById("providerHint"),
  detailsHint: document.getElementById("detailsHint"),
  detailsLabel: document.getElementById("detailsLabel"),
  detailsForm: document.getElementById("detailsForm"),
  accountInput: document.getElementById("accountInput"),
  detailsError: document.getElementById("detailsError"),
  clearAccount: document.getElementById("clearAccount"),
  amountInput: document.getElementById("amountInput"),
  amountForm: document.getElementById("amountForm"),
  amountError: document.getElementById("amountError"),
  summaryPayment: document.getElementById("summaryPayment"),
  summaryFee: document.getElementById("summaryFee"),
  summaryTotal: document.getElementById("summaryTotal"),
  confirmCard: document.getElementById("confirmCard"),
  paymentError: document.getElementById("paymentError"),
  completePayment: document.getElementById("completePayment"),
  receiptCard: document.getElementById("receiptCard"),
  awaitingCard: document.getElementById("awaitingCard"),
  declinedCard: document.getElementById("declinedCard"),
  terminalAccessBadge: document.getElementById("terminalAccessBadge"),
  checkAccessButton: document.getElementById("checkAccessButton"),
  refreshStatusButton: document.getElementById("refreshStatusButton"),
  resetButton: document.getElementById("newPaymentButton"),
  cancelPayment: document.getElementById("cancelPayment"),
  retryPaymentButton: document.getElementById("retryPaymentButton"),
  backFromError: document.getElementById("backFromError"),
};

function renderAccessState() {
  const activeSession = isBankSessionActive() ? getBankSession() : null;

  if (activeSession) {
    elements.terminalAccessBadge.textContent = `Доступ открыт: ${activeSession.fullName}`;
    elements.terminalAccessBadge.classList.add("authorized");
  } else {
    elements.terminalAccessBadge.textContent = "Нет активной банковской авторизации";
    elements.terminalAccessBadge.classList.remove("authorized");
  }
}

function goTo(screen) {
  const hasAccess = isBankSessionActive();
  const canOpen = {
    welcome: true,
    access: true,
    category: true,
    provider: Boolean(state.category),
    details: Boolean(state.provider),
    amount: Boolean(state.provider),
    confirm: Boolean(state.provider && state.total > 0),
    awaiting: Boolean(state.pendingTransactionId),
    receipt: true,
    declined: true,
    error: true,
  };
  let safeScreen = canOpen[screen] ? screen : "welcome";

  if (!hasAccess && !["access", "awaiting", "receipt", "declined", "error"].includes(safeScreen)) {
    safeScreen = "access";
  }
  state.screen = safeScreen;

  elements.screenPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.screen === safeScreen);
  });

  const stepOrder = ["welcome", "category", "details", "amount", "confirm", "receipt"];
  const stepMap = {
    welcome: 0,
    category: 1,
    provider: 1,
    details: 2,
    amount: 3,
    confirm: 4,
    awaiting: 4,
    receipt: 5,
    declined: 5,
    error: 5,
  };
  const currentStep = stepMap[safeScreen] ?? 0;

  elements.steps.forEach((step, index) => {
    step.classList.toggle("active", index <= currentStep && index < stepOrder.length);
  });
}

function renderCategories() {
  elements.categoryGrid.innerHTML = catalog
    .map(
      (category) => `
        <button class="category-card" type="button" data-category="${category.id}">
          <strong>${category.name}</strong>
          <small>${category.description}</small>
        </button>
      `
    )
    .join("");
}

function renderProviders() {
  if (!state.category) {
    elements.providerList.innerHTML = "";
    return;
  }

  elements.providerHint.textContent = `Категория: ${state.category.name}.`;
  elements.providerList.innerHTML = state.category.providers
    .map(
      (provider) => `
        <button class="provider-card" type="button" data-provider="${provider.id}">
          <strong>${provider.name}</strong>
          <small>${provider.maskLabel}: ${provider.placeholder}</small>
          <small>Комиссия ${provider.feePercent}% • ${formatMoney(provider.minAmount)} - ${formatMoney(provider.maxAmount)}</small>
        </button>
      `
    )
    .join("");
}

function renderAmountSummary() {
  elements.summaryPayment.textContent = formatMoney(state.amount);
  elements.summaryFee.textContent = formatMoney(state.fee);
  elements.summaryTotal.textContent = formatMoney(state.total);
}

function renderConfirm() {
  if (!state.provider) {
    return;
  }

  elements.confirmCard.innerHTML = `
    <h4>Параметры платежа</h4>
    <div class="receipt-row"><span>Категория</span><strong>${state.category.name}</strong></div>
    <div class="receipt-row"><span>Поставщик</span><strong>${state.provider.name}</strong></div>
    <div class="receipt-row"><span>${state.provider.maskLabel}</span><strong>${state.serviceAccount}</strong></div>
    <div class="receipt-row"><span>Сумма</span><strong>${formatMoney(state.amount)}</strong></div>
    <div class="receipt-row"><span>Комиссия</span><strong>${formatMoney(state.fee)}</strong></div>
    <div class="receipt-row total"><span>Итого</span><strong>${formatMoney(state.total)}</strong></div>
  `;

  elements.completePayment.textContent = "Отправить в банк";
}

function renderReceipt(transaction) {
  elements.receiptCard.innerHTML = `
    <div class="receipt-meta">Подтверждено через банк</div>
    <h4>Чек № ${transaction.receipt.receiptNumber}</h4>
    <div class="receipt-row"><span>Дата и время</span><strong>${transaction.receipt.timestamp}</strong></div>
    <div class="receipt-row"><span>Категория</span><strong>${transaction.category}</strong></div>
    <div class="receipt-row"><span>Поставщик</span><strong>${transaction.provider}</strong></div>
    <div class="receipt-row"><span>Реквизит</span><strong>${transaction.serviceAccount}</strong></div>
    <div class="receipt-row"><span>Способ оплаты</span><strong>${transaction.receipt.methodLabel}</strong></div>
    <div class="receipt-row"><span>Сумма</span><strong>${formatMoney(transaction.amount)}</strong></div>
    <div class="receipt-row"><span>Комиссия</span><strong>${formatMoney(transaction.fee)}</strong></div>
    <div class="receipt-row"><span>${transaction.receipt.methodValueLabel}</span><strong>${transaction.receipt.methodValue}</strong></div>
    <div class="receipt-row total"><span>${transaction.receipt.extraLabel}</span><strong>${transaction.receipt.extraValue}</strong></div>
    <div class="receipt-row total"><span>Статус</span><strong>Оплачено</strong></div>
  `;
}

function renderAwaiting(transaction) {
  elements.awaitingCard.innerHTML = `
    <div class="minimal-summary-row"><span>Запрос</span><strong class="minimal-code">${transaction.requestNumber}</strong></div>
    <div class="minimal-summary-row"><span>Поставщик</span><strong>${transaction.provider}</strong></div>
    <div class="minimal-summary-row"><span>Итого</span><strong>${formatMoney(transaction.total)}</strong></div>
    <div class="minimal-summary-row"><span>Статус</span><strong>Ожидает подтверждения</strong></div>
    <p class="minimal-note">После подтверждения в банковском приложении терминал автоматически покажет чек.</p>
  `;
}

function renderDeclined(transaction) {
  const reason = transaction.bankAction?.reason || "Операция отклонена в банковском приложении.";
  elements.declinedCard.innerHTML = `
    <div class="minimal-summary-row"><span>Запрос</span><strong>${transaction.requestNumber}</strong></div>
    <div class="minimal-summary-row"><span>Поставщик</span><strong>${transaction.provider}</strong></div>
    <div class="minimal-summary-row"><span>Итого</span><strong>${formatMoney(transaction.total)}</strong></div>
    <div class="minimal-summary-row"><span>Причина</span><strong>${reason}</strong></div>
  `;
}

function updateAmount(amount) {
  state.amount = amount;
  state.fee = Math.round((amount * state.provider.feePercent) / 100);
  state.total = state.amount + state.fee;
  renderAmountSummary();
}

function normalizePhoneInput(value) {
  const startsWithPlus = value.trim().startsWith("+");
  let digits = value.replace(/\D/g, "");

  if (!digits) {
    return startsWithPlus ? "+7" : "";
  }

  if (digits.startsWith("8")) {
    digits = `7${digits.slice(1)}`;
  } else if (digits.startsWith("9")) {
    digits = `7${digits}`;
  } else if (!digits.startsWith("7")) {
    digits = `7${digits}`;
  }

  return `+${digits.slice(0, 11)}`;
}

function normalizeWalletInput(value) {
  const cleanValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const digits = cleanValue.replace(/^AW/, "").replace(/\D/g, "").slice(0, 6);
  return digits ? `AW-${digits}` : cleanValue.startsWith("AW") ? "AW-" : "";
}

function normalizeAccountInput(value, provider = state.provider) {
  if (!provider) {
    return value.trim();
  }

  if (provider.inputType === "phone") {
    return normalizePhoneInput(value);
  }

  if (provider.inputType === "wallet") {
    return normalizeWalletInput(value);
  }

  return value.trim();
}

function isRegisteredAccount(provider, value) {
  if (!provider.validAccounts?.length) {
    return true;
  }

  return provider.validAccounts.includes(value);
}

function stopPendingWatch() {
  if (pendingInterval) {
    clearInterval(pendingInterval);
    pendingInterval = null;
  }
}

function syncPendingTransaction() {
  if (!state.pendingTransactionId) {
    return;
  }

  const transaction = getTransactions().find((item) => item.id === state.pendingTransactionId);

  if (!transaction) {
    stopPendingWatch();
    return;
  }

  if (transaction.status === "paid") {
    stopPendingWatch();
    renderReceipt(transaction);
    goTo("receipt");
    state.pendingTransactionId = "";
    return;
  }

  if (transaction.status === "declined") {
    stopPendingWatch();
    renderDeclined(transaction);
    goTo("declined");
    state.pendingTransactionId = "";
    return;
  }

  renderAwaiting(transaction);
}

function startPendingWatch() {
  stopPendingWatch();
  pendingInterval = setInterval(syncPendingTransaction, 1500);
}

function resetSession() {
  stopPendingWatch();
  state = initialState();
  elements.accountInput.value = "";
  elements.amountInput.value = "";
  elements.detailsError.textContent = "";
  elements.amountError.textContent = "";
  elements.paymentError.textContent = "";
  renderAmountSummary();
  renderConfirm();
  renderAccessState();
  goTo(isBankSessionActive() ? "welcome" : "access");
  resetSessionTimer();
}

function resetSessionTimer() {
  sessionSeconds = 120;

  if (sessionInterval) {
    clearInterval(sessionInterval);
  }

  sessionInterval = setInterval(() => {
    sessionSeconds -= 1;

    if (sessionSeconds <= 0) {
      resetSession();
    }
  }, 1000);
}

function pickCategory(categoryId) {
  state.category = catalog.find((item) => item.id === categoryId) || null;
  state.provider = null;
  state.serviceAccount = "";
  state.amount = 0;
  state.fee = 0;
  state.total = 0;
  elements.accountInput.value = "";
  elements.amountInput.value = "";
  renderProviders();
  renderAmountSummary();
  goTo("provider");
}

function pickProvider(providerId) {
  state.provider = state.category.providers.find((item) => item.id === providerId) || null;
  state.serviceAccount = "";
  elements.accountInput.value = "";
  elements.detailsError.textContent = "";
  elements.detailsLabel.textContent = state.provider.maskLabel;
  elements.detailsHint.textContent = `${state.provider.name}. ${state.provider.formatHint} ${state.provider.exampleHint}`;
  elements.accountInput.placeholder = state.provider.placeholder;
  goTo("details");
}

document.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  const categoryButton = event.target.closest("[data-category]");
  const providerButton = event.target.closest("[data-provider]");
  const navButton = event.target.closest("[data-nav]");

  if (actionButton) {
    if (actionButton.dataset.action === "home") {
      resetSession();
      return;
    }

    if (actionButton.dataset.action === "start-payment") {
      goTo(isBankSessionActive() ? "category" : "access");
    }

    if (actionButton.dataset.action === "format-error") {
      goTo("error");
    }
  }

  if (categoryButton) {
    pickCategory(categoryButton.dataset.category);
  }

  if (providerButton) {
    pickProvider(providerButton.dataset.provider);
  }

  if (navButton) {
    const targetScreen = navButton.dataset.nav;

    if (targetScreen === "welcome") {
      resetSession();
      return;
    }

    if (["category", "provider", "details", "amount"].includes(targetScreen)) {
      goTo(targetScreen);
    }
  }
});

elements.detailsForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const pattern = new RegExp(state.provider.pattern);
  state.serviceAccount = normalizeAccountInput(elements.accountInput.value);
  elements.accountInput.value = state.serviceAccount;

  if (!pattern.test(state.serviceAccount)) {
    elements.detailsError.textContent = state.provider.formatHint || "Проверьте формат реквизита и попробуйте еще раз.";
    return;
  }

  if (!isRegisteredAccount(state.provider, state.serviceAccount)) {
    elements.detailsError.textContent = "Реквизит не найден в базе поставщика.";
    return;
  }

  elements.detailsError.textContent = "";
  goTo("amount");
});

elements.amountForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const amount = Number(elements.amountInput.value);

  if (!Number.isFinite(amount) || amount < state.provider.minAmount || amount > state.provider.maxAmount) {
    elements.amountError.textContent = `Введите сумму от ${formatMoney(state.provider.minAmount)} до ${formatMoney(state.provider.maxAmount)}.`;
    return;
  }

  elements.amountError.textContent = "";
  updateAmount(amount);
  renderConfirm();
  goTo("confirm");
});

elements.amountInput.addEventListener("input", () => {
  const amount = Number(elements.amountInput.value);

  if (Number.isFinite(amount) && amount > 0 && state.provider) {
    updateAmount(amount);
  } else {
    state.amount = 0;
    state.fee = 0;
    state.total = 0;
    renderAmountSummary();
  }
});

elements.accountInput.addEventListener("input", () => {
  if (!state.provider || !["phone", "wallet"].includes(state.provider.inputType)) {
    return;
  }

  const cursorWasAtEnd = elements.accountInput.selectionStart === elements.accountInput.value.length;
  const normalizedValue = normalizeAccountInput(elements.accountInput.value);
  elements.accountInput.value = normalizedValue;
  elements.detailsError.textContent = "";

  if (cursorWasAtEnd) {
    elements.accountInput.setSelectionRange(normalizedValue.length, normalizedValue.length);
  }
});

elements.clearAccount.addEventListener("click", () => {
  state.serviceAccount = "";
  elements.accountInput.value = "";
  elements.detailsError.textContent = "";
});

elements.completePayment.addEventListener("click", () => {
  const transaction = createBankRequest({
    category: state.category.name,
    provider: state.provider.name,
    serviceAccount: state.serviceAccount,
    amount: state.amount,
    fee: state.fee,
    total: state.total,
  });
  state.pendingTransactionId = transaction.id;
  renderAwaiting(transaction);
  goTo("awaiting");
  startPendingWatch();
});

elements.refreshStatusButton.addEventListener("click", syncPendingTransaction);
elements.checkAccessButton.addEventListener("click", () => {
  renderAccessState();
  goTo(isBankSessionActive() ? "welcome" : "access");
});
elements.resetButton.addEventListener("click", resetSession);
elements.cancelPayment.addEventListener("click", resetSession);
elements.retryPaymentButton.addEventListener("click", resetSession);
elements.backFromError.addEventListener("click", resetSession);

window.addEventListener("storage", () => {
  renderAccessState();

  if (state.screen === "awaiting") {
    syncPendingTransaction();
    return;
  }

  if (!isBankSessionActive()) {
    goTo("access");
  }
});

renderCategories();
renderProviders();
renderAmountSummary();
renderAccessState();
resetSession();
