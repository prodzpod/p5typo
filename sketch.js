'use strict'

let cnv
let svgMode = false
let startOffsetY

let bgColor
let lineColor

let noMenu = false
let darkMode = true
let printMode = false
let debugGridMode = false
let drawFills = true
let alignCenter = false
let strokeGradient = false
let initialDraw = true

let sliderModes = [
   "size", "rings", "spacing", "xoffset", "yoffset", "xstretch", "ystretch", "weight", "gradient"
]
let sliderMode = 0
let sliderChange = 0
let waveMode = false

let appScale = 10
let totalWidth = [0, 0, 0, 0]
let totalHeight = [0, 0, 0, 0]

let values = {
   colorDark: {from: undefined, to: undefined, lerp: 0},
   colorLight: {from: undefined, to: undefined, lerp: 0},
   rings: {from: 3, to: undefined, lerp: 0},
   size: {from: 9, to: undefined, lerp: 0},
   spacing: {from: 0, to: undefined, lerp: 0},
   offsetX: {from: 0, to: undefined, lerp: 0},
   stretchX: {from: 0, to: undefined, lerp: 0},
   offsetY: {from: 0, to: undefined, lerp: 0},
   stretchY: {from: 0, to: undefined, lerp: 0},
   gradient: {from: 0, to: undefined, lerp: 0},
   weight: {from: 7, to: undefined, lerp: 0},
   ascenders: {from: 0.25, to: undefined, lerp: 0},
}
// calculated every frame based on current lerps
let typeSize
let typeRings
let typeSpacing
let typeOffsetX
let typeOffsetY
let typeStretchX
let typeStretchY
let typeWeight
let typeGradient
let typeAscenders
let themeDark
let themeLight
let typeSpacingY = undefined//5*0.25 +1

let linesArray = ["hamburgefonstiv", "", "", ""]
let currentLine = 0
const validLetters = "abcdefghijklmnopqrstuvwxyzäöü,.!-_ "

// use alt letters?
let altS = false



function windowResized() {
   if (!noMenu) {
      resizeCanvas(windowWidth-10, windowHeight-10)
   }
}

function setup() {
   const params = new Proxy(new URLSearchParams(window.location.search), {
      get: (searchParams, prop) => searchParams.get(prop),
    });
   if (params.svg === "true" || params.svg === "1") {
      svgMode = true
      print("Loaded with URL Mode: SVG")
   }
   if (params.wave === "true" || params.wave === "1") {
      waveMode = true
      print("Loaded with URL Mode: Wave")
   }
   if (params.xray === "true" || params.xray === "1") {
      debugGridMode = true
      print("Loaded with URL Mode: XRAY")
   }
   if (params.center === "true" || params.center === "1") {
      alignCenter = true
      print("Loaded with URL Mode: Centered")
   }
   if (params.solid === "false" || params.solid === "0") {
      drawFills = false
      print("Loaded with URL Mode: Transparent overlaps")
   }
   if (params.invert === "true" || params.invert === "1") {
      darkMode = false
      print("Loaded with URL Mode: Inverted")
   }
   if (params.mono === "true" || params.mono === "1") {
      printMode = true
      print("Loaded with URL Mode: Mono")
   }
   if (params.strokegradient === "true" || params.strokegradient === "1") {
      strokeGradient = true
      print("Loaded with URL Mode: Stroke Gradient")
   }
   if (params.nomenu === "true" || params.nomenu === "1") {
      noMenu = true
      print("Loaded with URL Mode: Menu Hidden")
   }
   if (params.line1 !== null && params.line1.length > 0) {
      if (params.line4 !== null && params.line3 !== null && params.line2 !== null) {
         linesArray = [params.line1, params.line2, params.line3, params.line4]
         currentLine = 3
      } else if (params.line3 !== null && params.line2 !== null) {
         linesArray = [params.line1, params.line2, params.line3, ""]
         currentLine = 2
      } else if (params.line2 !== null) {
         linesArray = [params.line1, params.line2, "", ""]
         currentLine = 1
      } else {
         linesArray = [params.line1, "", "", ""]
         currentLine = 0
      }
      print("Loaded with URL Text")
   }
   if (params.values !== null && params.values.length > 0) {
      const valString = String(params.values)
      const valArray = valString.split('_')

      if (valString.match("[0-9_-]+") && valArray.length === 9) {
         print("Loaded with parameters", valArray)
         values.size.from = parseInt(valArray[0])
         values.rings.from = parseInt(valArray[1])
         values.spacing.from = parseInt(valArray[2])
         values.offsetX.from = parseInt(valArray[3])
         values.offsetY.from = parseInt(valArray[4])
         values.stretchX.from = parseInt(valArray[5])
         values.stretchY.from = parseInt(valArray[6])
         values.weight.from = parseInt(valArray[7])
         values.gradient.from = parseInt(valArray[8])
      } else {
         print("Has to be 9 negative or positive numbers with _ in between")
      }
   }

   cnv = createCanvas(windowWidth-10, windowHeight-10,(svgMode)?SVG:"")
   strokeCap(ROUND)
   rectMode(CORNERS)
   textFont("Courier Mono")
   frameRate(60)

   values.colorDark.from = color("#16111F")
   values.colorLight.from = color("#C4B6FF")
}

function changeValuesAndURL () {
   // translate left/right arrow use to correct "to" value
   if (sliderChange !== 0) {
      switch (sliderMode) {
         case 0:
            values.size.to = values.size.from + sliderChange
            // smallest possible size is 1
            values.size.to = max(values.size.to, 1)
            break;
         case 1:
            values.rings.to = values.rings.from + sliderChange
            // smallest possible ring count is 1
            values.rings.to = max(values.rings.to, 1)
            break;
         case 2:
            values.spacing.to = values.spacing.from + sliderChange
            // furthest spacing is half the outer size
            values.spacing.to = max(values.spacing.to, Math.ceil(values.size.from*-0.5))
            values.spacing.to = min(values.spacing.to, Math.ceil(values.size.from*0.25))
            break;
         case 3:
            values.offsetX.to = values.offsetX.from + sliderChange
            //furthest offset is spacing + outer size
            values.offsetX.to = max(values.offsetX.to, -(values.size.from+values.spacing.from))
            values.offsetX.to = min(values.offsetX.to, (values.size.from+values.spacing.from))
            break;
         case 4:
            values.offsetY.to = values.offsetY.from + sliderChange
            //furthest vert offset is outer size
            values.offsetY.to = max(values.offsetY.to, -(values.size.from))
            values.offsetY.to = min(values.offsetY.to, (values.size.from))
            break;
         case 5:
            values.stretchX.to = values.stretchX.from + sliderChange
            //stretch is minimum 0
            values.stretchX.to = max(values.stretchX.to, 0)
            break;
         case 6:
            values.stretchY.to = values.stretchY.from + sliderChange
            //stretch is minimum 0
            values.stretchY.to = max(values.stretchY.to, 0)
            break;
         case 7:
            values.weight.to = values.weight.from + sliderChange
            //weight
            values.weight.to = max(values.weight.to, 2)
            values.weight.to = min(values.weight.to, 9)
            break;
         case 8:
            values.gradient.to = values.gradient.from + sliderChange
            //gradient
            values.gradient.to = max(values.gradient.to, 0)
            values.gradient.to = min(values.gradient.to, 9)
            break;
      }
      sliderChange = 0
   }

   // change URL
   let URL = String(window.location.href)
   if (URL.includes("?")) {
      URL = URL.split("?",1)
   }

   const newParams = new URLSearchParams();

   // add all setting parameters if any of them are not default
   if (true) { //WIP needs better condition lol
      function getValue(key) {
         if (values[key].to === undefined) {
            return values[key].from
         } else {
            return values[key].to
         }
      }
      let valueArr = []
      valueArr.push(getValue("size"))
      valueArr.push(getValue("rings"))
      valueArr.push(getValue("spacing"))
      valueArr.push(getValue("offsetX"))
      valueArr.push(getValue("offsetY"))
      valueArr.push(getValue("stretchX"))
      valueArr.push(getValue("stretchY"))
      valueArr.push(getValue("weight"))
      valueArr.push(getValue("gradient"))

      newParams.append("values",valueArr.join("_"))
   }

   // add word parameter if it isn't the default word or has more lines
   if (linesArray[0] !== "hamburgefonstiv" || currentLine > 0) {
      newParams.append("line1",linesArray[0])
   }
   if (currentLine > 0) {
      newParams.append("line2",linesArray[1])
   }
   if (currentLine > 1) {
      newParams.append("line3",linesArray[2])
   }
   if (currentLine > 2) {
      newParams.append("line4",linesArray[3])
   }

   // add other parameters afterwards
   if (svgMode) {
      newParams.append("svg",true)
   }
   if (!darkMode) {
      newParams.append("invert",true)
   }
   if (printMode) {
      newParams.append("mono",true)
   }
   if (debugGridMode) {
      newParams.append("xray",true)
   }
   if (waveMode) {
      newParams.append("wave",true)
   }
   if (!drawFills) {
      newParams.append("solid",false)
   }
   if (alignCenter) {
      newParams.append("center",true)
   }
   if (strokeGradient) {
      newParams.append("strokegradient",true)
   }
   if (noMenu) {
      newParams.append("nomenu",true)
   }

   if (URLSearchParams.toString(newParams).length > 0) {
      URL += "?" + newParams
   }
   window.history.replaceState("", "", URL)

   if (svgMode) {
      location.reload()
   }
}

