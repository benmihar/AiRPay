const {
  authenticateBankUser,
  getBankUserById,
  getBankSession,
  isBankSessionActive,
  clearBankSession,
  getPendingTransactions,
  getTransactions,
  approveBankRequest,
  declineBankRequest,
  createRefundRequest,
  formatMoney,
  maskBankAccountNumber,
  getStatusLabel,
  getStatusClass,
  getRefundRequestLabel,
  getRefundRequestClass,
} = window.EduPayData;

const state = {
  userId: "",
  selectedTransactionId: "",
  selectedRefundTransactionId: "",
  selectedAccountId: "",
};

const elements = {
  bankLoginCard: document.getElementById("bankLoginCard"),
  bankDashboard: document.getElementById("bankDashboard"),
  bankLoginForm: document.getElementById("bankLoginForm"),
  bankLoginInput: document.getElementById("bankLoginInput"),
  bankPasswordInput: document.getElementById("bankPasswordInput"),
  bankAuthError: document.getElementById("bankAuthError"),
  bankLogoutButton: document.getElementById("bankLogoutButton"),
  bankUserHero: document.getElementById("bankUserHero"),
  accountList: document.getElementById("accountList"),
  bankHistoryList: document.getElementById("bankHistoryList"),
  pendingCountBadge: document.getElementById("pendingCountBadge"),
  pendingList: document.getElementById("pendingList"),
  pendingDetails: document.getElementById("pendingDetails"),
  refundRequestCountBadge: document.getElementById("refundRequestCountBadge"),
  refundTransactionList: document.getElementById("refundTransactionList"),
  refundRequestDetails: document.getElementById("refundRequestDetails"),
};

function getCurrentUser() {
  return getBankUserById(state.userId);
}

function formatEventTime(transaction) {
  const raw = transaction.receipt?.timestamp || transaction.bankAction?.timestamp || transaction.createdAt;

  if (raw && raw.includes("T")) {
    return new Date(raw).toLocaleString("ru-RU");
  }

  return raw || "";
}

function renderUserHero(user) {
  elements.bankUserHero.innerHTML = `
    <div>
      <p class="screen-kicker">Аккаунт</p>
      <h4>${user.fullName}</h4>
      <p>${user.phone}</p>
    </div>
    <div class="bank-user-stats">
      <div class="bank-stat">
        <span>Счетов</span>
        <strong>${user.accounts.length}</strong>
      </div>
      <div class="bank-stat">
        <span>Общий баланс</span>
        <strong>${formatMoney(user.accounts.reduce((sum, account) => sum + account.balance, 0))}</strong>
      </div>
    </div>
  `;
}

function renderAccounts(user) {
  elements.accountList.innerHTML = user.accounts
    .map(
      (account) => `
        <div class="account-card ${account.id === state.selectedAccountId ? "active" : ""}">
          <strong>${account.name}</strong>
          <small>${maskBankAccountNumber(account.number)}</small>
          <div class="account-balance">${formatMoney(account.balance)}</div>
        </div>
      `
    )
    .join("");
}

function renderHistory(user) {
  const history = getTransactions()
    .filter(
      (transaction) =>
        transaction.source?.userId === user.id || transaction.bankAction?.userId === user.id || transaction.refund?.userId === user.id
    )
    .slice(0, 6);

  if (!history.length) {
    elements.bankHistoryList.innerHTML = `
      <div class="empty-state">
        <strong>История пуста</strong>
        <p class="admin-note">Подтвержденные или отклоненные вами операции появятся здесь.</p>
      </div>
    `;
    return;
  }

  elements.bankHistoryList.innerHTML = history
    .map(
      (transaction) => `
        <div class="history-item">
          <div>
            <strong>${transaction.provider}</strong>
            <small>${formatEventTime(transaction)}</small>
          </div>
          <div class="history-meta">
            <span class="tag ${getStatusClass(transaction.status)}">${getStatusLabel(transaction.status)}</span>
            <strong>${formatMoney(transaction.total)}</strong>
          </div>
        </div>
      `
    )
    .join("");
}

function getUserRefundableTransactions(user) {
  return getTransactions()
    .filter((transaction) => transaction.source?.type === "bank_account" && transaction.source.userId === user.id)
    .filter((transaction) => ["paid", "refunded"].includes(transaction.status) || Boolean(transaction.refundRequest))
    .slice(0, 8);
}

