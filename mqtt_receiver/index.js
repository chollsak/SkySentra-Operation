const mqtt = require('mqtt');
const axios = require('axios');
require('dotenv').config();

// Configuration
const MQTT_BROKER = process.env.MQTT_BROKER || 'broker.hivemq.com';
const MQTT_TOPIC = process.env.MQTT_TOPIC || 'TGR2568/66';
const MQTT_USERNAME = process.env.MQTT_USERNAME || '';
const MQTT_PASSWORD = process.env.MQTT_PASSWORD || '';
const API_URL = process.env.API_URL || 'http://localhost:3000/ttc/api/offense-move';
const API_TIMEOUT = parseInt(process.env.API_TIMEOUT || '1000000000000');

// Statistics
let stats = {
  received: 0,
  sent: 0,
  failed: 0
};

// MQTT Client options
const mqttOptions = {
  clientId: `mqtt_bridge_${Math.random().toString(16).slice(3)}`,
  clean: true,
  reconnectPeriod: 1000,
};

// Add authentication if provided
if (MQTT_USERNAME && MQTT_PASSWORD) {
  mqttOptions.username = MQTT_USERNAME;
  mqttOptions.password = MQTT_PASSWORD;
}

// Display startup info
console.log('=' .repeat(60));
console.log('🌉 MQTT to HTTP Bridge');
console.log('=' .repeat(60));
console.log(`MQTT Broker: ${MQTT_BROKER}`);
console.log(`MQTT Topic: ${MQTT_TOPIC}`);
console.log(`API Endpoint: ${API_URL}`);
console.log('=' .repeat(60));

// Connect to MQTT broker
console.log('🔄 Connecting to MQTT broker...');
const client = mqtt.connect(MQTT_BROKER, mqttOptions);

// Connection event
client.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  console.log(`📡 Subscribing to topic: ${MQTT_TOPIC}`);
  
  client.subscribe(MQTT_TOPIC, (err) => {
    if (err) {
      console.error('❌ Failed to subscribe:', err);
    } else {
      console.log('🎧 Listening for messages...');
      console.log('=' .repeat(60));
    }
  });
});

// Message event
client.on('message', async (topic, message) => {
  stats.received++;
  
  try {
    // Parse message
    const data = JSON.parse(message.toString());
    console.log(`\n📨 Message #${stats.received} received from topic: ${topic}`);
    console.log('📦 Data:', JSON.stringify(data, null, 2));
    
    // Send to API
    console.log(`🚀 Sending to API: ${API_URL}`);
    const response = await axios.post(API_URL, data, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: API_TIMEOUT
    });
    
    stats.sent++;
    console.log(`✅ API Response Status: ${response.status}`);
    console.log('📥 API Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    stats.failed++;
    console.error('❌ Error processing message:');
    
    if (error.response) {
      // API responded with error
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
    } else if (error.request) {
      // No response received
      console.error(`   No response from API (timeout or connection error)`);
    } else if (error instanceof SyntaxError) {
      // JSON parse error
      console.error('   Invalid JSON format in MQTT message');
      console.error(`   Raw message: ${message.toString()}`);
    } else {
      // Other errors
      console.error('   Error:', error.message);
    }
    
  } finally {
    console.log(`📊 Stats: Received=${stats.received}, Sent=${stats.sent}, Failed=${stats.failed}`);
    console.log('=' .repeat(60));
  }
});

// Error event
client.on('error', (error) => {
  console.error('❌ MQTT Error:', error);
});

// Disconnect event
client.on('close', () => {
  console.log('👋 Disconnected from MQTT broker');
});

// Reconnect event
client.on('reconnect', () => {
  console.log('🔄 Reconnecting to MQTT broker...');
});

// Graceful shutdown
function gracefulShutdown() {
  console.log('\n⏹️  Shutting down...');
  console.log('📊 Final Statistics:');
  console.log(`   Received: ${stats.received}`);
  console.log(`   Sent: ${stats.sent}`);
  console.log(`   Failed: ${stats.failed}`);
  
  const successRate = stats.received > 0 ? (stats.sent / stats.received * 100).toFixed(2) : 0;
  console.log(`   Success Rate: ${successRate}%`);
  
  client.end(true, () => {
    console.log('MQTT client disconnected.');
    process.exit(0);
  });
}

process.on('SIGINT', gracefulShutdown); // Handle Ctrl+C
process.on('SIGTERM', gracefulShutdown); // Handle system shutdown