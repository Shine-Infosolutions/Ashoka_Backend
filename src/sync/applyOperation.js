// sync/applyOperation.js
const { ObjectId } = require("mongodb");

module.exports = async function applyOperation(db, op, cloudOutbox) {
  const collection = db.collection(op.collection);

  // Idempotency: ignore if already applied
  const exists = await cloudOutbox.findOne({ operationId: op.operationId });
  if (exists) {
    return {
      operationId: op.operationId,
      status: "duplicate",
      cloudTs: exists.cloudTs,
    };
  }

  const cloudTs = new Date();

  try {
    if (op.opType === "insert") {
      await collection.updateOne(
        { _id: ObjectId(op.documentId) },
        { $set: { ...op.payload, updatedAt: new Date(op.createdAt) } },
        { upsert: true }
      );
    } else if (op.opType === "update") {
      await collection.updateOne(
        { _id: ObjectId(op.documentId) },
        { $set: { ...op.payload, updatedAt: new Date(op.createdAt) } },
        { upsert: true }
      );
    } else if (op.opType === "delete") {
      await collection.deleteOne({ _id: ObjectId(op.documentId) });
    }

    // Record in cloud outbox for idempotency
    await cloudOutbox.insertOne({
      ...op,
      cloudTs,
      status: "applied",
    });

    return { operationId: op.operationId, status: "ok", cloudTs };
  } catch (err) {
    return { operationId: op.operationId, status: "error", error: err.message };
  }
};
