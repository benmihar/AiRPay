# AiRPay

AiRPay is a browser-based payment terminal interface with a separate banking client and admin panel. The project is built with plain HTML, CSS, and JavaScript, so it can be opened directly in a browser or served as a static site.

AiRPay имитирует платежный терминал с отдельным банковским клиентом и админ-панелью. Проект написан на чистом HTML, CSS и JavaScript, поэтому его можно открыть прямо в браузере или запустить как статический сайт.

## Русская версия

### Возможности

- Минималистичный платежный терминал с пошаговым сценарием оплаты.
- Доступ к платежам только после авторизации в банковском сервисе.
- Подтверждение операций в отдельном банковском клиенте.
- Проверка формата и существования реквизитов перед оплатой.
- Автоформатирование российских телефонных номеров: ввод с `+`, `8` или `9` приводится к формату `+7...`.
- Электронные кошельки и реквизиты поставщиков вынесены в отдельную базу.
- Админ-панель с журналом операций, статусами, возвратами и визуализацией формирования крипто-ключей.
- Обращение клиента на возврат средств через банковский клиент.
- Решение администратора по возврату: одобрить или отклонить с комментарием.
- Светлая и темная тема с воздушной голубой палитрой.

### Страницы

- `index.html` — платежный терминал AiRPay.
- `bank.html` — банковский клиент для входа, просмотра счетов, подтверждения операций и подачи обращения на возврат.
- `admin.html` — админ-панель для просмотра операций, анализа защищенного обмена и обработки возвратов.

### Быстрый запуск

Можно открыть `index.html` напрямую в браузере.

Также можно запустить локальный статический сервер:

```bash
python3 -m http.server 8000
```

После запуска откройте:

```text
http://localhost:8000/index.html
```

### Данные для входа и реквизиты

Все данные вынесены в текстовые файлы:

- `airpay-database.txt` — общая база: логины, пароли, реквизиты оплаты и телефоны.
- `airpay-credentials.txt` — логины и пароли.
- `airpay-payment-requisites.txt` — реквизиты оплаты, номера телефонов и кошельки.

### Основной сценарий

1. Откройте `bank.html`.
2. Войдите в банковский сервис одним из аккаунтов из `airpay-credentials.txt`.
3. Перейдите в `index.html`.
4. Выберите услугу, поставщика, реквизит и сумму.
5. Отправьте платеж в банк.
6. Вернитесь в банковский клиент и подтвердите операцию.
7. После подтверждения терминал покажет электронный чек.

### Возврат средств

1. В банковском клиенте выберите оплаченную операцию.
2. Заполните форму обращения на возврат и объясните ситуацию.
3. Откройте `admin.html` и войдите как администратор.
4. В деталях операции рассмотрите обращение.
5. Одобрите возврат или отклоните его с комментарием.

### Структура проекта

- `app.js` — логика платежного терминала.
- `bank.js` — логика банковского клиента.
- `admin.js` — логика админ-панели.
- `shared.js` — общие данные, операции, авторизация, возвраты и хранение в `localStorage`.
- `payments-db.js` — каталог услуг, форматы реквизитов и допустимые реквизиты.
- `theme.js` — переключение светлой и темной темы.
- `styles.css` — визуальный стиль всех страниц.
- `payment-terminal-is-design.md` — описание проектирования системы.

### Примечание

AiRPay работает полностью на стороне браузера. Данные сохраняются в `localStorage`, поэтому очистка данных сайта сбросит счета, операции, сессии и обращения.

## English Version

### Features

- Minimal step-by-step payment terminal flow.
- Payment access only after banking service authentication.
- Payment confirmation in a separate banking client.
- Payment detail validation by format and by registered requisites.
- Russian phone number auto-formatting: input starting with `+`, `8`, or `9` is normalized to `+7...`.
- Separate text databases for credentials, payment requisites, phone numbers, and wallet IDs.
- Admin panel with operation history, statuses, refund processing, and crypto-key generation visualization.
- Client refund request form in the banking client.
- Admin refund decision flow: approve or decline with a comment.
- Light and dark theme with an airy blue color palette.

### Pages

- `index.html` — AiRPay payment terminal.
- `bank.html` — banking client for login, account overview, payment confirmation, and refund requests.
- `admin.html` — admin panel for operation monitoring, protected exchange details, and refund decisions.

### Quick Start

You can open `index.html` directly in a browser.

Or run a local static server:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000/index.html
```

### Credentials and Requisites

Project data is stored in text files:

- `airpay-database.txt` — full database: credentials, payment requisites, and phone numbers.
- `airpay-credentials.txt` — logins and passwords.
- `airpay-payment-requisites.txt` — payment requisites, phone numbers, and wallet IDs.

### Main Flow

1. Open `bank.html`.
2. Sign in to the banking service using one of the accounts from `airpay-credentials.txt`.
3. Go to `index.html`.
4. Select a service, provider, requisite, and amount.
5. Send the payment request to the bank.
6. Return to the banking client and confirm the operation.
7. After confirmation, the terminal displays an electronic receipt.

### Refund Flow

1. In the banking client, select a completed operation.
2. Fill in the refund request form and describe the situation.
3. Open `admin.html` and sign in as an administrator.
4. Review the request in operation details.
5. Approve or decline the refund with an admin comment.

### Project Structure

- `app.js` — payment terminal logic.
- `bank.js` — banking client logic.
- `admin.js` — admin panel logic.
- `shared.js` — shared data, operations, authentication, refunds, and `localStorage` persistence.
- `payments-db.js` — service catalog, requisite formats, and accepted requisites.
- `theme.js` — light/dark theme switching.
- `styles.css` — visual style for all pages.
- `payment-terminal-is-design.md` — system design notes.

### Note

AiRPay runs fully in the browser. Data is stored in `localStorage`, so clearing site data will reset accounts, operations, sessions, and refund requests.
