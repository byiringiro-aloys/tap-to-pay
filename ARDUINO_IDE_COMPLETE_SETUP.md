# Complete Arduino IDE Setup for ESP8266 - Step by Step

## 📥 Part 1: Download and Install Arduino IDE

### Step 1: Download Arduino IDE

1. Go to: **https://www.arduino.cc/en/software**
2. Download the version for your operating system:
   - **Windows**: Click "Windows Win 10 and newer" 
   - **macOS**: Click "macOS"
   - **Linux**: Click "Linux AppImage 64 bits" or "Linux ZIP file 64 bits"

3. **For Windows users**: 
   - Download the `.exe` installer (easier) or `.zip` if you prefer portable
   - Run the installer and follow the installation wizard
   - Accept the license agreement
   - Choose installation location (default is fine)
   - Install

4. **For macOS users**:
   - Download the `.dmg` file
   - Open the downloaded file
   - Drag Arduino app to Applications folder
   - Open from Applications

5. **For Linux users**:
   - Download AppImage or ZIP
   - Make executable: `chmod +x arduino-ide*.AppImage`
   - Run: `./arduino-ide*.AppImage`

### Step 2: Launch Arduino IDE

1. Open Arduino IDE
2. First launch may take a moment to initialize
3. You should see the main Arduino IDE window with a blank sketch

---

## 🔧 Part 2: Add ESP8266 Board Support

### Step 3: Open Preferences

1. In Arduino IDE, go to the menu:
   - **Windows/Linux**: Click **File** → **Preferences**
   - **macOS**: Click **Arduino IDE** → **Preferences** (or **Settings**)

2. A "Preferences" window will open

### Step 4: Add ESP8266 Board Manager URL

1. In the Preferences window, find the field labeled:
   **"Additional Board Manager URLs"**

2. Click the small **icon/button** on the right side of this field
   (It looks like a window/document icon)

3. A new window opens where you can add multiple URLs

