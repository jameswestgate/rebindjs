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
		Rebind.reset();
		Rebind.update(fixture, modelA);

		var element1 = $(fixture).find('li')[0];

		Rebind.update(fixture, modelB);

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

		Rebind.reset();
		Rebind.update(fixture, model);

		model.name = 'two';
		Rebind.update(fixture, model);

		ok($(fixture).find("li:contains('two')").length, 'Results found.');
	});

	test('model manual dom update', function() {
		
		var template = '<ul><li>{{name}}</li></ul>',
			model = {name: 'one'};

		//Take template and add as-is to the dom
		var fixture = document.getElementById('qunit-fixture');

		$(fixture).html(template);

		Rebind.reset();
		Rebind.render(fixture, model);

		model.name = 'two';
		Rebind.merge(fixture, model);

		ok($(fixture).find("li:contains('two')").length, 'Results found.');
	});
	
})();