const express = require("express");
const router = express.Router();
const {
  createMedicalRecord,
  getMedicalRecord,
  updateMedicalRecord,
  addFilesToMedicalRecord,
} = require("../controllers/medicalRecordController");
const { protect, authorize } = require("../middleware/authMiddleware");

router
  .route("/")
  .post(protect, authorize("doctor", "admin"), createMedicalRecord);

router
  .route("/:id")
  .get(protect, getMedicalRecord)
  .put(protect, authorize("doctor", "admin"), updateMedicalRecord);

router
  .route("/:id/files")
  .put(protect, authorize("doctor", "admin"), addFilesToMedicalRecord);

module.exports = router;
