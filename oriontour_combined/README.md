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
