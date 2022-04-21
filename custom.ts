
/**
 * Use this file to define custom functions and blocks.
 * Read more at https://makecode.microbit.org/blocks/custom
 */

// This code is currently for internal use only, 
// not to be shared or published without written agreement with Henning Pedersen


//"\uf072"
//

//% weight=50 color=#0040ff icon="\uf0d0"


namespace WonderBit {
    /**
     * Set of code blocks for the Drone
     */

    /*
        let batteryMilliVolt = 0
    
        serial.onDataReceived(serial.delimiters(Delimiters.Dollar), function () {
            //    telemetriBuffer = serial.readBuffer(8)
            led.plot(0, 0)
    
        })
    */

    //% block
    export function plotYLine(y1: number, y2: number, x: number): void {
        /**
         * Draw a line along the Y axis. y1: first pixel, y2: last pixel
         */

        if (y1 >= y2) {
            for (let y = y2; y <= y1; y++) {
                led.plot(x, y)
            }
        }
        else if (y1 < y2) {
            for (let y = y1; y <= y2; y++) {
                led.plot(x, y)
            }
        }
    }


    //% block
    export function plotXLine(x1: number, x2: number, y: number): void {
        /**
        * Draw a line along the X axis
        */
        if (x1 >= x2) {
            for (let x = x2; x <= x1; x++) {
                led.plot(x, y)
            }
        }
        else if (x1 < x2) {
            for (let x = x1; x <= x2; x++) {
                led.plot(x, y)
            }
        }
    }







    //% block
    export function blinkLed(x: number, y: number, speed: number): void {
        /**
         * Plot a blinking led at x,y with speed 0-7
         */
        if (((input.runningTime() >> (12 - speed) & 1)) == 1) {
            led.plot(x, y)
        }

    }

    //%block
    export function rotateDotCw(speed: number): void {
        /**
         * Draw a dot that is rotating in a clockwise manner with chosen speed
         */
        let posisjon = (input.runningTime() >> (12 - speed)) & 15
        posisjon = pins.map(
            posisjon,
            0,
            15,
            1,
            12
        )
        if (posisjon == 1) {
            led.plot(1, 0)
        }
        if (posisjon == 2) {
            led.plot(2, 0)
        }
        if (posisjon == 3) {
            led.plot(3, 0)
        }
        if (posisjon == 4) {
            led.plot(4, 1)
        }
        if (posisjon == 5) {
            led.plot(4, 2)
        }
        if (posisjon == 6) {
            led.plot(4, 3)
        }
        if (posisjon == 7) {
            led.plot(3, 4)
        }
        if (posisjon == 8) {
            led.plot(2, 4)
        }
        if (posisjon == 9) {
            led.plot(1, 4)
        }
        if (posisjon == 10) {
            led.plot(0, 3)
        }
        if (posisjon == 11) {
            led.plot(0, 2)
        }
        if (posisjon == 12) {
            led.plot(0, 1)
        }
        // Add code here
    }


    //%block
    export function Initialise(): void {
        serial.redirect(
            SerialPin.P1,
            SerialPin.P12,
            BaudRate.BaudRate115200
        )
    }

    //% block="Servo $Servo90|Servo 1 $Aux1|Servo 2 $Aux2"
    export function Servo(Aux1: number, Aux2: number): void {
        /**
         * Aux1: 0 - 90
         * Aux2: 0 - 90
         */
        let buf = pins.createBuffer(16)
        let scaling = 1024 / 90
        //   let offset = 512
        // Header "Fade" (Spektsat code)
        buf[0] = 0
        // Header "System" (Spektsat code)  
        buf[1] = 0x01
        // 0x01 22MS 1024 DSM2 
        // 0x12 11MS 2048 DSM2
        // 0xa2 22MS 2048 DSMS 
        // 0xb2 11MS 2048 DSMX
        // Aux  limit

        let aux1S = (90-Aux1) * scaling
        let aux2S = (90-Aux2) * scaling


        if (aux1S > 1023) {
            aux1S = 1023
        }
        if (aux1S < 0) {
            aux1S = 0
        }

        if (aux2S > 1023) {
            aux2S = 1023
        }
        if (aux2S < 0) {
            aux2S = 0
        }

        buf[12] = (5 << 2) | ((aux1S >> 8) & 3)
        buf[13] = aux1S & 255
        buf[14] = (6 << 2) | ((aux2S >> 8) & 3)
        buf[15] = aux2S & 255
        serial.writeBuffer(buf)
    }


