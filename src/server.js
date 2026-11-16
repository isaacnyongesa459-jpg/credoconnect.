// ======================================================
// CREDOCONNECT - BACKEND SERVER (Node.js & Express)
// ======================================================

"use strict";

const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// ======================================================
// 2. HEALTH CHECK & ROOT ROUTE
// ======================================================

app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "CredoConnect Backend Server is running."
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    database: "not connected",
    message: "CredoConnect backend is running without Supabase."
  });
});



// ======================================================
// 4. SAFARICOM DARAJA M-PESA STK PUSH INTEGRATION
// ======================================================

// Helper: Get Safaricom Access Token
async function getMpesaAccessToken() {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  
  if (!consumerKey || !consumerSecret) {
    throw new Error("M-Pesa credentials not configured on server.");
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const response = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    {
      headers: {
        Authorization: `Basic ${auth}`
      }
    }
  );

  return response.data.access_token;
}

// STK PUSH ROUTE - TEMPORARILY INDEPENDENT OF DATABASE
app.post("/api/mpesa/stkpush", async (req, res) => {
  try {
    let { phone, amount } = req.body;

    // Validate input
    if (!phone || !amount) {
      return res.status(400).json({
        success: false,
        message: "Phone number and amount are required."
      });
    }

    amount = Number(amount);

    if (!Number.isInteger(amount) || amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid whole-number amount."
      });
    }

    // Format Kenyan phone number
    let formattedPhone = String(phone)
      .replace(/\s+/g, "")
      .replace(/-/g, "");

    if (formattedPhone.startsWith("+")) {
      formattedPhone = formattedPhone.slice(1);
    }

    if (formattedPhone.startsWith("0")) {
      formattedPhone = "254" + formattedPhone.slice(1);
    }

    if (!/^254[71]\d{8}$/.test(formattedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid Kenyan mobile number."
      });
    }

    // Check M-Pesa credentials
    const shortcode = process.env.MPESA_SHORTCODE || "174379";
    const passkey = process.env.MPESA_PASSKEY;
    const callbackUrl = process.env.MPESA_CALLBACK_URL;

    if (!passkey || !callbackUrl) {
      throw new Error(
        "MPESA_PASSKEY or MPESA_CALLBACK_URL is missing in Render."
      );
    }

    if (!callbackUrl.startsWith("https://")) {
      throw new Error("M-Pesa callback URL must use HTTPS.");
    }

    // Generate Safaricom access token
    const accessToken = await getMpesaAccessToken();

    // Generate Kenya local timestamp (UTC+3)
    const timestamp = new Date(Date.now() + 3 * 60 * 60 * 1000)
      .toISOString()
      .replace(/[-:TZ.]/g, "")
      .slice(0, 14);

    // Generate STK password
    const password = Buffer.from(
      `${shortcode}${passkey}${timestamp}`
    ).toString("base64");

    // Prepare STK Push request
    const stkPayload = {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: shortcode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: "CredoConnect",
      TransactionDesc: "CredoConnect Payment"
    };

    // Send request to Safaricom Daraja Sandbox
    const stkResponse = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      stkPayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        timeout: 30000
      }
    );

    console.log("STK Push response:", stkResponse.data);

    // Return Safaricom response without depending on PostgreSQL
    return res.status(200).json({
      success: true,
      message: "STK Push request accepted by Safaricom.",
      data: stkResponse.data
    });

  } catch (error) {
    console.error(
      "M-Pesa STK Push Error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message:
        error.response?.data?.errorMessage ||
        error.response?.data?.ResponseDescription ||
        error.message ||
        "Failed to initiate M-Pesa STK Push.",
      details: error.response?.data || null
    });
  }
});


// M-Pesa Callback Endpoint
app.post("/api/mpesa/callback", async (req, res) => {
  try {
    const callbackData = req.body;
    console.log("M-Pesa Callback received:", JSON.stringify(callbackData, null, 2));

  

    res.json({ ResultCode: 0, ResultDesc: "Success" });
  } catch (error) {
    console.error("Callback error:", error);
    res.status(500).json({ ResultCode: 1, ResultDesc: "Internal Server Error" });
  }
});

// ======================================================
// 5. START SERVER
// ======================================================
app.listen(PORT, () => {
  console.log(`CredoConnect backend server running on port ${PORT}`);
});
