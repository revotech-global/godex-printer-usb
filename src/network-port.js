import * as usb from 'usb';
import * as url from 'node:url';
import * as axios from 'axios';
import EventEmitter from 'events';


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
      let response = await axios.request({
           method: 'post',
           url: `${this.URL}login.cgi`,
           headers: {
               'Content-Type': 'application/x-www-form-urlencoded',
           },
           data : DataToSend
       });
      console.log(response);
    }

    write(command, onDoneCallback){
        return new Promise(async (resolve, reject)=>{
            if (!this.isOpen()) {
                throw new Error('Port not open');
            }

            const DataToSend = (new url.URLSearchParams({
                "printCmd":command.replaceAll('\n','\r\n'),
                "outputMsg":"",
                "hiddenButton": 1
            })).toString();

            let response = await axios.request({
                method: 'post',
                url: `${this.URL}printercontrol.cgi`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                data : DataToSend
            });
            if (response?.data?.includes("You need to relogin after server is reboot ready")) {
                await this._login();
            }
            const regex = /<input[\s\S]*?type="hidden"[\s\S]*?name="hiddenButton"[\s\S]*?value="([\s\S]*?)"[\s\S]*?>/i;
            const match = response?.data?.match(regex);
            if (match && match[1]) {
                this.EM.emit('data', match[1]);
                onDoneCallback(match[1]);
            } else {
                onDoneCallback("");
                this.EM.emit('data', "");
            }
        });
    }

}
