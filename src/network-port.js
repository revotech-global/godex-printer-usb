import * as usb from 'usb';
import * as url from 'node:url';
import * as axios from 'axios';
import EventEmitter from 'events';



// Characters a form body may carry unencoded.
const UNRESERVED = /[A-Za-z0-9\-_.~]/;

const encodeSingleByte = (text) => Array.from(text, (ch) => {
    if (UNRESERVED.test(ch)) { return ch; }
    const code = ch.charCodeAt(0);
    if (ch.length === 1 && code <= 0xFF) { return `%${code.toString(16).toUpperCase().padStart(2, '0')}`; }
    return encodeURIComponent(ch);
}).join('');

/**
 * Builds an x-www-form-urlencoded body with one byte per character.
 * EZPL text is already in the printer's code page (e.g. Win-1253 Greek as U+00C1..U+00FE), so each
 * character must reach the printer as that single byte; URLSearchParams would send it as two UTF-8 bytes.
 * Characters above U+00FF keep UTF-8 encoding: no single byte can carry them.
 * @param {Record<string, string|number>} fields - The form fields.
 * @returns {string} The encoded body.
 */
export const toSingleByteFormBody = (fields) => Object.entries(fields)
    .map(([key, value]) => `${encodeSingleByte(String(key))}=${encodeSingleByte(String(value))}`)
    .join('&');


export default class NetworkPort {
    constructor(){
//      this.device = null;
      this.URL = null;
      this.iphost = null;
      this.port = 80;
      this.protocol = 'http';
      this.EM = new EventEmitter();
      this.username = 'admin';
      this.password = '1111';
      this.timeout = 3000;
   }

   // Set serial port
   setURL(theURL){
        let urlParts = url.parse(theURL);
        this.protocol = urlParts.protocol;
        this.iphost = urlParts.hostname;
        this.port = urlParts.port || this.protocol === 'https:' ? 443 : 80;
        this._prepareURL();
   }

   setHostIp(iphost){
        this.iphost = iphost;
        this._prepareURL();
   }

   _prepareURL(){
        let URL = new url.URL("http://localhost");
        URL.protocol = this.protocol;
        URL.hostname = this.iphost;
        URL.port = this.port;
        this.URL = URL.toString();
   }

    setAuth(username, password){
        this.username = username;
        this.password = password;
    }

    setTimeout(timeout){
        this.timeout = timeout;
    }

   // Start serial port
   start(){
      return new Promise(async function(resolve, reject){
         if(this.URL ){
            try {
                await this._login();
            } catch (e){
                reject(e);
            }
         }
         else{
            reject("No ip/host specified");
         }
      }.bind(this));
   }

   // Stop serial port
   stop(){
     //DUMMY
   }

   isOpen(){
        return true;
   }

   // Get list of serial ports
   getPorts(callback, raw){

   }
   once(arg0, arg1) {
        this.EM.once(arg0, arg1);
   }

    // Get list of serial ports synchronously
    async getPortsSync(raw){

    }

   async _login() {
       const DataToSend = (new url.URLSearchParams({
           "userName":this.username,
           "userPassword":this.password,
           "loginButton": "Login"
       })).toString();
       console.log("DataToSend", DataToSend);
       try {
           let response = await axios.request({
               method: 'post',
               url: `${this.URL}login.cgi`,
               headers: {
                   'Content-Type': 'application/x-www-form-urlencoded',
               },
               timeout: this.timeout,
               data: DataToSend
           });
       } catch(err){
              this.EM.emit('error', err);
            throw err;
       }
    }

    splitCommandToSize(command, size){
        const commandParts = command.split("\r\n");
        const splitParts = [];
        let currentPart = "";
        while (commandParts.length) {
            if ((currentPart+commandParts[0]+"\r\n").length <= size){
                currentPart += commandParts[0] + "\r\n";
                commandParts.shift();
            } else {
                if (commandParts[0].length>size){
                    throw (new Error("Single command part exceeds size limit"));
                }
                splitParts.push(currentPart);
                currentPart = "";
            }
        }
        if (currentPart.length){
            splitParts.push(currentPart);
        }
        return splitParts;
    }
    write5(command, onDoneCallback){
        return new Promise(async (resolve, reject)=>{
            if (!this.isOpen()) {
                throw new Error('Port not open');
            }
            const properCommand = command.replaceAll('\n','\r\n');

            const DataToSend = toSingleByteFormBody({
                "printCmd":properCommand,
                "outputMsg":"",
                "hiddenButton": 1
            });

            let response = await axios.request({
                method: 'post',
                url: `${this.URL}printercontrol.cgi`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: this.timeout,
                data : DataToSend,
            });
            if (response?.data?.includes("You need to relogin after server is reboot ready")) {
                await this._login();
            }
            const regex = /<input[\s\S]*?type="hidden"[\s\S]*?name="hiddenButton"[\s\S]*?value="([\s\S]*?)"[\s\S]*?>/i;
            const match = response?.data?.match(regex);
            if (match && match[1]) {
                console.log("A",match[1])
                this.EM.emit('data', match[1]);
                onDoneCallback(match[1]);
            } else {
                console.log("B");
                onDoneCallback("");
                this.EM.emit('data', "");
            }
        });
    }

    write(command, onDoneCallback){
        return new Promise(async (resolve, reject)=>{
            if (!this.isOpen()) {
                throw new Error('Port not open');
            }
            const commandToSend = command.replaceAll('\r\n','\n').replaceAll('\n','\r\n');
            const DataToSend = toSingleByteFormBody({
                "printCmd":commandToSend,
                "outputMsg":"",
                "hiddenButton": 1
            });

            let parts = [];
            console.log("Doing command", commandToSend.length, commandToSend);
            if (command.length<=230){
                parts.push(commandToSend);
            } else {
                parts = this.splitCommandToSize(commandToSend, 230);
            }

            let allResult = "";
            console.log("splitCommandToSize", parts.length,commandToSend.length)
            for (let i=0; i<parts.length; i++){
                let result = await this.writePart(parts[i]);
                allResult += result;
            }
            console.log("command data", allResult);
            this.EM.emit('data', allResult);
            onDoneCallback(allResult);

        });
    }

    writePart(command){
        return new Promise(async (resolve, reject)=>{
            if (!this.isOpen()) {
                throw new Error('Port not open');
            }
            const DataToSend = toSingleByteFormBody({
                "printCmd": command,
                 "outputMsg":"",
                "hiddenButton": 1
        });
            try {
                let response = await axios.request({
                    method: 'post',
                    url: `${this.URL}printercontrol.cgi`,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    timeout: this.timeout,
                    data: DataToSend
                });
                if (response?.data?.includes("You need to relogin after server is reboot ready")) {
                    await this._login();
                    return this.writePart(command);
                }
                const regex = /<input[\s\S]*?type="hidden"[\s\S]*?name="hiddenButton"[\s\S]*?value="([\s\S]*?)"[\s\S]*?>/i;
                const match = response?.data?.match(regex);
                if (match && match[1]) {
                    resolve(match[1]);
                } else {
                    resolve("");
                }
            } catch (e){
                this.EM.emit('error', e)
                reject(e);
            }
        });
    }

}
