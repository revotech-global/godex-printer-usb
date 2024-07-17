/*jshint esversion: 6 */
/*
printer.js
==========
A module to control GoDex printer.
*/
//import {SerialPort} from 'serialport';
import EventEmitter from 'events';
import Label from './label';
import Promise from 'bluebird';

/**
 * Class representing Printer
 * @extends EventEmitter
 */
export default class Printer extends EventEmitter{

   constructor({
               connector = null,
               dpi=203,
               speed= 4,
               darkness= 6,
               transferType = 'Direct',
               rotate= 150} = {}){
      super();

      this.connector = connector;
      // Printer specific dot per inch
      this.dpi = dpi;

      this.config = {speed, darkness, rotate, transferType};

      this.cmd = {
         speed : ()=>{return `^S${this.config.speed}\n`;},
         darkness: ()=>{return `^H${this.config.darkness}\n`;},
         rotate: ()=>{return `~R${this.config.rotate}\n`;},
         end: ()=>{return 'E\n';},
         setTransferType: ()=>{return this.transferType == 'Direct' ? '^AD\n' : '^AD\n';},
         cancel: ()=>{return '~S,CANCEL\n';},
         clearBuffer: ()=>{return '~S,BUFCLR\n';}
      };

      this.set = {
         speed : x=>{this.config.speed = x;},
         darkness : x=>{this.config.darkness = x;},
         rotate : x=>{this.config.rotate = x;}
      };

      // Printer status
      this.status = { '00': 'Ready', '01': 'Media Empty or Media Jam', '02': 'Media Empty or Media Jam', '03': 'Ribbon Empty',
                      '04': 'Door Open', '05': 'Rewinder Full', '06': 'File System Full', '07': 'Filename Not Found',
                      '08': 'Duplicate Name', '09': 'Syntax Error', '10': 'Cutter Jam', '11': 'Extended Memory Not Found', '20': 'Pause', '21': 'In Setting Mode', '22': 'In Keyboard Mode', '50': 'Printer is Printing', '60': 'Data in Process' };

      this.isPrinting = false;
      this.queue = [];
      this.sp = null;

      // Try to connect to port
      if(this.connector){
         this.connector.start()
         .then(function(){
            this.nextPrintTask();
         }.bind(this))
         .catch(function(err){
            console.log(err.message);
         });
      }
   }

   stop(){
      this.connector.stop();
   }


   // DEPRECATED - Push a print task to queue
   addPrintTask(task){
      console.error("DEPRECATED: Printer.addPrintTask() depricated, use Printer.PrintLabel(Label) instead.");
   }

   clearIssues(){
      let cmd = this.cmd.clearBuffer() + this.cmd.cancel();
      this.queue.push(cmd);
      this.nextPrintTask();
   }

   // Push a print task to queue
   printLabel(label){
      if(label instanceof Label){
         var cmd = this.getPrintCommandPrefix() + label.getPrintCommandPrefix() + label.getPrintCommand(this.dpi) + this.cmd.end();
         this.queue.push(cmd);
         this.nextPrintTask();
      }
   }

   // Push a raw print command to queue
   printLabelRaw(command){
      this.queue.push(command);
      this.nextPrintTask();
   }

   // Test print
   testPrint(callback){
      this.print('~V\n', callback);
   }

   // Test printer head
   testPrintHead(callback){
      this.print('~T\n', callback);
   }

   // Calibrate printer
   calibrate(callback){
      this.print('~S,SENSOR\n', callback);
   }

   // Factory reset printer
   factoryReset(callback){
      this.print('^Z\n', callback);
   }

   // Get printer status
   getPrinterStatus(callback, flag){
      if(this.connector.isOpen()){
         // On  data received
         this.connector.once('data', function(data){
            data = data?.toString('UTF-8')?.trimEnd();
            var d = data.replace('\r', '');
            if(callback)
               callback(null, this.status[d]);
         }.bind(this));
         // Write
         this.connector.write("^XSET,IMMEDIATE,1\n~S,CHECK\n", function(err, results){
            console.log("Write immediate result",results);
         });
      }
      else{
         if(callback)
            callback(new Error("Port not started!"), null);
      }
   }

   // Print next task in queue
   nextPrintTask(){
      // If  port is open
      if(this.connector.isOpen()){
         // If not printing and task leftover in queue
         if(!this.isPrinting && this.queue.length > 0){
            var task = this.queue.splice(0,1)[0];
            this.print(task);
         }
         else{
            this.emit('printQueueEmpty');
         }
      }
   }

   // Print
   print(command, callback){
      // If connector port is open
      if(this.connector.isOpen()){
         // If currently not printing
         if(!this.isPrinting){
            this.isPrinting = true;
            this.connector.write(command, function(){
               this.isPrinting = false;
               this.nextPrintTask();
               if(callback)
                  callback(null);
            }.bind(this));
         }
      }
      else{
         if(callback)
            callback(new Error("Port not open"));
      }
   }

   getPrintCommandPrefix(mode=0){
      var prefix =
          this.cmd.setTransferType() +
          this.cmd.speed() +
          this.cmd.darkness() +
          this.cmd.rotate();
      return prefix;
   }
}
