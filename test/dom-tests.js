module('dom tests');

test('simple dom update', function() {
	
	var template = '<ul><li>{{name}}</li></ul>',
		modelA = {name: 'one'},
		modelB = {name: 'two'};

	runTest(template, modelA, modelB, "li:contains('two')");
});

function runTest(template, modelA, modelB, selector) {

	//Take template and add as-is to the dom
	var fixture = document.getElementById('qunit-fixture');

	$(fixture).html(template);

	Rebind.render(fixture, modelA);
	Rebind.render(fixture, modelB);

	ok($(fixture).find(selector).length, 'Results found.');
}