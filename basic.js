// CONSTANTS
var image_default = '/home/pi/losp/move.png';
var splash = '/home/pi/losp/welcome.png';
var dockImg = '/home/pi/losp/reset.png';
var image10 = '/home/pi/losp/image10.png';
var image11 = '/home/pi/losp/image11.png';
var image20 = '/home/pi/losp/image20.png';
var image21 = '/home/pi/losp/image21.png';
var image30 = '/home/pi/losp/image30.png';
var image31 = '/home/pi/losp/image31.png';
var image40 = '/home/pi/losp/image40.png';
var image41 = '/home/pi/losp/image41.png';
var image50 = '/home/pi/losp/image50.png';
var image51 = '/home/pi/losp/image51.png';
var image60 = '/home/pi/losp/image60.png';
var image61 = '/home/pi/losp/image61.png';
var image70 = '/home/pi/losp/image70.png';
var image71 = '/home/pi/losp/image71.png';
var image80 = '/home/pi/losp/image80.png';
var image81 = '/home/pi/losp/image81.png';
var image90 = '/home/pi/losp/image90.png';
var image91 = '/home/pi/losp/image91.png';
var audio10 = '/home/pi/losp/audio10.wav';
var audio11 = '/home/pi/losp/audio11.wav';
var audio20 = '/home/pi/losp/audio20.wav';
var audio21 = '/home/pi/losp/audio21.wav';
var audio30 = '/home/pi/losp/audio30.wav';
var audio31 = '/home/pi/losp/audio31.wav';
var audio40 = '/home/pi/losp/audio40.wav';
var audio41 = '/home/pi/losp/audio41.wav';
var audio50 = '/home/pi/losp/audio50.wav';
var audio51 = '/home/pi/losp/audio51.wav';
var audio60 = '/home/pi/losp/audio60.wav';
var audio61 = '/home/pi/losp/audio61.wav';
var audio70 = '/home/pi/losp/audio70.wav';
var audio71 = '/home/pi/losp/audio71.wav';
var audio80 = '/home/pi/losp/audio80.wav';
var audio81 = '/home/pi/losp/audio81.wav';
var audio90 = '/home/pi/losp/audio90.wav';
var audio91 = '/home/pi/losp/audio91.wav';

var rangeLimit = 3;
var playMax = 2;
var lastPlayed = '';
var checking = false;
var docked = false;
var timeLimit = 0;
var timer;

// Load beacon scanner package
var UriBeaconScanner = require('uri-beacon-scanner');
// load package to run child process
var childProcess = require('child_process');



startTimer = function() {
    timer = setTimeout(function() {
        docked = false;
        imgDisplay(splash);
    }, 5000);
};

resetTimer = function() {
    clearTimeout(timer);
    startTimer();
};

function imgDisplay(img) {
    picture = childProcess.exec('sudo fbi -T 2 -d /dev/fb1 -noverbose -a '
                                            + img, function(error, stdout, stderr) {
        if (error) {
            console.log(error.stack);
            console.log('Error code: '+error.code);
            console.log('Signal received: '+error.signal);
        }
        console.log('Child Process STDOUT: '+stdout);
        console.log('Child Process STDERR: '+stderr);
    });
    picture.on('exit', function(code) {
        console.log('Show exit code '+code);
        // UriBeaconScanner.startScanning();
    });
};

function reset(img) {
    if(!docked) {
        imgDisplay(img);
    };
    docked = true;
    lastPlayed = '';
    resetTimer();
    number1.startOver();
    number2.startOver();
    number3.startOver();
    number4.startOver();
    number5.startOver();
    number6.startOver();
    number7.startOver();
    number8.startOver();
    number9.startOver();
};

// Ranging function
function calc_range(rssi, tx_power) {
    var diff_db = tx_power - rssi;
    var ratio_linear = Math.pow(10, diff_db / 10);
    var r = Math.sqrt(ratio_linear);
    console.log('Range: ' +Math.round(r))
    return Math.round(r);
}

// Ranging function for Blesh beacons
function calc_range_alt(rssi, tx_power) {
    // Alternative calculation to test, likely very similar answer!
    // rssi1m needs to be found with testing
    // Based on; http://matts-soup.blogspot.co.uk/2013/12/finding-distance-from-rssi.html
    var rssi1m = -40;
    var pathLoss = 5.2; // free space
    if (rssi > 0) { rssi = 0 };
    var rawRange = Math.pow(10, (rssi - (tx_power + rssi1m)) / (-10*pathLoss));
    console.log('rangeAlt = ' +  Math.round(rawRange));
    return Math.round(rawRange);
}

// Step up 'listen' station
var station = function(name, audio1, image1, audio2, image2) {
    console.log('station creation');
    this.playCount = 0;
    this.lastPlayed  = 0;
    this.showImage = true;
    this.beacon = name;
    this.audio1 = audio1;
    this.image1 = image1;
    this.audio2 = audio2;
    this.image2 = image2;
    this.audio = this.audio1;
    this.image = this.image1;
};

