
var util = (function() {
	
	return {
		parseJSON: function(str) {
			try {
				return JSON.parse(str) || {};
			} catch(e) {}
			
			return {};
		}
	};
})();

var proxy = (function() {
	var proxyConfig = util.parseJSON(localStorage.proxyConfig);
	var proxies = {};
	var list;
	
	if (!$.isArray(proxyConfig.list)) {
		list = proxyConfig.list = [];
	}
	
	if (localStorage.init) {
		list.push({
			name: 'whistle',
			host: '127.0.0.1',
			port: 8899
		}, {
			name: 'aeproxy',
			host: '127.0.0.1',
			port: 9527
		});
		localStorage.init = true;
		store();
	}
	
	list = proxyConfig.list = proxyConfig.list.filter(function(item) {
		if (!item || !item.name) {
			return false;
		}
		proxies[item.name] = item;
		return true;
	});
	
	function store() {
		localStorage.proxyConfig = JSON.stringify(proxyConfig);
	}
	
	function cleartSelection() {
		proxyConfig.system = false;
		proxyConfig.direct = false;
		list.forEach(function(item) {
			item.active = false;
		});
	}
	
	function active(host, port, callback) {
		var config = {
	            scheme: 'http',
	            host: host || '127.0.0.1',
	            port: port || 8899
	        };

		chrome.proxy.settings.set({value: {
		    mode: 'fixed_servers',
		    rules: {
		        proxyForHttp: config,
		        proxyForHttps: config
		    }
		}}, callback);

	}
	
	return {
		setDirect: function(callback) {
			chrome.proxy.settings.set({value: {mode: 'direct'}}, callback);
			cleartSelection();
			proxyConfig.direct = false;
			store();
		},
		setSystem: function(callback) {
			chrome.proxy.settings.set({value: {mode: 'system'}}, callback);
			cleartSelection();
			proxyConfig.system = true;
			store();
		},
		removeProxy: function(name) {
			var item = proxies[name];
			if (!item) {
				return;
			}
			
			list.splice(list.indexOf(item), 1);
			store();
		},
		setProxy: function(name, host, port) {
			if (!name) {
				return;
			}
			
			var item = proxies[name];
			if (item) {
				item.host = host;
				item.port = port;
			} else {
				item = {
						name: name,
						host: host,
						port: port
				};
				list.push(item);
			}
			store();
		},
		enableProxy: function(name) {
			var item = proxies[name];
			if (item) {
				cleartSelection();
				item.active = true;
				active(item.host, item.port);
				store();
			}
		},
		getProxy: function(name) {
			
			return proxies[name];
		},
		getProxyConfig: function() {
			
			return proxyConfig; //只是内部使用，不用副本
		}
	};
})();

function openWhistlePage(name) {
	openWindow(getWhistlePageUrl(name), true);
}

function getWhistlePageUrl(name) {
	return 'http://local.whistlejs.com/#' + name;
}

function openOptions() {
    openWindow(chrome.extension.getURL('options.html'));
}

function openAbout() {
	openWindow(chrome.extension.getURL('about.html'));
}

function openWindow(url, pinned) {
	chrome.tabs.getAllInWindow(null, function (tabs) {
        for (var i = 0, len = tabs.length; i < len; i++) {
        	var tab = tabs[i];
            if (getUrl(tab.url) == getUrl(url)) {
            	var options = {selected: true};
            	if (tab.url != url) {
            		options.url = url;
            	}
                chrome.tabs.update(tab.id, options);
                return;
            }
        }
        
        chrome.tabs.query({active: true}, function(tabs){
		    var tab = tabs[0];
		    chrome.tabs.create({
			    index: tab ? tab.index + 1 : 100,
			    url: url,
			    active: true,
			    pinned: !!pinned
			});
		});
    });
}

function getUrl(url) {
	
	return url && url.replace(/#.*$/, '');
}

function init() {
	setProxy();
}

init();