function renderRefundTransactionList(user) {
  const transactions = getUserRefundableTransactions(user);
  const pendingCount = transactions.filter((transaction) => transaction.refundRequest?.status === "pending").length;
  elements.refundRequestCountBadge.textContent = `${pendingCount} на рассмотрении`;

  if (!transactions.length) {
    elements.refundTransactionList.innerHTML = `
      <div class="empty-state">
        <strong>Нет операций для обращения</strong>
        <p class="admin-note">Здесь появятся операции, оплаченные через банковский сервис.</p>
      </div>
    `;
    elements.refundRequestDetails.innerHTML = "";
    return;
  }

  if (!transactions.some((transaction) => transaction.id === state.selectedRefundTransactionId)) {
    state.selectedRefundTransactionId = transactions[0].id;
  }

  elements.refundTransactionList.innerHTML = transactions
    .map(
      (transaction) => `
        <button class="pending-item ${transaction.id === state.selectedRefundTransactionId ? "active" : ""}" type="button" data-refund-transaction-id="${transaction.id}">
          <div class="transaction-item-top">
            <div>
              <strong>${transaction.receipt?.receiptNumber || transaction.requestNumber}</strong>
              <small>${transaction.provider}</small>
            </div>
            <strong>${formatMoney(transaction.total)}</strong>
          </div>
          <div class="transaction-tags">
            <span class="tag ${getStatusClass(transaction.status)}">${getStatusLabel(transaction.status)}</span>
            <span class="tag ${getRefundRequestClass(transaction.refundRequest?.status)}">${getRefundRequestLabel(transaction.refundRequest?.status)}</span>
          </div>
        </button>
      `
    )
    .join("");
}

function renderRefundRequestDetails(user) {
  const transaction = getUserRefundableTransactions(user).find((item) => item.id === state.selectedRefundTransactionId);

  if (!transaction) {
    elements.refundRequestDetails.innerHTML = "";
    return;
  }

  const request = transaction.refundRequest;

  if (request) {
    elements.refundRequestDetails.innerHTML = `
      <div class="pending-detail-card">
        <h4>Статус обращения</h4>
        <div class="crypto-line"><span>Операция</span><code>${transaction.receipt?.receiptNumber || transaction.requestNumber}</code></div>
        <div class="crypto-line"><span>Сумма</span><code>${formatMoney(transaction.total)}</code></div>
        <div class="crypto-line"><span>Статус</span><code>${getRefundRequestLabel(request.status)}</code></div>
        <div class="crypto-line"><span>Создано</span><code>${request.createdAtLabel}</code></div>
        <div class="crypto-line"><span>Ситуация</span><code>${request.reason}</code></div>
        ${
          request.decisionLabel
            ? `<div class="crypto-line"><span>Решение</span><code>${request.decisionLabel}</code></div>
               <div class="crypto-line"><span>Комментарий</span><code>${request.decisionNote || "-"}</code></div>`
            : ""
        }
      </div>
    `;
    return;
  }

  if (transaction.status !== "paid") {
    elements.refundRequestDetails.innerHTML = `
      <div class="pending-detail-card">
        <h4>Возврат недоступен</h4>
        <p class="admin-note">По этой операции уже выполнен возврат.</p>
      </div>
    `;
    return;
  }

  elements.refundRequestDetails.innerHTML = `
    <form class="pending-detail-card" id="refundRequestForm">
      <h4>Запрос на возврат</h4>
      <div class="crypto-line"><span>Операция</span><code>${transaction.receipt?.receiptNumber || transaction.requestNumber}</code></div>
      <div class="crypto-line"><span>Поставщик</span><code>${transaction.provider}</code></div>
      <div class="crypto-line"><span>Сумма</span><code>${formatMoney(transaction.total)}</code></div>
      <label class="field">
        <span>Что произошло</span>
        <textarea id="refundReasonInput" rows="5" placeholder="Опишите ситуацию и почему нужен возврат"></textarea>
      </label>
      <div class="field-row">
        <button class="primary-button" type="submit">Отправить обращение</button>
      </div>
      <p class="form-error" id="refundRequestError"></p>
    </form>
  `;
}

function renderPendingList() {
  const pending = getPendingTransactions();
  elements.pendingCountBadge.textContent = `${pending.length} запросов`;

  if (!pending.length) {
    elements.pendingList.innerHTML = `
      <div class="empty-state">
        <strong>Нет заявок</strong>
        <p class="admin-note">Новые запросы появятся здесь после отправки из терминала.</p>
      </div>
    `;
    elements.pendingDetails.innerHTML = "";
    state.selectedTransactionId = "";
    return;
  }

  if (!pending.some((transaction) => transaction.id === state.selectedTransactionId)) {
    state.selectedTransactionId = pending[0].id;
  }

  elements.pendingList.innerHTML = pending
    .map(
      (transaction) => `
        <button class="pending-item ${transaction.id === state.selectedTransactionId ? "active" : ""}" type="button" data-pending-id="${transaction.id}">
          <div class="transaction-item-top">
            <div>
              <strong>${transaction.requestNumber}</strong>
              <small>${transaction.provider}</small>
            </div>
            <strong>${formatMoney(transaction.total)}</strong>
          </div>
          <small>${transaction.category} • ${transaction.serviceAccountMasked}</small>
        </button>
      `
    )
    .join("");
}

