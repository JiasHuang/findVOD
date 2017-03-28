
var gateways = ['192.168.1.1', '192.168.0.1'];
var vod_path = '/vod/';
var vod_png = 'mic-icon.png';
var vod_lastIPNumMin = 2;
var vod_lastIPNumMax = 254;
var found = 0;
var fails = 0;
var start = false;

function log(msg) {
    var text = $('#log').html();
    text += '<p>'+msg+'</p>';
    $('#log').html(text);
}

function addLink(link) {
    var text = $('#log').html();
    text += '<h1><a href="'+link+'" target="_blank">'+link+'</a></h1>';
    $('#log').html(text);
}

function updateProgress() {
    var percent = Math.floor((fails + found) * 100 / (vod_lastIPNumMax - vod_lastIPNumMin + 1));
    $('#progress').html('Progress: '+percent.toString()+'%');
    if (percent == 100) {
        start = false;
        $('#start').removeClass('hl');
    }
}

function onImageError(element) {
    fails = fails + 1;
    updateProgress();
}

function onImageLoad(element) {
    var vod = element.src.match(/(.*)vod/);
    addLink(vod[0]);
    found = found + 1;
    $('#found').html('Found: '+found.toString());
    updateProgress();
}

function scanVOD(ip) {
    log('scanning '+ip+'/255.255.255.0');
    var ip_nums = ip.split('.');
    var prefix = ip_nums[0] + '.' + ip_nums[1] + '.' + ip_nums[2] + '.';
    var text = '';
    for (var i = vod_lastIPNumMin; i <= vod_lastIPNumMax; i++) {
        var link = prefix + i.toString() + vod_path + vod_png + '?' + new Date().getTime();
        text += '<img src="http://'+link+'" onload="onImageLoad(this)" onerror="onImageError(this)" \>';
    }
    $('#images').html(text);
}

function ping(ip, callback, timeout = 0) {

    console.log('ping : '+ip);

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

function onGatewayResult(ip, status) {
    if (status != 'timeout') {
        scanVOD(ip);
    }
}

function findGateway() {
    for (var i=0; i<gateways.length; i++) {
        new ping(gateways[i], onGatewayResult, 1500);
    }
}

function findVOD() {
    if (!start) {
        start = true;
        found = fails = 0;
        $('#log').html('');
        $('#start').addClass('hl');
        findGateway();
    }
}

