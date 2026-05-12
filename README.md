# AiRPay
AiRPay Terminal
Русская версия
Возможности
Минималистичный платежный терминал с пошаговым сценарием оплаты.
Доступ к платежам только после авторизации в банковском сервисе.
Подтверждение операций в отдельном банковском клиенте.
Проверка формата и существования реквизитов перед оплатой.
Автоформатирование российских телефонных номеров: ввод с +, 8 или 9 приводится к формату +7....
Электронные кошельки и реквизиты поставщиков вынесены в отдельную базу.
Админ-панель с журналом операций, статусами, возвратами и визуализацией формирования крипто-ключей.
Обращение клиента на возврат средств через банковский клиент.
Решение администратора по возврату: одобрить или отклонить с комментарием.
Светлая и темная тема с воздушной голубой палитрой.
Страницы
index.html — платежный терминал AiRPay.
bank.html — банковский клиент для входа, просмотра счетов, подтверждения операций и подачи обращения на возврат.
admin.html — админ-панель для просмотра операций, анализа защищенного обмена и обработки возвратов.
Быстрый запуск
Можно открыть index.html напрямую в браузере.

Также можно запустить локальный статический сервер:

python3 -m http.server 8000
После запуска откройте:

http://localhost:8000/index.html
Данные для входа и реквизиты
Все данные вынесены в текстовые файлы:

airpay-database.txt — общая база: логины, пароли, реквизиты оплаты и телефоны.
airpay-credentials.txt — логины и пароли.
airpay-payment-requisites.txt — реквизиты оплаты, номера телефонов и кошельки.
Основной сценарий
Откройте bank.html.
Войдите в банковский сервис одним из аккаунтов из airpay-credentials.txt.
Перейдите в index.html.
Выберите услугу, поставщика, реквизит и сумму.
Отправьте платеж в банк.
Вернитесь в банковский клиент и подтвердите операцию.
После подтверждения терминал покажет электронный чек.
Возврат средств
В банковском клиенте выберите оплаченную операцию.
Заполните форму обращения на возврат и объясните ситуацию.
Откройте admin.html и войдите как администратор.
В деталях операции рассмотрите обращение.
Одобрите возврат или отклоните его с комментарием.
Структура проекта
app.js — логика платежного терминала.
bank.js — логика банковского клиента.
admin.js — логика админ-панели.
shared.js — общие данные, операции, авторизация, возвраты и хранение в localStorage.
payments-db.js — каталог услуг, форматы реквизитов и допустимые реквизиты.
theme.js — переключение светлой и темной темы.
styles.css — визуальный стиль всех страниц.
payment-terminal-is-design.md — описание проектирования системы.
Примечание
AiRPay работает полностью на стороне браузера. Данные сохраняются в localStorage, поэтому очистка данных сайта сбросит счета, операции, сессии и обращения.

English Version
Features
Minimal step-by-step payment terminal flow.
Payment access only after banking service authentication.
Payment confirmation in a separate banking client.
Payment detail validation by format and by registered requisites.
Russian phone number auto-formatting: input starting with +, 8, or 9 is normalized to +7....
Separate text databases for credentials, payment requisites, phone numbers, and wallet IDs.
Admin panel with operation history, statuses, refund processing, and crypto-key generation visualization.
Client refund request form in the banking client.
Admin refund decision flow: approve or decline with a comment.
Light and dark theme with an airy blue color palette.
Pages
index.html — AiRPay payment terminal.
bank.html — banking client for login, account overview, payment confirmation, and refund requests.
admin.html — admin panel for operation monitoring, protected exchange details, and refund decisions.
Quick Start
You can open index.html directly in a browser.

Or run a local static server:

python3 -m http.server 8000
Then open:

http://localhost:8000/index.html
Credentials and Requisites
Project data is stored in text files:

airpay-database.txt — full database: credentials, payment requisites, and phone numbers.
airpay-credentials.txt — logins and passwords.
airpay-payment-requisites.txt — payment requisites, phone numbers, and wallet IDs.
Main Flow
Open bank.html.
Sign in to the banking service using one of the accounts from airpay-credentials.txt.
Go to index.html.
Select a service, provider, requisite, and amount.
Send the payment request to the bank.
Return to the banking client and confirm the operation.
After confirmation, the terminal displays an electronic receipt.
Refund Flow
In the banking client, select a completed operation.
Fill in the refund request form and describe the situation.
Open admin.html and sign in as an administrator.
Review the request in operation details.
Approve or decline the refund with an admin comment.
Project Structure
app.js — payment terminal logic.
bank.js — banking client logic.
admin.js — admin panel logic.
shared.js — shared data, operations, authentication, refunds, and localStorage persistence.
payments-db.js — service catalog, requisite formats, and accepted requisites.
theme.js — light/dark theme switching.
styles.css — visual style for all pages.
payment-terminal-is-design.md — system design notes.
Note
AiRPay runs fully in the browser. Data is stored in localStorage, so clearing site data will reset accounts, operations, sessions, and refund requests.
