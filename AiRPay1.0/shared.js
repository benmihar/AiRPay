(function initEduPayData() {
  const STORAGE_KEYS = {
    bankUsers: "edupay-bank-users-v2",
    transactions: "edupay-transactions-v2",
    bankSession: "edupay-bank-session-v1",
  };

  const adminCredentials = {
    login: "admin",
    password: "terminal2026",
  };

  const catalog = window.EduPayPaymentsDB?.catalog || [];

  const bankUserSeed = [
    {
      id: "user-1",
      login: "petrov",
      password: "demo123",
      fullName: "Иван Петров",
      phone: "+7 900 111-22-33",
      accounts: [
        {
          id: "acc-1",
          name: "Основной счет",
          number: "4081781000001245001",
          balance: 26500,
        },
        {
          id: "acc-2",
          name: "Накопительный счет",
          number: "4081781000001245778",
          balance: 7800,
        },
      ],
    },
    {
      id: "user-2",
      login: "smirnova",
      password: "demo123",
      fullName: "Анна Смирнова",
      phone: "+7 900 555-10-10",
      accounts: [
        {
          id: "acc-3",
          name: "Зарплатный счет",
          number: "4081781000002211301",
          balance: 18100,
        },
        {
          id: "acc-4",
          name: "Резервный счет",
          number: "4081781000002211455",
          balance: 12300,
        },
      ],
    },
    {
      id: "user-3",
      login: "student",
      password: "demo123",
      fullName: "Демо Клиент",
      phone: "+7 900 777-55-00",
      accounts: [
        {
          id: "acc-5",
          name: "Основной счет",
          number: "4081781000003155008",
          balance: 5900,
        },
        {
          id: "acc-6",
          name: "Резервный кошелек",
          number: "4081781000003155889",
          balance: 32400,
        },
      ],
    },
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function safeRead(key, fallback) {
    const raw = window.localStorage.getItem(key);

    if (!raw) {
      return clone(fallback);
    }

    try {
      const parsed = JSON.parse(raw);
      return parsed ?? clone(fallback);
    } catch {
      return clone(fallback);
    }
  }

  function safeWrite(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function ensureSeed() {
    if (!window.localStorage.getItem(STORAGE_KEYS.bankUsers)) {
      safeWrite(STORAGE_KEYS.bankUsers, bankUserSeed);
    }

    if (!window.localStorage.getItem(STORAGE_KEYS.transactions)) {
      safeWrite(STORAGE_KEYS.transactions, []);
    }
  }

  function formatMoney(value) {
    return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
  }

  function maskServiceAccount(value) {
    if (!value) {
      return "скрыто";
    }

    const visible = value.slice(-4);
    return `${"•".repeat(Math.max(value.length - 4, 2))}${visible}`;
  }

  function maskBankAccountNumber(number) {
    const digits = String(number).replace(/\s/g, "");

    if (digits.length <= 8) {
      return digits;
    }

    return `${digits.slice(0, 4)} •••• ${digits.slice(-4)}`;
  }

  function generateToken(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  }

  function generateReceiptNumber(prefix) {
    return `${prefix}-${Date.now().toString().slice(-8)}`;
  }

  function fakeHash(value) {
    let hash = 0;

    for (let index = 0; index < value.length; index += 1) {
      hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    }

    return hash.toString(16).padStart(8, "0").toUpperCase();
  }

  function fakeEncrypt(value) {
    return btoa(unescape(encodeURIComponent(value))).slice(0, 120);
  }

  function getStatusLabel(status) {
    const labels = {
      paid: "Оплачено",
      pending_bank_confirmation: "Ожидает подтверждения",
      declined: "Отклонено",
      refunded: "Возвращено",
    };

    return labels[status] || status;
  }

  function getStatusClass(status) {
    const classes = {
      paid: "success",
      pending_bank_confirmation: "pending",
      declined: "danger",
      refunded: "muted",
    };

    return classes[status] || "muted";
  }

  function getRefundRequestLabel(status) {
    const labels = {
      pending: "Ожидает решения",
      approved: "Одобрено",
      declined: "Отклонено",
    };

    return labels[status] || "Нет обращения";
  }

  function getRefundRequestClass(status) {
    const classes = {
      pending: "pending",
      approved: "success",
      declined: "danger",
    };

    return classes[status] || "muted";
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function nowLabel() {
    return new Date().toLocaleString("ru-RU");
  }

  function getBankUsers() {
    ensureSeed();
    return safeRead(STORAGE_KEYS.bankUsers, bankUserSeed);
  }

  function saveBankUsers(users) {
    safeWrite(STORAGE_KEYS.bankUsers, users);
  }

  function getTransactions() {
    ensureSeed();
    return safeRead(STORAGE_KEYS.transactions, []);
  }

  function saveTransactions(transactions) {
    safeWrite(STORAGE_KEYS.transactions, transactions);
  }

  function getBankUserById(userId) {
    return getBankUsers().find((user) => user.id === userId) || null;
  }

  function getBankUserPublic(user) {
    if (!user) {
      return null;
    }

    const publicUser = clone(user);
    delete publicUser.password;
    return publicUser;
  }

  function findBankUser(login, password) {
    const normalizedLogin = login.trim().toLowerCase();
    const user = getBankUsers().find(
      (candidate) => candidate.login.toLowerCase() === normalizedLogin && candidate.password === password
    );

    return getBankUserPublic(user);
  }

  function getBankSession() {
    ensureSeed();
    return safeRead(STORAGE_KEYS.bankSession, null);
  }

  function saveBankSession(session) {
    safeWrite(STORAGE_KEYS.bankSession, session);
  }

  function clearBankSession() {
    window.localStorage.removeItem(STORAGE_KEYS.bankSession);
  }

  function isBankSessionActive() {
    const session = getBankSession();

    if (!session?.userId || !session?.expiresAt) {
      return false;
    }

    return new Date(session.expiresAt).getTime() > Date.now();
  }

  function authenticateBankUser(login, password) {
    const user = findBankUser(login, password);

    if (!user) {
      return null;
    }

    const session = {
      userId: user.id,
      login: user.login,
      fullName: user.fullName,
      sessionToken: generateToken("BANKSESS"),
      authorizedAt: nowLabel(),
      expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    };

    saveBankSession(session);
    return {
      user,
      session: clone(session),
    };
  }

  function getPendingTransactions() {
    return getTransactions().filter((transaction) => transaction.status === "pending_bank_confirmation");
  }

  function buildEncryption(kind, payload) {
    const sessionKeyId = generateToken("SES");
    const clientKeyId = kind === "bank_app" ? generateToken("TERM") : generateToken("CASH");
    const bankKeyId = kind === "bank_app" ? generateToken("BNK") : generateToken("LOC");
    const serialized = JSON.stringify(payload);
    const entropyNonce = generateToken("NONCE");
    const derivationSalt = fakeHash(`${serialized}:${entropyNonce}:salt`);
    const seedMaterial = fakeHash(`${serialized}:${kind}:${Date.now()}`);
    const cipherText = fakeEncrypt(`${serialized}|${sessionKeyId}`);
    const signature = fakeHash(`${cipherText}:${sessionKeyId}:${kind}`);
    const integrity = fakeHash(`${signature}:${serialized}`);
    const clientKeyFingerprint = fakeHash(`${clientKeyId}:${seedMaterial}:${derivationSalt}`);
    const bankKeyFingerprint = fakeHash(`${bankKeyId}:${seedMaterial}:${derivationSalt}`);
    const sessionKeyFingerprint = fakeHash(`${sessionKeyId}:${seedMaterial}:${derivationSalt}`);

    return {
      sessionKeyId,
      clientKeyId,
      bankKeyId,
      handshakeId: fakeHash(`${clientKeyId}:${bankKeyId}:${sessionKeyId}`),
      cipherText,
      signature,
      integrity,
      route:
        kind === "bank_app"
          ? [
              "Платежный терминал",
              "Модуль шифрования запроса",
              "Очередь банковского приложения",
              "Банковый процессинг",
              "Обратное подтверждение терминалу",
            ]
          : [
              "Платежный терминал",
              "Локальный модуль учета",
              "Сервис формирования чека",
            ],
      transport:
        kind === "bank_app"
          ? "Защищенный канал TLS 1.3 + сквозная шифровка заявки"
          : "Локальный контур терминала",
      keyGeneration: {
        generatedAt: nowLabel(),
        entropyNonce,
        derivationSalt,
        seedMaterial,
        algorithm: kind === "bank_app" ? "X25519 + HKDF-SHA256 + AES-256-GCM" : "Local terminal key schedule",
        clientKeyFingerprint,
        bankKeyFingerprint,
        sessionKeyFingerprint,
        steps: [
          {
            title: "Сбор seed-материала",
            value: `payload hash ${seedMaterial}`,
          },
          {
            title: "Добавление entropy nonce",
            value: entropyNonce,
          },
          {
            title: "Деривация соли",
            value: derivationSalt,
          },
          {
            title: "Генерация ключа клиента",
            value: `${clientKeyId} / ${clientKeyFingerprint}`,
          },
          {
            title: "Генерация ключа банка",
            value: `${bankKeyId} / ${bankKeyFingerprint}`,
          },
          {
            title: "Выпуск сеансового ключа",
            value: `${sessionKeyId} / ${sessionKeyFingerprint}`,
          },
        ],
      },
    };
  }

  function buildBaseTransaction(params) {
    return {
      id: generateToken("TX"),
      requestNumber: generateReceiptNumber("REQ"),
      terminalId: "TERM-01",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      category: params.category,
      provider: params.provider,
      serviceAccount: params.serviceAccount,
      serviceAccountMasked: maskServiceAccount(params.serviceAccount),
      amount: params.amount,
      fee: params.fee,
      total: params.total,
      method: params.method,
      methodLabel: "Банковское приложение",
      source: null,
      receipt: null,
      refund: null,
      bankAction: null,
      encryption: buildEncryption(params.method, {
        provider: params.provider,
        category: params.category,
        serviceAccount: maskServiceAccount(params.serviceAccount),
        total: params.total,
        method: params.method,
      }),
    };
  }

  function createBankRequest(params) {
    const transactions = getTransactions();
    const transaction = buildBaseTransaction({ ...params, method: "bank_app" });
    transaction.status = "pending_bank_confirmation";
    transaction.bankAction = {
      type: "created",
      timestamp: nowLabel(),
      note: "Ожидает подтверждения из банковского приложения",
    };
    transactions.unshift(transaction);
    saveTransactions(transactions);
    return clone(transaction);
  }

  function approveBankRequest({ transactionId, userId, accountId }) {
    const bankUsers = getBankUsers();
    const transactions = getTransactions();
    const transaction = transactions.find((item) => item.id === transactionId);

    if (!transaction || transaction.status !== "pending_bank_confirmation") {
      return { ok: false, message: "Операция уже обработана или недоступна." };
    }

    const user = bankUsers.find((candidate) => candidate.id === userId);
    const account = user?.accounts.find((candidate) => candidate.id === accountId);

    if (!user || !account) {
      return { ok: false, message: "Не найден банковский аккаунт для списания." };
    }

    if (account.balance < transaction.total) {
      return { ok: false, message: "Недостаточно средств на выбранном счете." };
    }

    account.balance -= transaction.total;
    transaction.status = "paid";
    transaction.updatedAt = nowIso();
    transaction.source = {
      type: "bank_account",
      userId: user.id,
      userName: user.fullName,
      accountId: account.id,
      accountName: account.name,
      accountMasked: maskBankAccountNumber(account.number),
    };
    transaction.bankAction = {
      type: "approved",
      timestamp: nowLabel(),
      userId: user.id,
      userName: user.fullName,
    };
    transaction.receipt = {
      receiptNumber: generateReceiptNumber("AIR"),
      timestamp: nowLabel(),
      methodLabel: "Банковское приложение",
      methodValueLabel: "Счет списания",
      methodValue: `${account.name} • ${maskBankAccountNumber(account.number)}`,
      extraLabel: "Остаток на счете",
      extraValue: formatMoney(account.balance),
    };
    transaction.encryption.approvalToken = generateToken("APP");
    transaction.encryption.approvalCipher = fakeEncrypt(
      `${transaction.id}:${user.id}:${account.id}:${transaction.total}`
    );
    transaction.encryption.bankSignature = fakeHash(
      `${transaction.encryption.approvalCipher}:${transaction.total}:${user.id}`
    );

    saveBankUsers(bankUsers);
    saveTransactions(transactions);

    return {
      ok: true,
      transaction: clone(transaction),
      user: getBankUserPublic(user),
      account: clone(account),
    };
  }

  function declineBankRequest({ transactionId, userId, reason }) {
    const transactions = getTransactions();
    const user = getBankUserById(userId);
    const transaction = transactions.find((item) => item.id === transactionId);

    if (!transaction || transaction.status !== "pending_bank_confirmation") {
      return { ok: false, message: "Операция уже обработана или недоступна." };
    }

    transaction.status = "declined";
    transaction.updatedAt = nowIso();
    transaction.bankAction = {
      type: "declined",
      timestamp: nowLabel(),
      userId,
      userName: user?.fullName || "Банк",
      reason: reason || "Отклонено в банковском приложении",
    };
    transaction.encryption.declineToken = generateToken("DEC");
    transaction.encryption.declineCipher = fakeEncrypt(
      `${transaction.id}:${userId}:${transaction.total}:declined`
    );
    saveTransactions(transactions);

    return {
      ok: true,
      transaction: clone(transaction),
    };
  }

  function getRefundRequests() {
    return getTransactions().filter((transaction) => Boolean(transaction.refundRequest));
  }

  function createRefundRequest({ transactionId, userId, reason }) {
    const transactions = getTransactions();
    const user = getBankUserById(userId);
    const transaction = transactions.find((item) => item.id === transactionId);
    const normalizedReason = String(reason || "").trim();

    if (!transaction || transaction.status !== "paid") {
      return { ok: false, message: "Обращение можно создать только по оплаченной операции." };
    }

    if (transaction.source?.type !== "bank_account" || transaction.source.userId !== userId) {
      return { ok: false, message: "Операция недоступна для текущего клиента." };
    }

    if (transaction.refundRequest?.status === "pending") {
      return { ok: false, message: "По этой операции уже есть обращение на рассмотрении." };
    }

    if (!normalizedReason || normalizedReason.length < 12) {
      return { ok: false, message: "Опишите ситуацию подробнее: минимум 12 символов." };
    }

    transaction.refundRequest = {
      id: generateToken("RET"),
      status: "pending",
      createdAt: nowIso(),
      createdAtLabel: nowLabel(),
      userId,
      userName: user?.fullName || "Клиент",
      reason: normalizedReason,
      decisionAt: null,
      decisionLabel: null,
      decisionNote: "",
      decidedBy: "",
    };
    transaction.updatedAt = nowIso();
    saveTransactions(transactions);

    return {
      ok: true,
      transaction: clone(transaction),
    };
  }

  function refundTransaction(transactionId) {
    const bankUsers = getBankUsers();
    const transactions = getTransactions();
    const transaction = transactions.find((item) => item.id === transactionId);

    if (!transaction || transaction.status !== "paid") {
      return { ok: false, message: "Возврат доступен только для оплаченных операций." };
    }

    let updatedAccount = null;

    if (transaction.source?.type === "bank_account") {
      const user = bankUsers.find((candidate) => candidate.id === transaction.source.userId);
      const account = user?.accounts.find((candidate) => candidate.id === transaction.source.accountId);

      if (account) {
        account.balance += transaction.total;
        updatedAccount = account;
      }
    }

    transaction.status = "refunded";
    transaction.updatedAt = nowIso();
    transaction.refund = {
      receiptNumber: generateReceiptNumber("RF"),
      timestamp: nowLabel(),
      amount: transaction.total,
      methodLabel: updatedAccount
        ? `Возврат на счет ${maskBankAccountNumber(updatedAccount.number)}`
        : "Возврат по операции",
      token: generateToken("RFND"),
      cipherText: fakeEncrypt(`${transaction.id}:${transaction.total}:refund`),
      integrity: fakeHash(`${transaction.id}:${transaction.total}:refund`),
      balanceAfterRefund: updatedAccount ? formatMoney(updatedAccount.balance) : formatMoney(transaction.total),
    };
    transaction.encryption.refundToken = transaction.refund.token;
    transaction.encryption.refundIntegrity = transaction.refund.integrity;

    saveBankUsers(bankUsers);
    saveTransactions(transactions);

    return {
      ok: true,
      transaction: clone(transaction),
      account: updatedAccount ? clone(updatedAccount) : null,
    };
  }

  function decideRefundRequest({ transactionId, decision, decisionNote = "", decidedBy = "Администратор" }) {
    const transactions = getTransactions();
    const transaction = transactions.find((item) => item.id === transactionId);

    if (!transaction?.refundRequest || transaction.refundRequest.status !== "pending") {
      return { ok: false, message: "Нет обращения, ожидающего решения." };
    }

    if (decision === "declined") {
      transaction.refundRequest.status = "declined";
      transaction.refundRequest.decisionAt = nowIso();
      transaction.refundRequest.decisionLabel = nowLabel();
      transaction.refundRequest.decisionNote = decisionNote.trim() || "Возврат не согласован.";
      transaction.refundRequest.decidedBy = decidedBy;
      transaction.updatedAt = nowIso();
      saveTransactions(transactions);
      return { ok: true, transaction: clone(transaction) };
    }

    if (decision !== "approved") {
      return { ok: false, message: "Неизвестное решение по обращению." };
    }

    const refundResult = refundTransaction(transactionId);

    if (!refundResult.ok) {
      return refundResult;
    }

    const updatedTransactions = getTransactions();
    const updatedTransaction = updatedTransactions.find((item) => item.id === transactionId);

    if (updatedTransaction?.refundRequest) {
      updatedTransaction.refundRequest.status = "approved";
      updatedTransaction.refundRequest.decisionAt = nowIso();
      updatedTransaction.refundRequest.decisionLabel = nowLabel();
      updatedTransaction.refundRequest.decisionNote = decisionNote.trim() || "Возврат согласован.";
      updatedTransaction.refundRequest.decidedBy = decidedBy;
      updatedTransaction.refundRequest.refundReceiptNumber = updatedTransaction.refund?.receiptNumber || "";
      updatedTransaction.updatedAt = nowIso();
      saveTransactions(updatedTransactions);
    }

    return {
      ok: true,
      transaction: clone(updatedTransaction || refundResult.transaction),
    };
  }

  ensureSeed();

  window.EduPayData = {
    STORAGE_KEYS,
    adminCredentials,
    catalog: clone(catalog),
    ensureSeed,
    getBankUsers,
    saveBankUsers,
    getBankUserById,
    getBankUserPublic,
    findBankUser,
    authenticateBankUser,
    getBankSession,
    saveBankSession,
    clearBankSession,
    isBankSessionActive,
    getTransactions,
    saveTransactions,
    getPendingTransactions,
    getRefundRequests,
    createBankRequest,
    approveBankRequest,
    declineBankRequest,
    createRefundRequest,
    refundTransaction,
    decideRefundRequest,
    formatMoney,
    maskServiceAccount,
    maskBankAccountNumber,
    getStatusLabel,
    getStatusClass,
    getRefundRequestLabel,
    getRefundRequestClass,
  };
})();
