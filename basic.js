// CONSTANTS
var image_default = '/home/pi/losp/keep_walking.jpg';
var file1 = '/home/pi/losp/ZinovieffBirthdaySong.mp3';
var image1 = '/home/pi/losp/LichenOhmsSeriatim3-sml.png';
var file2 = '/home/pi/losp/Simpleloop.wav';
var image2 = '/home/pi/losp/nodejs.png';
var file3 = '/home/pi/losp/blimp_zones.wav';
var image3 = '/home/pi/losp/festival.jpg';
var file4 = '/home/pi/losp/tron_bike.wav';
var image4 = '/home/pi/losp/post-its.jpg';
var rangeLimit = 3;
var timeLimit = 120;

// Load beacon scanner package
var UriBeaconScanner = require('uri-beacon-scanner');
// load package to run child process
var childProcess = require('child_process');


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
    console.log('rangeAlt = ' + rawRange)
    return Math.round(rawRange);
}

// Step up 'listen' station
var station = function(audio, image) {
    console.log('station creation');
    this.lastPlayed = 0;
    this.showImage = true;
    this.audio = audio;
    this.image = image;
};

// Test for if station is in range and hasn't just been played
station.prototype.playTest = function(txPower, rssi) {
    now = Math.floor(new Date()/1000);
    if (calc_range_alt(rssi, txPower) < rangeLimit && now - this.lastPlayed > timeLimit) {
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

// Show the image for this station
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

// Play the audio for this station
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
            walking.show();
            UriBeaconScanner.startScanning(true);
        });
    };
};

// Create instances of the stations
walking = new station('', image_default);
number1 = new station(file1, image1);
number2 = new station(file2, image2);
number3 = new station(file3, image3);
number4 = new station(file4, image4);

// Event handler for when beacon is discovered
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
    } else if(new RegExp('2000').test(uriBeacon.uri)) {
        number3.play(uriBeacon.txPower, uriBeacon.rssi);
        number3.show();
    } else if(new RegExp('2007').test(uriBeacon.uri)) {
        number4.play(uriBeacon.txPower, uriBeacon.rssi);
        number4.show();
    }
});

// Start scanning for beacons (duplicates allowed)
UriBeaconScanner.startScanning(true);
