const express = require("express");
const router = express.Router();
const {
  getBills,
  getBill,
  createPaymentIntent,
  updatePaymentStatus,
  getPatientBills,
} = require("../controllers/billingController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").get(protect, authorize("admin"), getBills);

router.route("/:id").get(protect, getBill);

router.route("/:id/payment-intent").post(protect, createPaymentIntent);

router.route("/:id/payment").put(protect, updatePaymentStatus);

router.route("/patient/:patientId").get(protect, getPatientBills);

module.exports = router;
