#include <Servo.h>
#include <NeoSWSerial.h>
NeoSWSerial espSerial(2, 4); // RX = 2, TX = 3

String str="";
float x,y,z;
Servo myServo;

int in1 = 5;
int in2 = 6;
int in3 = 11;
int in4 = 3;

unsigned long lastDataTime = 0;   
const unsigned long TIMEOUT = 2000; 

void setup() {
  Serial.begin(9600);
  espSerial.begin(9600);
  myServo.attach(7); 
  myServo.write(50);

  pinMode(in1,OUTPUT);   
  pinMode(in2,OUTPUT);
  pinMode(in3,OUTPUT);   
  pinMode(in4,OUTPUT);
  analogWrite(in1, 0);
  analogWrite(in2, 0);
  analogWrite(in3, 0);
  analogWrite(in4, 0);
}

void controlMotor1(float speed) {
  int pwm = abs(speed * 230);
  pwm = constrain(pwm, 0, 230);

  if (speed > 0.05) {          
    analogWrite(in1, pwm);
    analogWrite(in2, 0);
  }
  else if (speed < -0.05) {    
    analogWrite(in1, 0);
    analogWrite(in2, pwm);
  }
  else {                     
    analogWrite(in1, 0);
    analogWrite(in2, 0);
  }
}

void controlMotor2(float speed) {
  int pwm = abs(speed * 230);
  pwm = constrain(pwm, 0, 230);

  if (speed > 0.05) {          
    analogWrite(in3, pwm);
    analogWrite(in4, 0);
  }
  else if (speed < -0.05) {    
    analogWrite(in3, 0);
    analogWrite(in4, pwm);
  }
  else {                  
    analogWrite(in3, 0);
    analogWrite(in4, 0);
  }
}

void loop() {
  if (espSerial.available()) {
    char data = espSerial.read();
    lastDataTime = millis(); 

    if(data==','){
      x=str.toFloat();
      str = "";
      
    }else if(data == '|'){
      y=str.toFloat();
      str = "";

    }else if(data == '\n'){
      z = str.toInt();
      str="";

      float leftSpeed  = y+x;
      float rightSpeed = y-x;

      // Normalizálás (-1..1 tartományba)
      leftSpeed  = constrain(leftSpeed,  -1.0, 1.0);
      rightSpeed = constrain(rightSpeed, -1.0, 1.0);

      controlMotor1(leftSpeed);
      controlMotor2(rightSpeed);

      int angle = constrain(z, 0, 100);
      myServo.write(angle);

    }else{
      str+=data;
    }
  }


  if (millis() - lastDataTime > TIMEOUT) {
    controlMotor1(0);
    controlMotor2(0);
  }

}
