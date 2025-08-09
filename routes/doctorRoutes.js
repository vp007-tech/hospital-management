const express = require("express");
const router = express.Router();
const {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorAppointments,
} = require("../controllers/doctorController");
const { protect, authorize } = require("../middleware/authMiddleware");

router
  .route("/")
  .get(getDoctors)
  .post(protect, authorize("admin"), createDoctor);

router
  .route("/:id")
  .get(getDoctor)
  .put(protect, authorize("doctor", "admin"), updateDoctor)
  .delete(protect, authorize("admin"), deleteDoctor);

router
  .route("/:id/appointments")
  .get(protect, authorize("doctor", "admin"), getDoctorAppointments);

module.exports = router;
