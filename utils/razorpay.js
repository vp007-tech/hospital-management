const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create an order
const createOrder = async (amount, currency = "INR", receipt) => {
  const options = {
    amount: amount * 100, // amount in smallest currency unit (paise)
    currency,
    receipt,
    payment_capture: 1, // auto-capture payment
  };

  try {
    const response = await razorpay.orders.create(options);
    return response;
  } catch (err) {
    console.error("Razorpay order creation error:", err);
    throw err;
  }
};

// Verify payment signature
const verifyPayment = (
  razorpayOrderId,
  razorpayPaymentId,
  razorpaySignature
) => {
  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  return generatedSignature === razorpaySignature;
};

module.exports = {
  createOrder,
  verifyPayment,
};
