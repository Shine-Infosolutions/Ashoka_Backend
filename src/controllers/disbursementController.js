const Disbursement = require('../models/Disbursement');
const Inventory = require('../models/Inventory');
const KitchenStore = require('../models/KitchenStore');

// Create disbursement
exports.createDisbursement = async (req, res) => {
  try {
    const { type, items, notes } = req.body;
    
    // Generate disbursement number
    const count = await Disbursement.countDocuments();
    const disbursementNumber = `DISB${String(count + 1).padStart(4, '0')}`;
    
    const disbursement = new Disbursement({
      disbursementNumber,
      type,
      items,
      notes,
      createdBy: req.user?.id,
      status: 'pending'
    });
    
    await disbursement.save();
    
    // Update kitchen store if disbursing to kitchen
    if (type === 'pantry_to_kitchen') {
      for (const item of items) {
        const existingItem = await KitchenStore.findOne({ itemId: item.itemId });
        if (existingItem) {
          existingItem.quantity += item.quantity;
          existingItem.lastUpdated = new Date();
          existingItem.disbursementId = disbursement._id;
          await existingItem.save();
        } else {
          const inventoryItem = await Inventory.findById(item.itemId);
          await KitchenStore.create({
            itemId: item.itemId,
            quantity: item.quantity,
            unit: inventoryItem?.unit || 'pcs',
            disbursementId: disbursement._id
          });
        }
      }
    }
    
    // 🔥 WebSocket: Emit disbursement event
    const io = req.app.get('io');
    if (io) {
      io.to('waiters').emit('disbursement-created', {
        disbursement,
        type,
        itemCount: items.length
      });
      
      if (type === 'pantry_to_kitchen') {
        io.to('waiters').emit('kitchen-store-updated', {
          disbursementId: disbursement._id,
          items
        });
      }
    }
    
    res.status(201).json(disbursement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all disbursements
exports.getAllDisbursements = async (req, res) => {
  try {
    const disbursements = await Disbursement.find()
      .populate('items.itemId', 'name')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });
    res.json(disbursements);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update disbursement status
exports.updateDisbursementStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const disbursement = await Disbursement.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!disbursement) {
      return res.status(404).json({ error: 'Disbursement not found' });
    }
    
    // 🔥 WebSocket: Emit status update
    const io = req.app.get('io');
    if (io) {
      io.to('waiters').emit('disbursement-status-updated', {
        disbursementId: disbursement._id,
        status: disbursement.status,
        type: disbursement.type
      });
    }
    
    res.json(disbursement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get kitchen store items
exports.getKitchenStore = async (req, res) => {
  try {
    const kitchenItems = await KitchenStore.find()
      .populate('itemId', 'name category')
      .populate('disbursementId', 'disbursementNumber')
      .sort({ lastUpdated: -1 });
    res.json(kitchenItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};