function keyTyped() {
   if (key === "2") {
      darkMode = !darkMode
      changeValuesAndURL()
      return
   }
   else if (key === "1") {
      //random
      values.size.to = floor(random(4,16))
      values.weight.to = floor(random(2,10))
      values.rings.to = floor(random(1, values.size.to/2 + 1))
      values.spacing.to = floor(random(-values.rings.to, 2))

      values.offsetX.to = 0
      values.offsetY.to = 0
      values.stretchX.to = 0
      values.stretchY.to = 0
      values.gradient.to = 0

      const offsetType = random(["v", "h", "h", "h", "0", "0", "0", "vh"])
      if (offsetType === "h") {
         values.offsetX.to = floor((random(-values.rings.to+1, values.rings.to) + random(-values.rings.to+1, values.rings.to))*0.5)
      } else if (offsetType === "v") {
         values.offsetY.to = floor(random(-1, 2))
      } else if (offsetType === "ha") {
         values.offsetX.to = floor(random(-1, 2)) * (values.size.to+values.spacing.to)
      } else if (offsetType === "vh") {
         values.offsetX.to = floor(random(-1, 2))
         values.offsetY.to = floor(random(-1, 2))
      }

      if (random() >= 0.8) {
         values.stretchX.to = floor(random(0, values.size.to*1.5))
      }
      if (random() >= 0.8) {
         values.stretchY.to = floor(random(0, values.size.to*1.5))
      }

      if (random() >= 0.5) {
         values.gradient.to = floor(random(2,9))
      }

      values.colorDark.to = color('hsl('+floor(random(0,360))+', 100%, 06%)')
      values.colorLight.to = color('hsl('+floor(random(0,360))+', 100%, 90%)')
      changeValuesAndURL()
      return
   }
   else if (key === "3") {
      //toggle print b/w mode
      printMode = !printMode
      changeValuesAndURL()
      return
   }
   else if (key === "4") {
      //toggle debug mode
      debugGridMode = !debugGridMode
      changeValuesAndURL()
      return
   }
   else if (key === "5") {
      waveMode = !waveMode
      changeValuesAndURL()
      return
   }
   else if (key === "6") {
      drawFills = !drawFills
      changeValuesAndURL()
      return
   }
   else if (key === "7") {
      alignCenter = !alignCenter
      changeValuesAndURL()
      return
   }
   else if (key === "8") {
      //reset
      values.rings.to = 3
      values.size.to = 9
      values.spacing.to = 0
      values.offsetX.to = 0
      values.offsetY.to = 0
      values.stretchX.to = 0
      values.stretchY.to = 0
      values.weight.to = 7
      values.gradient.to = 0
      changeValuesAndURL()
      return
   }
   else if (key === "9") {
      linesArray = ["","","",""]
      currentLine = 0
      changeValuesAndURL()
      return
   }

   if (validLetters.includes(key)) {
      linesArray[currentLine] += key;
      changeValuesAndURL()
   }
}

function keyPressed() {
   if (keyCode === BACKSPACE) {
      if (currentLine > 0 && linesArray[currentLine].length === 0) {
         currentLine--
      } else {
         linesArray[currentLine] = linesArray[currentLine].slice(0, -1)
      }
      changeValuesAndURL()
      return
   }

   if (keyCode === RETURN) {
      if (currentLine < linesArray.length-1) {
         currentLine++
      }
      changeValuesAndURL()
      return
   }

   sliderChange = 0
   if (keyCode === LEFT_ARROW) {
      sliderChange = -1
      changeValuesAndURL()
      return
   }
   else if (keyCode === RIGHT_ARROW) {
      sliderChange = 1
      changeValuesAndURL()
      return
   }
   else if (keyCode === DOWN_ARROW) {
      sliderMode += 1
      if (sliderMode >= sliderModes.length) {
         sliderMode = 0
      }
      return
   }
   else if (keyCode === UP_ARROW) {
      sliderMode -= 1
      if (sliderMode < 0) {
         sliderMode = sliderModes.length-1
      }
      return
   }
}

function draw () {
   // if a "to" value in the values object is not undefined, get closer to it by increasing that "lerp"
   // when the "lerp" value is at 6, the "to" value has been reached,
   // and can be cleared again, new "from" value set.

   Object.keys(values).forEach(key => {
      const slider = values[key]

      if (slider.to !== undefined) {
         if (slider.lerp >= 6) {
            //destination reached
            slider.from = slider.to
            slider.to = undefined
            slider.lerp = 0
         } else {
            //increment towards destination
            slider.lerp++
            if (svgMode) {
               slider.lerp = 6
            }
         }
      }
   });

   // calculate in between values for everything
   function lerpValues(slider, mode) {
      if (slider.to === undefined) {
         return slider.from
      }
      if (mode === "color") {
         return lerpColor(slider.from, slider.to, slider.lerp/6)
      }
      return map(slider.lerp,0,6,slider.from, slider.to)
   }
   typeSize = lerpValues(values.size)
   typeRings = lerpValues(values.rings)
   typeSpacing = lerpValues(values.spacing)
   typeOffsetX = lerpValues(values.offsetX)
   typeOffsetY = lerpValues(values.offsetY)
   typeStretchX = lerpValues(values.stretchX)
   typeStretchY = lerpValues(values.stretchY)
   typeWeight = lerpValues(values.weight)
   typeGradient = lerpValues(values.gradient)
   typeAscenders = lerpValues(values.ascenders)
   themeDark = lerpValues(values.colorDark, "color")
   themeLight = lerpValues(values.colorLight, "color")

   const lightColor = (printMode || debugGridMode) ? color("white") : themeLight
   const darkColor = (printMode || debugGridMode) ? color("black") : themeDark

   bgColor = lightColor
   lineColor = darkColor

   if (darkMode) {
      bgColor = darkColor
      lineColor = lightColor
   }

   background(bgColor)
   strokeWeight(0.3*(svgMode?appScale:1))

   drawElements()

   //first draw only
   if (svgMode && initialDraw) {
      // resize canvas to fit text if in noMenu mode
      if (noMenu) {
         const hMargin = 1
         const vMargin = 1
         const vGap = (typeSpacingY !== undefined) ? typeSpacingY : 0 
         const newWidth = Math.max(...totalWidth) + hMargin*2
         const newHeight = (currentLine+1) * Math.max(...totalHeight) + (currentLine)*vGap + vMargin*2
         resizeCanvas(newWidth*appScale, newHeight*appScale)
      }
      initialDraw = false
      loop()
   } else if (svgMode) {
      noLoop()
   }
}


function drawElements() {
   push()
   scale(appScale)
   if (noMenu) translate(1,1)
   else translate(6, 6)

   if (!noMenu) {
      textSize(2)
      noStroke()
      fill(lineColor)
      textFont("IBM Plex Mono")
   
      const col1 = 0
      const col2 = 5
      const col25 = 3
      const col3 = 29
      const col4 = 33
      const col5 = 60
   
      push()
      for (let i = 0; i <= currentLine; i++) {
         if (i === currentLine) {
            text(linesArray[i], col5, 0)
         }
         translate(0,2)
      }
      pop()
   
      push()
      const sliderSpacing = 2
      if (sliderMode === 0) {
         translate(0,0*sliderSpacing)
         text("size", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeSize), col25, 0)
      }
      else if (sliderMode === 1) {
         translate(0,1*sliderSpacing)
         text("ring count", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeRings), col25, 0)
      }
      else if (sliderMode === 2) {
         translate(0,2*sliderSpacing)
         text("spacing", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeSpacing), col25, 0)
      }
      else if (sliderMode === 3) {
         translate(0,3*sliderSpacing)
         text("h-offset", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeOffsetX), col25, 0)
      }
      else if (sliderMode === 4) {
         translate(0,4*sliderSpacing)
         text("v-offset", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeOffsetY), col25, 0)
      }
      else if (sliderMode === 5) {
         translate(0,5*sliderSpacing)
         text("h-stretch", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeStretchX), col25, 0)
      }
      else if (sliderMode === 6) {
         translate(0,6*sliderSpacing)
         text("v-stretch", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeStretchY), col25, 0)
      }
      else if (sliderMode === 7) {
         translate(0,7*sliderSpacing)
         text("weight", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeWeight), col25, 0)
      }
      else if (sliderMode === 8) {
         translate(0,8*sliderSpacing)
         text("gradient", col2, 0)
         textAlign(RIGHT)
         text(Math.round(typeGradient), col25, 0)
      }
      pop()
   
      lineColor.setAlpha(100)
      fill(lineColor)
   
      push()
      text("size         " ,col2, 0); translate (0,2.0)
      text("ring count" ,col2, 0); translate (0,2.0)
      text("spacing    " ,col2, 0); translate (0,2.0)
      text("h-offset   " ,col2, 0); translate (0,2.0)
      text("v-offset   " ,col2, 0); translate (0,2.0)
      text("h-stretch " ,col2, 0); translate (0,2.0)
      text("v-stretch " ,col2, 0); translate (0,2.0)
      text("weight      " ,col2, 0); translate (0,2.0)
      text("gradient   " ,col2, 0); translate (0,2.0)
      pop()
   
      push(); textAlign(RIGHT)
      text(addLeadingChar(Math.round(typeSize),3)      , col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeRings),3)    , col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeSpacing),3) , col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeOffsetX),3) , col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeOffsetY),3) , col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeStretchX),3), col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeStretchY),3), col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeWeight),3)   , col25, 0); translate(0,2.0)
      text(addLeadingChar(Math.round(typeGradient),3), col25, 0); translate(0,2.0)
      pop()
   
      push()
      text("1:" , col3, 0); translate(0,2)
      text("2:" , col3, 0); translate(0,2)
      text("3:" , col3, 0); translate(0,2)
      text("4:" , col3, 0); translate(0,2)
      text("5:" , col3, 0); translate(0,2)
      text("6:" , col3, 0); translate(0,2)
      text("7:" , col3, 0); translate(0,2)
      text("8:" , col3, 0); translate(0,2)
      text("9:" , col3, 0); translate(0,2)
      pop()
   
      push()
      text("randomize    ", col4, 0); translate(0,2)
      text("invert color ", col4, 0); translate(0,2)
      text("monochromatic", col4, 0); translate(0,2)
      text("xray mode    ", col4, 0); translate(0,2)
      text("wave mode (test)", col4, 0); translate(0,2)
      text("overlaps     ", col4, 0); translate(0,2)
      text("alignment    ", col4, 0); translate(0,2)
      text("clear style  ", col4, 0); translate(0,2)
      text("clear text   ", col4, 0); translate(0,2)
      pop()
   
   
      //stroke(lineColor)
      //strokeWeight(0.2)
      //line(col5-1, -1.5, col5-1, 2.5)
      //noStroke()
   
      push()
      for (let i = 0; i < linesArray.length; i++) {
         const line = (linesArray[i].length>0) ? linesArray[i] : ".".repeat(9)
         text((currentLine === i) ? linesArray[i]+"_":line, col5, 0)
         translate(0,2)
      }
   
      translate(0,2)
      text("abcdefghijklmnopqrstuvwxyz-.,!", col5, 0)
      translate(0,2.5)
      text("SPACE, BACKSPACE, RETURN", col5, 0)
      pop()

      translate(0,22)
   }
   translate(0, max(typeSize*typeAscenders, 1))

   strokeWeight((typeWeight/10)*(svgMode?appScale:1))
   lineColor.setAlpha(255)

   startOffsetY = 0

   if (typeOffsetY < 0) {
      startOffsetY -= typeOffsetY
   }

   
   push()
   translate(0,0.5*typeSize)
   if (alignCenter && currentLine === 0) {
      translate(0,16)
   }

   for (let i = 0; i <= currentLine; i++) {
      drawStyle(i)
   }
   pop()
}

