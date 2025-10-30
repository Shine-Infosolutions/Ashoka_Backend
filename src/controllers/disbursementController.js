const Disbursement = require('../models/Disbursement');
const Inventory = require('../models/Inventory');
const KitchenStore = require('../models/KitchenStore');

// Create disbursement
exports.createDisbursement = async (req, res) => {
  try {
    console.log('Disbursement creation started:', req.body);
    const { type, items, notes } = req.body;
    
    console.log('Counting documents...');
    // Generate disbursement number
    const count = await Disbursement.countDocuments();
    console.log('Document count:', count);
    const disbursementNumber = `DISB${String(count + 1).padStart(4, '0')}`;
    
    console.log('Creating disbursement object...');
    const disbursement = new Disbursement({
      disbursementNumber,
      type,
      items,
      notes,
      createdBy: req.user?.id,
      status: 'pending'
    });
    
    console.log('Saving disbursement...');
    await disbursement.save();
    console.log('Disbursement saved successfully');
    
    console.log('Checking if need to update kitchen store...');
    // Update kitchen store if disbursing to kitchen
    if (type === 'pantry_to_kitchen') {
      console.log('Updating kitchen store for', items.length, 'items');
      for (const item of items) {
        console.log('Processing item:', item.itemId);
        const existingItem = await KitchenStore.findOne({ itemId: item.itemId });
        console.log('Existing item found:', !!existingItem);
        if (existingItem) {
          existingItem.quantity += item.quantity;
          existingItem.lastUpdated = new Date();
          existingItem.disbursementId = disbursement._id;
          await existingItem.save();
          console.log('Updated existing item');
        } else {
          console.log('Creating new kitchen store item');
          const inventoryItem = await Inventory.findById(item.itemId);
          console.log('Inventory item found:', !!inventoryItem);
          await KitchenStore.create({
            itemId: item.itemId,
            quantity: item.quantity,
            unit: inventoryItem?.unit || 'pcs',
            disbursementId: disbursement._id
          });
          console.log('Created new kitchen store item');
        }
      }
      console.log('Kitchen store update completed');
    }
    
    console.log('About to send response...');
    res.status(201).json(disbursement);
    console.log('Response sent successfully');
    
    // 🔥 WebSocket: Emit disbursement event (after response)
    try {
      const io = req.app.get('io');
      if (io) {
        console.log('Emitting WebSocket events...');
        io.emit('disbursement-created', {
          disbursement,
          type,
          itemCount: items.length
        });
        
        if (type === 'pantry_to_kitchen') {
          io.emit('kitchen-store-updated', {
            disbursementId: disbursement._id,
            items
          });
        }
        console.log('WebSocket events emitted');
      }
    } catch (wsError) {
      console.error('WebSocket error (non-blocking):', wsError);
    }
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