    //% block="Air:bit|Throttle $Throttle|Yaw $Yaw|Pitch $Pitch|Roll $Roll|Arm $Arm|Servo 1 $Aux1|Servo 2 $Aux2|Screen $Screen"
    export function AirBit(Throttle: number, Yaw: number, Pitch: number, Roll: number, Arm: number, Aux1: number, Aux2: number, Screen: boolean): void {
        /**
         * Control TYPR12 (Throttle, Yaw, Pitch, Roll and AUX1 and AUX2) using the Spektsat 2048 protocol
         * Throttle min: 0, max: 100
         * Yaw, Pitch Roll: min -90, max 90
         * Arm: 0 = Disarm, 1 = Arm 
         * Aux1: 0 - 180
         * Aux2: 0 - 180
         */
        let buf = pins.createBuffer(16)
        let scaling = 1024 / 180
        let offset = 512
        let scalingServo = 1024 / 90
        let tlm = pins.createBuffer(1)
        let telemetriBuffer = control.createBuffer(16)
        let battV = 0
        let battPx = 0

        // Header "Fade" (Spektsat code)
        buf[0] = 0
        // Header "System" (Spektsat code)  
        buf[1] = 0x01
        // 0x01 22MS 1024 DSM2 
        // 0x12 11MS 2048 DSM2
        // 0xa2 22MS 2048 DSMS 
        // 0xb2 11MS 2048 DSMX


        //Screen plot


        // Reverse the pitch 
        Pitch = - Pitch


        // Upscale Arm (Arm = true or false)
        let armS = 0
        if (Arm == 0) {
            armS = 0
        }

        if (Arm == 1) {
            armS = 1023
        }

        let aux1S = Aux1 * scalingServo
        let aux2S = Aux2 * scalingServo

        if (aux1S > 1023) {
            aux1S = 1023
        }
        if (aux1S < 0) {
            aux1S = 0
        }

        // Aux  limit
        if (aux2S > 1023) {
            aux2S = 1023
        }
        if (aux2S < 0) {
            aux2S = 0
        }

        if (Throttle > 99) {
            Throttle = 99
        }
        if (Throttle < 0) {
            Throttle = 0
        }
        if (Yaw > 90) {
            Yaw = 90
        }
        if (Yaw < -90) {
            Yaw = -90
        }
        if (Pitch > 90) {
            Pitch = 90
        }
        if (Pitch < -90) {
            Pitch = -90
        }
        if (Roll > 90) {
            Roll = 90
        }
        if (Roll < -90) {
            Roll = -90
        }

        let pitchS = Pitch * scaling + offset
        let rollS = Roll * scaling + offset
        let yawS = Yaw * scaling + offset
        let throttleS = (Throttle * 512) / 50

        buf[2] = (0 << 2) | ((rollS >> 8) & 3)
        buf[3] = rollS & 255
        buf[4] = (1 << 2) | ((pitchS >> 8) & 3)
        buf[5] = pitchS & 255
        buf[6] = (2 << 2) | ((throttleS >> 8) & 3)
        buf[7] = throttleS & 255
        buf[8] = (3 << 2) | ((yawS >> 8) & 3)
        buf[9] = yawS & 255
        buf[10] = (4 << 2) | ((armS >> 8) & 3)
        buf[11] = armS & 255
        buf[12] = (5 << 2) | ((aux1S >> 8) & 3)
        buf[13] = aux1S & 255
        buf[14] = (6 << 2) | ((aux2S >> 8) & 3)
        buf[15] = aux2S & 255
        serial.writeBuffer(buf)


        /*  if (batteryMilliVolt > 100) {
              if (arm == 1) {
                  AirBit.plotYLine(4, Math.round(Math.map(batteryMilliVolt, 3400, 3900, 4, 0)), 4)
              } else {
                  AirBit.plotYLine(4, Math.round(Math.map(batteryMilliVolt, 3700, 4200, 4, 0)), 4)
              }
          } else {
              if (input.runningTime() % 500 > 250) {
                  led.plot(4, 4)
              }
          }
          */

    }


}