function getInnerSize (size, rings) {
   let innerSize = min(size - (rings-1) * 2, size)

   if (typeSize % 2 === 0) {
      return max(2, innerSize)
   }
   return max(1, innerSize)
}

function isin (char, sets) {

   let found = false
   sets.forEach((set) => {
      if (found === false) {
         if (set === "ul") {
            //up left edge
            found = "bhijkltuüvwy".includes(char)
         }
         else if (set === "dl") {
            //down left edge
            found = "hijkmnprfv".includes(char)
         }
         else if (set === "ur") {
            //down left edge
            found = "dijuüvwy".includes(char)
         }
         else if (set === "dr") {
            //down left edge
            found = "aäghijmnqye".includes(char)
         }
         else if (set === "gap") {
            //separating regular letters
            found = "., :;-_!?".includes(char)
         }
      }
   });
   return found
}


function drawStyle (lineNum) {

   // don't draw anything for lines of text that have not been written yet
   if (currentLine < lineNum) {
      return
   }

   // current line text
   let lineText = linesArray[lineNum]

   // if line empty, but visible, put row of darker o's there
   const oldLineColor = lineColor
   if (lineText.length === 0 && !printMode) {
      lineText = "o".repeat(9)
      if (!debugGridMode) {
         lineColor = lerpColor(lineColor, bgColor, 0.8)
      }
   }

   // variables that grow until the end of the line
   let charsWidth = 0 //total width
   let verticalOffset = 0 // which side of letters is offset up/down

   // fadeout in wavemode
   function waveInner (i, inner, size) {
      if (!waveMode) {
         return inner
      }
      return min(size, inner + i*2)
   }

   // go through the letters once to get total spacing
   totalWidth[lineNum] = Math.abs(typeOffsetX)
   for (let i = 0; i < lineText.length; i++) {
      // get characters
      const char = lineText[i]
      const nextchar = (lineText[i+1] !== undefined) ? lineText[i+1] : " "
      const prevchar = (lineText[i-1] !== undefined) ? lineText[i-1] : " "
      // WIP not writing this twice lol
      let letterInner = getInnerSize(typeSize, typeRings) //+ [2,4,3,-2,0,2,4,5][i % 8]
      let letterOuter = typeSize //+ [2,4,3,-2,0,2,4,5][i % 8]
      letterInner = waveInner(i, letterInner, letterOuter)

      const extendOffset = ((letterOuter % 2 == 0) ? 0 : 0.5) + (typeStretchX-(typeStretchX%2))*0.5
      totalWidth[lineNum] += addSpacingBetween(prevchar, char, nextchar, typeSpacing, letterInner, letterOuter, extendOffset).width
   }

   //translate to center if toggled
   push()
   if (alignCenter) {
      translate(-6+(width/appScale-totalWidth[lineNum])/2,0)
   }
   if (typeOffsetX < 0) {
      translate(-typeOffsetX,0)
   }

   // go through all the letters, but this time to actually draw them

   for (let i = 0; i < lineText.length; i++) {
      // get characters
      const char = lineText[i]
      const nextchar = (lineText[i+1] !== undefined) ? lineText[i+1] : " "
      const prevchar = (lineText[i-1] !== undefined) ? lineText[i-1] : " "

      // ring sizes for this character
      let letterInner = getInnerSize(typeSize, typeRings) //+ [2,4,3,-2,0,2,4,5][i % 8]
      let letterOuter = typeSize //+ [2,4,3,-2,0,2,4,5][i % 8]

      // change depending on the character index (i) if wave mode is on
      letterInner = waveInner(i, letterInner, letterOuter)

      // array with all ring sizes for that letter
      let ringSizes = []
      for (let b = letterOuter; b >= letterInner-2; b-=2) {
         // smallest ring is animated
         let size = (b < letterInner) ? letterInner : b
         ringSizes.push(size)
      }

      // convenient values
      // per letter
      const ascenders = max(letterOuter*typeAscenders, 1)
      const descenders = max(letterOuter*typeAscenders, 1)
      const weight = (letterOuter-letterInner)*0.5
      const oneoffset = (letterOuter>3 && letterInner>2) ? 1 : 0
      const splitoffset = (weight>0) ? 1 : 0
      const topOffset = (letterOuter < 0) ? -typeOffsetX : 0
      const wideOffset = 0.5*letterOuter + 0.5*letterInner
      const extendOffset = ((letterOuter % 2 == 0) ? 0 : 0.5) + (typeStretchX-(typeStretchX%2))*0.5
      const extendDownOffset = ((letterOuter % 2 == 0) ? 0 : 0.5)

      // determine spacing to the right of character based on both
      const spacingResult = addSpacingBetween(prevchar, char, nextchar, typeSpacing, letterInner, letterOuter, extendOffset)
      const nextSpacing = spacingResult.width


      function drawArcFill (arcQ, offQ, tx, ty, noStretchX, noStretchY) {
         if (weight === 0 || !drawFills) {
            return
         }

         push()
         translate(tx, ty)
         noFill()
         stroke((debugGridMode)? color("#52A"): bgColor)
         strokeCap(SQUARE)
         strokeWeight(weight*(svgMode?appScale:1))

         const smallest = letterInner
         const size = smallest + weight
         //if (frameCount<2) {
         //   print("drawArcFill",char,smallest,letterOuter)
         //}

         // base position
         let xpos = topOffset + charsWidth + (letterOuter/2)
         let ypos = startOffsetY
         // offset based on quarter and prev vertical offset
         let offx = (offQ === 3 || offQ === 4) ? 1:0
         let offy = (offQ === 2 || offQ === 3) ? 1:0
         xpos += (offx > 0) ? typeOffsetX : 0
         ypos += (verticalOffset+offy) % 2==0 ? typeOffsetY : 0
         xpos += (offy > 0) ? typeStretchX : 0
         ypos += (offx > 0) ? typeStretchY : 0

         // angles
         let startAngle = PI + (arcQ-1)*HALF_PI
         let endAngle = startAngle + HALF_PI

         arc(xpos, ypos, size, size, startAngle, endAngle)

         if (typeStretchX > 0 && !noStretchX) {
            stroke((debugGridMode)? color("#831"): bgColor)
            const toSideX = (arcQ === 1 || arcQ === 2) ? -1 : 1
            let stretchXPos = xpos
            let stretchYPos = ypos + size*toSideX*0.5
            const dirX = (arcQ === 1 || arcQ === 4) ? 1 : -1

            // the offset can be in between the regular lines vertically if it would staircase nicely
            let offsetShift = 0
            let stairDir = (verticalOffset+offy) % 2===0 ? -1 : 1
            if (Math.abs(typeOffsetY) >2 && Math.abs(typeOffsetY) <4) {
               offsetShift = (typeOffsetY/3)*stairDir
            } else if (Math.abs(typeOffsetY) >1 && Math.abs(typeOffsetY)<3) {
               offsetShift = (typeOffsetY/2)*stairDir
            }

            line(stretchXPos, stretchYPos+offsetShift,
               stretchXPos + dirX*0.5*typeStretchX, stretchYPos+offsetShift)
         }
         if (typeStretchY > 0 && !noStretchY) {
            stroke((debugGridMode)? color("#17B"): bgColor)
            const toSideY = (arcQ === 1 || arcQ === 4) ? -1 : 1
            let stretchXPos = xpos + size*toSideY*0.5
            let stretchYPos = ypos
            const dirY = (arcQ === 1 || arcQ === 2) ? 1 : -1

            // the offset can be in between the regular lines horizontally if it would staircase nicely
            let offsetShift = 0
            if (Math.abs(typeOffsetX) >2 && Math.abs(typeOffsetX) <4) {
               offsetShift = typeOffsetX/3*dirY
            } else if (Math.abs(typeOffsetX) >1 && Math.abs(typeOffsetX)<3) {
               offsetShift = typeOffsetX/2*dirY
            }

            line(stretchXPos+offsetShift, stretchYPos,
               stretchXPos+offsetShift, stretchYPos + dirY*0.5*typeStretchY)
         }
         pop()
      }

      function drawArc (strokeSizes, arcQ, offQ, tx, ty, cutMode, cutSide, flipped, noSmol, noStretchX, noStretchY) {
         push()
         translate(tx, ty)
         noFill()
         strokeWeight((typeWeight/10)*(svgMode?appScale:1))
         if (debugGridMode) {
            strokeWeight(0.2*(svgMode?appScale:1))
         }

         let innerColor = (debugGridMode)? color("orange"): lerpColor(lineColor,bgColor,typeGradient/10)
         let outerColor = lineColor

         //innerColor = color("red")
         //outerColor = color("yellow")

         const smallest = strokeSizes[strokeSizes.length-1]
         const biggest = strokeSizes[0]

         let innerEdgeReference = smallest
         if ((biggest-smallest) <1) {
            innerEdgeReference = biggest-2
         }

         strokeSizes.forEach((size) => {
            if (strokeGradient && !debugGridMode) {
               strokeWeight((typeWeight/10)*(svgMode?appScale:1)*map(size,smallest,biggest,0.3,1))
            }
            stroke(lerpColor(innerColor, outerColor, map(size,innerEdgeReference,biggest,0,1)))
            if ((arcQ !== offQ) !== (flipped === "flipped")) {
               stroke(lerpColor(innerColor, outerColor, map(size,biggest,smallest,0,1)))
            }

            // base position
            let xpos = topOffset + charsWidth + (biggest/2)
            let ypos = startOffsetY
            // offset based on quarter and prev vertical offset
            let offx = (offQ === 3 || offQ === 4) ? 1:0
            let offy = (offQ === 2 || offQ === 3) ? 1:0
            xpos += (offx > 0) ? typeOffsetX : 0
            ypos += (verticalOffset+offy) % 2 === 0 ? typeOffsetY : 0
            xpos += (offy > 0) ? typeStretchX : 0
            ypos += (offx > 0) ? typeStretchY : 0

            // angles
            let startAngle = PI + (arcQ-1)*HALF_PI
            let endAngle = startAngle + HALF_PI

            let cutDifference = 0
            let drawCurve = true

            if (cutMode === "sharp") {
               if (smallest-2 <= 0 && noSmol) {
                  drawCurve = false
               }
               cutDifference = HALF_PI-arcUntil(size, smallest-2, HALF_PI)
            }
            else if (cutMode === "round") {
               if ((smallest <= 2 || letterOuter+2 <= 2) && noSmol) {
                  drawCurve = false
               }
               if (smallest > 2) {
                  cutDifference = HALF_PI-arcUntilArc(size, letterOuter+2, smallest+weight, HALF_PI)
               } else {
                  cutDifference = 0
               }
            }

            if (cutSide === "start") {
               startAngle += cutDifference
            } else if (cutSide === "end") {
               endAngle -= cutDifference
            }

            // random animation idea, maybe try more with this later
            //endAngle = startAngle + (endAngle-startAngle) * Math.abs(((frameCount % 60) /30)-1)

            if (drawCurve) {
               arc(xpos,ypos,size,size,startAngle,endAngle)
            }

            const cutX = (arcQ % 2 === 0) === (cutSide === "start")
            if (typeStretchX > 0 && !noStretchX) {
               // check if not cut off
               if (cutMode === "" || (cutMode!== "" && !cutX)) {
                  const toSideX = (arcQ === 1 || arcQ === 2) ? -1 : 1
                  let stretchXPos = xpos
                  let stretchYPos = ypos + size*toSideX*0.5
                  const dirX = (arcQ === 1 || arcQ === 4) ? 1 : -1

                  // the offset can be in between the regular lines vertically if it would staircase nicely
                  let offsetShift = 0
                  let stairDir = (verticalOffset+offy) % 2===0 ? -1 : 1
                  if (Math.abs(typeOffsetY) >2 && Math.abs(typeOffsetY) <4) {
                     offsetShift = (typeOffsetY/3)*stairDir
                  } else if (Math.abs(typeOffsetY) >1 && Math.abs(typeOffsetY)<3) {
                     offsetShift = (typeOffsetY/2)*stairDir
                  }

                  line(stretchXPos, stretchYPos+offsetShift,
                     stretchXPos + dirX*0.5*typeStretchX, stretchYPos+offsetShift)
               }
            }
            if (typeStretchY > 0 && !noStretchY) {
               // check if not cut off
               if (cutMode === "" || (cutMode!== "" && cutX)) {
                  const toSideY = (arcQ === 1 || arcQ === 4) ? -1 : 1
                  let stretchXPos = xpos + size*toSideY*0.5
                  let stretchYPos = ypos
                  const dirY = (arcQ === 1 || arcQ === 2) ? 1 : -1

                  //if (curveMode) {
                  //   curve(stretchXPos, stretchYPos-dirY*typeStretchY*3,
                  //      stretchXPos, stretchYPos,
                  //      stretchXPos+typeOffsetX*0.5*dirY, stretchYPos + dirY*0.5*typeStretchY,
                  //      stretchXPos+typeOffsetX*0.5*dirY, stretchYPos + dirY*0.5*typeStretchY)
                  //}

                  // the offset can be in between the regular lines horizontally if it would staircase nicely
                  let offsetShift = 0
                  if (Math.abs(typeOffsetX) >2 && Math.abs(typeOffsetX) <4) {
                     offsetShift = typeOffsetX/3*dirY
                  } else if (Math.abs(typeOffsetX) >1 && Math.abs(typeOffsetX)<3) {
                     offsetShift = typeOffsetX/2*dirY
                  }

                  line(stretchXPos+offsetShift, stretchYPos,
                     stretchXPos+offsetShift, stretchYPos + dirY*0.5*typeStretchY)
               }
            }
            const extendamount = ((letterOuter % 2 == 0) ? 0 : 0.5) + (typeStretchX-(typeStretchX%2))*0.5
            if (cutMode === "extend" && extendamount > 0) {
               const toSideX = (arcQ === 1 || arcQ === 2) ? -1 : 1
               let extendXPos = xpos
               let extendYPos = ypos + size*toSideX*0.5
               const dirX = (arcQ === 1 || arcQ === 4) ? 1 : -1
               line(extendXPos, extendYPos, extendXPos + dirX*extendamount, extendYPos)
            }
         });

         pop()
      }

      function drawLine (strokeSizes, arcQ, offQ, tx, ty, axis, extension, startFrom, flipped) {
         push()
         translate(tx, ty)
         noFill()
         strokeWeight((typeWeight/10)*(svgMode?appScale:1))
         if (debugGridMode) {
            strokeWeight(0.2*(svgMode?appScale:1))
         }

         let innerColor = (debugGridMode)? color("lime"): lerpColor(lineColor,bgColor,typeGradient/10)
         let outerColor = lineColor

         //innerColor = color("red")
         //outerColor = color("yellow")

         const smallest = strokeSizes[strokeSizes.length-1]
         const biggest = strokeSizes[0]

         let innerEdgeReference = smallest
         if ((biggest-smallest) <1) {
            innerEdgeReference = biggest-2
         }

         strokeSizes.forEach((size) => {
            if (strokeGradient && !debugGridMode) {
               strokeWeight((typeWeight/10)*(svgMode?appScale:1)*map(size,smallest,biggest,0.3,1))
            }
            stroke(lerpColor(innerColor, outerColor, map(size,innerEdgeReference,biggest,0,1)))
            if ((arcQ !== offQ) !== (flipped === "flipped")) {
               stroke(lerpColor(innerColor, outerColor, map(size,biggest,smallest,0,1)))
            }

            // base position
            let xpos = topOffset + charsWidth + (biggest/2)
            let ypos = startOffsetY
            // offset based on quarter and prev vertical offset
            let offx = (offQ === 3 || offQ === 4) ? 1:0
            let offy = (offQ === 2 || offQ === 3) ? 1:0
            xpos += (offx > 0) ? typeOffsetX : 0
            ypos += (verticalOffset+offy) % 2==0 ? typeOffsetY : 0
            xpos += (offy > 0) ? typeStretchX : 0
            ypos += (offx > 0) ? typeStretchY : 0

            let x1 = xpos
            let x2 = xpos
            let y1 = ypos
            let y2 = ypos

            const innerPosV = (startFrom !== undefined) ? startFrom : 0
            const innerPosH = (startFrom !== undefined) ? startFrom : 0

            if (axis === "v") {
               const toSideX = (arcQ === 1 || arcQ === 4) ? -1 : 1
               x1 += size*toSideX*0.5
               x2 += size*toSideX*0.5
               const dirY = (arcQ === 1 || arcQ === 2) ? -1 : 1
               y1 += innerPosV * dirY
               y2 += (letterOuter*0.5 + extension) * dirY
               if (typeStretchY !== 0 && innerPosV === 0) {
                  //stretch
                  // the offset can be in between the regular lines horizontally if it would staircase nicely
                  let offsetShift = 0
                  if (Math.abs(typeOffsetX) >2 && Math.abs(typeOffsetX) <4) {
                     offsetShift = typeOffsetX/3*dirY
                  } else if (Math.abs(typeOffsetX) >1 && Math.abs(typeOffsetX)<3) {
                     offsetShift = typeOffsetX/2*dirY
                  }
                  line(x1-offsetShift, y1-typeStretchY*0.5*dirY, x2-offsetShift, y1)
               }
            } else if (axis === "h") {
               const toSideY = (arcQ === 1 || arcQ === 2) ? -1 : 1
               y1 += size*toSideY*0.5
               y2 += size*toSideY*0.5
               const dirX = (arcQ === 1 || arcQ === 4) ? -1 : 1
               x1 += innerPosH * dirX
               x2 += (letterOuter*0.5 + extension) * dirX
               if (typeStretchX !== 0 && innerPosH === 0) {
                  //stretch
                  // the offset can be in between the regular lines vertically if it would staircase nicely
                  let offsetShift = 0
                  let stairDir = (verticalOffset+offy) % 2===0 ? -1 : 1
                  if (Math.abs(typeOffsetY) >2 && Math.abs(typeOffsetY) <4) {
                     offsetShift = (typeOffsetY/3)*stairDir
                  } else if (Math.abs(typeOffsetY) >1 && Math.abs(typeOffsetY)<3) {
                     offsetShift = (typeOffsetY/2)*stairDir
                  }
                  line(x1-typeStretchX*0.5*dirX, y1+offsetShift, x1, y2+offsetShift)
               }
            }
            line(x1, y1, x2, y2)
         });

         pop()
      }

      function drawLineFill (arcQ, offQ, tx, ty, axis, extension, startFrom) {
         if (weight === 0 || !drawFills) {
            return
         }

         push()
         translate(tx, ty)
         noFill()
         stroke((debugGridMode)? color("#462"): bgColor)
         strokeWeight(weight*(svgMode?appScale:1))
         strokeCap(SQUARE)

         // to make the rectangles a little longer at the end
         let strokeWeightReference = (typeWeight/10)
         if (debugGridMode) {
            strokeWeightReference = 0.2*(svgMode?appScale:1)
         }
         const roundStrokeRadius = strokeWeightReference*0.5

         // base position
         let xpos = topOffset + charsWidth + (letterOuter/2)
         let ypos = startOffsetY
         // offset based on quarter and prev vertical offset
         let offx = (offQ === 3 || offQ === 4) ? 1:0
         let offy = (offQ === 2 || offQ === 3) ? 1:0
         xpos += (offx > 0) ? typeOffsetX : 0
         ypos += (verticalOffset+offy) % 2==0 ? typeOffsetY : 0
         xpos += (offy > 0) ? typeStretchX : 0
         ypos += (offx > 0) ? typeStretchY : 0

         let x1 = xpos
         let x2 = xpos
         let y1 = ypos
         let y2 = ypos

         const innerPosV = (startFrom !== undefined) ? startFrom : 0
         const innerPosH = (startFrom !== undefined) ? startFrom : 0

         if (axis === "v") {
            const toSideX = (arcQ === 1 || arcQ === 4) ? -0.5 : 0.5
            x1 += (letterInner+weight)*toSideX
            x2 += (letterInner+weight)*toSideX
            const dirY = (arcQ === 1 || arcQ === 2) ? -1 : 1
            y1 += innerPosV * dirY
            y2 += (letterOuter*0.5 + extension + roundStrokeRadius) * dirY
            line(x1, y1, x2, y2)
            if (innerPosV === 0) {
               //stretch
               stroke((debugGridMode)? color("#367"): bgColor)

               // the offset can be in between the regular lines horizontally if it would staircase nicely
               let offsetShift = 0
               if (Math.abs(typeOffsetX) >2 && Math.abs(typeOffsetX) <4) {
                  offsetShift = typeOffsetX/3*dirY
               } else if (Math.abs(typeOffsetX) >1 && Math.abs(typeOffsetX)<3) {
                  offsetShift = typeOffsetX/2*dirY
               }

               line(x1-offsetShift, y1-typeStretchY*0.5*dirY, x2-offsetShift, y1)
            }
         } else if (axis === "h") {
            const toSideY = (arcQ === 1 || arcQ === 2) ? -0.5 : 0.5
            y1 += (letterInner+weight)*toSideY
            y2 += (letterInner+weight)*toSideY
            const dirX = (arcQ === 1 || arcQ === 4) ? -1 : 1
            x1 += innerPosH * dirX
            x2 += (letterOuter*0.5 + extension + roundStrokeRadius) * dirX
            line(x1, y1, x2, y2)
            if (innerPosH === 0) {
               //stretch
               stroke((debugGridMode)? color("#891"): bgColor)

               // the offset can be in between the regular lines vertically if it would staircase nicely
               let offsetShift = 0
               let stairDir = (verticalOffset+offy) % 2===0 ? -1 : 1
               if (Math.abs(typeOffsetY) >2 && Math.abs(typeOffsetY) <4) {
                  offsetShift = (typeOffsetY/3)*stairDir
               } else if (Math.abs(typeOffsetY) >1 && Math.abs(typeOffsetY)<3) {
                  offsetShift = (typeOffsetY/2)*stairDir
               }

               line(x1-typeStretchX*0.5*dirX, y1+offsetShift, x1, y2+offsetShift)
            }
         }
         pop()
      }


      // DESCRIBING THE FILLED BACKGROUND SHAPES AND LINES OF EACH LETTER

      // draw start of certain next letters early so that the current letter can overlap it
      //"ktlcrfs"

      const isFlipped = ("cktfe".includes(char)) ? "" : "flipped"
      const nextOffset = addSpacingBetween(char, nextchar, "", typeSpacing, letterInner, letterOuter, extendOffset).offset
      switch(nextchar) {
         case "s":
            if (!altS) {
               verticalOffset += nextOffset
               if (char === "s") {
                  drawArc(ringSizes, 4, 4, nextSpacing, 0, "round", "end", isFlipped)
               } else if (char === "r") {
                  drawArc(ringSizes, 4, 4, nextSpacing, 0, "sharp", "end", isFlipped)
               } else if (!isin(char,["gap", "dr"]) && char !== "f") {
                  drawArc(ringSizes, 4, 4, nextSpacing, 0, "round", "end", isFlipped)
               }
               verticalOffset -= nextOffset
            } else {
               //alt S
               verticalOffset += nextOffset
               if (isin(char,["dr"])) {
                  drawArc(ringSizes, 4, 4, nextSpacing, 0, "sharp", "end")
               } else if (char !== "t") {
                  drawArc(ringSizes, 4, 4, nextSpacing, 0, "round", "end")
               }
               verticalOffset -= nextOffset
            }
            break;
         case "x":
            push()
            if (isin(char,["gap","ur"]) && isin(char,["gap","dr"])) {
               translate(-weight-1,0)
            }
            // top connection
            verticalOffset += nextOffset
            if (!isin(char,["gap"]) && char !== "x") {
               if (isin(char,["ur"]) || "l".includes(char)) {
                  drawArc(ringSizes, 1, 1, nextSpacing, 0, "sharp", "start")
               } else if (char !== "t"){
                  drawArc(ringSizes, 1, 1, nextSpacing, 0, "round", "start")
               }
            }
            // bottom connection
            if (!"xef".includes(char) && !isin(char,["gap"])) {
               if (char === "s" && !altS) {
                  drawArc(ringSizes, 4, 4, nextSpacing, 0, "round", "end", isFlipped)
               } else if (char === "r" || isin(char,["dr"])) {
                  drawArc(ringSizes, 4, 4, nextSpacing, 0, "sharp", "end", isFlipped)
               } else {
                  drawArc(ringSizes, 4, 4, nextSpacing, 0, "round", "end", isFlipped)
               }
            }
            pop()
            verticalOffset -= nextOffset
            break;
         case "z":
            verticalOffset += nextOffset
            if (isin(char,["ur"]) || "l".includes(char)) {
               drawArc(ringSizes, 1, 1, nextSpacing, 0, "sharp", "start")
            } else if (char !== "t") {
               drawArc(ringSizes, 1, 1, nextSpacing, 0, "round", "start")
            }
            verticalOffset -= nextOffset
            break;
      }

      // draw chars
      switch(char) {
         case "o":
         case "ö":
         case "d":
         case "b":
         case "p":
         case "g":
         case "q":
            // circle
            drawArcFill(1, 1, 0, 0)
            drawArcFill(2, 2, 0, 0)
            drawArcFill(3, 3, 0, 0)
            drawArcFill(4, 4, 0, 0)

            drawArc(ringSizes, 1, 1, 0, 0, "", "")
            drawArc(ringSizes, 2, 2, 0, 0, "", "")
            drawArc(ringSizes, 3, 3, 0, 0, "", "")
            drawArc(ringSizes, 4, 4, 0, 0, "", "")

            // SECOND LAYER
            if (char === "d") {
               drawLineFill(2, 2, 0, 0, "v", ascenders)

               drawLine(ringSizes, 2, 2, 0, 0, "v", ascenders)
            }
            else if (char === "b") {
               drawLineFill(1, 1, 0, 0, "v", ascenders)

               drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders)
            }
            else if (char === "q") {
               drawLineFill(3, 3, 0, 0, "v", descenders)

               drawLine(ringSizes, 3, 3, 0, 0, "v", descenders)
            }
            else if (char === "g") {
               drawLineFill(3, 3, 0, 0, "v", 0)
               drawArcFill(3, 3, 0, letterOuter*0.5-extendDownOffset, false, true)

               drawLine(ringSizes, 3, 3, 0, 0, "v", -extendDownOffset)
               drawArc(ringSizes, 3, 3, 0, letterOuter*0.5-extendDownOffset, "", "", undefined, false, false, true)
               drawArc(ringSizes, 4, 4, 0, letterOuter*0.5-extendDownOffset, "sharp", "end", undefined, true)
            }
            else if (char === "p") {
               drawLineFill(4, 4, 0, 0, "v", descenders)

               drawLine(ringSizes, 4, 4, 0, 0, "v", descenders)
            } else if (char === "ö") {
               drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               drawLine(ringSizes, 2, 2, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
            }
            break;
         case "c":
            drawArcFill(1, 1, 0, 0)
            if (!isin(nextchar,["ul", "gap"])) {
               drawArcFill(2, 2, 0, 0)
            }
            if (!isin(nextchar, ["gap","dl"])) {
               drawArcFill(3, 3, 0, 0)
            }
            drawArcFill(4, 4, 0, 0)

            drawArc(ringSizes, 1, 1, 0, 0, "", "")
            if (isin(nextchar, ["ul", "gap"])) {
               drawArc(ringSizes, 2, 2, 0, 0, "sharp", "end", undefined, true)
            } else {
               drawArc(ringSizes, 2, 2, 0, 0, "round", "end", undefined, false)
            }
            if (isin(nextchar, ["dl", "gap"])) {
               drawArc(ringSizes, 3, 3, 0, 0, "sharp", "start", undefined, true)
            } else {
               drawArc(ringSizes, 3, 3, 0, 0, "round", "start", undefined, false)
            }
            drawArc(ringSizes, 4, 4, 0, 0, "", "")
            break;
         case "e":
            drawArcFill(1, 1, 0, 0)
            drawArcFill(2, 2, 0, 0)
            drawArcFill(3, 3, 0, 0)
            drawArcFill(4, 4, 0, 0)

            drawArc(ringSizes, 1, 1, 0, 0, "", "")
            drawArc(ringSizes, 2, 2, 0, 0, "", "")
            drawArc(ringSizes, 3, 3, 0, 0, "sharp", "end")
            drawArc(ringSizes, 4, 4, 0, 0, "", "")

            // SECOND LAYER
            drawLineFill(3, 3, 0, 0, "h", 0)

            if (isin(nextchar,["gap"]) || "s".includes(nextchar) && !altS) {
               drawLine(ringSizes, 3, 3, 0, 0, "h", 0)
            } else if ("zx".includes(nextchar)) {
               drawLine(ringSizes, 3, 3, 0, 0, "h", outer*0.5 + typeStretchX-weight)
            } else if (!isin(nextchar,["dl"])) {
               drawLine(ringSizes, 3, 3, 0, 0, "h", -oneoffset*0.5+max(typeSpacing, -weight))
            } else if (typeSpacing < 0) {
               drawLine(ringSizes, 3, 3, 0, 0, "h", -oneoffset+max(typeSpacing, -weight))
            } else if (typeSpacing > 0){
               drawLine(ringSizes, 3, 3, 0, 0, "h", 0)
            } else {
               drawLine(ringSizes, 3, 3, 0, 0, "h", -oneoffset)
            }
            break;
         case "a":
         case "ä":
            drawArcFill(1, 1, 0, 0)
            drawArcFill(2, 2, 0, 0)
            drawArcFill(3, 3, 0, 0)
            drawArcFill(4, 4, 0, 0)

            drawArc(ringSizes, 1, 1, 0, 0, "", "")
            drawArc(ringSizes, 2, 2, 0, 0, "", "")
            drawArc(ringSizes, 3, 3, 0, 0, "sharp", "start")
            drawArc(ringSizes, 4, 4, 0, 0, "", "")

            // SECOND LAYER
            drawLineFill(3, 3, 0, 0, "v", 0)

            drawLine(ringSizes, 3, 3, 0, 0, "v", 0)

            if (char === "ä") {
               drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               drawLine(ringSizes, 2, 2, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
            }
            break;
         case "n":
         case "m":
            drawArcFill(1, 1, 0, 0)
            drawArcFill(2, 2, 0, 0)
            drawLineFill(3, 3, 0, 0, "v", 0)
            drawLineFill(4, 4, 0, 0, "v", 0)

            drawArc(ringSizes, 1, 1, 0, 0, "", "")
            drawArc(ringSizes, 2, 2, 0, 0, "", "")
            drawLine(ringSizes, 3, 3, 0, 0, "v", 0)
            drawLine(ringSizes, 4, 4, 0, 0, "v", 0)

            // SECOND LAYER
            if (char === "m") {
               drawArcFill(2, 1, wideOffset + typeStretchX*2, 0)
               drawArcFill(1, 2, wideOffset, 0)
               drawLineFill(4, 3, wideOffset, 0, "v", 0)
               drawLineFill(3, 4, wideOffset + typeStretchX*2, 0, "v", 0)

               drawArc(ringSizes, 2, 1, wideOffset + typeStretchX*2, 0, "", "", "flipped")
               drawArc(ringSizes, 1, 2, wideOffset, 0, "", "", "flipped")
               drawLine(ringSizes, 4, 3, wideOffset, 0, "v", 0, undefined, "flipped")
               drawLine(ringSizes, 3, 4, wideOffset + typeStretchX*2, 0, "v", 0, undefined, "flipped")
            }
            break;
         case "s":
            if (!altS) {
               push()
               if (isin(prevchar,["gap", "dr"])) {
                  translate(-letterOuter*0.5+extendOffset-typeStretchX,0)
               }
               drawArcFill(3, 3, 0, 0)
               drawArcFill(1, 2, wideOffset, 0)
               if (!(isin(nextchar,["gap", "ul"]))) {
                  drawArcFill(2, 1, wideOffset + typeStretchX*2, 0)
               }
               pop()

               push()
               const isFlipped = ("cktfe".includes(prevchar)) ? "" : "flipped"
               //start further left if not connecting left
               if (isin(prevchar,["gap", "dr"])) {
                  translate(-letterOuter*0.5 + extendOffset -typeStretchX,0)
                  drawArc(ringSizes, 3, 3, 0, 0, "extend", "end", isFlipped)
               } else {
                  drawArc(ringSizes, 3, 3, 0, 0, "", "", isFlipped)
               }
               if (!isin(nextchar,["gap", "ul"]) || nextchar === "s") {
                  drawArc(ringSizes, 1, 2, wideOffset, 0, "", "", isFlipped)
                  drawArc(ringSizes, 2, 1, wideOffset + typeStretchX*2, 0, "round", "end", isFlipped)
               } else {
                  drawArc(ringSizes, 1, 2, wideOffset, 0, "extend", "end", isFlipped)
               }
               pop()
            } else {
               // alternative cursive s
               drawArcFill(2, 2, 0, 0)
               drawArcFill(3, 3, 0, 0)
               //drawArcFill(4, 4, 0, 0)

               drawArc(ringSizes, 2, 2, 0, 0, "", "")
               drawArc(ringSizes, 3, 3, 0, 0, "", "")
               if (isin(prevchar,["gap"])) {
                  drawArc(ringSizes, 4, 4, 0, 0, "", "")
               }
            }
            break;
         case "x":
            push()
            if (isin(prevchar,["gap","ur"]) && isin(prevchar,["gap","dr"])) {
               translate(-weight-1,0)
            }

            drawArcFill(2, 2, 0, 0)
            drawArcFill(4, 3, wideOffset, 0)

            if (isin(prevchar, ["gap"])) {
               drawArc(ringSizes, 1, 1, 0, 0, "sharp", "start", undefined, true)
            }
            drawArc(ringSizes, 2, 2, 0, 0, "", "")
            drawArc(ringSizes, 4, 3, wideOffset, 0, "", "")

            if (nextchar !== "x") {
               if (!isin(nextchar,["dl", "gap"])) {
                  drawArc(ringSizes, 3, 4, wideOffset + typeStretchX*2, 0, "round", "start")
               } else {
                  drawArc(ringSizes, 3, 4, wideOffset + typeStretchX*2, 0, "sharp", "start", undefined, true)
               }
            }

            // SECOND LAYER
            if (isin(prevchar,["gap", "ur"])) {
               drawArcFill(1, 2, wideOffset, 0)
               drawArcFill(3, 3, 0, 0)
            } else {
               drawArcFill(1, 2, wideOffset, 0)
               drawArcFill(3, 3, 0, 0)
            }

            drawArc(ringSizes, 1, 2, wideOffset, 0, "", "")
            if (nextchar !== "x") {
               if (!isin(nextchar,["gap", "ul"])) {
                  drawArc(ringSizes, 2, 1, wideOffset+ typeStretchX*2, 0, "round", "end")
               } else {
                  drawArc(ringSizes, 2, 1, wideOffset+ typeStretchX*2, 0, "sharp", "end", undefined, true)
               }
            }
            drawArc(ringSizes, 3, 3, 0, 0, "", "")
            if (isin(prevchar,["gap"])) {
               drawArc(ringSizes, 4, 4, 0, 0, "sharp", "end", undefined, true)
            }
            pop()
            break;
         case "u":
         case "ü":
         case "w":
         case "y":
            drawLineFill(1, 1, 0, 0, "v", 0)
            drawLineFill(2, 2, 0, 0, "v", 0)
            drawArcFill(3, 3, 0, 0)
            drawArcFill(4, 4, 0, 0)

            drawLine(ringSizes, 1, 1, 0, 0, "v", 0)
            drawLine(ringSizes, 2, 2, 0, 0, "v", 0)
            drawArc(ringSizes, 3, 3, 0, 0, "", "")
            drawArc(ringSizes, 4, 4, 0, 0, "", "")

            // SECOND LAYER
            if (char === "y") {
               drawLineFill(3, 3, 0, 0, "v", descenders)

               drawLine(ringSizes, 3, 3, 0, 0, "v", descenders)
            }
            else if (char === "w") {
               drawLineFill(2, 1, wideOffset+ typeStretchX*2, 0, "v", 0)
               drawLineFill(1, 2, wideOffset, 0, "v", 0)
               drawArcFill(4, 3, wideOffset, 0)
               drawArcFill(3, 4, wideOffset+ typeStretchX*2, 0)

               drawLine(ringSizes, 2, 1, wideOffset + typeStretchX*2, 0, "v", 0, undefined, "flipped")
               drawLine(ringSizes, 1, 2, wideOffset, 0, "v", 0, undefined, "flipped")
               drawArc(ringSizes, 4, 3, wideOffset, 0, "", "", "flipped")
               drawArc(ringSizes, 3, 4, wideOffset + typeStretchX*2, 0, "", "", "flipped")
            } else if (char === "ü") {
               drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
               drawLine(ringSizes, 2, 2, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
            }
            break;
         case "r":
            drawArcFill(1, 1, 0, 0)
            if (!(isin(nextchar,["gap"]))) {
               drawArcFill(2, 2, 0, 0)
            }
            drawLineFill(4, 4, 0, 0, "v", 0)

            drawArc(ringSizes, 1, 1, 0, 0, "", "")
            if (isin(nextchar,["ul", "gap"])) {
               drawArc(ringSizes, 2, 2, 0, 0, "sharp", "end", undefined, true)
            } else {
               drawArc(ringSizes, 2, 2, 0, 0, "round", "end")
            }
            drawLine(ringSizes, 4, 4, 0, 0, "v", 0)
            break;
         case "l":
         case "t":
            drawLineFill(1, 1, 0, 0, "v", ascenders)
            if (!(isin(nextchar,["gap","dl"]))) {
               drawArcFill(3, 3, 0, 0)
            }
            drawArcFill(4, 4, 0, 0)

            drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders)
            drawArc(ringSizes, 4, 4, 0, 0, "", "")
            if (isin(nextchar,["dl", "gap"])) {
               drawArc(ringSizes, 3, 3, 0, 0, "sharp", "start", undefined, true)
            } else {
               drawArc(ringSizes, 3, 3, 0, 0, "round", "start", undefined, false)
            }

            // SECOND LAYER
            if (char === "t") {
               drawLineFill(1, 1, 0, 0, "h", -typeWeight*0.1) //to not go all the way to the left
               //drawLineFill(2, 2, 0, 0, "h", 0)

               drawLine(ringSizes, 1, 1, 0, 0, "h", -splitoffset)
               if (nextchar !== "z") drawLine(ringSizes, 2, 2, 0, 0, "h", -weight-1)
            }
            break;
         case "f":
            drawArcFill(1, 1, 0, 0)
            if (!(isin(nextchar,["gap","ul"]))) {
               drawArcFill(2, 2, 0, 0)
            }
            drawLineFill(4, 4, 0, 0, "v", descenders)

            drawArc(ringSizes, 1, 1, 0, 0, "", "")
            if (isin(nextchar,["ul", "gap"])) {
               drawArc(ringSizes, 2, 2, 0, 0, "sharp", "end", undefined, true)
            } else {
               drawArc(ringSizes, 2, 2, 0, 0, "round", "end", undefined, false)
            }
            drawLine(ringSizes, 4, 4, 0, 0, "v", descenders)

            // SECOND LAYER
            //drawLineFill(3, 3, 0, 0, "h", 0)
            drawLineFill(4, 4, 0, 0, "h", -typeWeight*0.1) //to not go all the way to the left

            if (!"sx".includes(nextchar)) drawLine(ringSizes, 3, 3, 0, 0, "h", -weight-1)
            drawLine(ringSizes, 4, 4, 0, 0, "h", -splitoffset)
            break;
         case "k":
            drawLineFill(1, 1, 0, 0, "v", ascenders)
            drawArcFill(1, 1, weight, 0)
            drawArcFill(4, 4, weight, 0)
            drawLineFill(4, 4, 0, 0, "v", 0)

            drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders)
            drawLine(ringSizes, 4, 4, 0, 0, "v", 0)
            drawArc(ringSizes, 1, 1, weight, 0, "", "")
            drawArc(ringSizes, 4, 4, weight, 0, "", "")
            if (!"xz".includes(nextchar)) {
               drawLine(ringSizes, 2, 2, weight, 0, "h", -oneoffset-weight)
            }
            if (!"sxz".includes(nextchar)) {
               if (!(isin(nextchar,["dl", "gap"]))) {
                  drawArc(ringSizes, 3, 3, weight, 0, "round", "start")
               } else {
                  drawLine(ringSizes, 3, 3, weight, 0, "h", -oneoffset-weight)
               }
            }
            break;
         case "h":
            drawLineFill(1, 1, 0, 0, "v", ascenders)

            drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders)

            // SECOND LAYER
            drawArcFill(1, 1, 0, 0)
            drawArcFill(2, 2, 0, 0)
            drawLineFill(3, 3, 0, 0, "v", 0)
            drawLineFill(4, 4, 0, 0, "v", 0)

            drawArc(ringSizes, 1, 1, 0, 0, "", "")
            drawArc(ringSizes, 2, 2, 0, 0, "", "")
            drawLine(ringSizes, 3, 3, 0, 0, "v", 0)
            drawLine(ringSizes, 4, 4, 0, 0, "v", 0)
            break;
         case "v":
            drawLineFill(1, 1, 0, 0, "v", 0)
            drawLineFill(4, 4, 0, 0, "v", 0)

            drawLine(ringSizes, 1, 1, 0, 0, "v", 0)
            drawLine(ringSizes, 4, 4, 0, 0, "v", 0)

            // SECOND LAYER
            drawLineFill(4, 4, typeWeight*0.1, 0, "h", 0)
            drawArcFill(3, 3, 0, 0)
            drawLineFill(2, 2, 0, 0, "v", 0)

            drawLine([letterOuter], 4, 4, 0, 0, "h", 0)
            drawLine(ringSizes, 4, 4, 0, 0, "h", -splitoffset)
            
            drawLine(ringSizes, 2, 2, 0, 0, "v", 0)
            drawArc(ringSizes, 3, 3, 0, 0, "", "")
            break;
         case ".":
            drawLine(ringSizes, 4, 4, 0, 0, "v", 0, letterOuter*0.5 - (weight+0.5))
            break;
         case ",":
            drawLine(ringSizes, 4, 4, 0, 0, "v", descenders, letterOuter*0.5 - (weight+0.5))
            break;
         case "!":
            drawLineFill(1, 1, 0, 0, "v", ascenders)
            drawLineFill(4, 4, 0, 0, "v", 0)
            // wip
            drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders,)
            drawLine(ringSizes, 4, 4, 0, 0, "v", -weight-1.5)
            drawLine(ringSizes, 4, 4, 0, 0, "v", 0, letterOuter*0.5 - (weight+0.5))
            break;
         case "i":
            drawLineFill(1, 1, 0, 0, "v", 0)
            drawLineFill(4, 4, 0, 0, "v", 0)

            drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
            drawLine(ringSizes, 1, 1, 0, 0, "v", 0)
            drawLine(ringSizes, 4, 4, 0, 0, "v", 0)
            break;
         case "j":
            drawLineFill(1, 1, 0, 0, "v", 0)
            drawLineFill(4, 4, 0, 0, "v", 0)
            drawArcFill(3, 4, -letterInner-weight, letterOuter*0.5+extendDownOffset, false, true)

            drawLine(ringSizes, 1, 1, 0, 0, "v", ascenders, letterOuter*0.5 + 1)
            drawLine(ringSizes, 1, 1, 0, 0, "v", 0)
            drawLine(ringSizes, 4, 4, 0, 0, "v", extendDownOffset)
            drawArc(ringSizes, 3, 4, -letterInner-weight, letterOuter*0.5+extendDownOffset, "", "", undefined, false, false, true)
            break;
         case "z":
            //drawArcFill(1, 1, 0, 0)
            drawArcFill(2, 2, 0, 0)
            drawArcFill(3, 3, 0, 0)

            if (isin(prevchar, ["gap"])) {
               drawArc(ringSizes, 1, 1, 0, 0, "", "")
            }

            drawArc(ringSizes, 2, 2, 0, 0, "", "")
            drawArc(ringSizes, 3, 3, 0, 0, "", "")

            // SECOND LAYER
            drawArcFill(2, 3, 0, letterInner+weight, false, true)

            drawArc(ringSizes, 2, 3, 0, letterInner+weight, "", "", undefined, false, false, true)
            break;
         case "-":
            drawLine([letterOuter], 1, 1, 0, +letterOuter*0.5, "h", -1)
            drawLine([letterOuter], 2, 2, 0, +letterOuter*0.5, "h", -1)
            break;
         case "_":
            drawLine([letterOuter], 3, 3, 0, 0, "h", -1)
            drawLine([letterOuter], 4, 4, 0, 0, "h", -1)
            break;
      }

      verticalOffset += spacingResult.offset
      charsWidth += nextSpacing
   }

   lineColor = oldLineColor

   const height = typeSize + Math.abs(typeOffsetY) + typeStretchY
   const asc = typeAscenders*typeSize
   const desc = Math.ceil(typeSize/2)
   if (typeSpacingY !== undefined) {
      startOffsetY += height+typeSpacingY
      totalHeight[lineNum] = height +typeSpacingY
   } else {
      startOffsetY += height + asc + desc
      totalHeight[lineNum] = height + asc + desc
   }
   

   if (!printMode) {
      lineColor.setAlpha(40)
      stroke(lineColor)
      strokeWeight(0.2*(svgMode?appScale:1))

      const i = lineNum * totalHeight[lineNum] - typeSize/2
      if (typeOffsetX<0) {
         translate(typeOffsetX,0)
      }

      if (debugGridMode) {
         //vertical gridlines
         line(0, i, totalWidth[lineNum], i)
         line(0, i+height, totalWidth[lineNum], i+height)
         line(0, i-asc, totalWidth[lineNum], i-asc)
         line(0, i+height/2-typeOffsetY*0.5, totalWidth[lineNum], i+height/2-typeOffsetY*0.5)
         line(0, i+height/2+typeOffsetY*0.5, totalWidth[lineNum], i+height/2+typeOffsetY*0.5)
         line(0, i+height+asc, totalWidth[lineNum], i+height+asc)

         //horizontal gridlines
         push()
         translate(0,i+height*0.5)
         for (let j = 0; j <= totalWidth[lineNum]; j++) {
            line(j, -height/2-typeAscenders*typeSize, j, height/2+typeAscenders*typeSize)
         }
         pop()
      }
   }
   pop()

   bgColor.setAlpha(255)
   lineColor.setAlpha(255)
}






