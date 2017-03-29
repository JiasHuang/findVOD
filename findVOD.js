
var vod_gateways = '192.168.1.1, 192.168.0.1';
var vod_path = '/vod/';
var vod_image = 'mic-icon.png';
var vod_lastIPNumMin = 2;
var vod_lastIPNumMax = 254;
var vod_auto = null;
var found = 0;
var fails = 0;
var start = false;
var redirect = false;

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function extractDIR(link, dir) {
    var re = new RegExp('(.*)'+escapeRegExp(dir));
    var match = link.match(re);
    if (match) {
        return match[0];
    }
    return null;
}

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
        if (!found) {
            log('Oops! Not Found');
        }
        start = false;
        $('#start').removeClass('hl');
    }
}

function onImageError(element) {
    fails = fails + 1;
    updateProgress();
}

function onImageLoad(element) {
    var vod = extractDIR(element.src, vod_path)
    if (redirect) {
        localStorage.setItem('vod', vod);
        window.location = vod;
        return;
    }
    addLink(vod);
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
        var link = prefix + i.toString() + vod_path + vod_image + '?' + new Date().getTime();
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
    var lists = vod_gateways.replace(/\s/g, '').split(',');
    for (var i=0; i<lists.length; i++) {
        new ping(lists[i], onGatewayResult, 1500);
    }
}

function findVOD() {
    if (!start) {
        save();
        start = true;
        found = fails = 0;
        $('#log').html('');
        $('#start').addClass('hl');
        findGateway();
    }
}

function save() {
    var lists = ['vod_gateways', 'vod_path', 'vod_image'];
    for (var i=0; i<lists.length; i++) {
        this[lists[i]] = document.getElementById(lists[i]).value;
        localStorage.setItem(lists[i], this[lists[i]]);
    }
 }

function onInit() {
    var lists = ['vod_gateways', 'vod_path', 'vod_image'];
    for (var i=0; i<lists.length; i++) {
        var x = localStorage.getItem(lists[i]);
        if (x && x.length > 0) {
            this[lists[i]] = x;
        }
    }
    for (var i=0; i<lists.length; i++) {
        document.getElementById(lists[i]).value = this[lists[i]];
    }
}

function onAuto() {
    onInit();
    redirect = true;
    if (vod_auto) {
        var link = vod_auto + vod_image + '?' + new Date().getTime();
        var text = '<img src="'+link+'" onload="onImageLoad(this)" onerror="findVOD()" \>';
        $('#images').html(text);
    } else {
        findVOD();
    }
}
