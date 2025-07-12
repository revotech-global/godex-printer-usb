/*jshint esversion: 6 */

import {Printer, Label, UsbPort, SerialPort} from '../src/index';
import LineHor from '../src/elements/LineHor';
import Promise from 'bluebird';

let usb = new UsbPort();
usb.setPortById();
var p = new Printer({connector: usb, labelWidth: 40});


p.getPrinterStatus((result)=> {
   p.clearIssues();
   p.calibrate((result)=>{
       console.log("calibrate results", result);
   });


   var label1 = new Label(1, 55, 25, 4, 0);
    label1.addText("S-1000i", 2, 0, 2);
    label1.addText("28/05/21", 37, 0, 3);
    label1.addText("NAME LASTNAME", 2, 4, 2,0, 'E' );
    label1.addText("641", 37, 3, 4);
    label1.addLineHor(2, 54, 9, 0.1);
   label1.addBarcode('EAN8', 9, 10, 0.3, 0.7, 10, "22408785");
   label1.addText("BLOOD.", 2, 20, 2, 0 , 'E');


    var label2 = new Label(1, 55, 25, 4, 0);
    label2.addText("STOCK SERUM", 2, 0, 2, 0, 'E');
    label2.addText("28/05/21", 37, 0, 3);
    label2.addText("NAME LASTNAME", 2, 4, 2,0, 'E' );
    label2.addText("641", 37, 3, 4);
    label2.addLineHor(2, 54, 9, 0.1);

     var label3 = new Label(1, 55, 25, 4, 0);
     label3.addText("A2KM4Q", 5, 6, 2, 1, 'E');
    label3.addBarcode('CODE93', 10, 0, 0.2, 0.4, 5, "A2KM4Q",1);
    label3.addText("A2KM4Q", 50, 16, 2, 3, 'E');
    label3.addBarcode('CODE93', 50, 0, 0.2, 0.4, 5, "A2KM4Q",1);

     var label4 = new Label(1, 55, 25, 4, 0);
     label4.addText("A2KM4Q", 5, 6, 2, 1, 'E');
    label4.addQrCode("ALPHA","MICRO", 5, 7, "M", 3,8,0,"A2KM4Q");
    label4.addText("A2KM4Q", 50, 16, 2, 3, 'E');
    label4.addQrCode("ALPHA","MICRO", 42, 7, "M", 3,8,0,"A2KM4Q");




    p.printLabel(label1);
    p.printLabel(label2);
     p.printLabel(label3);
     p.printLabel(label4);

    p.on("printQueueEmpty", function () {
      console.log("Everything printed");
      p.stop();
   });

});
