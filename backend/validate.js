#!/usr/bin/env node

/**
 * VeriBite Backend Validation Script
 * Validates that all services are working correctly
 */

const axios = require('axios');
const { createFoodClassifier } = require('./dist/services/classifier');
const { createIPFSService } = require('./dist/services/ipfs');

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'test-admin-key';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testHealthEndpoint() {
  log('\n🏥 Testing Health Endpoint...', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status === 200 && response.data.status === 'OK') {
      log('✅ Health endpoint working', 'green');
      return true;
    } else {
      log('❌ Health endpoint returned unexpected response', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Health endpoint failed: ${error.message}`, 'red');
    return false;
  }
}

async function testFoodClassifier() {
  log('\n🍕 Testing Food Classifier...', 'blue');
  try {
    const classifier = createFoodClassifier();
    const testCases = [
      { text: 'These organic tomatoes are fresh ingredients', expectedCategory: 'Ingredient' },
      { text: 'This pizza dish is delicious', expectedCategory: 'Dish' },
      { text: 'This restaurant serves great food', expectedCategory: 'Restaurant' }
    ];

    let passed = 0;
    for (const testCase of testCases) {
      const result = await classifier.classify(testCase.text);
      if (result.isFood && result.category === testCase.expectedCategory) {
        log(`✅ Classified "${testCase.text}" as ${result.category}`, 'green');
        passed++;
      } else {
        log(`❌ Failed to classify "${testCase.text}" correctly`, 'red');
      }
    }

    if (passed === testCases.length) {
      log('✅ Food classifier working correctly', 'green');
      return true;
    } else {
      log(`❌ Food classifier failed ${testCases.length - passed} tests`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Food classifier test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testIPFSService() {
  log('\n🌐 Testing IPFS Service...', 'blue');
  try {
    const ipfsService = createIPFSService();
    const testData = {
      test: 'validation',
      timestamp: Date.now(),
      predictionText: 'Test IPFS functionality'
    };

    const result = await ipfsService.pinJSON(testData);
    if (result.cid && result.hash && result.size > 0) {
      log(`✅ IPFS service working - CID: ${result.cid}`, 'green');
      return true;
    } else {
      log('❌ IPFS service returned invalid result', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ IPFS service test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testPredictionAPI() {
  log('\n🔮 Testing Prediction API...', 'blue');
  try {
    const predictionData = {
      userAddress: '0x1234567890123456789012345678901234567890',
      predictionText: 'These organic tomatoes will taste amazing',
      category: 'Ingredient',
      relayerMode: true
    };

    const response = await axios.post(`${BASE_URL}/api/predictions`, predictionData, {
      headers: { 'Content-Type': 'application/json' }
    });

    if (response.status === 201 && response.data.success) {
      log('✅ Prediction creation working', 'green');
      
      // Test getting predictions
      const getResponse = await axios.get(`${BASE_URL}/api/predictions`);
      if (getResponse.status === 200 && getResponse.data.success) {
        log('✅ Prediction retrieval working', 'green');
        return true;
      } else {
        log('❌ Prediction retrieval failed', 'red');
        return false;
      }
    } else {
      log('❌ Prediction creation failed', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Prediction API test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testAdminAPI() {
  log('\n👨‍💼 Testing Admin API...', 'blue');
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/stats`, {
      headers: { 'x-admin-api-key': ADMIN_API_KEY }
    });

    if (response.status === 200 && response.data.success) {
      log('✅ Admin API working', 'green');
      log(`   Platform: ${response.data.stats.platform}`, 'blue');
      log(`   Total Predictions: ${response.data.stats.totalPredictions}`, 'blue');
      return true;
    } else {
      log('❌ Admin API returned unexpected response', 'red');
      return false;
    }
  } catch (error) {
    if (error.response && error.response.status === 401) {
      log('⚠️  Admin API authentication failed - check ADMIN_API_KEY', 'yellow');
      return false;
    }
    log(`❌ Admin API test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testErrorHandling() {
  log('\n🚨 Testing Error Handling...', 'blue');
  try {
    // Test invalid endpoint
    const response = await axios.get(`${BASE_URL}/api/nonexistent`);
    log('❌ Error handling failed - should return 404', 'red');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      log('✅ 404 error handling working', 'green');
    } else {
      log('❌ Unexpected error response', 'red');
      return false;
    }
  }

  try {
    // Test invalid prediction data
    const response = await axios.post(`${BASE_URL}/api/predictions`, {
      invalidField: 'test'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    log('❌ Validation error handling failed', 'red');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 400) {
      log('✅ Validation error handling working', 'green');
      return true;
    } else {
      log('❌ Unexpected validation error response', 'red');
      return false;
    }
  }
}

async function runValidation() {
  log('🚀 VeriBite Backend Validation Starting...', 'blue');
  log('===============================================', 'blue');

  const tests = [
    { name: 'Health Endpoint', test: testHealthEndpoint },
    { name: 'Food Classifier', test: testFoodClassifier },
    { name: 'IPFS Service', test: testIPFSService },
    { name: 'Prediction API', test: testPredictionAPI },
    { name: 'Admin API', test: testAdminAPI },
    { name: 'Error Handling', test: testErrorHandling }
  ];

  const results = [];
  
  for (const { name, test } of tests) {
    try {
      const result = await test();
      results.push({ name, success: result });
    } catch (error) {
      log(`❌ ${name} test crashed: ${error.message}`, 'red');
      results.push({ name, success: false });
    }
  }

  log('\n📊 Validation Results:', 'blue');
  log('===============================================', 'blue');
  
  let passed = 0;
  results.forEach(({ name, success }) => {
    if (success) {
      log(`✅ ${name}: PASSED`, 'green');
      passed++;
    } else {
      log(`❌ ${name}: FAILED`, 'red');
    }
  });

  const total = results.length;
  log(`\n📈 Summary: ${passed}/${total} tests passed`, passed === total ? 'green' : 'yellow');

  if (passed === total) {
    log('\n🎉 All validations passed! Backend is ready for use.', 'green');
    process.exit(0);
  } else {
    log(`\n⚠️  ${total - passed} validations failed. Please check configuration and services.`, 'red');
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  log('\n\n👋 Validation interrupted by user', 'yellow');
  process.exit(130);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`\n💥 Unhandled rejection at: ${promise}, reason: ${reason}`, 'red');
  process.exit(1);
});

// Run validation
runValidation().catch(error => {
  log(`\n💥 Validation script failed: ${error.message}`, 'red');
  process.exit(1);
});