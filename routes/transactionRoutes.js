const express = require("express");
const router = express.Router();
const transactionController = require('../controllers/transactionController.js');
const authMiddleware = require("../middlewares/authMiddleware.js");

router.post("/", authMiddleware, transactionController.createTransaction);
router.post("/validate", authMiddleware, transactionController.validateTransactionDetails);
router.get("/:id", authMiddleware, transactionController.getTransactionsByAccount);

module.exports = router;