var UriBeaconScanner = require('uri-beacon-scanner');
var file1 = '/home/pi/losp/ZinovieffBirthdaySong.mp3';
var image1 = '/home/pi/losp/LichenOhmsSeriatim3-sml.png';
var file2 = '/home/pi/losp/Simpleloop.wav';
var image2 = '/home/pi/losp/nodejs.png';

var childProcess = require('child_process');

var station = function() {
   console.log('stuff');
};


station.prototype.show = function(file) {
   this.picture1 = childProcess.exec('sudo fbi -T 2 -d /dev/fb1 -noverbose -a ' +file, function(error, stdout, stderr) {
      if (error) {
         console.log(error.stack);
         console.log('Error code: '+error.code);
         console.log('Signal received: '+error.signal);
      }
      console.log('Child Process STDOUT: '+stdout);
      console.log('Child Process STDERR: '+stderr);
   });
   this.picture1.on('exit', function(code) {
      console.log('Show exit code '+code);
      // UriBeaconScanner.startScanning();
   });
};
station.prototype.play = function(file) {
   this.music1 = childProcess.exec('omxplayer ' +file, function(error, stdout, stderr) {
      if (error) {
         console.log(error.stack);
         console.log('Error code: '+error.code);
         console.log('Signal received: '+error.signal);
      }
      console.log('Child Process STDOUT: '+stdout);
      console.log('Child Process STDERR: '+stderr);
   });
   this.music1.on('exit', function(code) {
      console.log('Child process exited with exit code '+code);
      console.log('Tune has finished');
      UriBeaconScanner.startScanning();
   });
};

number1 = new station();

UriBeaconScanner.on('discover', function(uriBeacon) {
  console.log('discovered UriBeacon:');
  console.log('  uri      = ' + uriBeacon.uri);
  console.log('  flags    = ' + uriBeacon.flags);
  console.log('  TX power = ' + uriBeacon.txPower);
  console.log('  RSSI     = ' + uriBeacon.rssi);
  console.log();
  if(new RegExp('1972').test(uriBeacon.uri)) {
	UriBeaconScanner.stopScanning();
	console.log('Play tune...');
	number1.play(file1);
        number1.show(image1);
  } else if(new RegExp('1966').test(uriBeacon.uri)) {
	UriBeaconScanner.stopScanning();
	console.log('Play tune...');
	number1.play(file2);
        number1.show(image2);
  }
});

UriBeaconScanner.startScanning();
