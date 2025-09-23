const BanquetBooking = require("../models/banquetBooking");
const Menu = require("../models/BanquetMenu");
const generateCustomerRef = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ref = '';
  for (let i = 0; i < 6; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ref;
};
exports.createBooking = async (req, res) => {
  try {
    // Generate unique customerRef
    let customerRef;
    let refExists = true;

    while (refExists) {
      customerRef = generateCustomerRef();
      refExists = await Menu.exists({ customerRef });
    }

    // Convert string numbers to actual numbers
    const bookingData = { ...req.body };
    if (bookingData.pax) bookingData.pax = Number(bookingData.pax);
    if (bookingData.advance) bookingData.advance = Number(bookingData.advance);
    if (bookingData.total) bookingData.total = Number(bookingData.total);
    if (bookingData.balance) bookingData.balance = Number(bookingData.balance);
    if (bookingData.ratePerPax) bookingData.ratePerPax = Number(bookingData.ratePerPax);
    if (bookingData.discount) bookingData.discount = Number(bookingData.discount);
    if (bookingData.gst) bookingData.gst = Number(bookingData.gst);
    if (bookingData.extraRooms) bookingData.extraRooms = Number(bookingData.extraRooms);
    if (bookingData.roomPricePerUnit) bookingData.roomPricePerUnit = Number(bookingData.roomPricePerUnit);
    if (bookingData.extraRoomTotalPrice) bookingData.extraRoomTotalPrice = Number(bookingData.extraRoomTotalPrice);
    if (bookingData.complimentaryRooms) bookingData.complimentaryRooms = Number(bookingData.complimentaryRooms);
    if (bookingData.staffEditCount) bookingData.staffEditCount = Number(bookingData.staffEditCount);

    // Attach customerRef
    bookingData.customerRef = customerRef;

    // 1. Create booking
    const booking = await BanquetBooking.create(bookingData);
    console.log("Booking created:", booking);
console.log("Menu",req.body.categorizedMenu)
    // 2. Handle categorizedMenu
    if (req.body.categorizedMenu) {
      const menu = new Menu({
        categories: req.body.categorizedMenu,
        bookingRef: booking._id,
        customerRef: customerRef
      });
      await menu.save();
      console.log('Menu created with bookingRef:', booking._id);
    }

    res.status(201).json({ message: "Success", booking });
  } catch (err) {
    console.error("Full error:", {
      message: err.message,
      stack: err.stack,
      receivedData: {
        body: req.body,
        categorizedMenu: req.body.categorizedMenu
      }
    });
    res.status(500).json({ 
      message: "Error creating booking",
      error: err.message
    });
  }
};

// @desc    Get all bookings
exports.getBookings = async (req, res) => {
  try {
    const bookings = await BanquetBooking.find().sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (err) {
    console.error("Error fetching bookings:", err.message);
    res.status(500).json({
      message: "Server error while fetching bookings",
      error: err.message,
    });
  }
};

// @desc    Get a single booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await BanquetBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Fetch the associated menu
    const menu = await Menu.findOne({ bookingRef: req.params.id });

    // Debug log
    console.log("Booking:", booking);
    console.log("Menu (categorizedMenu):", menu);

    res.status(200).json({
      ...booking.toObject(),
      categorizedMenu: menu ? menu.toObject() : null
    });
  } catch (err) {
    console.error("Error fetching booking:", err.message);
    res.status(500).json({
      message: "Server error while fetching booking",
      error: err.message,
    });
  }
};

// @desc    Update a booking by ID
// exports.updateBooking = async (req, res) => {
//   try {
//     const updatedData = req.body;

//     // Auto-recalculate balance if advance or total changed
//     if (
//       updatedData.total &&
//       updatedData.advance &&
//       (updatedData.balance === undefined || updatedData.balance === "")
//     ) {
//       updatedData.balance = updatedData.total - updatedData.advance;
//     }

//     const updatedBooking = await Booking.findByIdAndUpdate(
//       req.params.id,
//       updatedData,
//       { new: true, runValidators: true }
//     );

