const mongoose = require("mongoose");

const MedicalRecordSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    appointment: {
      type: mongoose.Schema.ObjectId,
      ref: "Appointment",
    },
    diagnosis: {
      type: String,
      required: true,
    },
    prescription: {
      type: mongoose.Schema.Types.Mixed, // Changed from String to Mixed
      default: null,
    },
    tests: {
      type: String,
    },
    notes: {
      type: String,
    },
    files: [
      {
        name: String,
        url: String,
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Add a pre-save hook to handle string/object conversion
MedicalRecordSchema.pre("save", function (next) {
  if (this.prescription && typeof this.prescription === "object") {
    try {
      // Convert object/array to JSON string if needed
      this.prescription = JSON.stringify(this.prescription);
    } catch (err) {
      return next(err);
    }
  }
  next();
});

// Add a method to parse prescription when retrieving
MedicalRecordSchema.methods.parsePrescription = function () {
  if (!this.prescription) return null;
  try {
    return typeof this.prescription === "string"
      ? JSON.parse(this.prescription)
      : this.prescription;
  } catch (err) {
    return this.prescription; // Return as-is if parsing fails
  }
};

module.exports = mongoose.model("MedicalRecord", MedicalRecordSchema);
