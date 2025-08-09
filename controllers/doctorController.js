const asyncHandler = require("express-async-handler");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

// @desc    Get all doctors
// @route   GET /api/doctors
// @access  Public
const getDoctors = asyncHandler(async (req, res) => {
  const doctors = await Doctor.find({ status: "active" }).populate(
    "user",
    "name email contact"
  );

  res.status(200).json(doctors);
});

// @desc    Get single doctor
// @route   GET /api/doctors/:id
// @access  Public
const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).populate(
    "user",
    "name email contact"
  );

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  res.status(200).json(doctor);
});

// @desc    Create doctor
// @route   POST /api/doctors
// @access  Private/Admin
const createDoctor = asyncHandler(async (req, res) => {
  const { userId, specialization, qualifications, experience, fees, schedule } =
    req.body;

  // Check if user exists and is a doctor
  const user = await User.findById(userId);
  if (!user || user.role !== "doctor") {
    res.status(400);
    throw new Error("User is not registered as a doctor");
  }

  // Check if doctor profile already exists
  const doctorExists = await Doctor.findOne({ user: userId });
  if (doctorExists) {
    res.status(400);
    throw new Error("Doctor profile already exists");
  }

  const doctor = await Doctor.create({
    user: userId,
    specialization,
    qualifications,
    experience,
    fees,
    schedule,
  });

  res.status(201).json(doctor);
});

// @desc    Update doctor
// @route   PUT /api/doctors/:id
// @access  Private/Doctor/Admin
const updateDoctor = asyncHandler(async (req, res) => {
  try {
    // Find the doctor document first
    let doctor = await Doctor.findById(req.params.id).populate('user', 'name email contact');
    
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        error: "Doctor not found" 
      });
    }

    // Authorization check
    if (doctor.user._id.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        error: "Not authorized to update this doctor" 
      });
    }

    // Update allowed fields
    const updatableFields = [
      'specialization',
      'qualifications',
      'experience',
      'fees',
      'status',
      'schedule'
    ];

    // Update each field that exists in request body
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        doctor[field] = req.body[field];
      }
    });

    // Handle user data updates separately
    if (req.body.name || req.body.contact) {
      const userUpdates = {};
      if (req.body.name) userUpdates.name = req.body.name;
      if (req.body.contact) userUpdates.contact = req.body.contact;
      
      await User.findByIdAndUpdate(
        doctor.user._id, 
        userUpdates,
        { new: true, runValidators: true }
      );
    }

    // Save the updated doctor document
    const updatedDoctor = await doctor.save();

    // Populate the user data again in case it was updated
    const result = await Doctor.findById(updatedDoctor._id)
      .populate('user', 'name email contact');

    return res.status(200).json({ 
      success: true, 
      data: result 
    });

  } catch (error) {
    console.error('Update doctor error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        error: "Validation error",
        details: messages 
      });
    }
    
    // Handle other errors
    return res.status(500).json({ 
      success: false, 
      error: "Server error during update" 
    });
  }
});

// @desc    Delete doctor
// @route   DELETE /api/doctors/:id
// @access  Private/Admin
const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  await doctor.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Get doctor appointments
// @route   GET /api/doctors/:id/appointments
// @access  Private/Doctor/Admin
const getDoctorAppointments = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    res.status(404);
    throw new Error("Doctor not found");
  }

  // Make sure the logged in user matches the doctor or is admin
  if (doctor.user.toString() !== req.user.id && req.user.role !== "admin") {
    res.status(401);
    throw new Error("Not authorized to view this doctor appointments");
  }

  const appointments = await Appointment.find({ doctor: req.params.id })
    .populate("patient", "name email contact")
    .sort({ date: 1, time: 1 });

  res.status(200).json(appointments);
});

module.exports = {
  getDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getDoctorAppointments,
};
