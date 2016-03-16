/**
* Copyright (c) 2015 NAVER Corp.
* egjs projects are licensed under the MIT license
*/

function noop() {};

module("persist: mock", {
	setup: function() {
		this.data = {
			"scrollTop": 100
		};

		this.fakeDocument = {
			title: ""
		};
		this.fakeWindow = {
			location: {
				href: ""
			},
			history: new History(),
			JSON: JSON,
			performance: {
				navigation: {
					TYPE_BACK_FORWARD: 2,
					TYPE_NAVIGATE: 0,
					TYPE_RELOAD: 1,
					TYPE_RESERVED: 255,
					type: 0
				}
			},
			navigator: {},
			sessionStorage: {
				getItem: function(key) {
					return this.storage[key];
				},
				setItem: function(key, val) {
					this.storage[key] = val;
				},
				removeItem: function(key) {
					this.storage[key] = undefined;
				}
			}
		};
		this.fakeEvent = {};
		this.storage = {};
		
		/*
		 *	 Mock History Object
		*/
		function History() {
			this.state = null;
		}

		History.prototype.replaceState = function(state) {
			this.state = state;
		};	
		
		this.method = eg.invoke("persist",[null, eg, this.fakeWindow, this.fakeDocument]);
		this.GLOBALKEY = this.method.GLOBALKEY;
	},
	teardown: function() {
		"replaceState" in this.fakeWindow.history && this.fakeWindow.history.replaceState(null, "", "");
	}
});

test("reset", function() {
	// When
	this.method.reset();

	// Then
	equal(this.fakeWindow.history.state, null);
});

test("persist : save state data, get state data", function() {
	// When
	var state = this.method.persist();
	
	// Then
	equal(state, null);

	// When
	var clonedState = this.method.persist(this.data);
	// Then
	notEqual(clonedState, this.data);
	deepEqual(clonedState, this.data);
});

test("persist : save state data by key, get state data by key", function() {
	// When
	var state = this.method.persist("TESTKEY");

	// Then
	equal(state, null);

	// When
	var clonedState = this.method.persist("TESTKEY", this.data);

	// Then
	notEqual(clonedState, this.data);
	deepEqual(clonedState, this.data);
});

test("onPageshow : when bfCache miss and not BF navigated, _reset method must be executed.", function() {
	// Given
	var ht = {};
	ht[this.GLOBALKEY] = this.data;
	this.fakeWindow.performance.navigation.type = 2;	// navigation
	var method = eg.invoke("persist",[null, eg, this.fakeWindow, this.fakeDocument]);
	method.persist(this.data)
	deepEqual(method.persist(), this.data);
	
	// When
	$(this.fakeWindow).trigger({
		type: "pageshow",
		originalEvent: {
			persisted: false
		}
	});

	// Then
	deepEqual(method.persist(), this.data);

	// When
	this.fakeWindow.performance.navigation.type = 0;	// enter url...
	this.fakeWindow.history.state = JSON.stringify(ht);
	var method = eg.invoke("persist",[null, eg, this.fakeWindow, this.fakeDocument]);

	// Then
	equal(method.persist(), null);	// must reset

	// When
	$(this.fakeWindow).trigger({
		type: "pageshow",
		originalEvent: {
			persisted: false
		}
	});

	// Then
	equal(method.persist(), null);

	// When
	this.fakeWindow.performance.navigation.type = 1;
	this.fakeWindow.history.state = JSON.stringify(ht);
	var method = eg.invoke("persist",[null, eg, this.fakeWindow, this.fakeDocument]);

	// Then
	equal(method.persist(), null);

	// When
	$(this.fakeWindow).trigger({
		type: "pageshow",
		originalEvent: {
			persisted: false
		}
	});

	// Then
	equal(method.persist(), null);

});

test("getState, setState: getter, setter of state", function() {
	// When
	this.method.setState(this.data);
	var clonedData = this.method.getState();

	// Then
	deepEqual(clonedData, this.data);
});


test("onPageshow : when bfCache miss and BF navigated, persist event must be triggered.", function(assert) {
	// Given
	this.fakeWindow.performance = {};
	this.fakeWindow.performance.navigation = {
		TYPE_BACK_FORWARD: 2,
		TYPE_NAVIGATE: 0,
		TYPE_RELOAD: 1,
		TYPE_RESERVED: 255
	};
	this.fakeWindow.performance.navigation.type = 2;
	var method = eg.invoke("persist",[null, eg, this.fakeWindow, this.fakeDocument]);

	var restoredState = null;
	$(this.fakeWindow).on("persist", function(e) {
		restoredState = e.state;
	});
	var clonedData = method.persist(this.data);

	// When
	$(this.fakeWindow).trigger({
		type: "pageshow",
		originalEvent: {
			persisted: false
		}
	});

	// Then
	deepEqual(restoredState, clonedData);
});
 
test("Test not throwing error for legacy browsers", function() {
	// Given
	this.fakeWindow.history = {};
	delete this.fakeWindow.sessionStorage;

	// When
	var method = eg.invoke("persist",[null, eg, this.fakeWindow, this.fakeDocument]);

	// Then
	ok(!method, "If browser don't have history.state neither web storage, persist shouldn't be defined.");
});

test("Test for browsers which don't have JSON object", function() {
	// Given
	this.fakeWindow.JSON = undefined;
	console.oldWarn = console.warn;
	var callCount=0;
	console.warn = function(msg){
		callCount++;
	}

	// When
	var method = eg.invoke("persist",[null, eg, this.fakeWindow, this.fakeDocument]);

	// Then
	ok(!method, "If browser don't have JSON object, persist shouldn't be defined.");
	equal(callCount, 1);

	console.warn = console.oldWarn;
});

