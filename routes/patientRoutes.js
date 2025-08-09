const express = require("express");
const router = express.Router();
const {
  getPatients,
  getPatient,
  updatePatient,
  deletePatient,
  getPatientAppointments,
  getPatientMedicalRecords,
} = require("../controllers/patientController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.route("/").get(protect, authorize("admin"), getPatients);

router
  .route("/:id")
  .get(protect, authorize("admin", "doctor"), getPatient)
  .put(protect, updatePatient)
  .delete(protect, authorize("admin"), deletePatient);

router.route("/:id/appointments").get(protect, getPatientAppointments);

router.route("/:id/medical-records").get(protect, getPatientMedicalRecords);

module.exports = router;
