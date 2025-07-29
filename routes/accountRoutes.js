const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/authMiddleware.js");
const accountController = require("../controllers/accountController.js");

router.post("/", authMiddleware, accountController.createAccount);
router.get("/", authMiddleware, accountController.getAccounts);

module.exports = router 