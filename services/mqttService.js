const mqtt = require('mqtt');

class MQTTService {
  constructor(brokerUrl) {
    this.brokerUrl = brokerUrl;
    this.client = null;
    this.isConnected = false;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.client = mqtt.connect(this.brokerUrl);
      
      this.client.on('connect', () => {
        console.log(`✅ Connected to MQTT broker at ${this.brokerUrl}`);
        this.isConnected = true;
        resolve();
      });
      
      this.client.on('error', (error) => {
        console.error('❌ MQTT connection error:', error);
        this.isConnected = false;
        reject(error);
      });
      
      this.client.on('close', () => {
        console.log('🔌 MQTT connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnect', () => {
        console.log('🔄 MQTT reconnecting...');
      });
    });
  }

  publish(topic, message, options = {}) {
    if (!this.client || !this.isConnected) {
      console.error('❌ MQTT client not connected. Cannot publish message:', message);
      return false;
    }

    this.client.publish(topic, message, options, (error) => {
      if (error) {
        console.error('❌ Error publishing MQTT message:', error);
      } else {
        console.log(`📤 Published MQTT message: "${message}" to topic: "${topic}"`);
      }
    });
    return true;
  }

  // Subscribe to a topic
  subscribe(topic, callback) {
    if (!this.client || !this.isConnected) {
      console.error('❌ MQTT client not connected. Cannot subscribe to topic:', topic);
      return false;
    }

    this.client.subscribe(topic, (error) => {
      if (error) {
        console.error('❌ Error subscribing to topic:', topic, error);
      } else {
        console.log(`📥 Subscribed to topic: "${topic}"`);
      }
    });

    if (callback) {
      this.client.on('message', (receivedTopic, message) => {
        if (receivedTopic === topic) {
          callback(receivedTopic, message.toString());
        }
      });
    }
    return true;
  }

  // Unsubscribe from a topic
  unsubscribe(topic) {
    if (!this.client || !this.isConnected) {
      console.error('❌ MQTT client not connected. Cannot unsubscribe from topic:', topic);
      return false;
    }

    this.client.unsubscribe(topic, (error) => {
      if (error) {
        console.error('❌ Error unsubscribing from topic:', topic, error);
      } else {
        console.log(`📤 Unsubscribed from topic: "${topic}"`);
      }
    });
    return true;
  }

  // Get broker URL
  getBrokerUrl() {
    return this.brokerUrl;
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

module.exports = MQTTService;
