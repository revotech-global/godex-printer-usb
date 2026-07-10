/*jshint esversion: 6 */
/*
label.js
========
Contains methods that give GoDex EZPL commands for priting labels elements.
*/
import _ from 'underscore';
import Element from './elements/Element';
import Rect from './elements/Rectangle';
import LineHor from './elements/LineHor';
import LineVer from './elements/LineVer';
import Text from './elements/Text';
import Barcode from './elements/Barcode';
import QrCode from "./elements/QrCode";
import RawCommand from './elements/RawCommand';

export default class Label{
   constructor(copies = 1, width = 80, height = 52, gap = 2, leftMargin= 26, rowOffset= -15, startPos= 20, codepage = null){

      this.copies = 1;
      this.width = width;
      this.height = height;
      this.gap = gap;
      this.leftMargin = leftMargin;
      this.rowOffset = rowOffset;
      this.startPos = startPos;
      // Optional EZPL codepage (^XSET,CODEPAGE,n). Common values:
      //   17 = Windows-1253 (Greek), 0 = Windows-1252 (Western), etc.
      // When set, prefix includes `^XSET,CODEPAGE,<n>` so the printer
      // interprets non-ASCII text bytes through that mapping.
      this.codepage = codepage;
      // Hold list of babel elements
      this.labelEle = [];

      this.set = {
         copies: x=>{this.copies = x;}
      };

      this.cmd = {
         copies: ()=>{return `^C${this.copies}\n`;},
         labelDim: ()=>{return `^W${this.width}\n^Q${this.height},${this.gap}\n`;},
         leftMargin: ()=>{return `^R${this.leftMargin}\n`;},
         rowOffset: ()=>{return `~Q${this.rowOffset}\n`;},
         startPos: ()=>{return `^E${this.startPos}\n`;},
         codepage: ()=>{return this.codepage != null ? `^XSET,CODEPAGE,${this.codepage}\n` : '';},
         startLabelNormal: ()=>{return '^L\n';},   // if mode = 0 || undefined
         startLabelInverse: ()=>{return '^LI\n';}, // if mode = 1
         startLabelMirror: ()=>{return '^LM\n';}  // if mode = 2
      };

      this.set = {
         copies : x=>{this.copies = x;},
         width : x=>{ this.width = x;},
         height : x=>{this.height = x;},
         gap : x=>{this.gap = x;},
         leftMargin : x=>{this.leftMargin = x;},
         rowOffset : x=>{this.rowOffset = x;},
         startPos : x=>{this.startPos = x;},
         codepage : x=>{this.codepage = x;}
      };
   }

   addLabelElement(element){
      if(element instanceof Element)
         this.labelEle.push(element);
   }

   // Horizontal line commmand
   addLineHor(xStart,xEnd,y,t){
      this.addLabelElement(new LineHor(xStart,xEnd,y,t));
   }

   addLineVer(x,yStart,yEnd,t){
      this.addLabelElement(new LineVer(x,yStart,yEnd,t));
   }

   addRect(xStart, yStart, width, height, t){
      this.addLabelElement(new Rect(xStart, yStart, width, height, t));
   }

   // Text command. Passing `inverse: true` appends the EZPL `I` flag to the
   // text command's 7th field (e.g. `0DEI`) so the printer renders the glyphs
   // in reverse-video — white on whatever is drawn underneath.
   addText(text, xStart, yStart, size, rotation, font, inverse){
      this.addLabelElement(new Text(text, xStart, yStart, size, rotation, font, inverse));
   }

   // `readable` controls the human-readable text the printer auto-renders below
   // the bars (0 = none, 1 = below centred, etc., per EZPL spec). Defaults to 0
   // for backward compatibility — callers asking for it pass true/1 explicitly.
   addBarcode(type, x, y, narrow, width, height, data, rotation = 0, readable = 0){
      this.addLabelElement(new Barcode(type, x, y, narrow, width, height, rotation, readable, data));
   }

   addQrCode(mode, type, x, y, errorCorrection, multiple, mask, rotation, data){
      this.addLabelElement(new QrCode(mode, type, x, y, errorCorrection, multiple, mask, rotation, data));
   }

   // Injects an arbitrary EZPL command into the stream between drawn elements.
   // Useful for mode switches like `^LI` (inverse) / `^L` (normal) mid-label.
   addRawCommand(command){
      this.addLabelElement(new RawCommand(command));
   }

   getPrintCommand(dpi=203, mode = 0){
      var cmd = "";
      for(var element of this.labelEle){
         cmd += element.getPrintCommand(dpi);
      }
      return cmd;
   }

   getPrintCommandPrefix(mode=0){
      var prefix =   this.cmd.copies() +
          this.cmd.labelDim() +
          this.cmd.leftMargin() +
          this.cmd.rowOffset() +
          this.cmd.startPos() +
          this.cmd.codepage() +
          (mode===0? this.cmd.startLabelNormal() : (mode===1? this.cmd.startLabelInverse() : this.cmd.startLabelMirror()));
      return prefix;
   }
}
