const Disbursement = require('../models/Disbursement');
const PantryItem = require('../models/PantryItem');
const KitchenOrder = require('../models/KitchenOrder');


// Create disbursement with stock tracking
const createDisbursement = async (req, res) => {
  try {
    const { type, fromLocation, toLocation, items, disbursedBy, notes } = req.body;
    
    // Generate disbursement number
    const count = await Disbursement.countDocuments();
    const disbursementNumber = `DSB${String(count + 1).padStart(6, '0')}`;
    
    // Process items and update stock
    const processedItems = [];
    
    for (const item of items) {
      const pantryItem = await PantryItem.findById(item.itemId);
      if (!pantryItem) {
        return res.status(404).json({ message: `Item ${item.itemId} not found` });
      }
      
      const previousStock = pantryItem.stockQuantity;
      let newStock;
      let operation;
      
      // Determine operation based on disbursement type
      if (type === 'kitchen_to_pantry') {
        operation = 'add';
        newStock = previousStock + item.quantity;
      } else if (type === 'pantry_to_kitchen') {
        operation = 'subtract';
        newStock = previousStock - item.quantity;
        
        if (newStock < 0) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${pantryItem.name}. Available: ${previousStock}` 
          });
        }
      }
      
      // Update pantry item stock
      pantryItem.stockQuantity = newStock;
      await pantryItem.save();
      
      processedItems.push({
        itemId: item.itemId,
        itemName: pantryItem.name,
        quantity: item.quantity,
        unit: pantryItem.unit,
        operation,
        previousStock,
        newStock
      });
    }
    
    const disbursement = new Disbursement({
      disbursementNumber,
      type,
      fromLocation,
      toLocation,
      items: processedItems,
      totalItems: processedItems.length,
      disbursedBy,
      status: 'completed',
      notes
    });
    
    await disbursement.save();
    res.status(201).json(disbursement);
    
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all disbursements
const getAllDisbursements = async (req, res) => {
  try {
    const disbursements = await Disbursement.find()
      .populate('items.itemId', 'name unit')
      .populate('disbursedBy', 'name')
      .populate('fromLocation.kitchenId', 'name')
      .populate('toLocation.pantryId', 'name')
      .sort({ createdAt: -1 });
    res.json(disbursements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get disbursement by ID
const getDisbursementById = async (req, res) => {
  try {
    const disbursement = await Disbursement.findById(req.params.id)
      .populate('items.itemId', 'name unit')
      .populate('disbursedBy', 'name');
    if (!disbursement) {
      return res.status(404).json({ message: 'Disbursement not found' });
    }
    res.json(disbursement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get stock tracking report
const getStockTrackingReport = async (req, res) => {
  try {
    const { itemId, startDate, endDate } = req.query;
    
    let filter = {};
    if (itemId) filter['items.itemId'] = itemId;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    const disbursements = await Disbursement.find(filter)
      .populate('items.itemId', 'name unit')
      .sort({ createdAt: -1 });
    
    res.json(disbursements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createDisbursement,
  getAllDisbursements,
  getDisbursementById,
  getStockTrackingReport
};