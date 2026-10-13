/**
 * notification_routes.js
 *
 * Copyright 2026-present Prescient Devices, Inc.
 **/

// NodeJS imports
const path = require("path")
// npm imports
const express = require("express")
// Prescient Devices imports
const { getMessaging } = require(path.resolve(__dirname, "firebase.js"))

/**
 * @typedef {object} SendNotificationBody
 * @property {string} token - FCM device token printed by the React app
 * @property {string} [title] - notification title
 * @property {string} [body] - notification body text
 * @property {string} [imageUrl] - optional image URL
 * @property {object} [data] - optional custom key/value data
 */

// Constants
const DEFAULT_BODY = "This notification was sent from the Node.js API"
const DEFAULT_TITLE = "Hello from Node.js"
const INVALID_TOKEN_CODES = [
  "messaging/invalid-argument",
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered"
]

/**
 * Build the FCM message from the request body
 * @param {SendNotificationBody} body - request body
 * @returns {object} FCM message
 */
function buildMessage(body) {
  const title = body.title || DEFAULT_TITLE
  const text = body.body || DEFAULT_BODY
  // FCM requires every data value to be a string
  const data = Object.fromEntries(
    Object.entries(body.data || {}).map(([key, value]) => [key, typeof value === "string" ? value : JSON.stringify(value)])
  )
  return {
    token: body.token,
    notification: {
      title,
      body: text,
      ...(body.imageUrl ? { imageUrl: body.imageUrl } : {})
    },
    data,
    webpush: {
      notification: {
        title,
        body: text,
        icon: body.imageUrl || undefined
      }
    },
    android: { priority: "high" },
    apns: { payload: { aps: { sound: "default" } } }
  }
}

/**
 * Handle POST /api/send-notification
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @returns {Promise<void>}
 */
async function sendNotification(req, res) {
  const body = req.body || {}
  if (!body.token || typeof body.token !== "string") {
    res.status(400).json({ success: false, error: "'token' (string) is required in the request body" })
    return
  }
  if (body.data !== undefined && (typeof body.data !== "object" || Array.isArray(body.data))) {
    res.status(400).json({ success: false, error: "'data' must be an object" })
    return
  }
  try {
    const messageId = await getMessaging().send(buildMessage(body))
    console.log(`Notification sent: ${messageId}`)
    res.json({ success: true, messageId })
  } catch (error) {
    console.error("FCM send failed:", error.code, error.message)
    if (INVALID_TOKEN_CODES.includes(error.code)) {
      res.status(400).json({ success: false, error: "Invalid or expired FCM token", code: error.code })
      return
    }
    res.status(500).json({ success: false, error: error.message, code: error.code })
  }
}

const router = express.Router()
router.post("/send-notification", sendNotification)

module.exports = router
