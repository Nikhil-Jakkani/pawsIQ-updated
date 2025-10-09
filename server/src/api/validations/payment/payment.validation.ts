import Joi from 'joi';

export const paymentValidation = {
  createOrder: {
    body: Joi.object().keys({
      booking_id: Joi.number().integer().positive().required(),
      amount: Joi.number().positive().required(),
      currency: Joi.string().default('INR'),
    }),
  },
  verifyPayment: {
    body: Joi.object().keys({
      razorpay_order_id: Joi.string().required(),
      razorpay_payment_id: Joi.string().required(),
      razorpay_signature: Joi.string().required(),
    }),
  },
  getPaymentByBooking: {
    params: Joi.object().keys({
      bookingId: Joi.number().integer().positive().required(),
    }),
  },
  getUserPayments: {
    query: Joi.object().keys({
      page: Joi.number().integer().min(1),
      limit: Joi.number().integer().min(1).max(50),
    }),
  },
};
