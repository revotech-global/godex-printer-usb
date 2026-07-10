import * as usb from 'usb';

export default class UsbPort {
    constructor(){
        this.device = null;
        this.vid = null;
        this.pid = null;
    }

    // Set serial port
    setPortById(vid = 6495, pid = 1){
        this.vid = vid;
        this.pid = pid;
        this.device = usb.findByIds(vid, pid);
    }

    // Start serial port
    start(){
        return new Promise(async function(resolve, reject){
            if(this.device ){
                try {
                    this.device.open();
                    this.outEndpoint = this.device.interfaces[0].endpoints.find(e => e.direction === 'out');
                    this.outEndpoint.transferType = 2;
                    this.inEndpoint = this.device.interfaces[0].endpoints.find(e => e.direction === 'in');
                    this.inEndpoint.transferType = 2;
                    this.device.interfaces[0].claim();
                } catch (e){
                    reject(e);
                }
            }
            else{
                reject("Cannot open port");
            }
        }.bind(this));
    }

    // Stop serial port
    stop(){
        if(this.device && this.device.interfaces) {
            this.device.close();
        }
    }

    isOpen(){
        return !!this.device && this.device.interfaces;
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
        this.inEndpoint.startPoll();
        this.inEndpoint.once(arg0, arg1);
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
        if (!this.isOpen()) {
            throw new Error('Port not open');
        }
        // EZPL is ASCII for commands and uses a printer-configurable codepage
        // for non-ASCII text (e.g. Win-1253 Greek bytes 0xC0..0xFF). Convert
        // string payloads to a Buffer using `binary` (Latin-1) so each JS
        // char maps to a single byte — using UTF-8 would split high bytes
        // into two bytes and the printer would render mojibake.
        const payload = Buffer.isBuffer(command) ? command : Buffer.from(command, 'binary');
        this.outEndpoint.transfer(payload, onDoneCallback);
    }
}