4. **Copy and paste** this URL:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```

5. If there are already other URLs in the list:
   - Each URL should be on a separate line
   - Just add the ESP8266 URL on a new line
   - Click **OK** to close the URL window

6. Click **OK** to close the Preferences window

### Step 5: Open Boards Manager

1. Go to menu: **Tools** → **Board** → **Boards Manager...**
   
2. A new "Boards Manager" window will open on the left side

3. Wait a few seconds for the list to load

### Step 6: Install ESP8266 Board Package

1. In the **search box** at the top of Boards Manager, type:
   ```
   esp8266
   ```

2. You should see: **"esp8266 by ESP8266 Community"**

3. Click on it to expand the information

4. You'll see:
   - Version number (select the latest, e.g., 3.1.2)
   - An **"Install"** button

5. Click the **"Install"** button

6. **Wait for download and installation** (may take 2-5 minutes)
   - You'll see a progress bar
   - Status will show "Installing..."
   - When done, it will show "INSTALLED" with the version number

7. Once installed, you'll see:
   - A green "INSTALLED" label
   - Version number
   - An "Uninstall" button (don't click this!)

8. Click **"Close"** to close Boards Manager

### Step 7: Verify ESP8266 Installation

1. Go to: **Tools** → **Board** → (scroll down)

2. You should now see a new section: **"ESP8266 Boards (X.X.X)"**
   - Where X.X.X is the version number

3. Under "ESP8266 Boards", you'll see many board options:
   - Generic ESP8266 Module
   - NodeMCU 1.0 (ESP-12E Module) ← **Most common for NodeMCU**
   - LOLIN(WEMOS) D1 R2 & mini ← **For Wemos D1 Mini**
   - And many others...

✅ **Success!** ESP8266 support is now installed!

---

## 📚 Part 3: Install Required Libraries

Now you need to install 3 libraries for the RFID project:

### Step 8: Open Library Manager

1. Go to menu: **Sketch** → **Include Library** → **Manage Libraries...**

2. The "Library Manager" window opens on the left side

3. Wait for the library list to load (may take a few seconds)

### Step 9: Install PubSubClient (for MQTT)

1. In the **search box**, type:
   ```
   PubSubClient
   ```

2. Find: **"PubSubClient by Nick O'Leary"**
   - Make sure it says "by Nick O'Leary"
   - This is the most popular MQTT library

3. Click on it to expand

4. Select **version 2.8** or newer from dropdown

5. Click **"Install"** button

6. Wait for installation (few seconds)

7. You'll see "INSTALLED" when done

### Step 10: Install MFRC522 (for RFID Reader)

1. In the **search box**, type:
   ```
   MFRC522
   ```

2. Find: **"MFRC522 by GithubCommunity"**

3. Click on it to expand

4. Select **version 1.4.10** or newer

5. Click **"Install"** button

6. Wait for installation

7. You'll see "INSTALLED" when done

### Step 11: Install ArduinoJson (for JSON handling)

1. In the **search box**, type:
   ```
   ArduinoJson
   ```

2. Find: **"ArduinoJson by Benoit Blanchon"**

3. Click on it to expand

4. **IMPORTANT**: Select **version 6.x** (NOT 7.x)
   - Example: 6.21.3
   - Version 7 has different syntax and won't work with the code

5. Click **"Install"** button

6. If it asks about dependencies, click **"Install All"**

7. Wait for installation

8. You'll see "INSTALLED" when done

9. Click **"Close"** to close Library Manager

✅ **All libraries installed!**

---

## ⚙️ Part 4: Configure Board Settings

### Step 12: Select Your ESP8266 Board

1. Go to: **Tools** → **Board** → **ESP8266 Boards**

2. Select your specific board:
   - **NodeMCU v1.0**: Choose **"NodeMCU 1.0 (ESP-12E Module)"**
   - **Wemos D1 Mini**: Choose **"LOLIN(WEMOS) D1 R2 & mini"**
   - **Generic ESP8266**: Choose **"Generic ESP8266 Module"**

Most users have NodeMCU, so select **"NodeMCU 1.0 (ESP-12E Module)"**

### Step 13: Configure Board Parameters

After selecting the board, configure these settings in the **Tools** menu:

1. **Upload Speed**: 
   - Go to: **Tools** → **Upload Speed** → Select **115200**

2. **CPU Frequency**:
   - Go to: **Tools** → **CPU Frequency** → Select **80 MHz**

3. **Flash Size**:
   - Go to: **Tools** → **Flash Size** → Select **4MB (FS:2MB OTA:~1019KB)**
   - (Most ESP8266 boards have 4MB flash)

4. **Port** (DO THIS WHEN ESP8266 IS CONNECTED):
   - Connect your ESP8266 to computer via USB cable
   - Go to: **Tools** → **Port** → Select the port
   - **Windows**: Will show as "COM3", "COM4", etc.
   - **macOS**: Will show as "/dev/cu.usbserial-XXXX" or "/dev/cu.wchusbserial-XXXX"
   - **Linux**: Will show as "/dev/ttyUSB0" or "/dev/ttyUSB1"

### Step 14: Install USB Drivers (If Needed)

If you don't see any port when ESP8266 is connected:

**For Windows/macOS/Linux:**

Your ESP8266 likely has one of these chips:
- **CH340** chip
- **CP2102** chip

**Download drivers:**

1. **CH340 Driver**:
   - Windows: https://bit.ly/44WdzVf (search "CH340 driver windows")
   - macOS: https://github.com/adrianmihalko/ch340g-ch34g-ch34x-mac-os-x-driver
   - Linux: Usually built-in

2. **CP2102 Driver**:
   - All platforms: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers

After installing drivers:
- Restart Arduino IDE
- Reconnect ESP8266
- Check **Tools** → **Port** again

---

## 🎯 Part 5: Open and Configure Your Project

### Step 15: Open the Arduino Sketch

1. Navigate to your project folder:
   ```
   rfid-topup-system/esp8266/rfid_topup_arduino/
   ```

2. Double-click on: **rfid_topup_arduino.ino**
   - Arduino IDE should open with the sketch loaded

3. OR in Arduino IDE:
   - Go to: **File** → **Open...**
   - Browse to the `.ino` file
   - Click **Open**

### Step 16: Configure WiFi Credentials

In the Arduino IDE, find these lines near the top:

```cpp
// WiFi Configuration
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
```

**Change them to your actual WiFi:**

```cpp
// WiFi Configuration
const char* WIFI_SSID = "MyHomeWiFi";        // ← Your WiFi name
const char* WIFI_PASSWORD = "mypassword123";  // ← Your WiFi password
```

**Important Notes:**
- ⚠️ ESP8266 **only supports 2.4GHz WiFi** (NOT 5GHz)
- Keep the quotation marks
- WiFi name is case-sensitive
- Make sure your WiFi doesn't have special characters that could cause issues

### Step 17: Verify Configuration

Double-check these settings in the code:

```cpp
const char* MQTT_BROKER = "broker.benax.rw";  // ✓ Should be this
const int MQTT_PORT = 1883;                    // ✓ Should be this
const char* TEAM_ID = "rdf";                   // ✓ Should be this
```

These should already be correct from the files I provided.

---

## ✅ Part 6: Compile and Upload

### Step 18: Verify/Compile the Code

1. Click the **✓ (Checkmark)** button at the top left
   - This is the "Verify" button
   - It compiles the code to check for errors

2. You'll see messages at the bottom:
   ```
   Compiling sketch...
   Sketch uses XXXXX bytes...
   Global variables use XXXXX bytes...
   ```

3. If successful, you'll see:
   ```
   Done compiling.
   ```

4. **If you get errors:**
   - Make sure all libraries are installed
   - Check that you selected the correct board
   - Read the error message for clues

### Step 19: Upload to ESP8266

1. **Connect ESP8266** to your computer via USB cable

2. **Select the correct Port** (see Step 13)

3. Click the **→ (Arrow)** button at the top left
   - This is the "Upload" button

4. You'll see:
   ```
   Compiling sketch...
   Uploading...
   ```

5. ESP8266's LED will blink during upload

6. Upload takes about 10-30 seconds

7. When successful, you'll see:
   ```
   Leaving...
   Hard resetting via RTS pin...
   Done uploading.
   ```

**Common Upload Issues:**

- **"Serial port not found"**: 
  - Install USB drivers (Step 14)
  - Try a different USB cable (must be data cable, not charge-only)

- **"espcomm_sync failed"**:
  - Press and HOLD the "FLASH" or "BOOT" button on ESP8266
  - Click Upload while holding the button
  - Release button when upload starts

- **"Board not found"**:
  - Check correct port is selected
  - Try unplugging and replugging USB cable

---

## 🔍 Part 7: Monitor Serial Output

### Step 20: Open Serial Monitor

1. Click: **Tools** → **Serial Monitor**
   - Or click the magnifying glass icon (🔍) at top right

2. A new window opens at the bottom

3. **Set baud rate** to **115200** (bottom right dropdown)

4. You should see output like:
   ```
   ==================================================
   RFID Card Top-Up System - ESP8266
   Team ID: rdf
   ==================================================
   Connecting to WiFi: YourWiFiName
   ....
   WiFi Connected!
   IP Address: 192.168.1.xxx
   Connecting to MQTT broker: broker.benax.rw
   MQTT Connected!
   Subscribed to: rfid/rdf/card/topup
   RFID reader initialized
   ==================================================
   System ready. Waiting for cards...
   ==================================================
   ```

### Step 21: Test RFID Card Reading

1. Place an RFID card on the MFRC522 reader

2. You should see in Serial Monitor:
   ```
   Card detected: A1B2C3D4
   Published status: {"uid":"A1B2C3D4","balance":0}
   ```

3. Remove the card:
   ```
   Card removed: A1B2C3D4
   ```

✅ **Success! Your ESP8266 is working!**

---

## 📋 Complete Checklist

Print this checklist and check off each item:

### Software Installation
- [ ] Arduino IDE downloaded and installed
- [ ] ESP8266 board manager URL added
- [ ] ESP8266 boards package installed
- [ ] PubSubClient library installed
- [ ] MFRC522 library installed
- [ ] ArduinoJson 6.x library installed

### Hardware Setup
- [ ] ESP8266 connected to computer via USB
- [ ] USB drivers installed (if needed)
- [ ] MFRC522 wired to ESP8266 correctly
- [ ] Power connections verified (3.3V, NOT 5V!)

### Configuration
- [ ] Correct board selected (NodeMCU 1.0)
- [ ] Correct port selected
- [ ] Upload speed set to 115200
- [ ] WiFi SSID configured
- [ ] WiFi password configured
- [ ] MQTT broker is "broker.benax.rw"
- [ ] Team ID is "rdf"

### Testing
- [ ] Code compiles without errors
- [ ] Code uploads successfully
- [ ] Serial monitor shows WiFi connected
- [ ] Serial monitor shows MQTT connected
- [ ] RFID card detected when scanned
- [ ] Card UID appears in serial monitor

---

## 🆘 Troubleshooting Guide

### Issue: "ESP8266 boards not showing in Board menu"

**Solution:**
1. Close and reopen Arduino IDE
2. Check Preferences → Additional Board Manager URLs
3. Open Boards Manager and reinstall ESP8266
4. Restart computer if needed

### Issue: "Library not found" errors when compiling

**Solution:**
1. Open Library Manager
2. Search for the missing library
3. Install it
4. Restart Arduino IDE

### Issue: "Port is busy" or "Access denied"

**Solution:**
- Close Serial Monitor before uploading
- Close any other programs using the serial port
- **Windows**: Check Device Manager for COM port conflicts
- **Linux**: Add user to dialout group: `sudo usermod -a -G dialout $USER`

### Issue: ESP8266 not connecting to WiFi

**Solution:**
- Verify WiFi SSID and password are correct
- Check WiFi is 2.4GHz (not 5GHz)
- Move ESP8266 closer to router
- Check if WiFi has special authentication (WPA2 should work)

### Issue: MQTT connection failed

**Solution:**
- Verify broker address: "broker.benax.rw"
- Check port is 1883
- Test broker connectivity: `ping broker.benax.rw`
- Check firewall isn't blocking port 1883

---

## 📖 Additional Resources

### Official Documentation
- Arduino IDE: https://www.arduino.cc/en/Guide
- ESP8266 Arduino Core: https://arduino-esp8266.readthedocs.io/
- MFRC522 Library: https://github.com/miguelbalboa/rfid

### Video Tutorials
- Search YouTube for: "Arduino IDE ESP8266 setup"
- Search YouTube for: "MFRC522 RFID ESP8266"

### Community Support
- Arduino Forum: https://forum.arduino.cc/
- ESP8266 Community: https://www.esp8266.com/

---

## 🎉 You're Ready!

Once you've completed all steps and verified everything works:

1. ✅ ESP8266 connects to WiFi
2. ✅ ESP8266 connects to MQTT broker
3. ✅ RFID cards are detected
4. ✅ Card data is published to MQTT

**Next steps:**
- Deploy backend to VPS (see main README)
- Open web dashboard
- Test complete top-up flow

Good luck with your project! 🚀
