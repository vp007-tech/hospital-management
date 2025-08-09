const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");

// @desc    Get all patients
// @route   GET /api/patients
// @access  Private/Admin
const getPatients = asyncHandler(async (req, res) => {
  const patients = await User.find({ role: "patient" }).select("-password");
  res.status(200).json(patients);
});

// @desc    Get single patient
// @route   GET /api/patients/:id
// @access  Private/Admin/Doctor
const getPatient = asyncHandler(async (req, res) => {
  const patient = await User.findById(req.params.id).select("-password");

  if (!patient || patient.role !== "patient") {
    res.status(404);
    throw new Error("Patient not found");
  }

  res.status(200).json(patient);
});

// @desc    Update patient
// @route   PUT /api/patients/:id
// @access  Private/Patient
const updatePatient = asyncHandler(async (req, res) => {
  const patient = await User.findById(req.params.id);

  if (!patient || patient.role !== "patient") {
    res.status(404);
    throw new Error("Patient not found");
  }

  // Make sure the logged in user matches the patient or is admin
  if (patient._id.toString() !== req.user.id && req.user.role !== "admin") {
    res.status(401);
    throw new Error("Not authorized to update this patient");
  }

  const updatedPatient = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  }).select("-password");

  res.status(200).json(updatedPatient);
});

// @desc    Delete patient
// @route   DELETE /api/patients/:id
// @access  Private/Admin
const deletePatient = asyncHandler(async (req, res) => {
  const patient = await User.findById(req.params.id);

  if (!patient || patient.role !== "patient") {
    res.status(404);
    throw new Error("Patient not found");
  }

    await patient.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Get patient appointments
// @route   GET /api/patients/:id/appointments
// @access  Private/Patient/Doctor/Admin
const getPatientAppointments = asyncHandler(async (req, res) => {
  // Check if patient exists
  const patient = await User.findById(req.params.id);

  if (!patient || patient.role !== "patient") {
    res.status(404);
    throw new Error("Patient not found");
  }

  // Make sure the logged in user matches the patient or is admin/doctor
  if (
    patient._id.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    req.user.role !== "doctor"
  ) {
    res.status(401);
    throw new Error("Not authorized to view this patient appointments");
  }

  const appointments = await Appointment.find({ patient: req.params.id })
    .populate("doctor", "name specialization")
    .populate("patient", "name email");

  res.status(200).json(appointments);
});

// @desc    Get patient medical records
// @route   GET /api/patients/:id/medical-records
// @access  Private/Patient/Doctor/Admin
const getPatientMedicalRecords = asyncHandler(async (req, res) => {
  // Check if patient exists
  const patient = await User.findById(req.params.id);

  if (!patient || patient.role !== "patient") {
    res.status(404);
    throw new Error("Patient not found");
  }

  // Make sure the logged in user matches the patient or is admin/doctor
  if (
    patient._id.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    req.user.role !== "doctor"
  ) {
    res.status(401);
    throw new Error("Not authorized to view this patient medical records");
  }

  const medicalRecords = await MedicalRecord.find({ patient: req.params.id })
    .populate("doctor", "name specialization")
    .populate("patient", "name email");

  res.status(200).json(medicalRecords);
});

module.exports = {
  getPatients,
  getPatient,
  updatePatient,
  deletePatient,
  getPatientAppointments,
  getPatientMedicalRecords,
};
