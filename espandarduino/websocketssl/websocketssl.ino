#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include "esp_camera.h"
//#include "FS.h"
//#include "SD_MMC.h"

const char* ssidList[] = {"Tenda_068F20", "iPhone13", "iPhone"};
const char* passList[] = {"windunder632", "00000000", "00000000"};
const int networkCount = 3;

const char* ws_host = "esp32cambackend.onrender.com";
const uint16_t ws_port = 443;
const char* ws_path = "/ws";

WebSocketsClient webSocket;

#define PWDN_GPIO_NUM  32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM  0
#define SIOD_GPIO_NUM  26
#define SIOC_GPIO_NUM  27

#define Y9_GPIO_NUM    35
#define Y8_GPIO_NUM    34
#define Y7_GPIO_NUM    39
#define Y6_GPIO_NUM    36
#define Y5_GPIO_NUM    21
#define Y4_GPIO_NUM    19
#define Y3_GPIO_NUM    18
#define Y2_GPIO_NUM    5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM  23
#define PCLK_GPIO_NUM  22

#define FLASH_LED_PIN 4

unsigned long lastRequest = 0;
const unsigned long interval = 75;

void initCamera() {

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.frame_size = FRAMESIZE_UXGA;
  config.jpeg_quality = 24;
  config.grab_mode = CAMERA_GRAB_LATEST;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.fb_count = 2;

   // camera init
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }

  //if (!SD_MMC.begin()) {
  //  Serial.println("SD kártya hiba");
  //  return;
  //}

  sensor_t *s = esp_camera_sensor_get();
  // initial sensors are flipped vertically and colors are a bit saturated
  if (s->id.PID == OV3660_PID) {
    s->set_vflip(s, 1);        // flip it back
    s->set_brightness(s, 1);   // up the brightness just a bit
    s->set_saturation(s, -2);  // lower the saturation
  }
  // drop down frame size for higher initial frame rate
  if (config.pixel_format == PIXFORMAT_JPEG) {
    s->set_framesize(s, FRAMESIZE_QVGA);
  }

}

void connectBestNetwork() {

  Serial.println("Network Searching...");
  int n = WiFi.scanNetworks();

  if (n == 0) {
    Serial.println("Can't find networks");
    return;
  }

  Serial.println("Networks:");
  for (int i = 0; i < n; i++) {
    Serial.printf("%d: %s (%d dBm)\n", i, WiFi.SSID(i).c_str(), WiFi.RSSI(i));
  }

  int bestNetwork = -1;
  int bestRSSI = -1000;

  for (int i = 0; i < n; i++) {
    for (int j = 0; j < networkCount; j++) {
      if (WiFi.SSID(i) == ssidList[j]) {
        if (WiFi.RSSI(i) > bestRSSI) {
          bestRSSI = WiFi.RSSI(i);
          bestNetwork = j;
        }
      }
    }
  }

  if (bestNetwork >= 0) {
    Serial.printf("Connect to: %s\n", ssidList[bestNetwork]);
    WiFi.begin(ssidList[bestNetwork], passList[bestNetwork]);

    unsigned long startAttemptTime = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
      Serial.print(".");
      delay(500);
    }

    if (WiFi.status() == WL_CONNECTED) {
      Serial.println("\nConnection succesfull!");
      Serial.print("IP: ");
      Serial.println(WiFi.localIP());
    } else {
      Serial.println("\nCan't connect");
    }

  } else {
    Serial.println("Can't connect to any of the finded networks");
  }

}
/*
void shootImage(){

  camera_fb_t* fb = esp_camera_fb_get();

  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  if (fb->format != PIXFORMAT_JPEG) {
    Serial.println("Not JPEG format");
    esp_camera_fb_return(fb);
    return;
  }

  String path = "/kep" + String(random(0xFFFFFF), HEX) + ".jpg";

  File file = SD_MMC.open(path.c_str(), FILE_WRITE);

  if (!file) {
    Serial.println("Nem lehet megnyitni a fájlt: " + path);
  } else {
    file.write(fb->buf, fb->len);
    file.close();
  }

  esp_camera_fb_return(fb);

}
*/
void sendCameraImage() {

  camera_fb_t* fb = esp_camera_fb_get();

  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }

  if (fb->format != PIXFORMAT_JPEG) {
    Serial.println("Not JPEG format");
    esp_camera_fb_return(fb);
    return;
  }

  webSocket.sendBIN(fb->buf, fb->len);

  esp_camera_fb_return(fb);

}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.printf("[WSc] Disconnected!\n");
      break;
    case WStype_CONNECTED:
      Serial.printf("[WSc] Connected to url: %s\n",  payload);
      break;
    case WStype_TEXT:
    {

		StaticJsonDocument<200> doc;
      if (deserializeJson(doc, payload) == DeserializationError::Ok) {
        float x = doc["x"];
        float y = doc["y"];
        float z = doc["z"];
        //int w = doc["w"];

        Serial1.print(x, 2);
        Serial1.print(",");
        Serial1.print(y, 2);
        Serial1.print("|");
        Serial1.println(z, 2);

        //if(w == 1){
        //  shootImage();
        //}

      } else {
          Serial.println("JSON parse error");
      }
    }
    break;
    case WStype_BIN:
      break;
		case WStype_ERROR:			
		case WStype_FRAGMENT_TEXT_START:
		case WStype_FRAGMENT_BIN_START:
		case WStype_FRAGMENT:
		case WStype_FRAGMENT_FIN:
		    break;
    }

}

void setup() {

  Serial.begin(115200);
  Serial1.begin(9600, SERIAL_8N1, 14, 15);

  for(uint8_t t = 4; t > 0; t--) {
    Serial.printf("[SETUP] BOOT WAIT %d...\n", t);
    Serial.flush();
    delay(1000);
  }

  initCamera();

  connectBestNetwork();

  webSocket.beginSSL(ws_host, ws_port, ws_path);
  webSocket.onEvent(webSocketEvent);

}

void loop() {

  webSocket.loop();

  if (WiFi.status() != WL_CONNECTED) {
    Serial1.println("0.00,0.00|0.00");
    connectBestNetwork();
  } else {
    if (millis() - lastRequest > interval) {
      lastRequest = millis();
      webSocket.sendTXT("get_coords");
      sendCameraImage();
    }
  }

}
