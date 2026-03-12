# MQTT Topics - Tap & Pay

This document outlines the MQTT topics and payload structures used for communication between the hardware (ESP32/RFID Scanner) and the backend server.

**Broker:** `mqtt://157.173.101.159:1883`  
**Team ID:** `team_rdf`

## 📡 Inbound Topics (Hardware → Backend)

These topics are subscribed to by the backend to receive real-time updates from the scanning devices.

### 1. Card Status
*   **Topic:** `rfid/team_rdf/card/status`
*   **Payload:** `{ "uid": "STRING", "present": BOOLEAN, "deviceId": "STRING" }`
*   **Description:** Triggered when a card is scanned or detected in the field.

### 2. Card Balance Update
*   **Topic:** `rfid/team_rdf/card/balance`
*   **Payload:** `{ "uid": "STRING", "new_balance": NUMBER, "deviceId": "STRING" }`
*   **Description:** Sent by the device after a successful balance check or update.

### 3. Card Removed
*   **Topic:** `rfid/team_rdf/card/removed`
*   **Payload:** `{ "uid": "STRING", "deviceId": "STRING" }`
*   **Description:** Triggered when a card leaves the RFID field.

---

## 📤 Outbound Topics (Backend → Hardware)

These topics are used by the backend to command the hardware or notify it of successful transactions.

### 1. Top Up Confirmation
*   **Topic:** `rfid/team_rdf/card/topup`
*   **Payload:** `{ "uid": "STRING", "amount": NUMBER, "deviceId": "STRING" }`
*   **Description:** Informs the device that a top-up was successful so it can update its local state/display.

### 2. Payment Confirmation / Result
*   **Topic:** `rfid/team_rdf/card/payment`
*   **Payload:** 
    ```json
    {
      "uid": "STRING",
      "amount": NUMBER, 
      "deducted": NUMBER,
      "description": "STRING",
      "status": "success" | "failed",
      "deviceId": "STRING"
    }
    ```
*   **Description:** Published after a payment attempt. The hardware uses this to show success/failure feedback to the user.
