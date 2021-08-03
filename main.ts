/*
  Kitronik package for use with the Air Quality Board (www.kitronik.co.uk/5674)
  This package pulls in other packages to deal with the lower level work for:
    Setting and reading a Real Time Clock chip
*/

/**
* Well known colors for ZIP LEDs
*/
enum ZipLedColors {
    //% block=red
    Red = 0xFF0000,
    //% block=orange
    Orange = 0xFFA500,
    //% block=yellow
    Yellow = 0xFFFF00,
    //% block=green
    Green = 0x00FF00,
    //% block=blue
    Blue = 0x0000FF,
    //% block=indigo
    Indigo = 0x4b0082,
    //% block=violet
    Violet = 0x8a2be2,
    //% block=purple
    Purple = 0xFF00FF,
    //% block=white
    White = 0xFFFFFF,
    //% block=black
    Black = 0x000000
}

/** 
 * Different time options for the Real Time Clock
 */
enum TimeParameter {
    //% block=hours
    Hours,
    //% block=minutes
    Minutes,
    //% block=seconds
    Seconds
}

/**
 * Different date options for the Real Time Clock
 */
enum DateParameter {
    //% block=day
    Day,
    //% block=month
    Month,
    //% block=year
    Year
}

/**
 * Kitronik Air Quality Board MakeCode Extension
 */

//% weight=100 color=#00A654 icon="\uf0c2" block="Air Quality"
//% groups='["Control", "Show", "Draw", "Delete", "Advanced", "Set Time", "Set Date", "Read Time", "Read Date", "Alarm", "Setup", "Measure", "Climate", "Air Quality", "General Inputs/Outputs", "Write", "Read," "Setup", "Add Data", "Transfer"]'
namespace kitronik_air_quality {
    ////////////////////////////////
    //         ZIP LEDS           //
    ////////////////////////////////
    
    export class airQualityZIPLEDs {
        buf: Buffer;
        pin: DigitalPin;
        brightness: number;
        start: number;
        _length: number;

        /** 
         * Create a range of LEDs.
         * @param start offset in the LED strip to start the range
         * @param length number of LEDs in the range. eg: 2
         */
        //% subcategory="ZIP LEDs"
        //% weight=89 blockGap=8
        //% blockId="kitronik_air_quality_range" block="%statusLEDs|range from %start|with %length|LEDs"
        range(start: number, length: number): airQualityZIPLEDs {
            start = start >> 0;
            length = length >> 0;
            let zipLEDs = new airQualityZIPLEDs();
            zipLEDs.buf = this.buf;
            zipLEDs.pin = this.pin;
            zipLEDs.brightness = this.brightness;
            zipLEDs.start = this.start + Math.clamp(0, this._length - 1, start);
            zipLEDs._length = Math.clamp(0, this._length - (zipLEDs.start - this.start), length);
            return zipLEDs;
        }

        /**
         * Rotate LEDs forward.
         * You need to call ``show`` to make the changes visible.
         * @param offset number of ZIP LEDs to rotate forward, eg: 1
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_air_quality_display_rotate" block="%statusLEDs|rotate ZIP LEDs by %offset" blockGap=8
        //% weight=92
        rotate(offset: number = 1): void {
            this.buf.rotate(-offset * 3, this.start * 3, this._length * 3)
        }
        /**
         * Sets all the ZIP LEDs to a given color (range 0-255 for r, g, b). Call Show to make changes visible 
         * @param rgb RGB color of the LED
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_air_quality_display_only_set_strip_color" block="%statusLEDs|set color %rgb=kitronik_air_quality_colors" 
        //% weight=96 blockGap=8
        setColor(rgb: number) {
            rgb = rgb >> 0;
            this.setAllRGB(rgb);
        }
        /**
         * Shows all the ZIP LEDs as a given color (range 0-255 for r, g, b). 
         * @param rgb RGB color of the LED
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_air_quality_display_set_strip_color" block="%statusLEDs|show color %rgb=kitronik_air_quality_colors" 
        //% weight=97 blockGap=8
        showColor(rgb: number) {
            rgb = rgb >> 0;
            this.setAllRGB(rgb);
            this.show();
        }

        /**
         * Set particular ZIP LED to a given color. 
         * You need to call ``show changes`` to make the changes visible.
         * @param zipLedNum position of the ZIP LED in the string
         * @param rgb RGB color of the ZIP LED
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_air_quality_set_zip_color" block="%statusLEDs|set ZIP LED %zipLedNum|to %rgb=kitronik_air_quality_colors" 
        //% weight=95 blockGap=8
        setZipLedColor(zipLedNum: number, rgb: number): void {
            this.setPixelRGB(zipLedNum >> 0, rgb >> 0);
        }

        /**
         * Send all the changes to the ZIP LEDs.
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_air_quality_display_show" block="%statusLEDs|show"
        //% weight=94 blockGap=8
        show() {
            //use the Kitronik version which respects brightness for all 
            //ws2812b.sendBuffer(this.buf, this.pin, this.brightness);
            // Use the pxt-microbit core version which now respects brightness (10/2020)
            light.sendWS2812BufferWithBrightness(this.buf, this.pin, this.brightness);
            control.waitMicros(100) // This looks messy, but it fixes the issue sometimes found when using multiple ZIP LED ranges, where the settings for the first range are clocked through to the next range. A short pause allows the ZIP LEDs to realise they need to stop pushing data.
        }

        /**
         * Turn off all the ZIP LEDs.
         * You need to call ``show`` to make the changes visible.
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_air_quality_display_clear" block="%statusLEDs|clear"
        //% weight=93 blockGap=8
        clear(): void {
            this.buf.fill(0, this.start * 3, this._length * 3);
        }

        /**
         * Set the brightness of the ZIP LEDs. This flag only applies to future show operation.
         * @param brightness a measure of LED brightness in 0-255. eg: 255
         */
        //% subcategory="ZIP LEDs"
        //% blockId="kitronik_air_quality_display_set_brightness" block="%statusLEDs|set brightness %brightness" blockGap=8
        //% weight=91
        //% brightness.min=0 brightness.max=255
        setBrightness(brightness: number): void {
            //Clamp incoming variable at 0-255 as values out of this range cause unexpected brightnesses as the lower level code only expects a byte.
            if (brightness < 0) {
                brightness = 0
            }
            else if (brightness > 255) {
                brightness = 255
            }
            this.brightness = brightness & 0xff;
            basic.pause(1) //add a pause to stop wierdnesses
        }

        //Sets up the buffer for pushing LED control data out to LEDs
        private setBufferRGB(offset: number, red: number, green: number, blue: number): void {
            this.buf[offset + 0] = green;
            this.buf[offset + 1] = red;
            this.buf[offset + 2] = blue;
        }

        //Separates out Red, Green and Blue data and fills the LED control data buffer for all LEDs
        private setAllRGB(rgb: number) {
            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            const end = this.start + this._length;
            for (let i = this.start; i < end; ++i) {
                this.setBufferRGB(i * 3, red, green, blue)
            }
        }

        //Separates out Red, Green and Blue data and fills the LED control data buffer for a single LED
        private setPixelRGB(pixeloffset: number, rgb: number): void {
            if (pixeloffset < 0
                || pixeloffset >= this._length)
                return;

            pixeloffset = (pixeloffset + this.start) * 3;

            let red = unpackR(rgb);
            let green = unpackG(rgb);
            let blue = unpackB(rgb);

            this.setBufferRGB(pixeloffset, red, green, blue)
        }
    }

    /**
     * Create a new ZIP LED driver for Air Quality Board.
     */
    //% subcategory="ZIP LEDs"
    //% blockId="kitronik_air_quality_display_create" block="Air Quality Board with 3 ZIP LEDs"
    //% weight=100 blockGap=8
    //% trackArgs=0,2
    //% blockSetVariable=statusLEDs
    export function createAirQualityZIPDisplay(): airQualityZIPLEDs {
        let statusLEDs = new airQualityZIPLEDs;
        statusLEDs.buf = pins.createBuffer(9);
        statusLEDs.start = 0;
        statusLEDs._length = 3;
        statusLEDs.setBrightness(128)
        statusLEDs.pin = DigitalPin.P8;
        pins.digitalWritePin(statusLEDs.pin, 0);
        return statusLEDs;
    }

    /**
     * Converts wavelength value to red, green, blue channels
     * @param wavelength value between 470 and 625. eg: 500
     */
    //% subcategory="ZIP LEDs"
    //% weight=1 blockGap=8
    //% blockId="kitronik_air_quality_wavelength" block="wavelength %wavelength|nm"
    //% wavelength.min=470 wavelength.max=625
    export function wavelength(wavelength: number): number {
        /*  The LEDs we are using have centre wavelengths of 470nm (Blue) 525nm(Green) and 625nm (Red) 
        * 	 We blend these linearly to give the impression of the other wavelengths. 
        *   as we cant wavelength shift an actual LED... (Ye canna change the laws of physics Capt)*/
        let r = 0;
        let g = 0;
        let b = 0;
        if ((wavelength >= 470) && (wavelength < 525)) {
            //We are between Blue and Green so mix those
            g = pins.map(wavelength, 470, 525, 0, 255);
            b = pins.map(wavelength, 470, 525, 255, 0);
        }
        else if ((wavelength >= 525) && (wavelength <= 625)) {
            //we are between Green and Red, so mix those
            r = pins.map(wavelength, 525, 625, 0, 255);
            g = pins.map(wavelength, 525, 625, 255, 0);
        }
        return packRGB(r, g, b);
    }

    /**
     * Converts hue (0-360) to an RGB value. 
     * Does not attempt to modify luminosity or saturation. 
     * Colours end up fully saturated. 
     * @param hue value between 0 and 360
     */
    //% subcategory="ZIP LEDs"
    //% weight=1 blockGap=8
    //% blockId="kitronik_air_quality_hue" block="hue %hue"
    //% hue.min=0 hue.max=360
    export function hueToRGB(hue: number): number {
        let redVal = 0
        let greenVal = 0
        let blueVal = 0
        let hueStep = 2.125
        if ((hue >= 0) && (hue < 120)) { //RedGreen section
            greenVal = Math.floor((hue) * hueStep)
            redVal = 255 - greenVal
        }
        else if ((hue >= 120) && (hue < 240)) { //GreenBlueSection
            blueVal = Math.floor((hue - 120) * hueStep)
            greenVal = 255 - blueVal
        }
        else if ((hue >= 240) && (hue < 360)) { //BlueRedSection
            redVal = Math.floor((hue - 240) * hueStep)
            blueVal = 255 - redVal
        }
        return ((redVal & 0xFF) << 16) | ((greenVal & 0xFF) << 8) | (blueVal & 0xFF);
    }

    /*  The LEDs we are using have centre wavelengths of 470nm (Blue) 525nm(Green) and 625nm (Red) 
    * 	 We blend these linearly to give the impression of the other wavelengths. 
    *   as we cant wavelength shift an actual LED... (Ye canna change the laws of physics Capt)*/

    /**
     * Converts value to red, green, blue channels
     * @param red value of the red channel between 0 and 255. eg: 255
     * @param green value of the green channel between 0 and 255. eg: 255
     * @param blue value of the blue channel between 0 and 255. eg: 255
     */
    //% subcategory="ZIP LEDs"
    //% weight=1 blockGap=8
    //% blockId="kitronik_air_quality_rgb" block="red %red|green %green|blue %blue"
    export function rgb(red: number, green: number, blue: number): number {
        return packRGB(red, green, blue);
    }

    /**
     * Gets the RGB value of a known color
    */
    //% subcategory="ZIP LEDs"
    //% weight=2 blockGap=8
    //% blockId="kitronik_air_quality_colors" block="%color"
    export function colors(color: ZipLedColors): number {
        return color;
    }

    //Combines individual RGB settings to be a single number
    function packRGB(a: number, b: number, c: number): number {
        return ((a & 0xFF) << 16) | ((b & 0xFF) << 8) | (c & 0xFF);
    }
    //Separates red value from combined number
    function unpackR(rgb: number): number {
        let r = (rgb >> 16) & 0xFF;
        return r;
    }
    //Separates green value from combined number
    function unpackG(rgb: number): number {
        let g = (rgb >> 8) & 0xFF;
        return g;
    }
    //Separates blue value from combined number
    function unpackB(rgb: number): number {
        let b = (rgb) & 0xFF;
        return b;
    }

    /**
     * Converts a hue saturation luminosity value into a RGB color
     */
    function hsl(h: number, s: number, l: number): number {
        h = Math.round(h);
        s = Math.round(s);
        l = Math.round(l);

        h = h % 360;
        s = Math.clamp(0, 99, s);
        l = Math.clamp(0, 99, l);
        let c = Math.idiv((((100 - Math.abs(2 * l - 100)) * s) << 8), 10000); //chroma, [0,255]
        let h1 = Math.idiv(h, 60);//[0,6]
        let h2 = Math.idiv((h - h1 * 60) * 256, 60);//[0,255]
        let temp = Math.abs((((h1 % 2) << 8) + h2) - 256);
        let x = (c * (256 - (temp))) >> 8;//[0,255], second largest component of this color
        let r$: number;
        let g$: number;
        let b$: number;
        if (h1 == 0) {
            r$ = c; g$ = x; b$ = 0;
        } else if (h1 == 1) {
            r$ = x; g$ = c; b$ = 0;
        } else if (h1 == 2) {
            r$ = 0; g$ = c; b$ = x;
        } else if (h1 == 3) {
            r$ = 0; g$ = x; b$ = c;
        } else if (h1 == 4) {
            r$ = x; g$ = 0; b$ = c;
        } else if (h1 == 5) {
            r$ = c; g$ = 0; b$ = x;
        }
        let m = Math.idiv((Math.idiv((l * 2 << 8), 100) - c), 2);
        let r = r$ + m;
        let g = g$ + m;
        let b = b$ + m;
        return packRGB(r, g, b);
    }

    /**
     * Options for direction hue changes, used by rainbow block (never visible to end user)
     */
    export enum HueInterpolationDirection {
        Clockwise,
        CounterClockwise,
        Shortest
    }

    ////////////////////////////////
    //            OLED            //
    ////////////////////////////////