module("persist: native", {
	setup: function() {
		this.data = {
			"scrollTop": 100
		};
		this.method = eg.invoke("persist",[null, eg, window, document]);
		this.GLOBALKEY = this.method.GLOBALKEY;
	},
	teardown: function() {
		"replaceState" in window.history && window.history.replaceState(null, "", "");
	}
});

test("reset", function() {
	// When
	this.method.reset();

	// Then
	equal($.persist(), null);
});

test("persist : save state data, get state data", function() {
	// When
	var state = this.method.persist();
	
	// Then
	equal(state, null);

	// When
	var clonedState = this.method.persist(this.data);
	
	// Then
	notEqual(clonedState, this.data);
	deepEqual(clonedState, this.data);
});

test("persist : save state data by key, get state data by key", function() {
	// When
	var state = this.method.persist("TESTKEY");

	// Then
	equal(state, null);

	// When
	var clonedState = this.method.persist("TESTKEY", this.data);

	// Then
	notEqual(clonedState, this.data);
	deepEqual(clonedState, this.data);
});

$.each(['{', '[ 1,2,3 ]', '1', '1.234', '"123"'], function(i, v) {
	test("show warning message for storage polloution with value that can be parsed: "+ v, function() {	
		// Given		
		console.oldWarn = console.warn;
		var callCount = 0;
		console.warn = function(msg){
			callCount++;
		};
		var clonedState = this.method.persist(this.data);
		
		var isSupportState = "replaceState" in history && "state" in history;	
		var isSupportStorage = "sessionStorage" in window || "localStorage" in window;	

		var isNoExceptionThrown = true;
		if(isSupportStorage) {
			sessionStorage.setItem("KEY___persist___", v);
			localStorage.setItem("KEY___persist___", v);
		} else if(isSupportState) {
			history.replaceState(v, document.title, location.href);	
		}
	
		// When	
		try {
			this.method.persist();
		} catch (e) {
			isNoExceptionThrown = false;
		}
	
		// Then	
		equal(callCount, (isSupportStorage || isSupportState) ? 1 : 0);
		ok(isNoExceptionThrown)
	
		console.warn = console.oldWarn;
	});
});

test("getState, setState: getter, setter of state", function() {
	// When
	this.method.setState(this.data);
	var clonedData = this.method.getState();

	// Then
	deepEqual(clonedData, this.data);
});

test("Test not throwing error for legacy browsers", function() {
	// Given
	var isPersistAvailable = ("replaceState" in history && "state" in history) ||
	"sessionStorage" in window || "localStorage" in window;	

	// When
	var persist = eg.invoke("persist",[null, eg, window, document]);
	
	// Then
	ok(isPersistAvailable ? persist : !persist, 
		"If browser don't have history.state neither web storage, persist shouldn't be defined.");
});

test("Test for browsers which don't have JSON object", function() {
	// Given
	var isSupportJSON = "JSON" in window;
	console.oldWarn = console.warn;
	var callCount=0;
	console.warn = function(msg){
		callCount++;
	}

	// When
	var persist = eg.invoke("persist",[null, eg, window, document]);

	// Then
	ok(isSupportJSON ? persist : !persist, "If browser don't have JSON object, persist shouldn't be defined.");
	equal(callCount, isSupportJSON ? 0 : 1);

	console.warn = console.oldWarn;
});

var ua = [

	{
		"device":  "Android 4.3.0",
		"ua": "Mozilla/5.0 (Linux; Android 4.3.0; SM-G900S Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.108 Mobile Safari/537.36",
		"isNeeded": false
	},
	{
		"device":  "Android 5.1.1",
		"ua": "Mozilla/5.0 (Linux; Android 5.1.1; SAMSUNG SM-G925S Build/LMY47X) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/3.2 Chrome/38.0.2125.102 Mobile Safari/537.36",
		"isNeeded": true
	},
	{
		"device":  "iOS 8.0",
		"ua": "Mozilla/5.0 (iPhone; CPU iPhone OS 8_0 like Mac OS X) AppleWebKit/600.1.4 (KHTML, like Gecko) Mobile/12B440",
		"isNeeded": false
	}
];

module("extend Agent Test", {
	setup : function() {
		this.fakeWindow = {
			location: {
				href: ""
			},
			history: window.history,
			JSON: JSON,
			performance : {
					navigation : {
						TYPE_BACK_FORWARD: 2,
						TYPE_NAVIGATE: 0,
						TYPE_RELOAD: 1,
						TYPE_RESERVED: 255,
						type : 0
					}
			},
			sessionStorage: {
				getItem: function(key) {
					return this.storage[key];
				},
				setItem: function(key, val) {
					this.storage[key] = val;
				},
				removeItem: function(key) {
					this.storage[key] = undefined;
				}
			},
			navigator: {}
		};
		this.agent = eg.agent;
	},
	teardown : function() {
		eg.agent = this.agent;
	}
});

$.each(ua, function(i, v) {
	test("$.persist.isNeeded : "+ v.device, function() {
		// Given
		this.fakeWindow.navigator.userAgent = v.ua;
		eg.invoke("eg",[null, null, this.fakeWindow]);
		this.isNeeded = eg.invoke("persist").isNeeded;
		var isNeeded;
		// When
		isNeeded = this.isNeeded();
		//Then
		equal(isNeeded, v.isNeeded);
	});
});