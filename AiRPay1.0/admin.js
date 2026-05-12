const {
  adminCredentials,
  getTransactions,
  decideRefundRequest,
  formatMoney,
  getStatusLabel,
  getStatusClass,
  getRefundRequestLabel,
  getRefundRequestClass,
} = window.EduPayData;

const state = {
  adminLoggedIn: false,
  selectedTransactionId: "",
};

const elements = {
  adminLoginCard: document.getElementById("adminLoginCard"),
  adminPanel: document.getElementById("adminPanel"),
  adminLoginForm: document.getElementById("adminLoginForm"),
  adminLoginInput: document.getElementById("adminLoginInput"),
  adminPasswordInput: document.getElementById("adminPasswordInput"),
  adminAuthError: document.getElementById("adminAuthError"),
  adminLogoutButton: document.getElementById("adminLogoutButton"),
  adminStatsGrid: document.getElementById("adminStatsGrid"),
  transactionList: document.getElementById("transactionList"),
  transactionCountBadge: document.getElementById("transactionCountBadge"),
  encryptionDetails: document.getElementById("encryptionDetails"),
};

function getSelectedTransaction() {
  const transactions = getTransactions();
  return transactions.find((transaction) => transaction.id === state.selectedTransactionId) || transactions[0] || null;
}

function renderAdminStats() {
  const transactions = getTransactions();
  const paidCount = transactions.filter((transaction) => transaction.status === "paid").length;
  const pendingCount = transactions.filter((transaction) => transaction.status === "pending_bank_confirmation").length;
  const refundedCount = transactions.filter((transaction) => transaction.status === "refunded").length;
  const refundRequestCount = transactions.filter((transaction) => transaction.refundRequest?.status === "pending").length;
  const totalAmount = transactions
    .filter((transaction) => transaction.status === "paid" || transaction.status === "refunded")
    .reduce((sum, transaction) => sum + transaction.total, 0);

  const stats = [
    { label: "Всего операций", value: String(transactions.length) },
    { label: "Оплачено", value: String(paidCount) },
    { label: "Ожидают банк", value: String(pendingCount) },
    { label: "Заявки возврата", value: String(refundRequestCount) },
    { label: "Возвраты", value: String(refundedCount) },
    { label: "Оборот", value: formatMoney(totalAmount) },
  ];

  elements.adminStatsGrid.innerHTML = stats
    .map(
      (stat) => `
        <div class="stat-card">
          <span class="status-label">${stat.label}</span>
          <strong>${stat.value}</strong>
        </div>
      `
    )
    .join("");
}

function renderTransactionList() {
  const transactions = getTransactions();
  elements.transactionCountBadge.textContent = `${transactions.length} записей`;

  if (!transactions.length) {
    elements.transactionList.innerHTML = `
      <div class="empty-state">
        <strong>Журнал пуст</strong>
        <p class="admin-note">Создайте платеж в терминале, чтобы увидеть его здесь.</p>
      </div>
    `;
    return;
  }

  if (!transactions.some((transaction) => transaction.id === state.selectedTransactionId)) {
    state.selectedTransactionId = transactions[0].id;
  }

  elements.transactionList.innerHTML = transactions
    .map(
      (transaction) => `
        <button class="transaction-item ${transaction.id === state.selectedTransactionId ? "active" : ""}" type="button" data-transaction-id="${transaction.id}">
          <div class="transaction-item-top">
            <div>
              <strong>${transaction.receipt?.receiptNumber || transaction.requestNumber}</strong>
              <small>${transaction.provider}</small>
            </div>
            <strong>${formatMoney(transaction.total)}</strong>
          </div>
          <small>${transaction.category} • ${transaction.serviceAccountMasked}</small>
          <div class="transaction-tags">
            <span class="tag">${transaction.methodLabel}</span>
            <span class="tag ${getStatusClass(transaction.status)}">${getStatusLabel(transaction.status)}</span>
            ${
              transaction.refundRequest
                ? `<span class="tag ${getRefundRequestClass(transaction.refundRequest.status)}">${getRefundRequestLabel(transaction.refundRequest.status)}</span>`
                : ""
            }
          </div>
        </button>
      `
    )
    .join("");
}