function renderPendingDetails(user) {
  const pending = getPendingTransactions();
  const transaction = pending.find((item) => item.id === state.selectedTransactionId);

  if (!transaction) {
    elements.pendingDetails.innerHTML = "";
    return;
  }

  if (!user.accounts.some((account) => account.id === state.selectedAccountId)) {
    state.selectedAccountId = user.accounts[0]?.id || "";
  }

  elements.pendingDetails.innerHTML = `
    <div class="pending-detail-card">
      <h4>Подтверждение операции</h4>
      <div class="crypto-line"><span>Запрос</span><code>${transaction.requestNumber}</code></div>
      <div class="crypto-line"><span>Поставщик</span><code>${transaction.provider}</code></div>
      <div class="crypto-line"><span>Реквизит</span><code>${transaction.serviceAccountMasked}</code></div>
      <div class="crypto-line"><span>Платеж</span><code>${formatMoney(transaction.amount)}</code></div>
      <div class="crypto-line"><span>Комиссия</span><code>${formatMoney(transaction.fee)}</code></div>
      <div class="crypto-line"><span>Итого</span><code>${formatMoney(transaction.total)}</code></div>
      <label class="field">
        <span>Счет списания</span>
        <select id="approvalAccountSelect">
          ${user.accounts
            .map(
              (account) => `
                <option value="${account.id}" ${account.id === state.selectedAccountId ? "selected" : ""}>
                  ${account.name} • ${maskBankAccountNumber(account.number)} • ${formatMoney(account.balance)}
                </option>
              `
            )
            .join("")}
        </select>
      </label>
      <div class="field-row">
        <button class="primary-button" id="approveRequestButton" type="button">Подтвердить</button>
        <button class="secondary-button" id="declineRequestButton" type="button">Отклонить</button>
      </div>
      <p class="form-error" id="bankDecisionError"></p>
    </div>
  `;
}

function renderBankApp() {
  const session = isBankSessionActive() ? getBankSession() : null;
  const user = session ? getCurrentUser() : null;
  elements.bankLoginCard.classList.toggle("visible", !user);
  elements.bankDashboard.classList.toggle("visible", Boolean(user));

  if (!user) {
    return;
  }

  renderUserHero(user);
  renderAccounts(user);
  renderHistory(user);
  renderPendingList();
  renderPendingDetails(user);
  renderRefundTransactionList(user);
  renderRefundRequestDetails(user);
}

document.addEventListener("click", (event) => {
  const pendingButton = event.target.closest("[data-pending-id]");
  const refundTransactionButton = event.target.closest("[data-refund-transaction-id]");
  const approveButton = event.target.closest("#approveRequestButton");
  const declineButton = event.target.closest("#declineRequestButton");

  if (pendingButton && state.userId) {
    state.selectedTransactionId = pendingButton.dataset.pendingId;
    renderBankApp();
  }

  if (refundTransactionButton && state.userId) {
    state.selectedRefundTransactionId = refundTransactionButton.dataset.refundTransactionId;
    renderBankApp();
  }

  if (approveButton && state.userId) {
    const select = document.getElementById("approvalAccountSelect");
    const error = document.getElementById("bankDecisionError");
    state.selectedAccountId = select?.value || state.selectedAccountId;
    const result = approveBankRequest({
      transactionId: state.selectedTransactionId,
      userId: state.userId,
      accountId: state.selectedAccountId,
    });

    if (!result.ok) {
      if (error) {
        error.textContent = result.message;
      }
      return;
    }

    renderBankApp();
  }

  if (declineButton && state.userId) {
    declineBankRequest({
      transactionId: state.selectedTransactionId,
      userId: state.userId,
      reason: "Отклонено в банковском приложении",
    });
    renderBankApp();
  }
});

document.addEventListener("change", (event) => {
  if (event.target.id === "approvalAccountSelect") {
    state.selectedAccountId = event.target.value;
  }
});

document.addEventListener("submit", (event) => {
  if (event.target.id !== "refundRequestForm") {
    return;
  }

  event.preventDefault();
  const reasonInput = document.getElementById("refundReasonInput");
  const error = document.getElementById("refundRequestError");
  const result = createRefundRequest({
    transactionId: state.selectedRefundTransactionId,
    userId: state.userId,
    reason: reasonInput?.value || "",
  });

  if (!result.ok) {
    if (error) {
      error.textContent = result.message;
    }
    return;
  }

  renderBankApp();
});

elements.bankLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const auth = authenticateBankUser(elements.bankLoginInput.value, elements.bankPasswordInput.value);
  const user = auth?.user || null;

  if (!user) {
    elements.bankAuthError.textContent = "Неверный логин или пароль.";
    return;
  }

  state.userId = user.id;
  state.selectedAccountId = user.accounts[0]?.id || "";
  elements.bankAuthError.textContent = "";
  renderBankApp();
});

elements.bankLogoutButton.addEventListener("click", () => {
  clearBankSession();
  state.userId = "";
  state.selectedTransactionId = "";
  state.selectedRefundTransactionId = "";
  state.selectedAccountId = "";
  elements.bankLoginInput.value = "";
  elements.bankPasswordInput.value = "";
  renderBankApp();
});

window.addEventListener("storage", () => {
  const session = isBankSessionActive() ? getBankSession() : null;

  if (!session) {
    state.userId = "";
    state.selectedTransactionId = "";
    state.selectedRefundTransactionId = "";
    state.selectedAccountId = "";
  }

  renderBankApp();
});

if (isBankSessionActive()) {
  const session = getBankSession();
  state.userId = session?.userId || "";
}

renderBankApp();
