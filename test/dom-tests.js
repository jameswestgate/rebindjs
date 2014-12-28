(function(){

	module('dom tests');

	test('simple dom update', function() {
		
		var template = '<div id="template"><ul><li>{{name}}</li></ul></div>',
			modelA = {name: 'one'},
			modelB = {name: 'two'};

		//Take template and add as-is to the dom
		var fixture = $('#qunit-fixture');
		fixture.html(template);

		//Reset because qunit-fixture is always the same id
		rebind.reset();
		
		var vm = rebind.create('template');
		vm.render(modelA);

		var element1 = fixture.find('li')[0];
		vm.merge(modelB);

		var element2 = fixture.find('li')[0];

		ok(fixture.find("li:contains('two')").length, 'Results found.');
		ok(element1 === element2, 'Element references match.')
	});

	test('dom lookup test', function() {
		
		var template = '<div id="template"><ul><li>{{name}}</li></ul></div>',
			modelA = {name: 'one'},
			modelB = {name: 'two'};

		//Take template and add as-is to the dom
		var fixture = $('#qunit-fixture');
		fixture.html(template);

		//Reset because qunit-fixture is always the same id
		rebind.reset();

		var vm = rebind.create('template');
		vm.render(modelA);

		var element1 = fixture.find('li')[0];
		vm.merge(modelB);

		var element2 = fixture.find('li')[0];

		ok(fixture.find("li:contains('two')").length, 'Results found.');
		ok(element1 === element2, 'Element references match.')
	});

	test('model modify dom update', function() {
		
		var template = '<div id="template"><ul><li>{{name}}</li></ul></div>',
			model = {name: 'one'};

		//Take template and add as-is to the dom
		var fixture = $('#qunit-fixture');
		fixture.html(template);

		rebind.reset();

		var vm = rebind.create('template');
		vm.render(model);

		model.name = 'two';
		vm.merge(model);

		ok(fixture.find("li:contains('two')").length, fixture.html());
	});

	test('model manual dom update', function() {
		
		var template = '<div id="template"><ul><li>{{name}}</li></ul></div>',
			model = {name: 'one'};

		//Take template and add as-is to the dom
		var fixture = $('#qunit-fixture');
		fixture.html(template);

		rebind.reset();
		
		var vm = rebind.create('template');
		vm.render(model);

		model.name = 'two';
		vm.merge(model);

		ok(fixture.find("li:contains('two')").length, fixture.html());
	});

	test('template node updates', function() {
		
		var template = '<div id="template" data-test="{{test}}"><ul><li>{{name}}</li></ul></div>',
			model = {name: 'one',test:'ok'};

		//Take template and add as-is to the dom
		var fixture = $('#qunit-fixture');
		fixture.html(template);

		rebind.reset();
		
		var vm = rebind.create('template');
		vm.render(model);

		ok(fixture.find("#template[data-test='ok']").length === 1, fixture.html());
		ok(fixture.find("li:contains('one')").length, fixture.html());

		model.name = 'two';
		model.test = "computer";

		vm.merge(model);

		ok(fixture.find("#template[data-test='computer']").length === 1, fixture.html());
		ok(fixture.find("li:contains('two')").length, fixture.html());
	});
	
})();