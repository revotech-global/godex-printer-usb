/*jshint esversion: 6 */

import {Printer, Label, UsbPort, NetworkPort} from '../src/index';
import LineHor from '../src/elements/LineHor';
import Promise from 'bluebird';

let netport = new NetworkPort();
netport.setURL("http://192.168.1.206/");
var p = new Printer({connector: netport});


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

    p.printLabel(label1);
    p.printLabel(label2);

    p.on("printQueueEmpty", function () {
      console.log("Everything printed");
      p.stop();
   });

});