//     if (!updatedBooking) {
//       return res.status(404).json({ message: "Booking not found" });
//     }

//     res.status(200).json({
//       message: "Booking updated successfully",
//       booking: updatedBooking,
//     });
//   } catch (err) {
//     console.error("Error updating booking:", err.message);
//     res.status(500).json({
//       message: "Server error while updating booking",
//       error: err.message,
//     });
//   }
// };


exports.updateBooking = async (req, res) => {
  try {
    const updatedData = req.body;

    // Auto-recalculate balance if advance or total changed
    if (
      updatedData.total &&
      updatedData.advance &&
      (updatedData.balance === undefined || updatedData.balance === "")
    ) {
      updatedData.balance = updatedData.total - updatedData.advance;
    }

    // 1. Find the booking
    const booking = await BanquetBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 2. Append to statusHistory if new entries are present
    if (Array.isArray(updatedData.statusHistory) && updatedData.statusHistory.length > 0) {
      updatedData.statusHistory.forEach(newEntry => {
        const exists = booking.statusHistory.some(
          entry =>
            entry.status === newEntry.status &&
            new Date(entry.changedAt).getTime() === new Date(newEntry.changedAt).getTime()
        );
        if (!exists) {
          booking.statusHistory.push(newEntry);
        }
      });
      // Remove statusHistory from updatedData so it doesn't overwrite
      delete updatedData.statusHistory;
    }

    // 3. Update other fields
    Object.assign(booking, updatedData);

    // --- STAFF MENU EDIT LIMIT LOGIC ---
    const role = (req.body.role || req.body.rolr || "staff").toLowerCase();
    // Only enforce staffEditCount if menu is being changed
    if (role !== "admin" && req.body.categorizedMenu) {
      if (typeof booking.staffEditCount !== "number") booking.staffEditCount = 0;
      if (booking.staffEditCount >= 2) {
        return res.status(403).json({ message: "Staff menu edit limit reached for this booking." });
      }
      booking.staffEditCount += 1;
    }


    // 4. Save the booking
    await booking.save();

    // --- MENU UPDATE LOGIC ---
    if (updatedData.categorizedMenu && booking.customerRef) {
      let menu = await Menu.findOne({ bookingRef: booking._id });
      if (menu) {
        menu.categories = updatedData.categorizedMenu;
        menu.customerRef = booking.customerRef;
        await menu.save();
      } else {
        menu = new Menu({
          categories: updatedData.categorizedMenu,
          bookingRef: booking._id,
          customerRef: booking.customerRef
        });
        await menu.save();
      }
    }

    res.status(200).json({
      message: "Booking and Menu updated successfully",
      booking,
    });
  } catch (err) {
    console.error("Error updating booking:", err.message);
    res.status(500).json({
      message: "Server error while updating booking",
      error: err.message,
    });
  }
};

// @desc    Delete a booking by ID
exports.deleteBooking = async (req, res) => {
  try {
    const deletedBooking = await BanquetBooking.findByIdAndDelete(req.params.id);

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.status(200).json({
      message: "Booking deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting booking:", err.message);
    res.status(500).json({
      message: "Server error while deleting booking",
      error: err.message,
    });
  }
};


exports.getAllPagination = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;  // Show 10 bookings per page
    const skip = (page - 1) * limit;

    // Fetch bookings with pagination and sorting
    const bookings = await BanquetBooking.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });  // Most recent bookings first

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found' });
    }

    const totalCount = await BanquetBooking.countDocuments();

    res.status(200).json({
      message: 'Bookings fetched successfully',
      data: bookings,
      total: totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      limit,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};


exports.searchBooking = async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res
      .status(400)
      .json({ message: "Please enter a search query", success: false });
  }

  try {
    const bookings = await BanquetBooking.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { phone: { $regex: query, $options: "i" } },
   
      ],
    });

    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: "No bookings found!", success: false });
    }

    res.status(200).json({ data: bookings, success: true });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ message: "Server error", success: false });
  }
};