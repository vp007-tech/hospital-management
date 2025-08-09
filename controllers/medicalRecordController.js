const asyncHandler = require("express-async-handler");
const MedicalRecord = require("../models/MedicalRecord");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, "../uploads/medical-records");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images, PDFs and Word documents are allowed"));
    }
  },
}).array("files", 5); // Allow up to 5 files

// @desc    Create medical record
// @route   POST /api/medical-records
// @access  Private/Doctor/Admin
const createMedicalRecord = asyncHandler(async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }

    try {
      const { patientId, diagnosis, prescription, notes, appointmentId } =
        req.body;

      // Validate required fields
      if (!patientId || !diagnosis) {
        return res.status(400).json({
          success: false,
          error: "Patient ID and diagnosis are required",
        });
      }

      // Check if patient exists
      const patient = await User.findById(patientId);
      if (!patient || patient.role !== "patient") {
        return res.status(404).json({
          success: false,
          error: "Patient not found",
        });
      }

      // Check authorization if appointment exists
      if (appointmentId) {
        const appointment = await Appointment.findById(appointmentId);
        if (
          appointment &&
          appointment.doctor.toString() !== req.user.id &&
          req.user.role !== "admin"
        ) {
          return res.status(403).json({
            success: false,
            error: "Not authorized to create medical record for this patient",
          });
        }
      }

      // Parse prescription if it's a string
      let parsedPrescription = [];
      if (prescription) {
        try {
          parsedPrescription =
            typeof prescription === "string"
              ? JSON.parse(prescription)
              : prescription;
        } catch (parseError) {
          return res.status(400).json({
            success: false,
            error: "Invalid prescription format",
          });
        }
      }

      // Process files
      const files = req.files
        ? req.files.map((file) => ({
            name: file.originalname,
            url: `/uploads/medical-records/${file.filename}`,
          }))
        : [];

      // Create medical record
      const medicalRecord = await MedicalRecord.create({
        patient: patientId,
        doctor: req.user.id,
        appointment: appointmentId,
        diagnosis,
        prescription: parsedPrescription,
        notes,
        files,
      });

      return res.status(201).json({
        success: true,
        data: medicalRecord,
      });
    } catch (error) {
      console.error("Error creating medical record:", error);
      return res.status(500).json({
        success: false,
        error: "Server error during medical record creation",
        details: error.message,
      });
    }
  });
});


// @desc    Get medical record by ID
// @route   GET /api/medical-records/:id
// @access  Private (Patient/Doctor/Admin)
const getMedicalRecord = asyncHandler(async (req, res) => {
  const medicalRecord = await MedicalRecord.findById(req.params.id)
    .populate("patient", "name email")
    .populate("doctor", "name specialization")
    .populate("appointment", "date time");

  if (!medicalRecord) {
    res.status(404);
    throw new Error("Medical record not found");
  }

  // Check authorization
  if (
    medicalRecord.patient._id.toString() !== req.user.id &&
    medicalRecord.doctor._id.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    res.status(401);
    throw new Error("Not authorized to view this medical record");
  }

  res.status(200).json(medicalRecord);
});

// @desc    Update medical record
// @route   PUT /api/medical-records/:id
// @access  Private/Doctor/Admin
const updateMedicalRecord = asyncHandler(async (req, res) => {
  const { diagnosis, prescription, notes } = req.body;

  let medicalRecord = await MedicalRecord.findById(req.params.id);

  if (!medicalRecord) {
    res.status(404);
    throw new Error("Medical record not found");
  }

  // Check authorization (either the doctor who created it or admin)
  if (
    medicalRecord.doctor.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    res.status(401);
    throw new Error("Not authorized to update this medical record");
  }

  // Update medical record
  medicalRecord.diagnosis = diagnosis || medicalRecord.diagnosis;
  medicalRecord.prescription = prescription || medicalRecord.prescription;
  medicalRecord.notes = notes || medicalRecord.notes;

  await medicalRecord.save();

  res.status(200).json(medicalRecord);
});

// @desc    Add files to medical record
// @route   PUT /api/medical-records/:id/files
// @access  Private/Doctor/Admin
const addFilesToMedicalRecord = asyncHandler(async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      res.status(400);
      throw new Error(err.message);
    }

    const medicalRecord = await MedicalRecord.findById(req.params.id);

    if (!medicalRecord) {
      res.status(404);
      throw new Error("Medical record not found");
    }

    // Check authorization (either the doctor who created it or admin)
    if (
      medicalRecord.doctor.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      res.status(401);
      throw new Error("Not authorized to update this medical record");
    }

    // Process uploaded files
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        medicalRecord.files.push({
          name: file.originalname,
          url: `/uploads/medical-records/${file.filename}`,
        });
      });
    }

    await medicalRecord.save();

    res.status(200).json(medicalRecord);
  });
});

module.exports = {
  createMedicalRecord,
  getMedicalRecord,
  updateMedicalRecord,
  addFilesToMedicalRecord,
};
