/*jshint esversion: 6 */
/*
Barcode.js
==========
Barcode label element.
*/
import _ from 'underscore';
import Element from './Element';

export default class QrCode extends Element{



   constructor(mode, type, x, y, errorCorrection, multiple, mask, rotation, data){
      super();

      const modes = {'NUMERICAL': '1', 'ALPHA': '2', /*'8-BIT':'3',*/ 'KANJI':'4', 'MIX':'5'};
      const types = {'MODEL1': '1', 'MODEL2': '2',  'MICRO':'3'};
      const rotations = {'0': '0', '90': '1',  '180':'2', '270':'3'};

      this.type = types[type];
      if (type === 'MICRO' && mode === 'MIX') {
            throw new Error('Mode MIX is not supported for MICRO QR codes.');
      }
      this.mode = modes[mode];
      this.xStart = x;
      this.yStart = y;
      if (errorCorrection === 'H' && type === 'MICRO') {
         throw new Error('Error correction level H is not supported for MICRO QR codes.');
      }

      this.errorCorrection = errorCorrection;
      this.multiple = multiple>0 && multiple<=40 ? multiple : 1; // 1-40
      this.size = Buffer.byteLength(data, 'utf8');
      this.mask = (type==='MICRO' ? '0' : mask) || 8;
      this.rotation = rotations[rotation];
      this.data = data;
   }

   getPrintCommand(dpi=203){
      super.getPrintCommand(dpi);
      const   xStartDot = this.toDot(this.xStart),
            yStartDot = this.toDot(this.yStart);

      return `W${xStartDot},${yStartDot},${this.mode},${this.mode},${this.errorCorrection},${this.mask},${this.multiple},${this.size},${this.rotation}\n${this.data}\n`;
   }
}
