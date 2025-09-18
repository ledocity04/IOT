
#include <DHT.h>
#include <Arduino.h>
#include <Adafruit_Sensor.h>
#include <BH1750.h>
#include <Wire.h>
#include <PubSubClient.h>
#include <WiFi.h>
#include <ArduinoJson.h>


#define DHTPIN 4 // DHT11 data pin (GPIO4)
#define DHTTYPE DHT11
#define MQTT_SERVER "172.20.10.3" // Wifi IP
#define MQTT_PORT 1883               
#define MQTT_TOPIC "iot_project"      // Broker topic
#define MQTT_REQUEST "iot_project_request"      // Broker request topic
#define MQTT_UPDATE "iot_project_update"      // Broker request topic

const char* ssid = "Nam Phạm";         // Wifi name
const char* password = "111222333";   // Wifi password

boolean manualState = false;

const int fan = 12;
const int light = 26;
const int ac = 33;
const int den = 25;

WiFiClient espClient;
PubSubClient client(espClient);

BH1750 lightMeter(0x23);
DHT dht(DHTPIN, DHTTYPE);
 
//ket noi wifi
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) { // Wait for connection
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

/// xu ly khi esp nhan du lieu mqtt
/// @param topic 
/// @param payload 
/// @param length 
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");

  // Convert payload to String safely
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);
    // Parse the message as JSON
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);

    if (error) {
      Serial.print(F("deserializeJson() failed: "));
      Serial.println(error.f_str());
      return;
    }

    const char* device = doc["device"];
    const char* action = doc["action"];

    bool stateChanged = false;

    // Check the device and action
    if (strcmp(device, "fan") == 0) {
      if (strcmp(action, "on") == 0) {

        digitalWrite(fan, HIGH);
        stateChanged = true;
      } else if (strcmp(action, "off") == 0) {
        digitalWrite(fan, LOW);
        stateChanged = true;
      }
    } else if (strcmp(device, "light") == 0) {
      if (strcmp(action, "on") == 0) {

        digitalWrite(light, HIGH);
        stateChanged = true;
      } else if (strcmp(action, "off") == 0) {
        digitalWrite(light, LOW);
        stateChanged = true;
      }

    } else if (strcmp(device, "ac") == 0) {
      if (strcmp(action, "on") == 0) {
        digitalWrite(ac, HIGH);
        stateChanged = true;
      } else if (strcmp(action, "off") == 0) {
        digitalWrite(ac, LOW);
        stateChanged = true;
      }
    } else if (strcmp(device, "alarm") == 0) {
      if (strcmp(action, "on") == 0) {
        manualState = true;
        digitalWrite(den, HIGH);
        stateChanged = true;
      } else if (strcmp(action, "off") == 0) {
        manualState = false;
        digitalWrite(den, LOW);
        stateChanged = true;
      }
    }
    
    if (stateChanged) {
      StaticJsonDocument<256> doc;
      doc["device"] = device;
      doc["action"] = action;

      char jsonBuffer[512];
      serializeJson(doc, jsonBuffer);

      client.publish(MQTT_UPDATE, jsonBuffer);
      Serial.print("Published JSON: ");
      Serial.println(jsonBuffer);
    
  }
}


//khoi tao Serial,dht,...
void setup() {
  Serial.begin(115200);
  dht.begin();
  Wire.begin();
  
  
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println(F("BH1750 Advanced begin"));
  } else {
    Serial.println(F("Error initialising BH1750"));
  }
  
  setup_wifi();
  client.setServer(MQTT_SERVER, MQTT_PORT);
  client.setCallback(callback);

  pinMode(fan, OUTPUT);
  pinMode(light, OUTPUT);
  pinMode(ac, OUTPUT);
  pinMode(den, OUTPUT);

  digitalWrite(fan, LOW);
  digitalWrite(light, LOW);
  digitalWrite(ac, LOW);
  digitalWrite(den, LOW);
}

//mqtt mat ket noi,lap connect den khi tcong
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ArduinoClient")) {
      Serial.println("connected");
      // Subscribe to the topic
      client.subscribe(MQTT_REQUEST);
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      delay(5000);
    }
  }
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  float lux = lightMeter.readLightLevel();
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  // if(lux > 500){
  //   blinkLed();
  // }

  // if(lux > 200){
  //   digitalWrite(light, HIGH);
  // }

  float dust = random(0, 100);
  if(dust > 80 && !manualState){

  StaticJsonDocument<256> doc;
  doc["humidity"] = humidity;  
  doc["temperature"] = temperature;
  doc["lux"] = lux;
  doc["dust"] = dust;
  // doc["wind"] = wind;


  doc["fan"] = (digitalRead(fan) == HIGH) ? 1 : 0;
  doc["light"] = (digitalRead(light) == HIGH) ? 1 : 0;
  doc["ac"] = (digitalRead(ac) == HIGH) ? 1 : 0;
  doc["alarm"] = (digitalRead(den) == HIGH) ? 1 : 0;

  char jsonBuffer[512];


  doc["alarm"] = "1";
  serializeJson(doc, jsonBuffer);
  client.publish(MQTT_TOPIC, jsonBuffer);
  digitalWrite(den, HIGH);
  delay(2000);

  doc["alarm"] = "0";
  serializeJson(doc, jsonBuffer);
  client.publish(MQTT_TOPIC, jsonBuffer);
  digitalWrite(den, LOW);
  delay(2000);

  doc["alarm"] = "1";
  serializeJson(doc, jsonBuffer);
  client.publish(MQTT_TOPIC, jsonBuffer);
  digitalWrite(den, HIGH);
  delay(1000);


  doc["alarm"] = "0";
  serializeJson(doc, jsonBuffer);
  client.publish(MQTT_TOPIC, jsonBuffer);
  digitalWrite(den, LOW);
  delay(1000);

  doc["alarm"] = "1";
  serializeJson(doc, jsonBuffer);
  client.publish(MQTT_TOPIC, jsonBuffer);
  digitalWrite(den, HIGH);
  delay(1000);

  doc["alarm"] = "0";
  serializeJson(doc, jsonBuffer);
  client.publish(MQTT_TOPIC, jsonBuffer);
  digitalWrite(den, LOW);
  delay(1000);
  }

  StaticJsonDocument<256> doc;
  doc["humidity"] = humidity;  
  doc["temperature"] = temperature;
  doc["lux"] = lux;
  doc["dust"] = dust;
  // doc["wind"] = wind;


  doc["fan"] = (digitalRead(fan) == HIGH) ? 1 : 0;
  doc["light"] = (digitalRead(light) == HIGH) ? 1 : 0;
  doc["ac"] = (digitalRead(ac) == HIGH) ? 1 : 0;
  doc["alarm"] = (digitalRead(den) == HIGH) ? 1 : 0;


  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);

  client.publish(MQTT_TOPIC, jsonBuffer);

  // Serial.print("Published JSON: ");
  // Serial.println(jsonBuffer);

  delay(2000);
}

