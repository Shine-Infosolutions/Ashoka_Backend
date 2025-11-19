// sync/cloudSyncRouter.js
const express = require("express");
const router = express.Router();
const applyOperation = require("./applyOperation");

module.exports = function (db) {
  const cloudOutbox = db.collection("cloud_outbox");

  // ------------------------------------------------
  // 1️⃣ OFFLINE → CLOUD (PUSH)
  // ------------------------------------------------
  router.post("/ops", async (req, res) => {
    const { origin, batch } = req.body;

    if (!batch || !Array.isArray(batch)) {
      return res.status(400).json({ error: "Invalid batch" });
    }

    const acks = [];
    for (const op of batch) {
      const ack = await applyOperation(db, op, cloudOutbox);
      acks.push(ack);
    }

    res.json({ acks });
  });

  // ------------------------------------------------
  // 2️⃣ CLOUD → OFFLINE (PULL)
  // ------------------------------------------------
  router.get("/pull", async (req, res) => {
    const since = req.query.since ? new Date(req.query.since) : new Date(0);

    const updates = await cloudOutbox
      .find({ cloudTs: { $gt: since } })
      .sort({ cloudTs: 1 })
      .limit(200)
      .toArray();

    res.json({ updates });
  });

  return router;
};