function addSpacingBetween(prevchar, char, nextchar, spacing, inner, outer, extendOffset) {
   const weight = (outer-inner)*0.5

   // negative spacing can't go past width of lines
   spacing = max(spacing, -weight)

   // spacing is used between letters that don't make a special ligature
   // some letters force a minimum spacing
   if (typeRings > 1) {
      if (("ij".includes(char) && "bhkltivj".includes(nextchar)) ||
         ("dgij".includes(char) && "ij".includes(nextchar))) {
      spacing = max(spacing, 1)
      }
   } else {
      if (("ij".includes(char) && "bhkltfivjnmrp".includes(nextchar)) ||
         ("dgijhnmaqvy".includes(char) && "ij".includes(nextchar)) ||
         ("dqay".includes(char) && "bhptf".includes(nextchar))) {
      spacing = max(spacing, 1)
      }
   }

   // widths of letters without overlapping
   let charWidth = outer
   switch(char) {
      case "m":
      case "w":
         charWidth = weight*3 + inner*2
         break;""
      case "x":
         charWidth = weight*2 + inner*2
         if (isin(prevchar,["gap","ur"]) && isin(prevchar,["gap","dr"])) {
            charWidth = weight*1 + inner*2 -1
         }
         break;
      case "s":
         if (!altS) {
            charWidth = weight*3 + inner*2
            if (isin(nextchar,["gap", "ul"])) {
               charWidth += -0.5*outer +1
            }
            if (isin(prevchar,["gap", "dr"])) {
               charWidth += -0.5*outer
            }
         }
         break;
      case " ":
         charWidth = ceil(outer*0.5)
         break;
      case "i":
      case "j":
      case ".":
      case ",":
      case "!":
         charWidth = weight
         break;
      case "t":
      case "l":
         if (isin(nextchar,["gap", "dl"])) {
            charWidth += -weight
         }
         break;
      case "f":
      case "c":
      case "r":
         if (isin(nextchar,["gap", "ul"])) {
            charWidth += -weight
         }
         break;
   }

   // 1 less space after letters with cutoff
   if ("ktlcrfsx-".includes(char) && isin(nextchar,["gap"])) {
      charWidth -= 1
   }
   // 1 less space in front of xzy
   if ("xsz-".includes(nextchar) && isin(char,["gap"])) {
      charWidth -= 1
   }

   // overlap after letter, overwrites default variable spacing
   // only happens if it connects into next letter
   let spaceAfter = 0
   let afterConnect = false
   let minSpaceAfter
   switch(char) {
      case "s":
         if (!altS) {
            if (!isin(nextchar,["gap", "ul"])) {
               spaceAfter = -weight
               afterConnect = true
            } else {
               minSpaceAfter = 0
            }
         }
         break;
      case "k":
         if (!isin(nextchar,["gap", "dl"])) {
            afterConnect = true
         } else {
            minSpaceAfter = 0
         }
         break;
      case "x":
         if (!(isin(nextchar,["gap", "dl"]) && isin(nextchar,["gap", "ul"]))) {
            afterConnect = true
         } else {
            minSpaceAfter = 0
         }
         break;
      case "t":
      case "l":
         if (!isin(nextchar,["gap", "dl"])) {
            spaceAfter = -weight
            afterConnect = true
         } else {
            minSpaceAfter = 0
         }
         break;
      case "f":
      case "c":
      case "r":
         if (!isin(nextchar,["gap", "ul"])) {
            spaceAfter = -weight
            afterConnect = true
         } else {
            minSpaceAfter = 0
         }
         break;
      case ".":
      case ",":
      case "!":
         if (!isin(nextchar,["gap"])) {
            minSpaceAfter = 1
         }
   }

   // depending on the next letter, adjust the spacing
   // only if the current letter doesn't already overlap with it
   let spaceBefore = 0
   let beforeConnect = false
   let minSpaceBefore
   if (afterConnect === false) {
      switch(nextchar) {
         case "s":
            if (!altS) {
               if (!isin(char,["gap", "dr"])) {
                  spaceBefore = -weight
                  beforeConnect = true
               } else {
                  if ("e".includes(char)) {
                     beforeConnect = true
                  } else {
                     minSpaceBefore = 1
                  }
               }
            } else {
               //alt s
               if (!isin(char, ["gap"])) {
                  spaceBefore = -weight
                  beforeConnect = true
               }
            }
            break;
         case "x":
            if (!(isin(char,["gap", "ur"]) && isin(char,["gap", "dr"]))) {
               spaceBefore = -weight
               beforeConnect = true
            } else {
               if ("e".includes(char)) {
                  beforeConnect = true
               } else {
                  minSpaceBefore = 1
               }
            }
            break;
         case "z":
            if (!isin(char, ["gap"])) {
               spaceBefore = -weight
               beforeConnect = true
            }
         case ",":
         case ".":
         case "!":
            minSpaceBefore = 1
            break;
      }
   }

   //extra special combinations
   if ("ktlcrfsx".includes(char) && nextchar === "s") {
      spaceBefore = -inner-weight-typeStretchX
      beforeConnect = true
   }
   if ("ktlcrfsx".includes(char) && nextchar === "x") {
      spaceBefore = -inner-weight-typeStretchX
      beforeConnect = true
   }
   if ("ktlcrfsx".includes(char) && nextchar === "z") {
      spaceBefore = -inner-weight-typeStretchX
      beforeConnect = true
   }

   // remove overlap spacing if next to space
   if (isin(nextchar,["gap"])) {
      spaceBefore = 0
      beforeConnect = false
   }
   if (isin(char,["gap"])) {
      spaceAfter = 0
      afterConnect = false
   }



   let spacingResult = 0

   // if there is no special overlaps, use the global spacing
   if (afterConnect === false && beforeConnect === false) {

      //regular spacing, if above minspacing
      if (minSpaceAfter !== undefined || minSpaceBefore !== undefined) {
         if (minSpaceBefore !== undefined) {
            spacingResult = charWidth + max(spacing, minSpaceBefore)
         } else {
            spacingResult = charWidth + max(spacing-1, minSpaceAfter)
         }
      } else if ("-_ ".includes(char)) {
         spacingResult = charWidth
      } else {
         // other punctuation?
         spacingResult = charWidth
         if (!"-_ ".includes(nextchar)) spacingResult += spacing
      }
   } else {
      spacingResult = charWidth + spaceAfter + spaceBefore
   }

   // width for vertical offset
   let offsetSegments = 0
   let stretchWidth = 0
   switch (char) {
      case "m":
      case "w":
      case "s":
      case "x":
         offsetSegments = 2
         if (char === "s") {
            if (!altS) {
               // stretch spacing depends on if it connects
               if (isin(prevchar,["gap", "dr"])) {
                  stretchWidth += extendOffset
               } else {
                  stretchWidth += typeStretchX
                  offsetSegments -=1
               }
               if (isin(nextchar,["gap", "ul"])) {
                  stretchWidth += extendOffset
               } else {
                  stretchWidth += typeStretchX
                  offsetSegments -=1
               }
            }
         } else {
            stretchWidth += typeStretchX * 2
         }
         break;
      case "i":
      case "j":
      case ".":
      case ",":
      case "!":
      case " ":
         offsetSegments = 0
         stretchWidth += typeStretchX * 0
         break;
      default:
         offsetSegments = 1
         stretchWidth += typeStretchX * 1
         break;
   }

   return {
      width: spacingResult + stretchWidth,
      offset: offsetSegments
   }
}

function arcUntil(circleSize, y, altValue) {
   //if too close
   if (y <= 0) {
      return altValue
   }

   const x = Math.sqrt(circleSize**2 - y**2)
   const theta = (Math.atan2(y, x));
   //const amount = (2*theta)/PI
   return theta
}

function arcUntilArc (sizeCircle, sizeOther, dist, altValue) {
   //if too close
   // if (da <= 2 || db <= 2) {
   //    return altValue
   // }

   const ra = sizeCircle/2
   const rb = sizeOther/2

   const x = (dist**2-rb**2+ra**2) / (2*dist)
   const y = Math.sqrt(ra**2 - x**2)
   const theta = (Math.atan2(x, y));
   //const amount = (2*theta)/PI

   if (theta < 0) {
      return altValue
   }
   return theta
}


function addLeadingChar (input, count) {
   let string = input.toString()
   const addcount = count - string.length

   if (addcount > 0) {
      string = ".".repeat(addcount) + string
   }
   return string
}