const express = require("express")
const router =  express.Router()
const authController = require("../controllers/authController.js");
const authMiddleware = require("../middlewares/authMiddleware.js");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/update", authMiddleware, authController.update);
router.get("/profile", authMiddleware, authController.getProfile);

module.exports = router