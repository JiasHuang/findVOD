
var gateways = ['192.168.1.1', '192.168.0.1'];
var gateways_errors = 0;
var scan_errors = 0;
var vod_path = '/vod/';
var vod_png = 'mic-icon.png';
var vod_lastIPNumMin = 2;
var vod_lastIPNumMax = 254;

function msg(s) {
    var text = $('#result').html();
    text += s;
    $('#result').html(text);
}

function ping(ip, callback) {

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
                console.log(e);
                _that.callback(_that.ip, 'error');
            }

        };
        this.start = new Date().getTime();
        this.img.src = 'http://' + ip;
        this.timer = setTimeout(function () {
            if (_that.inUse) {
                _that.inUse = false;
                _that.callback(_that.ip, 'timeout');
            }
        }, 1500);
    }
}

function redirect(ip) {
    var re = new RegExp(vod_png);
    var vod = ip.replace(re, '');
    localStorage.setItem('vod', vod);
    window.location = 'http://'+vod;
}

function onScanResult(ip, status) {
    if (status == 'load') {
        redirect(ip);
    } else {
        scan_errors = scan_errors + 1;
        if (scan_errors == (vod_lastIPNumMax - vod_lastIPNumMin + 1)) {
           msg('ERROR: No vod\n');
        }
    }
}

function scanVOD(ip) {
    ip_nums = ip.split('.');
    for (var i = vod_lastIPNumMin; i <= vod_lastIPNumMax; i++) {
        var addr = ip_nums[0] + '.' + ip_nums[1] + '.' + ip_nums[2] + '.' + i.toString();
        new ping(addr+vod_path+vod_png, onScanResult);
    }
}

function onGatewayResult(ip, status) {
    if (status != 'timeout') {
        scanVOD(ip);
    } else {
        gateways_errors = gateways_errors + 1;
        if (gateways_errors == gateways.length) {
            msg('ERROR: No gateway\n');
        }
    }
}

function findGateway() {
    for (var i=0; i<gateways.length; i++) {
        new ping(gateways[i], onGatewayResult);
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
