(function() {
	
	module('module tests');


	test('simple module', function() {

		ok(!window.one, '!window.testModule')

		rebind.module('one');
		ok(window.oneModule, 'window.oneModule')

		delete window.oneModule;
	});

	test('namespace module', function() {

		ok(!window.one, '!window.one.twoModule');

		rebind.module('one.two');
		ok(window.one.twoModule, 'window.one.twoModule');

		delete window.one.twoModule;
		delete window.one;
	});

	test('existing namespace module', function() {

		ok(!window.one, '!window.one.twoModule')

		window.one = {};
		ok(window.one, 'window.one');

		rebind.module('one.two');
		ok(window.one.twoModule, 'window.one.twoModule');

		delete window.one.twoModule;
		delete window.one;
	});

})();