// Test for if station is in range and hasn't just been played
station.prototype.playTest = function(txPower, rssi) {
    now = Math.floor(new Date()/1000);
    if (calc_range_alt(rssi, txPower) < rangeLimit
                && this.playCount < playMax
                && this.beacon != lastPlayed
                && now - this.lastPlayed > timeLimit) {
        if (this.playCount == 0) {
            console.log('Play beacon ' + this.beacon + ' ' + this.playCount)
            this.playCount = 1;
            this.image = this.image1;
            this.audio = this.audio1;
            lastPlayed = this.beacon;
        } else {
            console.log('Play beacon ' + this.beacon + ' ' + this.playCount)
            this.playCount = 2;
            this.image = this.image2;
            this.audio = this.audio2;
            lastPlayed = this.beacon;
        }
        this.lastPlayed = now;
        this.showImage = true;
        return true;
    } else {
        console.log('This beacon: ' + this.beacon + ' last played: ' + lastPlayed);
        console.log('playCount: ' + this.playCount)
        this.showImage = false;
        return false;
    }
}

// Show the image for this station
station.prototype.show = function() {
    if (this.showImage) {
        this.picture = childProcess.exec('sudo fbi -T 2 -d /dev/fb1 -noverbose -a '
                                            + this.image, function(error, stdout, stderr) {
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

// Play the audio for this station
station.prototype.play = function(txPower, rssi) {
    if (this.playTest(txPower, rssi)) {
        UriBeaconScanner.stopScanning();
        console.log('Play tune...');
        this.sound = childProcess.exec('aplay ' +this.audio, function(error, stdout, stderr) {
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
            walking.show();
            UriBeaconScanner.startScanning(true);
        });
    };
};

station.prototype.startOver = function() {
    this.playCount = 0;
    this.lastPlayed  = 0;
    this.showImage = true;
};

// Create instances of the stations
walking = new station('walking', '', image_default, '', '');
number1 = new station('number1', audio10, image10, audio11, image11);
number2 = new station('number2', audio20, image20, audio21, image21);
number3 = new station('number3', audio30, image30, audio31, image31);
number4 = new station('number4', audio40, image40, audio41, image41);
number5 = new station('number5', audio50, image50, audio51, image51);
number6 = new station('number6', audio60, image60, audio61, image61);
number7 = new station('number7', audio70, image70, audio71, image71);
number8 = new station('number8', audio80, image80, audio81, image81);
number9 = new station('number9', audio90, image90, audio91, image91);

// Event handler for when beacon is discovered
UriBeaconScanner.on('discover', function(uriBeacon) {
    if (!checking && !docked) {
        checking = true;
        console.log();
        console.log('discovered UriBeacon:');
        console.log('  uri      = ' + uriBeacon.uri);
        console.log('  flags    = ' + uriBeacon.flags);
        console.log('  TX power = ' + uriBeacon.txPower);
        console.log('  RSSI     = ' + uriBeacon.rssi);
        if(uriBeacon.uri.search('number1') > 0) {
            number1.play(uriBeacon.txPower, uriBeacon.rssi);
            number1.show();
        } else if(uriBeacon.uri.search('number2') > 0) {
            number2.play(uriBeacon.txPower, uriBeacon.rssi);
            number2.show();
        } else if(uriBeacon.uri.search('number3') > 0) {
            number3.play(uriBeacon.txPower, uriBeacon.rssi);
            number3.show();
        } else if(uriBeacon.uri.search('number4') > 0) {
            number4.play(uriBeacon.txPower, uriBeacon.rssi);
            number4.show();
        } else if(uriBeacon.uri.search('number5') > 0) {
            number5.play(uriBeacon.txPower, uriBeacon.rssi);
            number5.show();
        } else if(uriBeacon.uri.search('number6') > 0) {
            number6.play(uriBeacon.txPower, uriBeacon.rssi);
            number6.show();
        } else if(uriBeacon.uri.search('number7') > 0) {
            number7.play(uriBeacon.txPower, uriBeacon.rssi);
            number7.show();
        } else if(uriBeacon.uri.search('number8') > 0) {
            number8.play(uriBeacon.txPower, uriBeacon.rssi);
            number8.show();
        } else if(uriBeacon.uri.search('number9') > 0) {
            number9.play(uriBeacon.txPower, uriBeacon.rssi);
            number9.show();
        }
        checking = false;
    }
    if(uriBeacon.uri.search('1972') > 0) {
        if(calc_range(uriBeacon.rssi, uriBeacon.txPower) < 3 ) {
            reset(dockImg)
        }

    }
});

imgDisplay(splash);
resetTimer();
// Start scanning for beacons (duplicates allowed)
UriBeaconScanner.startScanning(true);