function renderRefundBlock(transaction) {
  if (transaction.refundRequest?.status === "pending") {
    return `
      <div class="encryption-block">
        <h5>Обращение на возврат</h5>
        <div class="crypto-line"><span>Номер обращения</span><code>${transaction.refundRequest.id}</code></div>
        <div class="crypto-line"><span>Клиент</span><code>${transaction.refundRequest.userName}</code></div>
        <div class="crypto-line"><span>Создано</span><code>${transaction.refundRequest.createdAtLabel}</code></div>
        <div class="crypto-line"><span>Ситуация</span><code>${transaction.refundRequest.reason}</code></div>
        <label class="field">
          <span>Комментарий администратора</span>
          <textarea id="refundDecisionNote" rows="4" placeholder="Комментарий к решению"></textarea>
        </label>
        <div class="field-row">
          <button class="primary-button" id="approveRefundRequestButton" type="button">Одобрить возврат</button>
          <button class="secondary-button" id="declineRefundRequestButton" type="button">Отклонить</button>
        </div>
        <p class="form-error" id="refundDecisionError"></p>
      </div>
    `;
  }

  if (transaction.status === "refunded" && transaction.refund) {
    return `
      <div class="encryption-block">
        <h5>Возврат</h5>
        <div class="crypto-line"><span>Чек возврата</span><code>${transaction.refund.receiptNumber}</code></div>
        <div class="crypto-line"><span>Дата</span><code>${transaction.refund.timestamp}</code></div>
        <div class="crypto-line"><span>Канал</span><code>${transaction.refund.methodLabel}</code></div>
        ${
          transaction.refundRequest
            ? `<div class="crypto-line"><span>Решение</span><code>${getRefundRequestLabel(transaction.refundRequest.status)}</code></div>
               <div class="crypto-line"><span>Комментарий</span><code>${transaction.refundRequest.decisionNote || "-"}</code></div>`
            : ""
        }
        <div class="crypto-line"><span>Refund token</span><code>${transaction.refund.token}</code></div>
        <div class="crypto-line"><span>Refund payload</span><code>${transaction.refund.cipherText}</code></div>
      </div>
    `;
  }

  if (transaction.refundRequest?.status === "declined") {
    return `
      <div class="encryption-block">
        <h5>Обращение на возврат</h5>
        <div class="crypto-line"><span>Статус</span><code>${getRefundRequestLabel(transaction.refundRequest.status)}</code></div>
        <div class="crypto-line"><span>Клиент</span><code>${transaction.refundRequest.userName}</code></div>
        <div class="crypto-line"><span>Ситуация</span><code>${transaction.refundRequest.reason}</code></div>
        <div class="crypto-line"><span>Решение</span><code>${transaction.refundRequest.decisionLabel || "-"}</code></div>
        <div class="crypto-line"><span>Комментарий</span><code>${transaction.refundRequest.decisionNote || "-"}</code></div>
      </div>
    `;
  }

  if (transaction.status === "paid") {
    return `
      <div class="encryption-block">
        <h5>Возврат</h5>
        <p class="admin-note">Возврат выполняется после обращения клиента из банковского приложения.</p>
      </div>
    `;
  }

  return `
    <div class="encryption-block">
      <h5>Возврат</h5>
      <p class="admin-note">Возврат недоступен для операций в статусе "${getStatusLabel(transaction.status)}".</p>
    </div>
  `;
}

