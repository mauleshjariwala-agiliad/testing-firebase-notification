/**
 * server.js
 *
 * Copyright 2026-present Prescient Devices, Inc.
 **/

// NodeJS imports
const path = require("path")
// npm imports
require("dotenv").config()
const cors = require("cors")
const express = require("express")
// Prescient Devices imports
const { initFirebase } = require(path.resolve(__dirname, "firebase.js"))
const notificationRoutes = require(path.resolve(__dirname, "notification_routes.js"))

// Constants
const CORS_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",").map((origin) => origin.trim())
const PORT = process.env.PORT || 4000

/**
 * Create and configure the Express app
 * @returns {object} Express app
 */
function createApp() {
  const app = express()
  app.use(cors({ origin: CORS_ORIGINS }))
  app.use(express.json())
  app.get("/health", (req, res) => res.json({ status: "ok" }))
  app.use("/api", notificationRoutes)
  app.use((req, res) => res.status(404).json({ success: false, error: "Route not found" }))
  return app
}

/**
 * Initialize Firebase and start the HTTP server
 * @returns {void}
 */
function start() {
  try {
    initFirebase()
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
  createApp().listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
    console.log(`POST http://localhost:${PORT}/api/send-notification`)
  })
}

if (require.main === module) {
  start()
}

module.exports = { createApp }
