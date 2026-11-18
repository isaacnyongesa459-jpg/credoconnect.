'use strict';

const MOCK_PRODUCTS = Object.freeze([
  { id: 'mock-sf-data-100', network: 'safaricom', category: 'data', name: 'Mock 1GB Daily', quantity: '1GB', priceKes: 50, validity: '24 hours' },
  { id: 'mock-sf-data-250', network: 'safaricom', category: 'data', name: 'Mock 5GB Weekly', quantity: '5GB', priceKes: 250, validity: '7 days' },
  { id: 'mock-sf-sms-20', network: 'safaricom', category: 'sms', name: 'Mock 200 SMS', quantity: '200 SMS', priceKes: 20, validity: '7 days' },
  { id: 'mock-sf-voice-50', network: 'safaricom', category: 'voice', name: 'Mock 50 Minutes', quantity: '50 minutes', priceKes: 50, validity: '24 hours' },
  { id: 'mock-ar-data-100', network: 'airtel', category: 'data', name: 'Mock 1.5GB Daily', quantity: '1.5GB', priceKes: 100, validity: '24 hours' },
  { id: 'mock-ar-data-300', network: 'airtel', category: 'data', name: 'Mock 10GB Weekly', quantity: '10GB', priceKes: 300, validity: '7 days' },
  { id: 'mock-ar-sms-30', network: 'airtel', category: 'sms', name: 'Mock 300 SMS', quantity: '300 SMS', priceKes: 30, validity: '7 days' },
  { id: 'mock-ar-voice-75', network: 'airtel', category: 'voice', name: 'Mock 75 Minutes', quantity: '75 minutes', priceKes: 75, validity: '24 hours' },
]);

function getMockCatalogue({ network, category }) {
  return {
    available: true,
    mock: true,
    message: 'Local mock catalogue for UI testing only. These are not real products or prices.',
    network,
    category,
    products: MOCK_PRODUCTS.filter((product) => product.network === network && product.category === category),
  };
}

module.exports = { MOCK_PRODUCTS, getMockCatalogue };