    // ASCII Code to OLED 5x8 pixel character for display conversion
    let font: number[] = [];
    // Set all non-printable characters [0-31] to be '0x0022d422'
    for (let fontCH = 0; fontCH < 32; fontCH++) {
        font[fontCH] = 0x0022d422
    }
    font[32] = 0x00000000;  // Space
    font[33] = 0x000002e0;  // !
    font[34] = 0x00018060;  // "
    font[35] = 0x00afabea;  // #
    font[36] = 0x00aed6ea;  // $
    font[37] = 0x01991133;  // %
    font[38] = 0x010556aa;  // &
    font[39] = 0x00000060;  // '
    font[40] = 0x000045c0;  // (
    font[41] = 0x00003a20;  // )
    font[42] = 0x00051140;  // *
    font[43] = 0x00023880;  // +
    font[44] = 0x00002200;  // ,
    font[45] = 0x00021080;  // -
    font[46] = 0x00000100;  // .
    font[47] = 0x00111110;  // /
    font[48] = 0x0007462e;  // 0
    font[49] = 0x00087e40;  // 1
    font[50] = 0x000956b9;  // 2
    font[51] = 0x0005d629;  // 3
    font[52] = 0x008fa54c;  // 4
    font[53] = 0x009ad6b7;  // 5
    font[54] = 0x008ada88;  // 6
    font[55] = 0x00119531;  // 7
    font[56] = 0x00aad6aa;  // 8
    font[57] = 0x0022b6a2;  // 9
    font[58] = 0x00000140;  // :
    font[59] = 0x00002a00;  // ;
    font[60] = 0x0008a880;  // <
    font[61] = 0x00052940;  // =
    font[62] = 0x00022a20;  // >
    font[63] = 0x0022d422;  // ?
    font[64] = 0x00e4d62e;  // @
    font[65] = 0x000f14be;  // A
    font[66] = 0x000556bf;  // B
    font[67] = 0x0008c62e;  // C 
    font[68] = 0x0007463f;  // D 
    font[69] = 0x0008d6bf;  // E 
    font[70] = 0x000094bf;  // F 
    font[71] = 0x00cac62e;  // G 
    font[72] = 0x000f909f;  // H 
    font[73] = 0x000047f1;  // I 
    font[74] = 0x0017c629;  // J 
    font[75] = 0x0008a89f;  // K 
    font[76] = 0x0008421f;  // L
    font[77] = 0x01f1105f;  // M 
    font[78] = 0x01f4105f;  // N 
    font[79] = 0x0007462e;  // O 
    font[80] = 0x000114bf;  // P 
    font[81] = 0x000b6526;  // Q 
    font[82] = 0x010514bf;  // R 
    font[83] = 0x0004d6b2;  // S 
    font[84] = 0x0010fc21;  // T 
    font[85] = 0x0007c20f;  // U 
    font[86] = 0x00744107;  // V
    font[87] = 0x01f4111f;  // W 
    font[88] = 0x000d909b;  // X 
    font[89] = 0x00117041;  // Y 
    font[90] = 0x0008ceb9;  // Z
    font[91] = 0x0008c7e0;  // [
    font[92] = 0x01041041;  // \
    font[93] = 0x000fc620;  // ]
    font[94] = 0x00010440;  // ^
    font[95] = 0x01084210;  // _ 
    font[96] = 0x00000820;  // `
    font[97] = 0x010f4a4c;  // a 
    font[98] = 0x0004529f;  // b 
    font[99] = 0x00094a4c;  // c 
    font[100] = 0x000fd288; // d 
    font[101] = 0x000956ae; // e 
    font[102] = 0x000097c4; // f 
    font[103] = 0x0007d6a2; // g 
    font[104] = 0x000c109f; // h 
    font[105] = 0x000003a0; // i 
    font[106] = 0x0006c200; // j 
    font[107] = 0x0008289f; // k 
    font[108] = 0x000841e0; // l 
    font[109] = 0x01e1105e; // m 
    font[110] = 0x000e085e; // n 
    font[111] = 0x00064a4c; // o 
    font[112] = 0x0002295e; // p 
    font[113] = 0x000f2944; // q 
    font[114] = 0x0001085c; // r 
    font[115] = 0x00012a90; // s 
    font[116] = 0x010a51e0; // t 
    font[117] = 0x010f420e; // u 
    font[118] = 0x00644106; // v 
    font[119] = 0x01e8221e; // w 
    font[120] = 0x00093192; // x 
    font[121] = 0x00222292; // y 
    font[122] = 0x00095b52; // z
    font[123] = 0x0008fc80; // {
    font[124] = 0x000003e0; // |
    font[125] = 0x000013f1; // }
    font[126] = 0x00841080; // ~
    font[127] = 0x0022d422; // DEL


    /**
     * Select the alignment of text
     */
    export enum ShowAlign {
        //% block="Left"
        Left,
        //% block="Centre"
        Centre,
        //% block="Right"
        Right
    }

    /**
     * Select direction for drawing lines
     */
    export enum LineDirectionSelection {
        //% block="horizontal"
        horizontal,
        //% block="vertical"
        vertical
    }

    // Constants for Display
    let NUMBER_OF_CHAR_PER_LINE = 26

    // Default address for the display
    let DISPLAY_ADDR_1 = 60
    let DISPLAY_ADDR_2 = 10
    let displayAddress = DISPLAY_ADDR_1;

    // Text alignment, defaulted to "Left"
    let displayShowAlign = ShowAlign.Left

    // Plot variables
    let plotArray: number[] = []
    let plottingEnable = 0
    let plotData = 0;
    let graphYMin = 0
    let graphYMax = 100
    let graphRange = 100
    let GRAPH_Y_MIN_LOCATION = 63
    let GRAPH_Y_MAX_LOCATION = 20
    let previousYPlot = 0

    // Screen buffers for sending data to the display
    let screenBuf = pins.createBuffer(1025);
    let ackBuf = pins.createBuffer(2);
    let writeOneByteBuf = pins.createBuffer(2);
    let writeTwoByteBuf = pins.createBuffer(3);
    let writeThreeByteBuf = pins.createBuffer(4);

    let initialised = 0    		// Flag to indicate automatic initalisation of the display

    // Function to write one byte of data to the display
    function writeOneByte(regValue: number) {
        writeOneByteBuf[0] = 0;
        writeOneByteBuf[1] = regValue;
        pins.i2cWriteBuffer(displayAddress, writeOneByteBuf);
    }

    // Function to write two bytes of data to the display
    function writeTwoByte(regValue1: number, regValue2: number) {
        writeTwoByteBuf[0] = 0;
        writeTwoByteBuf[1] = regValue1;
        writeTwoByteBuf[2] = regValue2;
        pins.i2cWriteBuffer(displayAddress, writeTwoByteBuf);
    }

    // Function to write three bytes of data to the display
    function writeThreeByte(regValue1: number, regValue2: number, regValue3: number) {
        writeThreeByteBuf[0] = 0;
        writeThreeByteBuf[1] = regValue1;
        writeThreeByteBuf[2] = regValue2;
        writeThreeByteBuf[3] = regValue3;
        pins.i2cWriteBuffer(displayAddress, writeThreeByteBuf);
    }

    // Set the starting on the display for writing text
    function set_pos(col: number = 0, page: number = 0) {
        writeOneByte(0xb0 | page) // page number
        writeOneByte(0x00 | (col % 16)) // lower start column address
        writeOneByte(0x10 | (col >> 4)) // upper start column address    
    }

    // Set the particular data byte on the screen for clearing
    function clearBit(d: number, b: number): number {
        if (d & (1 << b))
            d -= (1 << b)
        return d
    }

    // Return the correct display I2C address based on selection
    function setScreenAddr(selection: number): number {
        let addr = 0
        if (selection == 1) {
            addr = DISPLAY_ADDR_1
        }
        else if (selection == 2) {
            addr = DISPLAY_ADDR_2
        }
        else {
            addr = DISPLAY_ADDR_1
        }
        return addr
    }

    /**
     * Setup the display ready for use (function on available in text languages, not blocks)
     * @param screen is the selection of which screen to initialise
     */
    export function initDisplay(screen?: number): void {

        displayAddress = setScreenAddr(screen)
        // Load the ackBuffer to check if there is a display there before starting initalisation
        ackBuf[0] = 0
        ackBuf[1] = 0xAF
        let ack = pins.i2cWriteBuffer(displayAddress, ackBuf)
        if (ack == -1010) {      // If returned value back is -1010, there is no display so show error message
            basic.showString("ERROR - no display")
        }
        else {   // Start initalising the display
            writeOneByte(0xAE)              // SSD1306_DISPLAYOFF
            writeOneByte(0xA4)              // SSD1306_DISPLAYALLON_RESUME
            writeTwoByte(0xD5, 0xF0)        // SSD1306_SETDISPLAYCLOCKDIV
            writeTwoByte(0xA8, 0x3F)        // SSD1306_SETMULTIPLEX
            writeTwoByte(0xD3, 0x00)        // SSD1306_SETDISPLAYOFFSET
            writeOneByte(0 | 0x0)           // line #SSD1306_SETSTARTLINE
            writeTwoByte(0x8D, 0x14)        // SSD1306_CHARGEPUMP
            writeTwoByte(0x20, 0x00)        // SSD1306_MEMORYMODE
            writeThreeByte(0x21, 0, 127)    // SSD1306_COLUMNADDR
            writeThreeByte(0x22, 0, 63)     // SSD1306_PAGEADDR
            writeOneByte(0xa0 | 0x1)        // SSD1306_SEGREMAP
            writeOneByte(0xc8)              // SSD1306_COMSCANDEC
            writeTwoByte(0xDA, 0x12)        // SSD1306_SETCOMPINS
            writeTwoByte(0x81, 0xCF)        // SSD1306_SETCONTRAST
            writeTwoByte(0xd9, 0xF1)        // SSD1306_SETPRECHARGE
            writeTwoByte(0xDB, 0x40)        // SSD1306_SETVCOMDETECT
            writeOneByte(0xA6)              // SSD1306_NORMALDISPLAY
            writeTwoByte(0xD6, 0)           // Zoom is set to off
            writeOneByte(0xAF)              // SSD1306_DISPLAYON
            initialised = 1
            clear()
        }
    }

    /**
     * Using (x, y) coordinates, turn on a selected pixel on the screen.
     * @param x is the X axis value, eg: 0
     * @param y is the Y axis value, eg: 0
     * @param screen is screen selection when using multiple screens
     */
    //% blockId="kitronik_air_quality_set_pixel" block="show pixel at x %x|y %y"
    //% subcategory="Display"
    //% group="Show"
    //% weight=70 blockGap=8
    //% x.min=0, x.max=127
    //% y.min=0, y.max=63
    //% inlineInputMode=inline
    export function setPixel(x: number, y: number, screen?: 1) {
        displayAddress = setScreenAddr(screen)
        if (initialised == 0) {
            initDisplay()
        }

        let page = y >> 3
        let shift_page = y % 8                                  // Calculate the page to write to
        let ind = x + page * 128 + 1                            // Calculate which register in the page to write to
        let screenPixel = (screenBuf[ind] | (1 << shift_page))  // Set the screen data byte
        screenBuf[ind] = screenPixel                            // Store data in screen buffer
        set_pos(x, page)                                        // Set the position on the screen to write at 
        writeOneByteBuf[0] = 0x40                               // Load buffer with command
        writeOneByteBuf[1] = screenPixel                        // Load buffer with byte
        pins.i2cWriteBuffer(displayAddress, writeOneByteBuf)    // Send data to screen
    }

    /**
     * Using the (x, y) coordinates, clear a selected pixel on the screen.
     * @param x is the X axis value, eg: 0
     * @param y is the Y axis value, eg: 0
     * @param screen is screen selection when using multiple screens
     */
    //% blockId="kitronik_air_quality_clear_pixel" block="clear pixel at x %x|y %y"
    //% subcategory="Display"
    //% group="Delete"
    //% weight=70 blockGap=8
    //% x.min=0, x.max=127
    //% y.min=0, y.max=63
    //% inlineInputMode=inline
    export function clearPixel(x: number, y: number, screen?: 1) {
        displayAddress = setScreenAddr(screen)
        if (initialised == 0) {
            initDisplay(1)
        }

        let page2 = y >> 3
        let shift_page2 = y % 8                                     // Calculate the page to write to
        let ind2 = x + page2 * 128 + 1                              // Calculate which register in the page to write to
        let screenPixel2 = clearBit(screenBuf[ind2], shift_page2)   // Clear the screen data byte
        screenBuf[ind2] = screenPixel2                              // Store data in screen buffer
        set_pos(x, page2)                                           // Set the position on the screen to write at 
        writeOneByteBuf[0] = 0x40                                   // Load buffer with command
        writeOneByteBuf[1] = screenPixel2                           // Load buffer with byte
        pins.i2cWriteBuffer(displayAddress, writeOneByteBuf)        // Send data to screen
    }

