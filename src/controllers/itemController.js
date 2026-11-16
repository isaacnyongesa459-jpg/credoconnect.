// ======================================================
// CREDOCONNECT - ITEM CONTROLLER
// Database temporarily disconnected.
// ======================================================

const getItems = async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Database is not connected.",
    data: []
  });
};

const createItem = async (req, res) => {
  res.status(503).json({
    status: "error",
    message: "Item creation is temporarily unavailable."
  });
};

module.exports = {
  getItems,
  createItem
};
