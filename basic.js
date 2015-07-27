var image_default = '/home/pi/losp/keep_walking.jpg';
var file1 = '/home/pi/losp/ZinovieffBirthdaySong.mp3';
var image1 = '/home/pi/losp/LichenOhmsSeriatim3-sml.png';
var file2 = '/home/pi/losp/Simpleloop.wav';
var image2 = '/home/pi/losp/nodejs.png';
var rangeLimit = 2;
var timeLimit = 120;

var UriBeaconScanner = require('uri-beacon-scanner');
var childProcess = require('child_process');

function calc_range(rssi, tx_power) {
    var diff_db = tx_power - rssi;
    var ratio_linear = Math.pow(10, diff_db / 10);
    var r = Math.sqrt(ratio_linear);
    console.log('Range: ' +Math.round(r))
    return Math.round(r);
}

var station = function(audio, image) {
    console.log('station creation');
    this.lastPlayed = 0;
    this.showImage = true;
    this.audio = audio;
    this.image = image;
};

station.prototype.playTest = function(txPower, rssi) {
    now = Math.floor(new Date()/1000);
    if (calc_range(rssi, txPower) < rangeLimit && now - this.lastPlayed > timeLimit) {
        console.log('Reset last played');
        this.lastPlayed = now;
        this.showImage = true;
        return true;
    } else {
        console.log('Keep last played');
        this.showImage = false;
        return false;
    }
}

station.prototype.show = function() {
    if (this.showImage) {
        this.picture = childProcess.exec('sudo fbi -T 2 -d /dev/fb1 -noverbose -a ' +this.image, function(error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: '+error.code);
                console.log('Signal received: '+error.signal);
            }
            console.log('Child Process STDOUT: '+stdout);
            console.log('Child Process STDERR: '+stderr);
        });

        this.picture.on('exit', function(code) {
            console.log('Show exit code '+code);
            // UriBeaconScanner.startScanning();
        });
    };
};

station.prototype.play = function(txPower, rssi) {
    if (this.playTest(txPower, rssi)) {
        UriBeaconScanner.stopScanning();
        console.log('Play tune...');
        this.sound = childProcess.exec('omxplayer ' +this.audio, function(error, stdout, stderr) {
            if (error) {
                console.log(error.stack);
                console.log('Error code: '+error.code);
                console.log('Signal received: '+error.signal);
            }
            console.log('Child Process STDOUT: '+stdout);
            console.log('Child Process STDERR: '+stderr);
        });

        this.sound.on('exit', function(code) {
            console.log('Child process exited with exit code '+code);
            console.log('Tune has finished');
            UriBeaconScanner.startScanning(true);
        });
    };
};

number1 = new station(file1, image1);
number2 = new station(file2, image2);


UriBeaconScanner.on('discover', function(uriBeacon) {
    console.log();
    console.log('discovered UriBeacon:');
    console.log('  uri      = ' + uriBeacon.uri);
    console.log('  flags    = ' + uriBeacon.flags);
    console.log('  TX power = ' + uriBeacon.txPower);
    console.log('  RSSI     = ' + uriBeacon.rssi);
    if(new RegExp('1972').test(uriBeacon.uri)) {
        number1.play(uriBeacon.txPower, uriBeacon.rssi);
        number1.show();
    } else if(new RegExp('1966').test(uriBeacon.uri)) {
        number2.play(uriBeacon.txPower, uriBeacon.rssi);
        number2.show();
    }
});

UriBeaconScanner.startScanning(true);
