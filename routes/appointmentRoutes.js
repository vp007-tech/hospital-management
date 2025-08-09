const express = require("express");
const router = express.Router();
const {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointment,
} = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(protect, authorize("admin"), getAppointments)
  .post(protect, createAppointment);

router.route("/:id").get(protect, getAppointment);

router
  .route("/:id/status")
  .put(protect, authorize("doctor", "admin"), updateAppointmentStatus);

router.route("/:id/cancel").put(protect, cancelAppointment);

module.exports = router;
