#!/usr/bin/env python3
"""
MQTT Receiver - Subscribes to a topic and sends messages to API endpoint
"""

import paho.mqtt.client as mqtt
import requests
import json
import time

# MQTT Configuration
BROKER_ADDRESS = "localhost"  # Change to your MQTT broker address
BROKER_PORT = 1883
TOPIC = "test/topic"  # Change to your desired topic
CLIENT_ID = "mqtt_receiver"

# API Configuration
API_ENDPOINT = "http://localhost:3000/ttc/api/offense-move"

# Callback when the client connects to the broker
def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"✓ Connected to MQTT Broker at {BROKER_ADDRESS}:{BROKER_PORT}")
        print(f"✓ Subscribing to topic: {TOPIC}")
        client.subscribe(TOPIC)
        print("⏳ Waiting for messages...\n")
    else:
        print(f"✗ Failed to connect, return code {rc}")

# Callback when a message is received
def on_message(client, userdata, msg):
    print(f"📩 Message received on topic: {msg.topic}")
    payload = msg.payload.decode('utf-8')
    print(f"   Payload: {payload}")
    print(f"   QoS: {msg.qos}")
    
    # Send data to API endpoint
    try:
        # Parse payload as JSON
        try:
            data = json.loads(payload)
            print(f"✓ Parsed JSON data successfully")
        except json.JSONDecodeError as e:
            print(f"✗ Failed to parse JSON: {e}")
            print(f"⚠ Skipping API call - invalid JSON format")
            print("-" * 50)
            return
        
        print(f"🚀 Sending data to API: {API_ENDPOINT}")
        print(f"   Data: {json.dumps(data, indent=2)}")
        
        headers = {
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            API_ENDPOINT,
            json=data,
            headers=headers,
            timeout=5
        )
        
        if response.status_code in [200, 201]:
            print(f"✓ API Response: {response.status_code} - Success")
            try:
                response_data = response.json()
                print(f"   Response: {json.dumps(response_data, indent=2)}")
            except:
                print(f"   Response: {response.text[:200]}")
        else:
            print(f"⚠ API Error: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print(f"✗ Failed to connect to API - Is the server running?")
    except requests.exceptions.Timeout:
        print(f"✗ API request timeout")
    except requests.exceptions.RequestException as e:
        print(f"✗ Failed to send to API: {e}")
    
    print("-" * 50)

# Callback when subscription is confirmed
def on_subscribe(client, userdata, mid, granted_qos):
    print(f"✓ Subscription confirmed with QoS: {granted_qos[0]}\n")

# Callback when disconnected
def on_disconnect(client, userdata, rc):
    if rc != 0:
        print(f"⚠ Unexpected disconnection. Return code: {rc}")
        print("Attempting to reconnect...")

def main():
    # Create MQTT client instance
    client = mqtt.Client(client_id=CLIENT_ID)
    
    # Assign callback functions
    client.on_connect = on_connect
    client.on_message = on_message
    client.on_subscribe = on_subscribe
    client.on_disconnect = on_disconnect
    
    # Optional: Set username and password if your broker requires authentication
    # client.username_pw_set("your_username", "your_password")
    
    try:
        # Connect to the broker
        print(f"🔌 Connecting to MQTT Broker at {BROKER_ADDRESS}:{BROKER_PORT}...")
        client.connect(BROKER_ADDRESS, BROKER_PORT, keepalive=60)
        
        # Start the loop to process received messages
        client.loop_forever()
        
    except KeyboardInterrupt:
        print("\n\n⏹ Stopping MQTT Receiver...")
        client.disconnect()
        print("✓ Disconnected from broker")
        
    except Exception as e:
        print(f"✗ Error: {e}")

if __name__ == "__main__":
    main()