    /**
     * 'show' allows any number, string or variable to be displayed on the screen.
     * The block is expandable to set the line and alignment.
     * @param displayShowAlign is the alignment of the text, this can be left, centre or right
     * @param line is line the text to be started on, eg: 1
     * @param inputData is the text will be show
     * @param screen is screen selection when using multiple screens
     */
    //% blockId="kitronik_air_quality_show" block="show %s|| on line %line| with alignment: %displayShowAlign"
    //% weight=80 blockGap=8
    //% subcategory="Display"
    //% group="Show"
    //% expandableArgumentMode="enable"
    //% inlineInputMode=inline
    //% line.min=1 line.max=8
    export function show(inputData: any, line?: number, displayShowAlign?: ShowAlign, screen?: 1) {
        let y = 0
        let x = 0
        let inputString = convertToText(inputData)
        inputString = inputString + " "
        displayAddress = setScreenAddr(screen)
        if (initialised == 0) {
            initDisplay(1)
        }

        // If text alignment has not been specified, default to "Left"
        if (!displayShowAlign) {
            displayShowAlign = ShowAlign.Left
        }

        // If the screen line has not bee specified, default to top line (i.e. y = 0)
        // Otherwise, subtract '1' from the line number to return correct y value
        if (!line) {
            y = 0
        }
        else {
            y = (line - 1)
        }

        // Sort text into lines
        let stringArray: string[] = []
        let numberOfStrings = 0

        let previousSpacePoint = 0
        let spacePoint = 0
        let startOfString = 0
        let saveString = ""
        if (inputString.length > NUMBER_OF_CHAR_PER_LINE) {
            if (y == 7) {
                stringArray[numberOfStrings] = inputString.substr(0, (NUMBER_OF_CHAR_PER_LINE - 1))
                numberOfStrings = 1
            }
            else {
                for (let spaceFinder = 0; spaceFinder <= inputString.length; spaceFinder++) {
                    if (inputString.charAt(spaceFinder) == " ") {                                // Check whether the charector is a space, if so...
                        spacePoint = spaceFinder                                                // Remember the location of the new space found
                        if ((spacePoint - startOfString) < NUMBER_OF_CHAR_PER_LINE) {            // Check if the current location minus start of string is less than number of char on a screen
                            previousSpacePoint = spacePoint                                     // Remember that point for later
                            if (spaceFinder == (inputString.length - 1)) {
                                saveString = inputString.substr(startOfString, spacePoint)      // Cut the string from start of word to the last space and store it
                                stringArray[numberOfStrings] = saveString
                                numberOfStrings += 1
                            }
                        }
                        else if ((spacePoint - startOfString) > NUMBER_OF_CHAR_PER_LINE) {       // Check if the current location minus start of string is greater than number of char on a screen
                            saveString = inputString.substr(startOfString, previousSpacePoint)  // Cut the string from start of word to the last space and store it
                            stringArray[numberOfStrings] = saveString
                            startOfString = previousSpacePoint + 1                              // Set start of new word from last space plus one position
                            numberOfStrings += 1                                                // Increase the number of strings variable
                        }
                        else if ((spacePoint - startOfString) == NUMBER_OF_CHAR_PER_LINE) {      // Check if the current location minus start of string equals than number of char on a screen
                            saveString = inputString.substr(startOfString, spacePoint)
                            stringArray[numberOfStrings] = saveString
                            startOfString = spacePoint + 1
                            previousSpacePoint = spacePoint
                            numberOfStrings += 1
                        }
                    }
                }
            }
        }
        else {
            stringArray[numberOfStrings] = inputString
            numberOfStrings += 1
        }

        let col = 0
        let charDisplayBytes = 0
        let ind = 0

        // Set text alignment, fill up the screenBuffer with data and send to the display
        for (let textLine = 0; textLine <= (numberOfStrings - 1); textLine++) {
            let displayString = stringArray[textLine]

            if (inputString.length < (NUMBER_OF_CHAR_PER_LINE - 1)) {
                if (displayShowAlign == ShowAlign.Left) {
                    x = 0
                }
                else if (displayShowAlign == ShowAlign.Centre) {
                    x = Math.round((NUMBER_OF_CHAR_PER_LINE - displayString.length) / 2)
                }
                else if (displayShowAlign == ShowAlign.Right) {
                    x = (NUMBER_OF_CHAR_PER_LINE - displayString.length - 1) + textLine
                }
            }

            for (let charOfString = 0; charOfString < displayString.length; charOfString++) {
                charDisplayBytes = font[displayString.charCodeAt(charOfString)]
                for (let k = 0; k < 5; k++) {  // 'for' loop will take byte font array and load it into the correct register, then shift to the next byte to load into the next location
                    col = 0
                    for (let l = 0; l < 5; l++) {
                        if (charDisplayBytes & (1 << (5 * k + l)))
                            col |= (1 << (l + 1))
                    }

                    ind = (x + charOfString) * 5 + y * 128 + k + 1
                    screenBuf[ind] = col
                }
            }
            set_pos(x * 5, y)                               // Set the start position to write to
            let ind02 = x * 5 + y * 128
            let buf2 = screenBuf.slice(ind02, ind + 1)
            buf2[0] = 0x40
            pins.i2cWriteBuffer(displayAddress, buf2)       // Send data to the screen
            y += 1
        }
    }

    /**
     * Clear a specific line on the screen (1 to 8).
     * @param line is line to clear, eg: 1
     * @param screen is screen selection when using multiple screens
     */
    //% blockId="kitronik_air_quality_clear_line" block="clear line %line"
    //% weight=80 blockGap=8
    //% subcategory="Display"
    //% group="Delete"
    //% expandableArgumentMode="enable"
    //% inlineInputMode=inline
    //% line.min=1 line.max=8
    export function clearLine(line: number, screen?: 1) {
        let y = 0
        let x = 0
        displayAddress = setScreenAddr(screen)
        if (initialised == 0) {
            initDisplay(1)
        }

        // Subtract '1' from the line number to return correct y value
        y = (line - 1)

        let col = 0
        let charDisplayBytes = 0
        let ind = 0

        show("                          ", line) // Write 26 spaces to the selected line to clear it
    }

    /**
     * Draw a line of a specific length in pixels, using the (x, y) coordinates as a starting point.
     * @param lineDirection is the selection of either horizontal line or vertical line
     * @param x is start position on the X axis, eg: 0
     * @param y is start position on the Y axis, eg: 0
     * @param len is the length of line, length is the number of pixels, eg: 10
     * @param screen is screen selection when using multiple screens
     */
    //% blockId="kitronik_air_quality_draw_line" block="draw a %lineDirection | line with length of %len starting at x %x|y %y"
    //% weight=72 blockGap=8
    //% subcategory="Display"
    //% group="Draw"
    //% x.min=0, x.max=127
    //% y.min=0, y.max=63
    //% len.min=1, len.max=127
    //% inlineInputMode=inline
    export function drawLine(lineDirection: LineDirectionSelection, len: number, x: number, y: number, screen?: 1) {
        if (lineDirection == LineDirectionSelection.horizontal) {
            for (let hPixel = x; hPixel < (x + len); hPixel++)      // Loop to set the pixels in the horizontal line
                setPixel(hPixel, y, screen)
        }
        else if (lineDirection == LineDirectionSelection.vertical) {
            if (len >= 64) {          // For horizontal, 'len' can be max of 127 (full x-axis), but vertical only allowed to be max of 63 (full y-axis)
                len = 63
            }
            for (let vPixel = y; vPixel < (y + len); vPixel++)      // Loop to set the pixels in the vertical line
                setPixel(x, vPixel, screen)
        }
    }

    /**
     * Draw a rectangle with a specific width and height in pixels, using the (x, y) coordinates as a starting point.
     * @param width is width of the rectangle, eg: 60
     * @param height is height of the rectangle, eg: 30
     * @param x is the start position on the X axis, eg: 0
     * @param y is the start position on the Y axis, eg: 0
     * @param screen is screen selection when using multiple screens
     */
    //% blockId="kitronik_air_quality_draw_rect" block="draw a rectangle %width|wide %height|high from position x %x|y %y"
    //% weight=71 blockGap=8
    //% subcategory="Display"
    //% group="Draw"
    //% inlineInputMode=inline
    //% width.min=1 width.max=127
    //% height.min=1 height.max=63
    //% x.min=0 x.max=127
    //% y.min=0 y.max=63
    export function drawRect(width: number, height: number, x: number, y: number, screen?: 1) {
        if (!x) {    // If variable 'x' has not been used, default to x position of 0
            x = 0
        }

        if (!y) {    // If variable 'y' has not been used, default to y position of 0
            y = 0
        }

        // Draw the lines for each side of the rectangle
        drawLine(LineDirectionSelection.horizontal, width, x, y, screen)
        drawLine(LineDirectionSelection.horizontal, width, x, ((y + height) - 1), screen)
        drawLine(LineDirectionSelection.vertical, height, x, y, screen)
        drawLine(LineDirectionSelection.vertical, height, ((x + width) - 1), y, screen)
    }

    /**
     * Clear all pixels, text and images on the screen.
     * @param screen is screen selection when using multiple screens
     */
    //% blockId="kitronik_air_quality_clear" block="clear display"
    //% subcategory="Display"
    //% group="Delete"
    //% weight=63 blockGap=8
    export function clear(screen?: number) {
        displayAddress = setScreenAddr(screen)
        if (initialised == 0) {
            initDisplay(1)
        }

        screenBuf.fill(0)       // Fill the screenBuf with all '0'
        screenBuf[0] = 0x40
        set_pos()               // Set position to the start of the screen
        pins.i2cWriteBuffer(displayAddress, screenBuf)  // Write clear buffer to the screen
    }

    /**
     * Turn the screen on and off. The information on the screen will be kept when it is off, ready to be displayed again.
     * @param displayOutput is the boolean setting for the screen, either ON or OFF
     * @param screen is screen selection when using multiple screens
     */
    //% blockId=kitronik_air_quality_display_on_off_control
    //% block="turn %displayOutput=on_off_toggle| display"
    //% subcategory="Display"
    //% group="Control"
    //% expandableArgumentMode="toggle"
    //% weight=80 blockGap=8
    export function controlDisplayOnOff(displayOutput: boolean, screen?: 1) {
        displayAddress = setScreenAddr(screen)
        if (initialised == 0) {
            initDisplay(1)
        }

        if (displayOutput == true) {
            writeOneByte(0xAF)      // Turn display output on
        }
        else {
            writeOneByte(0xAE)      // Turn display output off
        }
    }

    /**
     * Render a boolean as an on/off toggle
     */
    //% blockId=on_off_toggle
    //% block="$on"
    //% on.shadow="toggleOnOff"
    //% blockHidden=true
    export function onOff(on: boolean): boolean {
        return on;
    }


    //////////////////////////////////////
    //
    //      Plotting blocks
    //
    //////////////////////////////////////

    /**
     * Start plotting a live graph of the chosen variable or input on the screen. 
     * @param plotVariable is the variable to be recorded on a graph on the display
     * @param screen is screen selection when using multiple screens
     */
    //% blockId="kitronik_air_quality_plot_request"
    //% subcategory="Display"
    //% group="Draw"
    //% block="plot %plotVariable| onto display"
    //% weight=100 blockGap=8
    export function plot(plotVariable: number, screen?: 1) {
        displayAddress = setScreenAddr(screen)
        if (initialised == 0) {
            initDisplay(1)
        }

        let plotLength = plotArray.length
        if (plotLength == 127) {     // If the length of the array has reached the max number of pixels, shift the array and remove the oldest value
            plotArray.shift()
        }
        // Round the variable to use ints rather than floats
        plotVariable = Math.round(plotVariable)
        // Add the value to the end of the array
        plotArray.push(plotVariable)

        // If the variable exceeds the scale of the y axis, update the min or max limits
        if (plotVariable > graphYMax)
            graphYMax = plotVariable
        if (plotVariable < graphYMin)
            graphYMin = plotVariable

        // 'for' loop plots the graph on the display
        for (let arrayPosition = 0; arrayPosition <= plotLength; arrayPosition++) {
            let x3 = arrayPosition  // Start of the screen (x-axis)
            let yPlot = plotArray[arrayPosition]
            // Map the variables to scale between the min and max values to the min and max graph pixel area
            yPlot = pins.map(yPlot, graphYMin, graphYMax, GRAPH_Y_MIN_LOCATION, GRAPH_Y_MAX_LOCATION)

            if (arrayPosition == 0) {
                previousYPlot = yPlot
            }
            let y3 = 0
            let len = 0

            // Determine if the line needs to be drawn from the last point to the new or visa-versa (vertical lines can only be drawn down the screen)
            if (yPlot < previousYPlot) {
                y3 = yPlot
                len = (previousYPlot - yPlot)
            }
            else if (yPlot > previousYPlot) {
                y3 = previousYPlot
                len = (yPlot - previousYPlot)
            }
            else {
                y3 = yPlot
                len = 1
            }

            // Clear plots in screenBuffer
            let page3 = 0
            for (let pixel = GRAPH_Y_MAX_LOCATION; pixel <= GRAPH_Y_MIN_LOCATION; pixel++) {
                page3 = pixel >> 3
                let shift_page3 = pixel % 8
                let ind5 = x3 + page3 * 128 + 1
                let screenPixel3 = clearBit(screenBuf[ind5], shift_page3)   // Clear the screen data byte
                screenBuf[ind5] = screenPixel3                              // Store data in screenBuffer
            }

            // Plot new data in screenBuffer
            for (let pixel = y3; pixel < (y3 + len); pixel++) {
                page3 = pixel >> 3
                let shift_page4 = pixel % 8
                let ind6 = x3 + page3 * 128 + 1
                let screenPixel4 = (screenBuf[ind6] | (1 << shift_page4))   // Set the screen data byte
                screenBuf[ind6] = screenPixel4                              // Store data in screen buffer
            }
            previousYPlot = yPlot
        }
        refresh() // Refresh screen with new data in screenBuffer
    }


    //////////////////////////////////////
    //
    //      Expert blocks
    //
    //////////////////////////////////////

    /**
     * Update or refresh the screen if any data has been changed.
     * @param screen is screen selection when using multiple screens
     */
    //% subcategory="Display"
    //% group="Advanced"
    //% blockId="kitronik_air_quality_draw" block="refresh display"
    //% weight=63 blockGap=8
    export function refresh(screen?: 1) {
        displayAddress = setScreenAddr(screen)
        if (initialised == 0) {
            initDisplay(1)
        }

        set_pos()
        pins.i2cWriteBuffer(displayAddress, screenBuf)
    }

    /**
     * Invert the colours on the screen (black to white, white to black)
     * @param output toggles between inverting the colours of the display
     */
    //% subcategory="Display"
    //% group="Advanced"
    //% blockId="kitronik_air_quality_invert_screen" block="inverted display %output=on_off_toggle"
    //% weight=62 blockGap=8
    export function invert(output: boolean, screen?: 1) {
        let invertRegisterValue = 0
        displayAddress = setScreenAddr(screen)
        if (initialised == 0) {
            initDisplay(1)
        }

        if (output == true) {
            invertRegisterValue = 0xA7
        }
        else {
            invertRegisterValue = 0xA6
        }
        writeOneByte(invertRegisterValue)
    }

    ////////////////////////////////
    //            RTC             //
    ////////////////////////////////

    /**
     * Alarm repeat type
     */
    export enum AlarmType {
        //% block="Single"
        Single = 0,
        //% block="Daily Repeating"
        Repeating = 1
    }

    /**
     * Alarm silence type
     */
    export enum AlarmSilence {
        //% block="Auto Silence"
        autoSilence = 1,
        //% block="User Silence"
        userSilence = 2
    }

    let alarmHour = 0       //The hour setting for the alarm
    let alarmMin = 0        //The minute setting for the alarm
    export let alarmSetFlag = 0    //Flag set to '1' when an alarm is set
    let alarmRepeat = 0     //If '1' shows that the alarm should remain set so it triggers at the next time match
    let alarmOff = 0        //If '1' shows that alarm should auto switch off, if '2' the user must switch off 
    let alarmTriggered = 0  //Flag to show if the alarm has been triggered ('1') or not ('0')
    let alarmTriggerHandler: Action
    let alarmHandler: Action
    let simpleCheck = 0 //If '1' shows that the alarmHandler is not required as the check is inside an "if" statement

    /**
     * Set time on RTC, as three numbers
     * @param setHours is to set the hours
     * @param setMinutes is to set the minutes
     * @param setSeconds is to set the seconds
    */
    //% subcategory="Clock"
    //% group="Set Time"
    //% blockId=kitronik_air_quality_set_time 
    //% block="Set Time to %setHours|hrs %setMinutes|mins %setSeconds|secs"
    //% setHours.min=0 setHours.max=23
    //% setMinutes.min=0 setMinutes.max=59
    //% setSeconds.min=0 setSeconds.max=59
    //% weight=100 blockGap=8
    export function setTime(setHours: number, setMinutes: number, setSeconds: number): void {

        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }

