const asyncHandler = require("express-async-handler");
const Billing = require("../models/Billing");
const Appointment = require("../models/Appointment");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User = require("../models/User");
// @desc    Get all bills
// @route   GET /api/billing
// @access  Private/Admin
const getBills = asyncHandler(async (req, res) => {
  const bills = await Billing.find()
    .populate("patient", "name email")
    .populate("doctor", "name specialization")
    .populate("appointment", "date time");

  res.status(200).json(bills);
});

// @desc    Get single bill
// @route   GET /api/billing/:id
// @access  Private (Patient/Doctor/Admin)
const getBill = asyncHandler(async (req, res) => {
  const bill = await Billing.findById(req.params.id)
    .populate("patient", "name email")
    .populate("doctor", "name specialization")
    .populate("appointment", "date time");

  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }

  // Check authorization
  if (
    bill.patient._id.toString() !== req.user.id &&
    bill.doctor._id.toString() !== req.user.id &&
    req.user.role !== "admin"
  ) {
    res.status(401);
    throw new Error("Not authorized to view this bill");
  }

  res.status(200).json(bill);
});

// @desc    Create payment intent (Stripe)
// @route   POST /api/billing/:id/payment-intent
// @access  Private/Patient
const createPaymentIntent = asyncHandler(async (req, res) => {
  const bill = await Billing.findById(req.params.id);

  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }

  // Make sure the logged in user is the patient
  if (bill.patient.toString() !== req.user.id) {
    res.status(401);
    throw new Error("Not authorized to pay this bill");
  }

  // Check if bill is already paid
  if (bill.status === "paid") {
    res.status(400);
    throw new Error("Bill is already paid");
  }

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: bill.amount * 100, // Convert to cents
    currency: "usd",
    metadata: {
      integration_check: "accept_a_payment",
      billId: bill._id.toString(),
    },
  });

  res.status(200).json({
    clientSecret: paymentIntent.client_secret,
    amount: bill.amount,
    currency: "usd",
  });
});

// @desc    Update payment status
// @route   PUT /api/billing/:id/payment
// @access  Private/Patient/Admin
const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentMethod, paymentDetails } = req.body;

  const bill = await Billing.findById(req.params.id);

  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }

  // Make sure the logged in user is the patient or admin
  if (bill.patient.toString() !== req.user.id && req.user.role !== "admin") {
    res.status(401);
    throw new Error("Not authorized to update this bill");
  }

  // Check if bill is already paid
  if (bill.status === "paid") {
    res.status(400);
    throw new Error("Bill is already paid");
  }

  // Update bill
  bill.status = "paid";
  bill.paymentMethod = paymentMethod;
  bill.paymentDetails = paymentDetails;
  bill.paidAt = Date.now();
  await bill.save();

  // Update appointment status if it's pending
  await Appointment.findOneAndUpdate(
    { _id: bill.appointment, status: "pending" },
    { status: "confirmed" }
  );

  // Send payment confirmation email
  const patient = await User.findById(bill.patient);
  const appointment = await Appointment.findById(bill.appointment).populate(
    "doctor",
    "name specialization"
  );

  await sendEmail({
    email: patient.email,
    subject: "Payment Confirmation",
    message: `Dear ${patient.name},\n\nYour payment of $${
      bill.amount
    } for the appointment with Dr. ${appointment.doctor.name} on ${
      appointment.date
    } at ${
      appointment.time
    } has been successfully processed.\n\nPayment Method: ${paymentMethod}\nTransaction ID: ${
      paymentDetails.id || "N/A"
    }\n\nThank you,\nHospital Team`,
  });

  res.status(200).json(bill);
});

// @desc    Get patient bills
// @route   GET /api/billing/patient/:patientId
// @access  Private/Patient/Admin
const getPatientBills = asyncHandler(async (req, res) => {
  // Check if patient exists
  const patient = await User.findById(req.params.patientId);

  if (!patient || patient.role !== "patient") {
    res.status(404);
    throw new Error("Patient not found");
  }

  // Make sure the logged in user matches the patient or is admin
  if (patient._id.toString() !== req.user.id && req.user.role !== "admin") {
    res.status(401);
    throw new Error("Not authorized to view this patient bills");
  }

  const bills = await Billing.find({ patient: req.params.patientId })
    .populate("doctor", "name specialization")
    .populate("appointment", "date time status");

  res.status(200).json(bills);
});

module.exports = {
  getBills,
  getBill,
  createPaymentIntent,
  updatePaymentStatus,
  getPatientBills,
};
