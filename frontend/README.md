# Frontend

The supplied React UI now calls the Spring Boot API through `src/api.js`.

See `../START_HERE.md` to configure and start the backend first.

```powershell
npm ci
npm run dev
```

Open http://localhost:5173/login for account login. `/` is the public camera, `/admin` is manager-only and `/employee` is employee-only. Use **Cấu hình lịch** in the manager sidebar; use the per-employee face-registration button in **Nhân viên**. Password changes are in the avatar menu beside logout. `/setup` remains a compatibility route to the schedule inside the dashboard; `/password` redirects to the dashboard.

`npm run lint` and `npm run build` verify the frontend. Vite forwards `/api` to http://localhost:8081. If you change the backend port, set `$env:API_PROXY_TARGET = 'http://localhost:NEW_PORT'` before starting Vite. Use the same-origin `/api` default; there is no permissive backend CORS policy.

Phone, department and attachment controls are disabled because those fields do not exist in the approved schema. There are no mock account or attendance arrays.

ExcelJS is retained from the supplied frontend. Its existing bundle emits an eval warning and a large-chunk warning during production build; neither fails the build.
