# OrionTour (каталог + админка в одном клиенте)

## Что сделано
- **/** — открывается каталог туров с фильтрацией (страна, курорт, отель, даты, ночи, питание, цена, т.д.).
- **/admin/login** — вход в админ-панель.
- Админка и каталог работают **через одну и ту же БД и один и тот же backend**, поэтому изменения из админки сразу влияют на каталог.

## Структура
- `server/` — Express + PostgreSQL (Pool), schema `oriontour`.
- `client/` — Vite + React + React Router: каталог + админка.

## Запуск (пример)
1) База данных
- Убедитесь, что PostgreSQL запущен.
- Выполните SQL из вашего сообщения, чтобы создать схему `oriontour` и данные.

2) Backend
```bash
cd server
npm i
node index.js
```
Backend слушает `http://localhost:5000`.

3) Frontend
```bash
cd client
npm i
npm run dev
```
Откройте `http://localhost:5173`.

> Если хотите поменять адрес backend, задайте переменную `VITE_API_BASE`.
