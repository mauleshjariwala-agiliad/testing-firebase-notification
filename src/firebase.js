/**
 * firebase.js
 *
 * Copyright 2026-present Prescient Devices, Inc.
 **/

// NodeJS imports
const fs = require("fs")
const path = require("path")
// npm imports
const { cert, getApps, initializeApp } = require("firebase-admin/app")
const { getMessaging } = require("firebase-admin/messaging")

/**
 * Initialize the Firebase Admin SDK using the service account file
 * @returns {void}
 * @throws {Error} if the service account file is missing or invalid
 */
function initFirebase() {
  if (getApps().length > 0) {
    return
  }
  let serviceAccount
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  } else {
  const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./serviceAccountKey.json")
  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(`Service account file not found at ${serviceAccountPath}. See README step 2.`)
  }
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"))
  }
  // Env vars often store the key with literal "\n" sequences instead of newlines
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n")
  initializeApp({ credential: cert(serviceAccount) })
  console.log(`Firebase Admin initialized for project "${serviceAccount.project_id}"`)
}

module.exports = {
  getMessaging,
  initFirebase
}