        let bcdHours = kitronik_RTC.decToBcd(setHours)                           //Convert number to binary coded decimal
        let bcdMinutes = kitronik_RTC.decToBcd(setMinutes)                       //Convert number to binary coded decimal
        let bcdSeconds = kitronik_RTC.decToBcd(setSeconds)                       //Convert number to binary coded decimal
        let writeBuf = pins.createBuffer(2)

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.STOP_RTC                                  //Disable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_HOURS_REG
        writeBuf[1] = bcdHours                                      //Send new Hours value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_MINUTES_REG
        writeBuf[1] = bcdMinutes                                    //Send new Minutes value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.START_RTC | bcdSeconds                            //Send new seconds masked with the Enable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
    }

    /**
     * Read time from RTC as a string
    */
    //% subcategory="Clock"
    //% group="Read Time"
    //% blockId=kitronik_air_quality_read_time 
    //% block="Read Time as String"
    //% weight=95 blockGap=8
    export function readTime(): string {

        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }

        //read Values
        kitronik_RTC.readValue()

        let decSeconds = kitronik_RTC.bcdToDec(kitronik_RTC.currentSeconds, kitronik_RTC.RTC_SECONDS_REG)                  //Convert number to Decimal
        let decMinutes = kitronik_RTC.bcdToDec(kitronik_RTC.currentMinutes, kitronik_RTC.RTC_MINUTES_REG)                  //Convert number to Decimal
        let decHours = kitronik_RTC.bcdToDec(kitronik_RTC.currentHours, kitronik_RTC.RTC_HOURS_REG)                        //Convert number to Decimal

        //Combine hours,minutes and seconds in to one string
        let strTime: string = "" + ((decHours / 10) >> 0) + decHours % 10 + ":" + ((decMinutes / 10) >> 0) + decMinutes % 10 + ":" + ((decSeconds / 10) >> 0) + decSeconds % 10

        return strTime
    }

    /**
     * Set date on RTC as three numbers
     * @param setDay is to set the day in terms of numbers 1 to 31
     * @param setMonths is to set the month in terms of numbers 1 to 12
     * @param setYears is to set the years in terms of numbers 0 to 99
    */
    //% subcategory="Clock"
    //% group="Set Date"
    //% blockId=kitronik_air_quality_set_date 
    //% block="Set Date to %setDays|Day %setMonths|Month %setYear|Year"
    //% setDay.min=1 setDay.max=31
    //% setMonth.min=1 setMonth.max=12
    //% setYear.min=0 setYear.max=99
    //% weight=90 blockGap=8
    export function setDate(setDay: number, setMonth: number, setYear: number): void {

        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }

        let leapYearCheck = 0
        let writeBuf = pins.createBuffer(2)
        let readBuf = pins.createBuffer(1)
        let bcdDay = 0
        let bcdMonths = 0
        let bcdYears = 0
        let readCurrentSeconds = 0

        //Check day entered does not exceed month that has 30 days in
        if ((setMonth == 4) || (setMonth == 6) || (setMonth == 9) || (setMonth == 11)) {
            if (setDay == 31) {
                setDay = 30
            }
        }

        //Leap year check and does not exceed 30 days
        if ((setMonth == 2) && (setDay >= 29)) {
            leapYearCheck = setYear % 4
            if (leapYearCheck == 0)
                setDay = 29
            else
                setDay = 28
        }

        let weekday = kitronik_RTC.calcWeekday(setDay, setMonth, (setYear + 2000))

        bcdDay = kitronik_RTC.decToBcd(setDay)                       //Convert number to binary coded decimal
        bcdMonths = kitronik_RTC.decToBcd(setMonth)                  //Convert number to binary coded decimal
        bcdYears = kitronik_RTC.decToBcd(setYear)                    //Convert number to binary coded decimal

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        readBuf = pins.i2cReadBuffer(kitronik_RTC.CHIP_ADDRESS, 1, false)
        readCurrentSeconds = readBuf[0]

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.STOP_RTC                                  //Disable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_WEEKDAY_REG
        writeBuf[1] = weekday                                        //Send new Weekday value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_DAY_REG
        writeBuf[1] = bcdDay                                        //Send new Day value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_MONTH_REG
        writeBuf[1] = bcdMonths                                     //Send new Months value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_YEAR_REG
        writeBuf[1] = bcdYears                                      //Send new Year value
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)

        writeBuf[0] = kitronik_RTC.RTC_SECONDS_REG
        writeBuf[1] = kitronik_RTC.START_RTC | readCurrentSeconds                    //Enable Oscillator
        pins.i2cWriteBuffer(kitronik_RTC.CHIP_ADDRESS, writeBuf, false)
    }

    /**
     * Read date from RTC as a string
    */
    //% subcategory="Clock"
    //% group="Read Date"
    //% blockId=kitronik_air_quality_read_date 
    //% block="Read Date as String"
    //% weight=85 blockGap=8
    export function readDate(): string {

        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }

        //read Values
        kitronik_RTC.readValue()

        let decDay = kitronik_RTC.bcdToDec(kitronik_RTC.currentDay, kitronik_RTC.RTC_DAY_REG)                      //Convert number to Decimal
        let decMonths = kitronik_RTC.bcdToDec(kitronik_RTC.currentMonth, kitronik_RTC.RTC_MONTH_REG)               //Convert number to Decimal
        let decYears = kitronik_RTC.bcdToDec(kitronik_RTC.currentYear, kitronik_RTC.RTC_YEAR_REG)                  //Convert number to Decimal

        //let strDate: string = decDay + "/" + decMonths + "/" + decYears
        let strDate: string = "" + ((decDay / 10) >> 0) + (decDay % 10) + "/" + ((decMonths / 10) >> 0) + (decMonths % 10) + "/" + ((decYears / 10) >> 0) + (decYears % 10)
        return strDate
    }

    /**Read time parameter from RTC*/
    //% subcategory="Clock"
    //% group="Read Time"
    //% blockId=kitronik_air_quality_read_time_parameter 
    //% block="Read %selectParameter| as Number"
    //% weight=75 blockGap=8
    export function readTimeParameter(selectParameter: TimeParameter): number {

        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }
        let decParameter = 0
        //read Values
        kitronik_RTC.readValue()

        //from enum convert the required time parameter and return
        if (selectParameter == TimeParameter.Hours) {
            decParameter = kitronik_RTC.bcdToDec(kitronik_RTC.currentHours, kitronik_RTC.RTC_HOURS_REG)                   //Convert number to Decimal
        }
        else if (selectParameter == TimeParameter.Minutes) {
            decParameter = kitronik_RTC.bcdToDec(kitronik_RTC.currentMinutes, kitronik_RTC.RTC_MINUTES_REG)                  //Convert number to Decimal
        }
        else if (selectParameter == TimeParameter.Seconds) {
            decParameter = kitronik_RTC.bcdToDec(kitronik_RTC.currentSeconds, kitronik_RTC.RTC_SECONDS_REG)                  //Convert number to Decimal
        }

        return decParameter
    }

    /**Read time parameter from RTC*/
    //% subcategory="Clock"
    //% group="Read Date"
    //% blockId=kitronik_air_quality_read_date_parameter 
    //% block="Read %selectParameter| as Number"
    //% weight=65 blockGap=8
    export function readDateParameter(selectParameter: DateParameter): number {

        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }
        let decParameter = 0
        //read Values
        kitronik_RTC.readValue()

        //from enum convert the required time parameter and return
        if (selectParameter == DateParameter.Day) {
            decParameter = kitronik_RTC.bcdToDec(kitronik_RTC.currentDay, kitronik_RTC.RTC_DAY_REG)                   //Convert number to Decimal
        }
        else if (selectParameter == DateParameter.Month) {
            decParameter = kitronik_RTC.bcdToDec(kitronik_RTC.currentMonth, kitronik_RTC.RTC_MONTH_REG)                  //Convert number to Decimal
        }
        else if (selectParameter == DateParameter.Year) {
            decParameter = kitronik_RTC.bcdToDec(kitronik_RTC.currentYear, kitronik_RTC.RTC_YEAR_REG)                   //Convert number to Decimal
        }

        return decParameter
    }

    /**
     * Set simple alarm
     * @param alarmType determines whether the alarm repeats
     * @param hour is the alarm hour setting (24 hour)
     * @param min is the alarm minute setting
     * @param alarmSilence determines whether the alarm turns off automatically or the user turns it off
    */
    //% subcategory="Clock"
    //% group=Alarm
    //% blockId=kitronik_air_quality_simple_set_alarm 
    //% block="set %alarmType|alarm to %hour|:%min|with %alarmSilence"
    //% hour.min=0 hour.max=23
    //% min.min=0 min.max=59
    //% sec.min=0 sec.max=59
    //% inlineInputMode=inline
    //% weight=26 blockGap=8
    export function simpleAlarmSet(alarmType: AlarmType, hour: number, min: number, alarmSilence: AlarmSilence): void {
        if (kitronik_RTC.initalised == false) {
            kitronik_RTC.secretIncantation()
        }

        if (alarmType == 1) {
            alarmRepeat = 1     //Daily Repeating Alarm
        }
        else {
            alarmRepeat = 0     //Single Alarm
        }

        if (alarmSilence == 1) {
            alarmOff = 1                //Auto Silence
        }
        else if (alarmSilence == 2) {
            alarmOff = 2                //User Silence
        }

        alarmHour = hour
        alarmMin = min

        alarmSetFlag = 1

        //Set background alarm trigger check running
        control.inBackground(() => {
            while (alarmSetFlag == 1) {
                backgroundAlarmCheck()
                basic.pause(1000)
            }
        })
    }

    //Function to check if an alarm is triggered and raises the trigger event if true
    //Runs in background once an alarm is set, but only if alarmSetFlag = 1
    function backgroundAlarmCheck(): void {
        let checkHour = readTimeParameter(TimeParameter.Hours)
        let checkMin = readTimeParameter(TimeParameter.Minutes)
        if (alarmTriggered == 1 && alarmRepeat == 1) {
            if (checkMin != alarmMin) {
                alarmSetFlag = 0
                alarmTriggered = 0
                simpleAlarmSet(AlarmType.Repeating, alarmHour, alarmMin, alarmOff) //Reset the alarm after the current minute has changed
            }
        }
        if (checkHour == alarmHour && checkMin == alarmMin) {
            alarmTriggered = 1
            if (alarmOff == 1) {
                alarmSetFlag = 0
                if (simpleCheck != 1) {
                    alarmHandler() //This causes a problem for the simpleAlarmCheck() function, so only runs for onAlarmTrigger()
                }
                basic.pause(2500)
                if (alarmRepeat == 1) {
                    control.inBackground(() => {
                        checkMin = readTimeParameter(TimeParameter.Minutes)
                        while (checkMin == alarmMin) {
                            basic.pause(1000)
                            checkMin = readTimeParameter(TimeParameter.Minutes)
                        }
                        alarmTriggered = 0
                        simpleAlarmSet(AlarmType.Repeating, alarmHour, alarmMin, alarmOff) //Reset the alarm after the current minute has changed
                    })
                }
            }
            else if (alarmOff == 2) {
                if (simpleCheck != 1) {
                    alarmHandler() //This causes a problem for the simpleAlarmCheck() function, so only runs for onAlarmTrigger()
                }
            }
        }
        if (alarmTriggered == 1 && alarmOff == 2 && checkMin != alarmMin) {
            alarmSetFlag = 0
            alarmTriggered = 0
        }
    }

    /**
     * Do something if the alarm is triggered
     */
    //% subcategory="Clock"
    //% group=Alarm
    //% blockId=kitronik_air_quality_on_alarm block="on alarm trigger"
    //% weight=25 blockGap=8
    export function onAlarmTrigger(alarmTriggerHandler: Action): void {
        alarmHandler = alarmTriggerHandler
    }

    /**
     * Determine if the alarm is triggered and return a boolean
    */
    //% subcategory="Clock"
    //% group=Alarm
    //% blockId=kitronik_air_quality_simple_check_alarm 
    //% block="alarm triggered"
    //% weight=24 blockGap=8
    export function simpleAlarmCheck(): boolean {
        simpleCheck = 1 //Makes sure the alarmHandler() is not called
        let checkHour = readTimeParameter(TimeParameter.Hours)
        let checkMin = readTimeParameter(TimeParameter.Minutes)
        if (alarmSetFlag == 1 && checkHour == alarmHour && checkMin == alarmMin) {
            if (alarmOff == 1) {
                control.inBackground(() => {
                    basic.pause(2500)
                    alarmSetFlag = 0
                })
            }
            return true
        }
        else {
            return false
        }
    }

    /**
     * Turn off the alarm
    */
    //% subcategory="Clock"
    //% group=Alarm
    //% blockId=kitronik_air_quality_alarm_off 
    //% block="turn off alarm"
    //% weight=23 blockGap=8
    export function simpleAlarmOff(): void {
        alarmSetFlag = 0
        if (alarmTriggered == 1 && alarmRepeat == 1) {
            control.inBackground(() => {
                let checkMin = readTimeParameter(TimeParameter.Minutes)
                while (checkMin == alarmMin) {
                    basic.pause(1000)
                    checkMin = readTimeParameter(TimeParameter.Minutes)
                }
                alarmTriggered = 0
                simpleAlarmSet(AlarmType.Repeating, alarmHour, alarmMin, alarmOff) //Reset the alarm after the current minute has changed
            })
        }
    }

    ////////////////////////////////
    //          BME688            //
    ////////////////////////////////

    //List of different temperature units
    export enum TemperatureUnitList {
        //% block="°C"
        C,
        //% block="°F"
        F
    }

    //List of different pressure units
    export enum PressureUnitList {
        //% block="Pa"
        Pa,
        //% block="mBar"
        mBar
    }

    // Useful BME688 Register Addresses
    // Control
    const CHIP_ADDRESS = 0x77    // I2C address as determined by hardware configuration
    const CTRL_MEAS = 0x74       // Bit position <7:5>: Temperature oversampling   Bit position <4:2>: Pressure oversampling   Bit position <1:0>: Sensor power mode
    const RESET = 0xE0           // Write 0xB6 to initiate soft-reset (same effect as power-on reset)
    const CHIP_ID = 0xD0         // Read this to return the chip ID: 0x61 - good way to check communication is occurring
    const CTRL_HUM = 0x72        // Bit position <2:0>: Humidity oversampling settings
    const CONFIG = 0x75          // Bit position <4:2>: IIR filter settings
    const CTRL_GAS_0 = 0x70      // Bit position <3>: Heater off (set to '1' to turn off current injection)
    const CTRL_GAS_1 = 0x71      // Bit position <5> DATASHEET ERROR: Enable gas conversions to start when set to '1'   Bit position <3:0>: Heater step selection (0 to 9)

    // Pressure Data
    const PRESS_MSB_0 = 0x1F     // Forced & Parallel: MSB [19:12]
    const PRESS_LSB_0 = 0x20     // Forced & Parallel: LSB [11:4]
    const PRESS_XLSB_0 = 0x21    // Forced & Parallel: XLSB [3:0]

    // Temperature Data
    const TEMP_MSB_0 = 0x22      // Forced & Parallel: MSB [19:12]
    const TEMP_LSB_0 = 0x23      // Forced & Parallel: LSB [11:4]
    const TEMP_XLSB_0 = 0x24     // Forced & Parallel: XLSB [3:0]

    // Humidity Data
    const HUMID_MSB_0 = 0x25     // Forced & Parallel: MSB [15:8]
    const HUMID_LSB_0 = 0x26     // Forced & Parallel: LSB [7:0]

    // Gas Resistance Data
    const GAS_RES_MSB_0 = 0x2C   // Forced & Parallel: MSB [9:2]
    const GAS_RES_LSB_0 = 0x2D   // Forced & Parallel: Bit <7:6>: LSB [1:0]    Bit <5>: Gas valid    Bit <4>: Heater stability    Bit <3:0>: Gas resistance range

    // Status
    const MEAS_STATUS_0 = 0x1D   // Forced & Parallel: Bit <7>: New data    Bit <6>: Gas measuring    Bit <5>: Measuring    Bit <3:0>: Gas measurement index

    //The following functions are for reading the registers on the BME688
    //function for reading register as unsigned 8 bit integer
    function getUInt8BE(reg: number): number {
        pins.i2cWriteNumber(CHIP_ADDRESS, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(CHIP_ADDRESS, NumberFormat.UInt8BE);
    }

    //function for reading register as signed 8 bit integer (little endian)
    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(CHIP_ADDRESS, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(CHIP_ADDRESS, NumberFormat.Int8LE);
    }

    //function for reading register as signed 8 bit integer (big endian)
    function getInt8BE(reg: number): number {
        pins.i2cWriteNumber(CHIP_ADDRESS, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(CHIP_ADDRESS, NumberFormat.Int8BE);
    }

    // Function to convert unsigned ints to twos complement signed ints
    function twosComp(value: number, bits: number): number {
        if ((value & (1 << (bits - 1))) != 0) {
            value = value - (1 << bits)
        }
        return value
    }

    // Calibration parameters for compensation calculations
    let tempLSB = 0
    let tempMSB = 0
    // Temperature
    tempLSB = getUInt8BE(0xE9)
    tempMSB = getUInt8BE(0xEA)
    let PAR_T1 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    tempLSB = getInt8BE(0x8A)
    tempMSB = getInt8BE(0x8B)
    let PAR_T2 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    let PAR_T3 = getInt8BE(0x8C)                                 // Signed 8-bit

    // Pressure
    tempLSB = getUInt8BE(0x8E)
    tempMSB = getUInt8BE(0x8F)
    let PAR_P1 = (tempMSB << 8) | tempLSB                    // Always a positive number, do not do twosComp() conversion!
    tempLSB = getUInt8BE(0x90)
    tempMSB = getUInt8BE(0x91)
    let PAR_P2 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    let PAR_P3 = getInt8BE(0x92)                                 // Signed 8-bit
    tempLSB = getUInt8BE(0x94)
    tempMSB = getUInt8BE(0x95)
    let PAR_P4 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    tempLSB = getUInt8BE(0x96)
    tempMSB = getUInt8BE(0x97)
    let PAR_P5 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    let PAR_P6 = getInt8BE(0x99)                                 // Signed 8-bit
    let PAR_P7 = getInt8BE(0x98)                                 // Signed 8-bit
    tempLSB = getUInt8BE(0x9C)
    tempMSB = getUInt8BE(0x9D)
    let PAR_P8 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    tempLSB = getUInt8BE(0x9E)
    tempMSB = getUInt8BE(0x9F)
    let PAR_P9 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    let PAR_P10 = getInt8BE(0xA0)                                // Signed 8-bit

    // Humidity
    let parH1_LSB_parH2_LSB = getUInt8BE(0xE2)
    let PAR_H1 = (getUInt8BE(0xE3) << 4) | (parH1_LSB_parH2_LSB & 0x0F)
    let PAR_H2 = (getUInt8BE(0xE1) << 4) | (parH1_LSB_parH2_LSB >> 4)
    let PAR_H3 = getInt8BE(0xE4)                                 // Signed 8-bit
    let PAR_H4 = getInt8BE(0xE5)                                 // Signed 8-bit
    let PAR_H5 = getInt8BE(0xE6)                                 // Signed 8-bit
    let PAR_H6 = getInt8BE(0xE7)                                 // Signed 8-bit
    let PAR_H7 = getInt8BE(0xE8)                                 // Signed 8-bit

    // Gas resistance
    let PAR_G1 = getInt8BE(0xED)                                 // Signed 8-bit
    tempLSB = getUInt8BE(0xEB)
    tempMSB = getUInt8BE(0xEC)
    let PAR_G2 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    let PAR_G3 = getUInt8BE(0xEE)                                // Unsigned 8-bit
    let RES_HEAT_RANGE = (getUInt8BE(0x02) >> 4) & 0x03
    let RES_HEAT_VAL = twosComp(getUInt8BE(0x00), 8)              // Signed 8-bit

    // Oversampling rate constants
    const OSRS_1X = 0x01
    const OSRS_2X = 0x02
    const OSRS_4X = 0x03
    const OSRS_8X = 0x04
    const OSRS_16X = 0x05

    // IIR filter coefficient values
    const IIR_0 = 0x00
    const IIR_1 = 0x01
    const IIR_3 = 0x02
    const IIR_7 = 0x03
    const IIR_15 = 0x04
    const IIR_31 = 0x05
    const IIR_63 = 0x06
    const IIR_127 = 0x07

    //Global variables used for storing one copy of value, these are used in multiple locations for calculations
    let bme688InitFlag = false
    let gasInit = false
    let measurementsBuf = pins.createBuffer(8)
    let writeBuf = pins.createBuffer(2)

    export let temperatureReading = 0       // calculated readings of sensor parameters from raw adc readings
    export let pressureReading = 0
    export let humidityReading = 0
    export let gasResistance = 0
    export let iaqPercent = 0
    export let iaqScore = 0
    export let airQualityRating = ""
    export let eCO2Value = 0

    let gasBaseline = 0
    let humidityBaseline = 40        // Between 30% & 50% is a widely recognised optimal indoor humidity, 40% is a good middle ground
    let humidityWeighting = 0.25     // Humidity contributes 25% to the IAQ score, gas resistance is 75%
    let prevTemperature = 0
    let prevHumidity = 0
    let measureTime = 0
    let prevMeasureTime = 0


    let adcRawTemperature = 0    // adc reading of raw temperature
    let adcRawPressure = 0       // adc reading of raw pressure
    let adcRawHumidity = 0       // adc reading of raw humidity
    let adcRawGasResistance = 0  // adc reading of raw gas resistance
    let gasRange = 0

    // Compensation calculation intermediate variables (used across temperature, pressure, humidity and gas)
    let var1 = 0
    let var2 = 0
    let var3 = 0
    let var4 = 0
    let var5 = 0
    let var6 = 0

    let t_fine = 0                          // Intermediate temperature value used for pressure calculation
    export let ambientTemperature = 0       // Intermediate temperature value used for heater calculation
    let ambTempPos = 0                      // Current position of the ambTemp measurement to store in EEPROM
    let ambTempFlag = false

    // Temperature compensation calculation: rawADC to degrees C (integer)
    export function calcTemperature(tempADC: number): void {
        prevTemperature = temperatureReading

        //var1 = (tempADC >> 3) - (PAR_T1 << 1)
        var1 = (tempADC >> 3)
        var2 = (PAR_T1 << 1)
        var1 = var1 - var2

        //var2 = (var1 * PAR_T2) >> 11
        var4 = (var1 * PAR_T2)
        var2 = var4 >> 11

        //var3 = ((((var1 >> 1) * (var1 >> 1)) >> 12) * (PAR_T3 << 4)) >> 14
        var1 = (var1 >> 1)
        var4 = (var1 * var1)
        var4 = (var4 >> 12)
        var5 = (PAR_T3 << 4)
        var1 = (var4 * var5)
        var3 = var1 >> 14

        t_fine = var2 + var3
        let newAmbTemp = ((t_fine * 5) + 128) >> 8
        temperatureReading = newAmbTemp / 100     // Convert to floating point with 2 dp

        var1 = 0
        var2 = 0
        var3 = 0
        var4 = 0
        var5 = 0

        // Change position in the ambPrevTemps[] array ready for next reading to be stored, overwriting the previous one in that position
        if (ambTempFlag == false) {
            if (ambTempPos < 59) {
                let newAmbTemp_H = newAmbTemp >> 8
                let newAmbTemp_L = newAmbTemp & 0xFF
                writeByte(newAmbTemp_H, ((13 * 128) + ambTempPos))
                writeByte(newAmbTemp_L, ((13 * 128) + ambTempPos + 1))
                //ambPrevTemps[ambTempPos] = newAmbTemp   // Store latest temperature in ambient temperature array
                ambTempPos++
            }
            else {
                ambTempPos = 0
                ambTempFlag = true      // Set flag to show there are now 60 previous temperature readings so the average can now be calculated
            }
        }
    }

    // Pressure compensation calculation: rawADC to Pascals (integer)
    export function intCalcPressure(pressureADC: number): void {
        //var1 = (t_fine >> 1) - 64000
        var1 = (t_fine >> 1)
        var1 = (var1 - 64000)

        //var2 = ((((var1 >> 2) * (var1 >> 2)) >> 11) * PAR_P6) >> 2
        var3 = (var1 >> 2)
        var3 = (var3 * var3)
        var3 = (var3 >> 11)
        var3 = (var3 * PAR_P6)
        var2 = (var3 >> 2)

        //var2 = var2 + ((var1 * PAR_P5) << 1)
        var3 = (var1 * PAR_P5)
        var3 = (var3 << 1)
        var2 = (var2 + var3)

        //var2 = (var2 >> 2) + (PAR_P4 << 16)
        var3 = (var2 >> 2)
        var4 = (PAR_P4 << 16)
        var2 = (var3 + var4)

        //var1 = (((((var1 >> 2) * (var1 >> 2)) >> 13) * (PAR_P3 << 5)) >> 3) + ((PAR_P2 * var1) >> 1)
        var3 = (var1 >> 2)
        var3 = (var3 * var3)
        var3 = (var3 >> 13)
        var4 = (PAR_P3 << 5)
        var4 = (var3 * var4)
        var4 = (var4 >> 3)
        var5 = (PAR_P2 * var1)
        var5 = (var5 >> 1)
        var1 = (var4 + var5)

        var1 = var1 >> 18

        //var1 = ((32768 + var1) * PAR_P1) >> 15
        var1 = (32768 + var1)
        var1 = (var1 * PAR_P1)
        var1 = (var1 >> 15)

        pressureReading = 1048576 - pressureADC

        //pressureReading = ((pressureReading - (var2 >> 12)) * 3125)
        var4 = (var2 >> 12)
        var4 = (pressureReading - var4)
        pressureReading = (var4 * 3125)

        if (pressureReading >= (1 << 30)) {
            pressureReading = Math.idiv(pressureReading, var1) << 1
        }
        else {
            pressureReading = Math.idiv((pressureReading << 1), var1)
        }

        //var1 = (PAR_P9 * (((pressureReading >> 3) * (pressureReading >> 3)) >> 13)) >> 12
        var4 = (pressureReading >> 3)
        var4 = (var4 * var4)
        var4 = (var4 >> 13)
        var5 = (PAR_P9 * var4)
        var1 = (var5 >> 12)

        //var2 = ((pressureReading >> 2) * PAR_P8) >> 13
        var4 = (pressureReading >> 2)
        var4 = (var4 * PAR_P8)
        var2 = (var4 >> 13)

        //var3 = ((pressureReading >> 8) * (pressureReading >> 8) * (pressureReading >> 8) * PAR_P10) >> 17
        var4 = (pressureReading >> 8)
        var5 = (var4 * var4 * var4 * PAR_P10)
        var3 = (var5 >> 17)

        //pressureReading = pressureReading + ((var1 + var2 + var3 + (PAR_P7 << 7)) >> 4)
        var4 = (PAR_P7 << 7)
        var5 = (var1 + var2 + var3 + var4)
        var5 = (var5 >> 4)
        pressureReading = (pressureReading + var5)

        var1 = 0
        var2 = 0
        var3 = 0
        var4 = 0
        var5 = 0
    }

    // Humidity compensation calculation: rawADC to % (integer)
    // 'tempScaled' is the current reading from the Temperature sensor
    export function intCalcHumidity(humidADC: number, tempScaled: number): void {
        prevHumidity = humidityReading

        //var1 = humidADC - (PAR_H1 << 4) - (Math.idiv((tempScaled * PAR_H3), 100) >> 1)
        var4 = (tempScaled * PAR_H3)
        var4 = Math.idiv(var4, 100)
        var4 = (var4 >> 1)
        var5 = (PAR_H1 << 4)
        var1 = (humidADC - var5 - var4)

        //var2 = (PAR_H2 * (Math.idiv((tempScaled * PAR_H4), 100) + Math.idiv(((tempScaled * (Math.idiv((tempScaled * PAR_H5), 100))) >> 6), 100) + ((1 << 14)))) >> 10
        var3 = (tempScaled * PAR_H4)
        var3 = Math.idiv(var3, 100)
        var4 = (tempScaled * PAR_H5)
        var4 = Math.idiv(var4, 100)
        var4 = (tempScaled * var4)
        var4 = (var4 >> 6)
        var4 = Math.idiv(var4, 100)
        var5 = (1 << 14)
        var6 = (var3 + var4 + var5)
        var6 = (PAR_H2 * var6)
        var2 = (var6 >> 10)

        var3 = var1 * var2

        //var4 = ((PAR_H6 << 7) + (Math.idiv((tempScaled * PAR_H7), 100))) >> 4
        var1 = (PAR_H6 << 7)
        var2 = (tempScaled * PAR_H7)
        var2 = Math.idiv(var2, 100)
        var2 = (var1 + var2)
        var4 = (var2 >> 4)

        //var5 = ((var3 >> 14) * (var3 >> 14)) >> 10
        var1 = (var3 >> 14)
        var1 = (var1 * var1)
        var5 = (var1 >> 10)

        var6 = (var4 * var5) >> 1

        humidityReading = (var3 + var6) >> 12

        //humidityReading = (((var3 + var6) >> 10) * (1000)) >> 12
        var1 = (var3 + var6)
        var1 = (var1 >> 10)
        var2 = (var1 * 1000)
        humidityReading = (var2 >> 12)

        humidityReading = Math.idiv(humidityReading, 1000)

        var1 = 0
        var2 = 0
        var3 = 0
        var4 = 0
        var5 = 0
        var6 = 0
    }

    // Gas sensor heater target temperature to target resistance calculation
    // 'ambientTemp' is reading from Temperature sensor in degC (could be averaged over a day when there is enough data?)
    // 'targetTemp' is the desired temperature of the hot plate in degC (in range 200 to 400)
    // Note: Heating duration also needs to be specified for each heating step in 'gas_wait' registers
    export function intConvertGasTargetTemp(ambientTemp: number, targetTemp: number): number {
        //var1 = Math.idiv((ambientTemp * PAR_G3), 1000) << 8    // Divide by 1000 as we have ambientTemp in pre-degC format (i.e. 2500 rather than 25.00 degC)
        var2 = (ambientTemp * PAR_G3)
        var2 = Math.idiv(var2, 1000)
        var1 = (var2 << 8)

        //var2 = (PAR_G1 + 784) * Math.idiv((Math.idiv(((PAR_G2 + 154009) * targetTemp * 5), 100) + 3276800), 10)
        var3 = (PAR_G1 + 784)
        var4 = (PAR_G2 + 154009)
        var4 = (var4 * targetTemp * 5)
        var4 = Math.idiv(var4, 100)
        var4 = (var4 + 3276800)
        var5 = Math.idiv(var4, 10)
        var2 = (var3 + var5)

        var3 = var1 + (var2 >> 1)

        var4 = Math.idiv(var3, (RES_HEAT_RANGE + 4))

        var5 = (131 * RES_HEAT_VAL) + 65536                 // Target heater resistance in Ohms

        //let resHeatX100 = ((Math.idiv(var4, var5) - 250) * 34)
        var1 = Math.idiv(var4, var5)
        var1 = (var1 - 250)
        let resHeatX100 = (var1 * 34)

        let resHeat = Math.idiv((resHeatX100 + 50), 100)

        var1 = 0
        var2 = 0
        var3 = 0
        var4 = 0
        var5 = 0

        return resHeat
    }

    // Gas resistance compensation calculation: rawADC & range to Ohms (integer)
    export function intCalcGasResistance(gasADC: number, gasRange: number): void {
        var1 = 262144 >> gasRange
        var2 = gasADC - 512
        var2 = var2 * 3
        var2 = 4096 + var2
        let calcGasRes = Math.idiv((10000 * var1), var2)

        var1 = 0
        var2 = 0

        gasResistance = calcGasRes * 100
    }

    // Initialise the BME688, establishing communication, entering initial T, P & H oversampling rates, setup filter and do a first data reading (won't return gas)
    export function bme688Init(): void {
        // Establish communication with BME688
        writeBuf[0] = CHIP_ID
        let chipID = getUInt8BE(writeBuf[0])
        while (chipID != 0x61) {
            chipID = getUInt8BE(writeBuf[0])
        }

        // Do a soft reset
        writeBuf[0] = RESET
        writeBuf[1] = 0xB6
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)
        basic.pause(1000)

        // Set mode to SLEEP MODE: CTRL_MEAS reg <1:0>
        writeBuf[0] = CTRL_MEAS
        writeBuf[1] = 0x00
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        // Set the oversampling rates for Temperature, Pressure and Humidity
        // Humidity: CTRL_HUM bits <2:0>
        writeBuf[0] = CTRL_HUM
        writeBuf[1] = OSRS_2X
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)
        // Temperature: CTRL_MEAS bits <7:5>     Pressure: CTRL_MEAS bits <4:2>    (Combine and write both in one command)
        writeBuf[0] = CTRL_MEAS
        writeBuf[1] = (OSRS_2X << 5) | (OSRS_16X << 2)
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        // IIR Filter: CONFIG bits <4:2>
        writeBuf[0] = CONFIG
        writeBuf[1] = IIR_3 << 2
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        // Enable gas conversion: CTRL_GAS_1 bit <5>    (although datasheet says <4> - not sure what's going on here...)
        writeBuf[0] = CTRL_GAS_1
        writeBuf[1] = 0x20    // LOOKS LIKE IT'S BIT 5 NOT BIT 4 - NOT WHAT THE DATASHEET SAYS
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        bme688InitFlag = true

        // Do an initial data read (will only return temperature, pressure and humidity as no gas sensor parameters have been set)
        measureData()
    }

    /**
    * Setup the gas sensor (defaults are 300°C and 150ms).
    * Expand the block to set a specific target temperature (200 - 400°C) and 'on-time' duration (0 - 4032ms).
    * @param targetTemp is the target temperature for the gas sensor plate to reach (200 - 400°C), eg: 300
    * @param heatDuration is the length of time for the heater to be turned on (0 - 4032ms), eg: 150
    */
    //% subcategory="Sensors"
    //% group="Setup"
    //% blockId=kitronik_air_quality_setup_gas_sensor
    //% block="setup gas sensor||: temperature %targetTemp|°C, duration %heatDuration|ms"
    //% weight=100 blockGap=8
    //% targetTemp.min = 200 targetTemp.max = 400
    //% heatDuration.min = 0 heatDuration.max = 4032
    export function setupGasSensor(targetTemp?: number, heatDuration?: number): void {
        if (bme688InitFlag == false) {
            bme688Init()
        }

        // Limit targetTemp between 200°C & 400°C
        if (targetTemp < 200) {
            targetTemp = 200
        }
        else if (targetTemp > 400) {
            targetTemp = 400
        }
        // Limit heatDuration between 0ms and 4032ms
        if (heatDuration < 0) {
            heatDuration = 0
        }
        else if (heatDuration > 4032) {
            heatDuration = 4032
        }

        // Define the target heater resistance from temperature (Heater Step 0)
        writeBuf[0] = 0x5A                                                          // res_wait_0 register - heater step 0
        writeBuf[1] = intConvertGasTargetTemp(ambientTemperature, targetTemp)
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        // Define the heater on time, converting ms to register code (Heater Step 0) - cannot be greater than 4032ms
        // Bits <7:6> are a multiplier (1, 4, 16 or 64 times)    Bits <5:0> are 1ms steps (0 to 63ms)
        let codedDuration = 0
        if (heatDuration < 4032) {
            let factor = 0
            while (heatDuration > 63) {
                heatDuration = Math.idiv(heatDuration, 4)
                factor = factor + 1
            }
            codedDuration = heatDuration + (factor * 64)
        }
        else {
            codedDuration = 255
        }
        writeBuf[0] = 0x64                                                  // gas_wait_0 register - heater step 0
        writeBuf[1] = codedDuration
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        // Select index of heater step (0 to 9): CTRL_GAS_1 reg <3:0>    (Make sure to combine with gas enable setting already there)
        writeBuf[0] = CTRL_GAS_1
        let gasEnable = (getUInt8BE(writeBuf[0]) & 0x20)
        writeBuf[1] = 0x00 | gasEnable                                      // Select heater step 0
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        gasInit = true
    }

    /**
    * Run all measurements on the BME688: Temperature, Pressure, Humidity & Gas Resistance.
    */
    //% subcategory="Sensors"
    //% group="Measure"
    //% blockId=kitronik_air_quality_bme688_measure_all
    //% block="measure all data readings"
    //% weight=100 blockGap=8
    export function measureData(): void {
        if (bme688InitFlag == false) {
            bme688Init()
        }

        prevMeasureTime = measureTime       // Store previous measurement time (ms since micro:bit powered on)

        // Set mode to FORCED MODE to begin single read cycle: CTRL_MEAS reg <1:0>    (Make sure to combine with temp/pressure oversampling settings already there)
        writeBuf[0] = CTRL_MEAS
        let oSampleTP = getUInt8BE(writeBuf[0])
        writeBuf[1] = 0x01 | oSampleTP
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        // Check New Data bit to see if values have been measured: MEAS_STATUS_0 bit <7>
        writeBuf[0] = MEAS_STATUS_0
        let newData = (getUInt8BE(writeBuf[0]) & 0x80) >> 7
        while (newData != 1) {
            newData = (getUInt8BE(writeBuf[0]) & 0x80) >> 7
        }

        // Check Heater Stability Status bit to see if gas values have been measured: <4> (heater stability)
        writeBuf[0] = GAS_RES_LSB_0
        let heaterStable = (getUInt8BE(writeBuf[0]) & 0x10) >> 4

        // Temporary variables for raw to compensated value calculations
        let adcMSB = 0
        let adcLSB = 0
        let adcXLSB = 0

        // If there is new data, read temperature ADC registers(this is required for all other calculations)
        adcMSB = getUInt8BE(TEMP_MSB_0)
        adcLSB = getUInt8BE(TEMP_LSB_0)
        adcXLSB = getUInt8BE(TEMP_XLSB_0)
        adcRawTemperature = (adcMSB << 12) | (adcLSB << 4) | (adcXLSB >> 4)

        // Read pressure ADC registers
        adcMSB = getUInt8BE(PRESS_MSB_0)
        adcLSB = getUInt8BE(PRESS_LSB_0)
        adcXLSB = getUInt8BE(PRESS_XLSB_0)
        adcRawPressure = (adcMSB << 12) | (adcLSB << 4) | (adcXLSB >> 4)

        // Read humidity ADC registers
        adcMSB = getUInt8BE(HUMID_MSB_0)
        adcLSB = getUInt8BE(HUMID_LSB_0)
        adcRawHumidity = (adcMSB << 8) | adcLSB

        // Read gas resistance ADC registers
        adcMSB = getUInt8BE(GAS_RES_MSB_0)
        adcLSB = getUInt8BE(GAS_RES_LSB_0) >> 6           // Shift bits <7:6> right to get LSB for gas resistance
        adcRawGasResistance = (adcMSB << 2) | adcLSB

        gasRange = getUInt8BE(GAS_RES_LSB_0) & 0x0F

        measureTime = control.millis()      // Capture latest measurement time (ms since micro:bit powered on)

        // Calculate the compensated reading values from the the raw ADC data
        calcTemperature(adcRawTemperature)
        intCalcPressure(adcRawPressure)
        intCalcHumidity(adcRawHumidity, temperatureReading)
        intCalcGasResistance(adcRawGasResistance, gasRange)
    }

    // A baseline gas resistance is required for the IAQ calculation - it should be taken in a well ventilated area without obvious air pollutants
    // Take 60 readings over a ~5min period and find the mean
    /**
    * Establish the baseline gas resistance reading and the ambient temperature.
    * These values are required for air quality calculations
    */
    //% subcategory="Sensors"
    //% group="Setup"
    //% blockId=kitronik_air_quality_establish_baselines
    //% block="establish gas baseline & ambient temperature"
    //% weight=85 blockGap=8
    export function calcBaselines(): void {
        if (bme688InitFlag == false) {
            bme688Init()
        }
        if (gasInit == false) {
            setupGasSensor(300, 150)
        }

        ambTempFlag = false

        let burnInReadings = 0
        let burnInData = 0
        let progress = 0
        drawRect(102, 7, 12, 50)
        while (burnInReadings < 60) {               // Measure data and continue summing gas resistance until 60 readings have been taken
            progress = Math.round((burnInReadings / 60) * 100)
            measureData()
            clearLine(4)
            show("Setting baselines.", 4, ShowAlign.Centre)
            show("" + progress + " %", 6, ShowAlign.Centre)
            drawLine(LineDirectionSelection.horizontal, progress, 13, 51)
            drawLine(LineDirectionSelection.horizontal, progress, 13, 52)
            drawLine(LineDirectionSelection.horizontal, progress, 13, 53)
            drawLine(LineDirectionSelection.horizontal, progress, 13, 54)
            drawLine(LineDirectionSelection.horizontal, progress, 13, 55)
            basic.pause(500)
            show("Setting baselines..", 4, ShowAlign.Centre)
            basic.pause(500)
            show("Setting baselines...", 4, ShowAlign.Centre)
            basic.pause(500)
            show("Setting baselines....", 4, ShowAlign.Centre)
            basic.pause(500)
            show("Setting baselines.....", 4, ShowAlign.Centre)
            burnInData = burnInData + gasResistance
            basic.pause(3000)
            burnInReadings++
        }
        gasBaseline = (burnInData / 60)             // Find the mean gas resistance during the period to form the baseline

        if (ambTempFlag) {
            let ambTotal = 0
            for (let i = 0; i < (ambTempPos + 1); i++) {
                let ambTempVal = (readByte((13 * 128) + i) << 8) | (readByte((13 * 128) + i + 1))
                ambTotal += ambTempVal
                //ambTotal += ambPrevTemps[i]
            }
            ambientTemperature = Math.trunc(ambTotal / (ambTempPos + 1))    // Calculate the ambient temperature as the mean of the 60 initial readings
        }

        clearLine(4)
        show("Setup Complete!", 4, ShowAlign.Centre)
        basic.pause(2000)
        clear()
    }

    /**
    * Read Temperature from sensor as a Number.
    * Units for temperature are in °C (Celsius) or °F (Fahrenheit) according to selection.
    */
    //% subcategory="Sensors"
    //% group="Climate"
    //% blockId="kitronik_air_quality_read_temperature"
    //% block="Read Temperature in %temperature_unit"
    //% weight=100 blockGap=8
    export function readTemperature(temperature_unit: TemperatureUnitList): number {
        let temperature = temperatureReading
        // Change temperature from °C to °F if user selection requires it
        if (temperature_unit == TemperatureUnitList.F) {
            temperature = ((temperature * 18) + 320) / 10
        }

        return temperature
    }

    /**
    * Read Pressure from sensor as a Number.
    * Units for pressure are in Pa (Pascals) or mBar (millibar) according to selection.
    */
    //% subcategory="Sensors"
    //% group="Climate"
    //% blockId="kitronik_air_quality_read_pressure"
    //% block="Read Pressure in %pressure_unit"
    //% weight=95 blockGap=8
    export function readPressure(pressure_unit: PressureUnitList): number {
        let pressure = pressureReading
        //Change pressure from Pascals to millibar if user selection requires it
        if (pressure_unit == PressureUnitList.mBar)
            pressure = pressure / 100

        return pressure
    }

    /**
    * Read Humidity from sensor as a Number.
    * Humidity is output as a percentage.
    */
    //% subcategory="Sensors"
    //% group="Climate"
    //% blockId="kitronik_air_quality_read_humidity"
    //% block="Read Humidity"
    //% weight=80 blockGap=8
    export function readHumidity(): number {
        return humidityReading
    }

    /**
    * Read Gas Resistance from sensor as a Number.
    * Units for gas resistance are in Ohms.
    */
    //% subcategory="Sensors"
    //% group="Air Quality"
    //% blockId="kitronik_air_quality_read_gas_resistance"
    //% block="Read Gas Resistance"
    //% weight=50 blockGap=8
    export function readGasRes(): number {
        if (gasInit == false) {
            clear()
            show("ERROR", 3, ShowAlign.Centre)
            show("Gas Sensor not setup!", 5, ShowAlign.Centre)
            return 0
        }

        return gasResistance
    }

    /**
    * Read eCO2 from sensor as a Number (250 - 40000+ppm).
    * Units for eCO2 are in ppm (parts per million).
    */
    //% subcategory="Sensors"
    //% group="Air Quality"
    //% blockId="kitronik_air_quality_read_eCO2"
    //% block="Read eCO2"
    //% weight=95 blockGap=8
    export function readeCO2(): number {
        if (gasInit == false) {
            clear()
            show("ERROR", 3, ShowAlign.Centre)
            show("Gas Sensor not setup!", 5, ShowAlign.Centre)
            return 0
        }
        calcCO2()

        let eCO2 = eCO2Value

        return eCO2
    }

    /**
    * Return the Air Quality rating as a percentage (0% = Bad, 100% = Excellent).
    */
    //% subcategory="Sensors"
    //% group="Air Quality"
    //% blockId=kitronik_air_quality_iaq_percent
    //% block="get IAQ \\%"
    //% weight=85 blockGap=8
    export function getAirQualityPercent(): number {
        if (gasInit == false) {
            clear()
            show("ERROR", 3, ShowAlign.Centre)
            show("Gas Sensor not setup!", 5, ShowAlign.Centre)
            return 0
        }
        calcIAQ()

        return iaqPercent
    }

    /**
    * Return the Air Quality rating as an IAQ score (500 = Bad, 0 = Excellent).
    * These values are based on the BME688 datasheet, Page 11, Table 6.
    */
    //% subcategory="Sensors"
    //% group="Air Quality"
    //% blockId=kitronik_air_quality_iaq_score
    //% block="get IAQ Score"
    //% weight=100 blockGap=8
    export function getAirQualityScore(): number {
        if (gasInit == false) {
            clear()
            show("ERROR", 3, ShowAlign.Centre)
            show("Gas Sensor not setup!", 5, ShowAlign.Centre)
            return 0
        }
        calcIAQ()

        return iaqScore
    }

    /**
    * Return the Air Quality rating as a text-based categorisation.
    * These values are based on the BME688 datasheet, Page 11, Table 6.
    */
    //% subcategory="Sensors"
    //% group="Air Quality"
    //% blockId=kitronik_air_quality_iaq_text
    //% block="get air quality category"
    //% weight=90 blockGap=8
    export function getAirQualityText(): string {
        if (gasInit == false) {
            clear()
            show("ERROR", 3, ShowAlign.Centre)
            show("Gas Sensor not setup!", 5, ShowAlign.Centre)
            return "NULL"
        }
        calcIAQ()

        return airQualityRating
    }

    // Calculate the Index of Air Quality score from the current gas resistance and humidity readings
    // iaqPercent: 0 to 100% - higher value = better air quality
    // iaqScore: 25 should correspond to 'typically good' air, 250 to 'typically polluted' air
    // airQualityRating: Text output based on the iaqScore
    export function calcIAQ(): void {
        let humidityScore = 0
        let gasScore = 0
        let gasOffset = gasBaseline - gasResistance                     // Calculate the gas offset from the baseline reading
        let humidityOffset = humidityReading - humidityBaseline         // Calculate the humidity offset from the baseline setting

        if (humidityOffset > 0) {                                       // Different paths for calculating the humidity score depending on whether the offset is greater than 0
            humidityScore = (100 - humidityBaseline - humidityOffset)
            humidityScore = humidityScore / (100 - humidityBaseline)
        }
        else {
            humidityScore = (humidityBaseline + humidityOffset)
            humidityScore = humidityScore / humidityBaseline
        }
        humidityScore = humidityScore * (humidityWeighting * 100)

        if (gasOffset > 0) {                                            // Different paths for calculating the gas score depending on whether the offset is greater than 0
            gasScore = gasResistance / gasBaseline
            gasScore = gasScore * (100 - (humidityWeighting * 100))
        }
        else {
            // Make sure that when gasOffset and humidityOffset are 0, iaqPercent is 95% - leaves room for cleaner air to be identified
            gasScore = Math.round(70 + (5 * ((gasResistance / gasBaseline) - 1)))
            if (gasScore > 75) {
                gasScore = 75
            }
        }

        iaqPercent = Math.trunc(humidityScore + gasScore)               // Air quality percentage is the sum of the humidity (25% weighting) and gas (75% weighting) scores
        iaqScore = (100 - iaqPercent) * 5                               // Final air quality score is in range 0 - 500 (see BME688 datasheet page 11 for details)

        if (iaqScore <= 50) {
            airQualityRating = "Excellent"
        }
        else if ((iaqScore > 50) && (iaqScore <= 100)) {
            airQualityRating = "Good"
        }
        else if ((iaqScore > 100) && (iaqScore <= 150)) {
            airQualityRating = "Lightly Polluted"
        }
        else if ((iaqScore > 150) && (iaqScore <= 200)) {
            airQualityRating = "Moderately Polluted"
        }
        else if ((iaqScore > 200) && (iaqScore <= 250)) {
            airQualityRating = "Heavily Polluted"
        }
        else if ((iaqScore > 250) && (iaqScore <= 350)) {
            airQualityRating = "Severely Polluted"
        }
        else if (iaqScore > 350) {
            airQualityRating = "Extremely Polluted"
        }
    }

    // Calculate the estimated CO2 value (eCO2)
    export function calcCO2(): void {
        let eCO2Baseline = 400      // 400ppm is a typical minimum value for occupied indoor spaces with good airflow
        let humidityOffset = humidityReading - humidityBaseline             // Calculate the humidity offset from the baseline setting
        let temperatureOffset = temperatureReading - ambientTemperature     // Calculate the temperature offset from the ambient temperature

        if (iaqScore == 25) {
            eCO2Value = 400
            return
        }

        if (iaqScore < 25) {
            // eCO2 in range 250-400ppm
            eCO2Value = Math.trunc(Math.map(iaqScore, 0, 24, 250, 399))
        }
        else if (iaqScore < 101) {
            // eCO2 in range 400-1000ppm
            eCO2Value = Math.trunc(Math.map(iaqScore, 25, 100, 400, 1000))
        }
        else if (iaqScore < 151) {
            // eCO2 in range 1000-2000ppm
            eCO2Value = Math.trunc(Math.map(iaqScore, 101, 150, 1001, 2000))
        }
        else if (iaqScore < 201) {
            // eCO2 in range 2000-3500ppm
            eCO2Value = Math.trunc(Math.map(iaqScore, 151, 200, 2001, 3500))
        }
        else if (iaqScore < 351) {
            // eCO2 in range 3500-5000ppm
            eCO2Value = Math.trunc(Math.map(iaqScore, 201, 350, 3501, 5000))
        }
        else if (iaqScore < 450) {
            // eCO2 > eCO2 in range 5000-40000ppm
            eCO2Value = Math.trunc(Math.map(iaqScore, 351, 450, 5001, 40000))
        }
        else if (iaqScore > 450) {
            // eCO2 > 40000ppm
            eCO2Value = Math.trunc(Math.map(iaqScore, 451, 500, 40001, 100000))
        }

        // Adjust eCO2Value for humidity greater than the baseline (40%)
        if ((humidityOffset > 0) && (temperatureOffset > 0)) {
            let humidityFactor = ((humidityReading - humidityBaseline) / humidityBaseline)
            let temperatureFactor = ((temperatureReading - ambientTemperature) / ambientTemperature)
            let combinedFactor = 1 + humidityFactor + temperatureFactor
            eCO2Value = Math.trunc(eCO2Value * combinedFactor)
        }
        else if (humidityOffset > 0) {
            eCO2Value = Math.trunc(eCO2Value * (((humidityReading - humidityBaseline) / humidityBaseline) + 1))
        }
        else if (temperatureOffset > 0) {
            eCO2Value = Math.trunc(eCO2Value * (((temperatureReading - ambientTemperature) / ambientTemperature) + 1))
        }

        // If measurements are taking place rapidly, breath detection is possible due to the sudden increase in humidity (~7-10%)
        // If this increase happens within a 2000ms time window, 1200ppm is added to the eCO2 value
        // (These values were based on 'breath-testing' with another eCO2 sensor with algorithms built-in)
        if ((measureTime - prevMeasureTime) <= 5000) {
            if ((humidityReading - prevHumidity) >= 3) {
                eCO2Value = Math.trunc(eCO2Value + 1500)
            }
        }
    }

    ////////////////////////////////
    //     PIN INPUT/OUTPUTS      //
    ////////////////////////////////

    /**
     * General IO pin type
     */
    export enum PinType {
        //% block=Analog
        analog = 0,
        //% block=Digital
        digital = 1
    }

    /**
     * General IO pins
     */
    export enum IOPins {
        //% block=P0
        p0 = 0,
        //% block=P1
        p1 = 1,
        //% block=P2
        p2 = 2
    }

    /**
     * Read value from IO pins, either Digital or Analog
     * @param readType is either Digital or Analog
     * @param pin which IO pin to read
     */
    //% subcategory="Inputs/Outputs"
    //% group="General Inputs/Outputs"
    //% blockId=kitronik_air_quality_read_io_pins 
    //% block="%readType|read %pin"
    //% weight=95 blockGap=8
    export function readIOPin(readType: kitronik_air_quality.PinType, pin: kitronik_air_quality.IOPins): number {
        let readValue = 0
        if (pin == 0) {
            if (readType == 0) {
                readValue = pins.analogReadPin(AnalogPin.P0)
            }
            else if (readType == 1) {
                readValue = pins.digitalReadPin(DigitalPin.P0)
            }
        }
        else if (pin == 1) {
            if (readType == 0) {
                readValue = pins.analogReadPin(AnalogPin.P1)
            }
            else if (readType == 1) {
                readValue = pins.digitalReadPin(DigitalPin.P1)
            }
        }
        else if (pin == 2) {
            if (readType == 0) {
                readValue = pins.analogReadPin(AnalogPin.P2)
            }
            else if (readType == 1) {
                readValue = pins.digitalReadPin(DigitalPin.P2)
            }
        }

        return readValue
    }

    /**
     * Digital write value to IO pins
     * @param pin which IO pin to read
     * @param value to write to the pin, eg: 0
     */
    //% subcategory="Inputs/Outputs"
    //% group="General Inputs/Outputs"
    //% blockId=kitronik_air_quality_digital_write_io_pins 
    //% block="digital write pin %pin|to %value"
    //% value.min=0 value.max=1
    //% weight=90 blockGap=8
    export function digitalWriteIOPin(pin: kitronik_air_quality.IOPins, value: number): void {
        if (pin == 0) {
            pins.digitalWritePin(DigitalPin.P0, value)
        }
        else if (pin == 1) {
            pins.digitalWritePin(DigitalPin.P1, value)
        }
        else if (pin == 2) {
            pins.digitalWritePin(DigitalPin.P2, value)
        }
    }

    /**
     * Analog write value to IO pins
     * @param pin which IO pin to read
     * @param value to write to the pin, eg: 1023
     */
    //% subcategory="Inputs/Outputs"
    //% group="General Inputs/Outputs"
    //% blockId=kitronik_air_quality_analog_write_io_pins 
    //% block="analog write pin %pin|to %value"
    //% value.min=0 value.max=1023
    //% weight=85 blockGap=8
    export function analogWriteIOPin(pin: kitronik_air_quality.IOPins, value: number): void {
        if (pin == 0) {
            pins.analogWritePin(AnalogPin.P0, value)
        }
        else if (pin == 1) {
            pins.analogWritePin(AnalogPin.P1, value)
        }
        else if (pin == 2) {
            pins.analogWritePin(AnalogPin.P2, value)
        }
    }

    ////////////////////////////////
    //           EEPROM           //
    ////////////////////////////////

    let CAT24_I2C_BASE_ADDR = 0x54  // This is A16 = 0, setting A16 = 1 will change address to 0x55

    /**
     * Write a single byte to a specified address
     * @param data is the data which will be written (a single byte)
     * @param addr is the EEPROM address, eg: 0
     */
    //% subcategory="Memory"
    //% group="Write"
    //% blockId=kitronik_air_quality_mem_write_byte 
    //% block="write byte %data|to memory address %addr"
    //% weight=100 blockGap=8
    //% addr.min=3072 addr.max=131071
    //% blockHidden = true
    export function writeByte(data: any, addr: number): void {
        if (addr < 3072) {
            addr = 3072
        }
        if (addr > 131071) {
            addr = 131071
        }

        let buf = pins.createBuffer(3);                             // Create buffer for holding addresses & data to write
        let i2cAddr = 0

        if ((addr >> 16) == 0) {                                    // Select the required address (A16 as 0 or 1)
            i2cAddr = CAT24_I2C_BASE_ADDR                           // A16 = 0
        }
        else {
            i2cAddr = CAT24_I2C_BASE_ADDR + 1                       // A16 = 1
        }

        buf[0] = (addr >> 8) & 0xFF                                 // Memory location bits a15 - a8
        buf[1] = addr & 0xFF                                        // Memory location bits a7 - a0
        buf[2] = data                                               // Store the data in the buffer
        pins.i2cWriteBuffer(i2cAddr, buf, false)                    // Write the data to the correct address
    }

    /**
     * Page Write
     * @param data is the data which will be written (up to 256 bytes)
     * @param page is the the EEPROM page to write the data to, eg: 0
     */
    //% subcategory="Memory"
    //% group="Write"
    //% blockId=kitronik_air_quality_mem_write_page 
    //% block="write %data|to memory page %page"
    //% weight=100 blockGap=8
    //% page.min=12 addr.max=511
    //% blockHidden = true
    export function writePage(data: string, page: number): void {
        if (page < 12) {
            page = 12
        }
        if (page > 511) {
            page = 511
        }
        let dataLength = data.length
        let buf = pins.createBuffer(dataLength + 2);                  // Create buffer for holding addresses & data to write
        let i2cAddr = 0
        let startAddr = page * 256

        if ((startAddr >> 16) == 0) {                               // Select the required address (A16 as 0 or 1)
            i2cAddr = CAT24_I2C_BASE_ADDR                           // A16 = 0
        }
        else {
            i2cAddr = CAT24_I2C_BASE_ADDR + 1                       // A16 = 1
        }

        buf[0] = (startAddr >> 8) & 0xFF                            // Memory location bits a15 - a8
        buf[1] = startAddr & 0xFF                                   // Memory location bits a7 - a0

        for (let i = 0; i < dataLength; i++) {
            let ascii = data.charCodeAt(i)
            buf[i + 2] = ascii                                        // Store the data in the buffer
        }

        pins.i2cWriteBuffer(i2cAddr, buf, false)                    // Write the data to the correct address
    }

    // Split the EEPROM pages in half to make 128 byte blocks
    // Write a data entry to a single block
    export function writeBlock(data: string, block: number): void {
        let dataLength = data.length
        let buf = pins.createBuffer(dataLength + 2);                  // Create buffer for holding addresses & data to write
        let i2cAddr = 0
        let startAddr = block * 128

        if ((startAddr >> 16) == 0) {                               // Select the required address (A16 as 0 or 1)
            i2cAddr = CAT24_I2C_BASE_ADDR                           // A16 = 0
        }
        else {
            i2cAddr = CAT24_I2C_BASE_ADDR + 1                       // A16 = 1
        }

        buf[0] = (startAddr >> 8) & 0xFF                            // Memory location bits a15 - a8
        buf[1] = startAddr & 0xFF                                   // Memory location bits a7 - a0

        for (let i = 0; i < dataLength; i++) {
            let ascii = data.charCodeAt(i)
            buf[i + 2] = ascii                                        // Store the data in the buffer
        }

        pins.i2cWriteBuffer(i2cAddr, buf, false)                    // Write the data to the correct address
    }

    // Read a data entry from a single block
    export function readBlock(block: number): string {
        let startAddr = block * 128
        let byte = 0
        let entry = ""

        for (byte = 0; byte < 127; byte++) {
            entry = entry + String.fromCharCode(readByte(startAddr + byte))
        }

        return entry
    }

    /**
     * Read a single byte from a specified address
     * @param addr is EEPROM address, eg: 0
     */
    //% subcategory="Memory"
    //% group="Read"
    //% blockId=kitronik_air_quality_mem_read_byte
    //% block="read byte from memory address %addr"
    //% weight=99 blockGap=8
    //% addr.min=0 addr.max=131071
    //% blockHidden = true
    export function readByte(addr: number): number {
        if (addr < 0) {
            addr = 0
        }
        if (addr > 131071) {
            addr = 131071
        }

        let writeBuf = pins.createBuffer(2)                         // Create a buffer for holding addresses
        let readBuf = pins.createBuffer(1)                          // Create a buffer for storing read data
        let i2cAddr = 0

        if ((addr >> 16) == 0) {                                    // Select the required address (A16 as 0 or 1)
            i2cAddr = CAT24_I2C_BASE_ADDR                           // A16 = 0
        }
        else {
            i2cAddr = CAT24_I2C_BASE_ADDR + 1                       // A16 = 1
        }

        writeBuf[0] = (addr >> 8) & 0xFF                            // Memory location bits a15 - a8
        writeBuf[1] = addr & 0xFF                                   // Memory location bits a7 - a0
        pins.i2cWriteBuffer(i2cAddr, writeBuf, false)               // Write to the address to prepare for read operation

        readBuf = pins.i2cReadBuffer(i2cAddr, 1, false)             // Read the data at the correct address into the buffer
        let readData = readBuf[0]                                   // Store the data from the buffer as a variable

        return readData                                             // Return the variable so the data can be accessed
    }

    ////////////////////////////////
    //       DATA LOGGING         //
    ////////////////////////////////

    let NONE = 0
    let USB = 1

    let delimiter = " "

    let incDate = false
    let incTime = false
    let incTemp = false
    let incPress = false
    let incHumid = false
    let incIAQ = false
    let incCO2 = false
    let incLight = false

    let tUnit = 0
    let pUnit = 0

    let logDate = ""
    let logTime = ""
    let logTemp = 0
    let logPress = 0
    let logHumid = 0
    let logIAQ = 0
    let logCO2 = 0
    let logLight = 0

    let dataEntry = ""
    let firstDataBlock = 24
    let entryNum = 0
    let writeTitles = false
    let dataFull = false

    let storedList: string[] = []
    let entryNumber = false
    let listLimit = 100
    let comms = NONE
    let entryBuild = ""
    let titleBuild = ""

    export enum ListNumber {
        //% block="Send"
        Send,
        //% block="Don't Send"
        DontSend
    }

    export enum Separator {
        //% block="Tab"
        tab,
        //% block="Semicolon"
        semicolon,
        //% block="Comma"
        comma,
        //% block="Space"
        space
    }

    /**
     * Set the output of logged data to the micro:bit USB (default baudrate is 115200).
     */
    //% subcategory="Data Logging"
    //% group=Setup
    //% weight=100 blockGap=8
    //% blockId=kitronik_air_quality_output_to_usb
    //% block="set data output to micro:bit USB"
    export function setDataForUSB() {
        comms = USB
        serial.redirectToUSB()
    }

    /**
     * Choice of which character to put between each data entry (the default is a space).
     * @param charSelect is the choice of character to separate each entry in the log
     */
    //% subcategory="Data Logging"
    //% group=Setup
    //% weight=95 blockGap=8
    //% blockId=kitronik_air_quality_select_separator
    //% block="separate entries with %charSelect"
    export function selectSeparator(charSelect: Separator): void {
        if (charSelect == Separator.tab)
            delimiter = "\t"
        else if (charSelect == Separator.semicolon)
            delimiter = ";"
        else if (charSelect == Separator.comma)
            delimiter = ","
        else if (charSelect == Separator.space)
            delimiter = " "
    }

    /**
     * Include the date in the data logging output.
     */
    //% subcategory="Data Logging"
    //% group="Setup"
    //% weight=90 blockGap=8
    //% blockId=kitronik_air_quality_include_date
    //% block="include Date"
    export function includeDate() {
        incDate = true
    }

    /**
     * Include the time in the data logging output.
     */
    //% subcategory="Data Logging"
    //% group="Setup"
    //% weight=89 blockGap=8
    //% blockId=kitronik_air_quality_include_time
    //% block="include Time"
    export function includeTime() {
        incTime = true
    }

    /**
     * Include the temperature in the data logging output.
     * @param tempUnit is in °C (Celsius) or °F (Fahrenheit) according to selection
     */
    //% subcategory="Data Logging"
    //% group="Setup"
    //% weight=88 blockGap=8
    //% blockId=kitronik_air_quality_include_temperature
    //% block="include Temperature in %tempUnit"
    export function includeTemperature(tempUnit: TemperatureUnitList) {
        tUnit = tempUnit
        incTemp = true
    }

    /**
     * Include the presure in the data logging output.
     * @param presUnit is in Pa (Pascals) or mBar (millibar) according to selection
     */
    //% subcategory="Data Logging"
    //% group="Setup"
    //% weight=87 blockGap=8
    //% blockId=kitronik_air_quality_include_pressure
    //% block="include Pressure in %presUnit"
    export function includePressure(presUnit: PressureUnitList) {
        pUnit = presUnit
        incPress = true
    }

    /**
     * Include the humidity in the data logging output.
     */
    //% subcategory="Data Logging"
    //% group="Setup"
    //% weight=86 blockGap=8
    //% blockId=kitronik_air_quality_include_humidity
    //% block="include Humidity"
    export function includeHumidity() {
        incHumid = true
    }

    /**
     * Include the IAQ score in the data logging output.
     */
    //% subcategory="Data Logging"
    //% group="Setup"
    //% weight=85 blockGap=8
    //% blockId=kitronik_air_quality_include_iaq
    //% block="include IAQ Score"
    export function includeIAQ() {
        incIAQ = true
    }

    /**
     * Include the eCO2 in the data logging output.
     */
    //% subcategory="Data Logging"
    //% group="Setup"
    //% weight=84 blockGap=8
    //% blockId=kitronik_air_quality_include_eco2
    //% block="include eCO2"
    export function includeCO2() {
        incCO2 = true
    }

    /**
     * Include the light level in the data logging output (micro:bit LEDs cannot be used if this block is included).
     */
    //% subcategory="Data Logging"
    //% group="Setup"
    //% weight=83 blockGap=8
    //% blockId=kitronik_air_quality_include_light
    //% block="include Light Level"
    export function includeLight() {
        incLight = true
    }

    // Store the Kitronik Header and standard data column headings in the reserved metadata EEPROM blocks
    function storeTitles(): void {
        let kitronikHeader = "Kitronik Data Logger - Air Quality & Environmental Board - www.kitronik.co.uk\r\n"
        writeBlock(kitronikHeader, 21)

        let headings = ""

        if (incDate) {
            headings = headings + "Date" + delimiter
        }
        if (incTime) {
            headings = headings + "Time" + delimiter
        }
        if (incTemp) {
            headings = headings + "Temperature" + delimiter
        }
        if (incPress) {
            headings = headings + "Pressure" + delimiter
        }
        if (incHumid) {
            headings = headings + "Humidity" + delimiter
        }
        if (incIAQ) {
            headings = headings + "IAQ Score" + delimiter
        }
        if (incCO2) {
            headings = headings + "eCO2" + delimiter
        }
        if (incLight) {
            headings = headings + "Light" + delimiter
        }

        headings = headings + "\r\n"
        writeBlock(headings, 23)

        writeTitles = true
    }

    /**
     * Input information about the user and project in string format.
     * @param name of person carrying out data logging
     * @param subject area of the data logging project
     * @param year group of person carrying data logging (if school project)
     * @param group of person carrying data logging (if school project)
     */
    //% subcategory="Data Logging"
    //% group="Setup"
    //% weight=80 blockGap=8
    //% blockId=kitronik_air_quality_project_info
    //% block="add project info: Name %name||Subject %subject| Year %year| Class %group"
    //% expandableArgumentMode="enabled" 
    //% inlineInputMode=inline
    export function addProjectInfo(name: string, subject?: string, year?: string, group?: string): void {
        if (comms == NONE) {
            setDataForUSB()
        }

        let projectInfo = "Name: " + name + "\r\n"
        if (subject != "") {
            projectInfo = projectInfo + "Subject: " + subject + "\r\n"
        }
        if (year != "") {
            projectInfo = projectInfo + "Year: " + year + "\r\n"
        }
        if (group != "") {
            projectInfo = projectInfo + "Class: " + group + "\r\n"
        }

        writeBlock(projectInfo, 22)
    }

    /**
     * Captures and logs the data requested with the "include" blocks.
     */
    //% subcategory="Data Logging"
    //% group="Add Data"
    //% weight=100 blockGap=8
    //% blockId=kitronik_air_quality_log_data
    //% block="log data"
    export function logData(): void {
        if (writeTitles == false) {
            storeTitles()
        }

        logDate = readDate()
        logTime = readTime()
        logTemp = readTemperature(tUnit)
        logPress = readPressure(pUnit)
        logHumid = humidityReading
        logIAQ = iaqScore
        logCO2 = eCO2Value
        logLight = input.lightLevel()
        
        if (incDate) {
            dataEntry = dataEntry + readDate() + delimiter
        }
        if (incTime) {
            dataEntry = dataEntry + logTime + delimiter
        }
        if (incTemp) {
            dataEntry = dataEntry + logTemp + delimiter
        }
        if (incPress) {
            dataEntry = dataEntry + logPress + delimiter
        }
        if (incHumid) {
            dataEntry = dataEntry + logHumid + delimiter
        }
        if (incIAQ) {
            dataEntry = dataEntry + logIAQ + delimiter
        }
        if (incCO2) {
            dataEntry = dataEntry + logCO2 + delimiter
        }
        if (incLight) {
            dataEntry = dataEntry + logLight + delimiter
        }

        writeBlock(dataEntry + "\r\n", firstDataBlock + entryNum)

        let entryNum_H = entryNum >> 8
        let entryNum_L = entryNum & 0xFF

        writeByte(entryNum_H, (12 * 128))           // Store the current entry number at first bytes of block 12
        writeByte(entryNum_L, ((12 * 128) + 1))
        
        if (entryNum == 999) {
            dataFull = true
            entryNum = 0
        }
        else {
            entryNum++
        }
    }

    /**
     * Erases all data stored on the EEPROM by writing all bytes to 0xFF (does not erase reserved area).
     */
    //% subcategory="Data Logging"
    //% group="Add Data"
    //% weight=70 blockGap=8
    //% blockId=kitronik_air_quality_erase_data
    //% block="erase all data"
    export function eraseData(): void {
        let progress = 0
        show("Erasing Memory...", 2, ShowAlign.Centre)
        for (let addr = (firstDataBlock * 128); addr < 131072; addr++) {
            progress = Math.round((addr / 131072) * 100)
            writeByte(0xFF, addr)
        }
        clear()
        show("Memory Erase Complete", 2, ShowAlign.Centre)
        basic.pause(2500)
        clear()
    }

    /**
     * Send all the stored data via comms selected
     * Maximum of 1000 data entries stored
     */
    //% subcategory="Data Logging"
    //% group="Transfer"
    //% weight=65 blockGap=8
    //% blockId=kitronik_air_quality_send_all
    //% block="transmit all data"
    export function sendAllData(): void {
        if (comms == NONE) {
            setDataForUSB()
        }

        let block = firstDataBlock
        let lastEntry = 0
        let header = ""
        let info = ""
        let titles = ""
        let data = ""

        header = readBlock(21)
        serial.writeString(header)      // Send Kitronik Header
        info = readBlock(22)
        serial.writeString(info)        // Send Project Info
        titles = readBlock(23)
        serial.writeString(titles)      // Send Data Column Headings

        if (dataFull) {
            for (block = firstDataBlock; block < 1024; block++) {
                data = readBlock(block)
                serial.writeString(data)
            }
        }
        else {
            lastEntry = (readByte(12 * 128) << 8) | (readByte((12 * 128) + 1))
            for (block = firstDataBlock; block < (firstDataBlock + lastEntry); block++) {
                data = readBlock(block)
                serial.writeString(data)
            }
        }
    }
}
