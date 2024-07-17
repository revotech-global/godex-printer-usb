export default class SerialPort {
    constructor(){
      this.sp = null;
      this.port = null;
      this.baud = 9600;
      this.open = false;
   }

   // Set serial port
   setPort(port){
      this.port = port;
   }

   // Start serial port
   start(port){
      return new Promise(function(resolve, reject){
         this.port = port? port : this.port;
         if((this.sp === null || !this.sp.isOpen) && this.port){
            this.sp = new SerialPort({path: this.port, baudRate: this.baud}, function(err){
               if(err)
                  reject(err);
               else {
                   resolve();
                   this.open = this.sp.isOpen;
               }
            }.bind(this));
         }
         else{
            reject("Cannot open port");
         }
      }.bind(this));
   }

   isOpen(){
        return this.open;
   }

   // Stop serial port
   stop(){
      if(this.sp && this.sp.isOpen) {
          this.sp.close();
            this.open = false;
      }
   }

   // Get list of serial ports
   getPorts(callback, raw){
      SerialPort.list(function (err, ports) {
         if(err){
            if(callback)
               callback(err, null);
         }
         else{
            if(!raw){
               var portNames = [];
               if(ports.length > 0)
                  ports.forEach(function(port){ portNames.push(port.comName); });
               callback(null, portNames);
            }
            else {
               callback(null, ports);
            }
         }
      });
   }
   once(arg0, arg1) {
        this.sp.once(arg0, arg1);
   }

    // Get list of serial ports synchronously
    async getPortsSync(raw){
        var ports = await SerialPort.list();
        console.log(ports);
        if(!raw){
            var portNames = [];
            if(ports.length > 0)
                ports.forEach((port) => { portNames.push(port.path); });
            return portNames;
        }
        else{
            return ports;
        }
    }
    write(command, onDoneCallback){
        this.sp.write(command, function(){
            this.sp.drain(onDoneCallback);
        }.bind(this));
    }
}
