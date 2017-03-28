
var gateways = ['192.168.1.1', '192.168.0.1'];
var vod_path = '/vod/';
var vod_png = 'mic-icon.png';
var vod_lastIPNumMin = 2;
var vod_lastIPNumMax = 254;
var found = 0;
var fails = 0;

function log(msg) {
    var text = $('#result').html();
    text += '<p>'+msg+'</p>';
    $('#result').html(text);
}

function addLink(link) {
    var text = $('#result').html();
    text += '<h1><a href=\"http://'+link+'\">'+link+'</a></h1>\n';
    $('#result').html(text);
}

function ping(ip, callback, timeout = 0) {

    if (!this.inUse) {
        this.status = 'unchecked';
        this.inUse = true;
        this.callback = callback;
        this.ip = ip;
        var _that = this;
        this.img = new Image();
        this.img.onload = function () {
            _that.inUse = false;
            _that.callback(_that.ip, 'load');

        };
        this.img.onerror = function (e) {
            if (_that.inUse) {
                _that.inUse = false;
                _that.callback(_that.ip, 'error');
            }

        };
        this.start = new Date().getTime();
        this.img.src = 'http://' + ip + '?'+ new Date().getTime();
        if (timeout) {
            this.timer = setTimeout(function () {
                if (_that.inUse) {
                    _that.inUse = false;
                    _that.img.src = '';
                    _that.callback(_that.ip, 'timeout');
                }
            }, timeout);
        }
    }
}

function redirect(ip) {
    var re = new RegExp(vod_png);
    var vod = ip.replace(re, '');
    //localStorage.setItem('vod', vod);
    addLink(vod);
    found = found + 1;
}

function onScanResult(ip, status) {
    if (status == 'load') {
        redirect(ip);
    } else {
        fails = fails + 1;
        console.log([ip, status, fails.toString()].join(','));
        if (fails == (vod_lastIPNumMax - vod_lastIPNumMin + 1 - found)) {
            log('Found : '+found.toString());
        }
    }
}

function scanVOD(ip) {
    log('scanning '+ip+'/255.255.255.0');
    var ip_nums = ip.split('.');
    var prefix = ip_nums[0] + '.' + ip_nums[1] + '.' + ip_nums[2] + '.';
    for (var i = vod_lastIPNumMin; i <= vod_lastIPNumMax; i++) {
        new ping(prefix+i.toString()+vod_path+vod_png, onScanResult);
    }

}

function onGatewayResult(ip, status) {
    if (status != 'timeout') {
        scanVOD(ip);
    }
}

function findGateway() {
    for (var i=0; i<gateways.length; i++) {
        new ping(gateways[i], onGatewayResult, 1000);
    }
}

function checkVOD(ip, status) {
    if (status == 'load') {
        redirect(ip);
    } else {
        findGateway();
    }
}

function findVOD_main () {
    var vod = localStorage.getItem('vod');
    if (vod && vod.length > 0) {
        new ping(vod+vod_png, checkVOD);
    } else {
        findGateway();
    }
}
