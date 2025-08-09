const asyncHandler = require("express-async-handler");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Billing = require("../models/Billing");
const sendEmail = require("../utils/sendEmail");
const MedicalRecord = require("../models/MedicalRecord");
// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private/Admin
const getAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find()
    .populate("patient", "name email")
    .populate("doctor", "name specialization");

  res.status(200).json(appointments);
});
// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = asyncHandler(async (req, res) => {
  const { doctorId, date, time, symptoms } = req.body;

  try {
    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ 
        success: false,
        error: "Doctor not found" 
      });
    }

    // Validate date and time
    if (!isValidDate(date) || !isValidTime(time)) {
      return res.status(400).json({
        success: false,
        error: "Invalid date or time format"
      });
    }

    // Check if appointment slot is available
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      date,
      time,
      status: { $in: ["pending", "confirmed"] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        error: "Appointment slot is already booked"
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      date,
      time,
      symptoms
    });

    // Create billing record with valid payment method
    const billing = await Billing.create({
      appointment: appointment._id,
      patient: req.user.id,
      doctor: doctorId,
      amount: doctor.fees,
      paymentMethod: "online", // Default to online payment
      status: "pending"
    });

    // Populate appointment details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate("patient", "name email")
      .populate("doctor", "name specialization fees");

    // Send confirmation email (async)
    sendConfirmationEmail(req.user, doctor, appointment, billing)
      .catch(err => console.error('Email failed:', err));

    return res.status(201).json({
      success: true,
      data: populatedAppointment
    });

  } catch (error) {
    console.error('Appointment creation error:', error);
    return res.status(500).json({
      success: false,
      error: "Server error during appointment creation"
    });
  }
});

// Helper functions
const isValidDate = (dateString) => {
  return !isNaN(Date.parse(dateString));
};

const isValidTime = (timeString) => {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString);
};

const sendConfirmationEmail = async (user, doctor, appointment, billing) => {
  await sendEmail({
    email: user.email,
    subject: "Appointment Confirmation",
    message: `Dear ${user.name},\n\nYour appointment with Dr. ${doctor.user.name} (${doctor.specialization}) has been booked for ${appointment.date} at ${appointment.time}.\n\nSymptoms: ${appointment.symptoms}\n\nAmount to be paid: ${billing.amount}\n\nPayment Method: ${billing.paymentMethod}\n\nThank you,\nHospital Team`
  });
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private/Doctor/Admin
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, diagnosis, prescription, notes } = req.body;

  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  // Make sure the logged in user is the doctor or admin
  if (
    appointment.doctor.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    res.status(401);
    throw new Error("Not authorized to update this appointment");
  }

  const updatedAppointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    { status, diagnosis, prescription, notes },
    { new: true }
  )
    .populate("patient", "name email")
    .populate("doctor", "name specialization");

  // If appointment is completed, create medical record
  if (status === "completed") {
    await MedicalRecord.create({
      patient: appointment.patient,
      doctor: appointment.doctor,
      appointment: appointment._id,
      diagnosis: diagnosis || "",
      prescription: prescription || "",
      notes: notes || "",
    });
  }

  // Send status update email to patient
  const patient = await User.findById(appointment.patient);
  await sendEmail({
    email: patient.email,
    subject: "Appointment Status Update",
    message: `Dear ${
      patient.name
    },\n\nThe status of your appointment with Dr. ${
      updatedAppointment.doctor.name
    } on ${updatedAppointment.date} at ${
      updatedAppointment.time
    } has been updated to ${status}.\n\nDiagnosis: ${
      diagnosis || "N/A"
    }\nPrescription: ${prescription || "N/A"}\nNotes: ${
      notes || "N/A"
    }\n\nThank you,\nHospital Team`,
  });

  res.status(200).json(updatedAppointment);
});

// @desc    Cancel appointment
// @route   PUT /api/appointments/:id/cancel
// @access  Private/Patient
const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  // Make sure the logged in user is the patient
  if (appointment.patient.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized to cancel this appointment");
  }

  // Update appointment status
  appointment.status = "cancelled";
  await appointment.save();

  // Update billing status
  await Billing.findOneAndUpdate(
    { appointment: appointment._id },
    { status: "cancelled" }
  );

  // Send cancellation email
  const patient = await User.findById(appointment.patient);
  const doctor = await Doctor.findById(appointment.doctor).populate(
    "user",
    "name"
  );

  await sendEmail({
    email: patient.email,
    subject: "Appointment Cancellation",
    message: `Dear ${patient.name},\n\nYour appointment with Dr. ${doctor.user.name} on ${appointment.date} at ${appointment.time} has been cancelled.\n\nThank you,\nHospital Team`,
  });

  res.status(200).json({ success: true, data: appointment });
});

// @desc    Get single appointment
// @route   GET /api/appointments/:id
// @access  Private (Patient/Doctor/Admin)
const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate("patient", "name email")
    .populate("doctor", "name specialization");

  if (!appointment) {
    res.status(404);
    throw new Error("Appointment not found");
  }

  // Check authorization
  if (
    appointment.patient._id.toString() !== req.user.id &&
    appointment.doctor._id.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    res.status(401);
    throw new Error("Not authorized to view this appointment");
  }

  res.status(200).json(appointment);
});

module.exports = {
  getAppointments,
  createAppointment,
  updateAppointmentStatus,
  cancelAppointment,
  getAppointment,
};
