const axios = require('axios');
require('dotenv').config();
const db = require('../config/db');

// Helper to get Safaricom OAuth Token
async function getAccessToken(req, res, next) {
  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          authorization: `Basic ${auth}`
        }
      }
    );

    req.token = response.data.access_token;
    next();
  } catch (error) {
    console.error('Error generating M-Pesa access token:', error.response?.data || error.message);
    return res.status(500).json({ status: 'error', message: 'Failed to authorize M-Pesa payment service' });
  }
}

// Trigger STK Push
const triggerStkPush = async (req, res) => {
  try {
    const { phone, amount } = req.body;

    if (!phone || !amount) {
      return res.status(400).json({ status: 'error', message: 'Phone number and amount are required' });
    }

    // Format phone number to 254XXXXXXXXX
    let formattedPhone = phone.toString().replace(/\s+/g, '').replace(/-/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.slice(1);
    }

    const accessToken = req.token;
    const url = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
    const shortCode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: Number(amount),
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://mydomain.com/api/mpesa/callback',
      AccountReference: 'CredoConnect',
      TransactionDesc: 'Airtime and Bundle Purchase'
    };

    const response = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    // Optionally save initial pending transaction in database
    await db.query(
      'INSERT INTO items (title, description, amount, status) VALUES ($1, $2, $3, $4)',
      ['M-Pesa Topup', formattedPhone, amount, 'Pending']
    );

    return res.status(200).json({
      status: 'success',
      message: 'STK push sent successfully. Check your phone.',
      data: response.data
    });
  } catch (error) {
    console.error('STK Push error:', error.response?.data || error.message);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to initiate M-Pesa STK push',
      details: error.response?.data || error.message
    });
  }
};

// Handle Safaricom Callback
const mpesaCallback = async (req, res) => {
  try {
    const callbackData = req.body;
    console.log('M-Pesa Callback received:', JSON.stringify(callbackData, null, 2));

    // Process result code / transaction details here and update your database records accordingly

    return res.status(200).json({ result: 'Success' });
  } catch (error) {
    console.error('Error handling M-Pesa callback:', error);
    return res.status(500).json({ status: 'error' });
  }
};

module.exports = {
  getAccessToken,
  triggerStkPush,
  mpesaCallback
};
