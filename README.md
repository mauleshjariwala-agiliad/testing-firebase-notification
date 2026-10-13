# FCM Notification Server

A Node.js + Express API that takes an FCM device token (the one your React app
prints to the console) and sends a Firebase push notification to that device.

```
fcm-notification-server/
├── src/
│   ├── server.js               # Express app, CORS, startup
│   ├── firebase.js             # Firebase Admin SDK initialization
│   └── notification_routes.js  # POST /api/send-notification
├── .env.example                # Copy to .env
├── .gitignore
├── package.json
└── README.md
```

## Step 1: Prerequisites

- Node.js 18 or newer (`node -v` to check)
- The same Firebase project your React app uses

## Step 2: Download the service account key

1. Open [Firebase Console](https://console.firebase.google.com) and select the **same project** as your React app.
2. Click the gear icon, then **Project settings**, then the **Service accounts** tab.
3. Click **Generate new private key**, then **Generate key**. A JSON file downloads.
4. Rename it to `serviceAccountKey.json` and put it in the project root (next to `package.json`).

> Keep this file secret. It is already listed in `.gitignore`.

## Step 3: Configure environment

macOS / Linux:

```bash
cp .env.example .env
```

Windows (Command Prompt):

```bat
copy .env.example .env
```

Edit `.env` if needed. The defaults are:

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `4000` | API port |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | `./serviceAccountKey.json` | Service account file |
| `CORS_ORIGIN` | `http://localhost:3000,http://localhost:5173` | React dev server URLs (Create React App / Vite) |

## Step 4: Install and run

```bash
npm install
npm start
```

Expected output:

```
Firebase Admin initialized for project "your-project-id"
Server running at http://localhost:4000
POST http://localhost:4000/api/send-notification
```

Use `npm run dev` instead to auto-restart on code changes.

## Step 5: Get the token from React

Start your React app, open it in the browser, allow notifications, refresh,
and copy the FCM token printed in the browser console (F12, then Console).

## Step 6: Send a notification

The only required field is `token`. `title`, `body`, `imageUrl` and `data` are optional.

**curl (macOS / Linux / Git Bash)**

```bash
curl -X POST http://localhost:4000/api/send-notification \
  -H "Content-Type: application/json" \
  -d '{"token":"PASTE_FCM_TOKEN_HERE","title":"Hello","body":"Test from Node.js","data":{"orderId":"123"}}'
```

**PowerShell (Windows)**

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/send-notification `
  -ContentType "application/json" `
  -Body '{"token":"PASTE_FCM_TOKEN_HERE","title":"Hello","body":"Test from Node.js"}'
```

**Postman**: method `POST`, URL `http://localhost:4000/api/send-notification`,
Body, then raw, then JSON:

```json
{
  "token": "PASTE_FCM_TOKEN_HERE",
  "title": "Hello",
  "body": "Test from Node.js"
}
```

Success response:

```json
{ "success": true, "messageId": "projects/your-project-id/messages/0:1700000000000000%abc" }
```

## Optional: Call the API from React

```javascript
const sendTestNotification = async (token) => {
  const res = await fetch("http://localhost:4000/api/send-notification", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, title: "Hello", body: "Sent from React via Node.js" })
  })
  console.log(await res.json())
}
```

## Troubleshooting

**API returns success but no notification appears**

- If the React tab is open and focused, the browser does not show a system
  notification. Firebase delivers it to the `onMessage()` handler in your React
  code instead, so log or display it there:
  ```javascript
  import { getMessaging, onMessage } from "firebase/messaging"
  onMessage(getMessaging(), (payload) => console.log("Foreground message:", payload))
  ```
- To see the system notification, switch to another tab or minimize the browser.
  Background notifications need `public/firebase-messaging-sw.js` in your React app.
- Check that notifications are allowed for the site and at the operating-system level
  (Windows Focus Assist or macOS Focus can hide them).

**`Invalid or expired FCM token` (400)**

- Copy the token again, since it can change after clearing site data.
- Make sure `serviceAccountKey.json` comes from the same Firebase project as the
  React app's `firebaseConfig`. A token from another project is rejected.

**`Service account file not found`**: the file is not in the project root, or
`FIREBASE_SERVICE_ACCOUNT_PATH` in `.env` points to the wrong place.

**CORS error in the React console**: add your React dev server URL to `CORS_ORIGIN`
in `.env` and restart the server.

**`EADDRINUSE`**: port 4000 is busy. Change `PORT` in `.env`.
