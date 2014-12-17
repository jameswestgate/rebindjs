(function(){

	module('dom tests');

	test('simple dom update', function() {
		
		var template = '<ul><li>{{name}}</li></ul>',
			modelA = {name: 'one'},
			modelB = {name: 'two'};

		//Take template and add as-is to the dom
		var fixture = document.getElementById('qunit-fixture');

		$(fixture).html(template);

		//Reset because qunit-fixture is always the same id
		rebind.reset();
		
		var vm = rebind.create(fixture);
		vm.render(modelA);

		var element1 = $(fixture).find('li')[0];
		vm.merge(modelB);

		var element2 = $(fixture).find('li')[0];

		ok($(fixture).find("li:contains('two')").length, 'Results found.');
		ok(element1 === element2, 'Element references match.')
	});

	test('dom lookup test', function() {
		
		var template = '<ul><li>{{name}}</li></ul>',
			modelA = {name: 'one'},
			modelB = {name: 'two'};

		//Take template and add as-is to the dom
		var fixture = document.getElementById('qunit-fixture');

		$(fixture).html(template);

		//Reset because qunit-fixture is always the same id
		rebind.reset();

		var vm = rebind.create('qunit-fixture');
		vm.render(modelA);

		var element1 = $(fixture).find('li')[0];
		vm.merge(modelB);

		var element2 = $(fixture).find('li')[0];

		ok($(fixture).find("li:contains('two')").length, 'Results found.');
		ok(element1 === element2, 'Element references match.')
	});

	test('model modify dom update', function() {
		
		var template = '<ul><li>{{name}}</li></ul>',
			model = {name: 'one'};

		//Take template and add as-is to the dom
		var fixture = document.getElementById('qunit-fixture');

		$(fixture).html(template);

		rebind.reset();

		var vm = rebind.create(fixture);
		vm.render(model);

		model.name = 'two';
		vm.merge(model);

		ok($(fixture).find("li:contains('two')").length, $(fixture).html());
	});

	test('model manual dom update', function() {
		
		var template = '<ul><li>{{name}}</li></ul>',
			model = {name: 'one'};

		//Take template and add as-is to the dom
		var fixture = document.getElementById('qunit-fixture');

		$(fixture).html(template);

		rebind.reset();
		
		var vm = rebind.create(fixture);
		vm.render(model);

		model.name = 'two';
		vm.merge(model);

		ok($(fixture).find("li:contains('two')").length, $(fixture).html());
	});
	
})();