function renderTransactionDetails() {
  const transaction = getSelectedTransaction();

  if (!transaction) {
    elements.encryptionDetails.innerHTML = `<p class="status-text">Пока нет операций для просмотра.</p>`;
    return;
  }

  const route = transaction.encryption.route
    .map(
      (step, index) => `
        <div class="timeline-step">
          <div>
            <strong>Этап ${index + 1}</strong>
            <small>${step}</small>
          </div>
          <span class="tag ${getStatusClass(transaction.status)}">${getStatusLabel(transaction.status)}</span>
        </div>
      `
    )
    .join("");

  const keyGenerationSteps = (transaction.encryption.keyGeneration?.steps || [])
    .map(
      (step, index) => `
        <div class="timeline-step">
          <div>
            <strong>Шаг ${index + 1}</strong>
            <small>${step.title}</small>
          </div>
          <code>${step.value}</code>
        </div>
      `
    )
    .join("");

  elements.encryptionDetails.innerHTML = `
    <div class="encryption-block">
      <h5>Операция</h5>
      <div class="crypto-line"><span>Запрос</span><code>${transaction.requestNumber}</code></div>
      <div class="crypto-line"><span>Статус</span><code>${getStatusLabel(transaction.status)}</code></div>
      <div class="crypto-line"><span>Метод</span><code>${transaction.methodLabel}</code></div>
      <div class="crypto-line"><span>Итог</span><code>${formatMoney(transaction.total)}</code></div>
      <div class="crypto-line"><span>Источник списания</span><code>${transaction.source?.accountMasked || transaction.source?.label || "ожидает подтверждения"}</code></div>
      <div class="crypto-line"><span>Чек</span><code>${transaction.receipt?.receiptNumber || "еще не сформирован"}</code></div>
    </div>
    <div class="encryption-block">
      <h5>Защищенный обмен</h5>
      <div class="crypto-line"><span>Сеансовый ключ</span><code>${transaction.encryption.sessionKeyId}</code></div>
      <div class="crypto-line"><span>Ключ клиента</span><code>${transaction.encryption.clientKeyId}</code></div>
      <div class="crypto-line"><span>Ключ банка</span><code>${transaction.encryption.bankKeyId}</code></div>
      <div class="crypto-line"><span>Handshake ID</span><code>${transaction.encryption.handshakeId}</code></div>
      <div class="crypto-line"><span>Подпись</span><code>${transaction.encryption.signature}</code></div>
      <div class="crypto-line"><span>Контроль целостности</span><code>${transaction.encryption.integrity}</code></div>
      <div class="crypto-line"><span>Ciphertext</span><code>${transaction.encryption.cipherText}</code></div>
    </div>
    <div class="encryption-block">
      <h5>Формирование крипто-ключей</h5>
      <div class="crypto-line"><span>Алгоритм</span><code>${transaction.encryption.keyGeneration?.algorithm || "local-key-schedule"}</code></div>
      <div class="crypto-line"><span>Время генерации</span><code>${transaction.encryption.keyGeneration?.generatedAt || "-"}</code></div>
      <div class="crypto-line"><span>Seed material</span><code>${transaction.encryption.keyGeneration?.seedMaterial || "-"}</code></div>
      <div class="crypto-line"><span>Entropy nonce</span><code>${transaction.encryption.keyGeneration?.entropyNonce || "-"}</code></div>
      <div class="crypto-line"><span>Derivation salt</span><code>${transaction.encryption.keyGeneration?.derivationSalt || "-"}</code></div>
      <div class="crypto-line"><span>Fingerprint клиента</span><code>${transaction.encryption.keyGeneration?.clientKeyFingerprint || "-"}</code></div>
      <div class="crypto-line"><span>Fingerprint банка</span><code>${transaction.encryption.keyGeneration?.bankKeyFingerprint || "-"}</code></div>
      <div class="crypto-line"><span>Fingerprint сеанса</span><code>${transaction.encryption.keyGeneration?.sessionKeyFingerprint || "-"}</code></div>
      <div class="timeline">${keyGenerationSteps}</div>
    </div>
    <div class="encryption-block">
      <h5>Маршрут</h5>
      <div class="timeline">${route}</div>
      <p class="admin-note">Панель показывает служебный маршрут обмена, генерацию ключей и контроль целостности операции.</p>
    </div>
    ${renderRefundBlock(transaction)}
  `;
}

function renderAdmin() {
  elements.adminLoginCard.classList.toggle("visible", !state.adminLoggedIn);
  elements.adminPanel.classList.toggle("visible", state.adminLoggedIn);

  if (!state.adminLoggedIn) {
    return;
  }

  renderAdminStats();
  renderTransactionList();
  renderTransactionDetails();
}

document.addEventListener("click", (event) => {
  const transactionButton = event.target.closest("[data-transaction-id]");
  const approveRefundButton = event.target.closest("#approveRefundRequestButton");
  const declineRefundButton = event.target.closest("#declineRefundRequestButton");

  if (transactionButton && state.adminLoggedIn) {
    state.selectedTransactionId = transactionButton.dataset.transactionId;
    renderAdmin();
  }

  if ((approveRefundButton || declineRefundButton) && state.adminLoggedIn) {
    const decisionNote = document.getElementById("refundDecisionNote")?.value || "";
    const error = document.getElementById("refundDecisionError");
    const result = decideRefundRequest({
      transactionId: state.selectedTransactionId,
      decision: approveRefundButton ? "approved" : "declined",
      decisionNote,
      decidedBy: "Администратор AiRPay",
    });

    if (!result.ok) {
      if (error) {
        error.textContent = result.message;
      }
      return;
    }

    renderAdmin();
  }
});

elements.adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const login = elements.adminLoginInput.value.trim();
  const password = elements.adminPasswordInput.value;

  if (login !== adminCredentials.login || password !== adminCredentials.password) {
    elements.adminAuthError.textContent = "Неверный логин или пароль администратора.";
    return;
  }

  state.adminLoggedIn = true;
  elements.adminAuthError.textContent = "";
  renderAdmin();
});

elements.adminLogoutButton.addEventListener("click", () => {
  state.adminLoggedIn = false;
  elements.adminLoginInput.value = "";
  elements.adminPasswordInput.value = "";
  renderAdmin();
});

window.addEventListener("storage", () => {
  if (state.adminLoggedIn) {
    renderAdmin();
  }
});

renderAdmin();
