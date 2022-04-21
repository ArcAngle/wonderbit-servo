input.onButtonPressed(Button.A, function () {
    pins.digitalWritePin(DigitalPin.P1, 0)
})
input.onButtonPressed(Button.B, function () {
    pins.digitalWritePin(DigitalPin.P1, 1)
})
WonderBit.Initialise()
basic.forever(function () {
    let servo1 = 0
    WonderBit.Servo(servo1, servo1)
})
