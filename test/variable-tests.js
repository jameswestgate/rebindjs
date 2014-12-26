(function() {
	
	module('variable tests');


	test('simple counter', function() {
		
		var template = '<ul id="template">{{#items}}<li>{{@index}}</li>{{/items}}</ul>',
			model = {items: [{argument: 'one'}, {argument: 'two'}, {argument: 'three'}]};
		
		var writer = new rebind.Writer(),
			tokens = writer.parse(template);

		//Compile the template
		rebind.inject(tokens);

		var context = rebind.getContext(model);

		//Now manually render both views into the document fragments
		var output = writer.renderTokens(tokens, context, null, template);

		var fixture = document.getElementById('qunit-fixture'),
			sections,
			sectionValues;

		$(fixture).html(output);

		writer.postRender(fixture, sections, sectionValues);

		ok($(fixture).html() === '<ul id="template"><li>0</li><li>1</li><li>2</li></ul>', $(fixture).html());
	});

	test('simple counter1', function() {
		
		var template = '<ul id="template">{{#items}}<li>{{@index1}}</li>{{/items}}</ul>',
			model = {items: [{argument: 'one'}, {argument: 'two'}, {argument: 'three'}]};
		
		var writer = new rebind.Writer(),
			tokens = writer.parse(template);

		//Compile the template
		rebind.inject(tokens);

		var context = rebind.getContext(model);

		//Now manually render both views into the document fragments
		var output = writer.renderTokens(tokens, context, null, template);

		var fixture = document.getElementById('qunit-fixture'),
			sections,
			sectionValues;

		$(fixture).html(output);

		writer.postRender(fixture, sections, sectionValues);

		ok($(fixture).html() === '<ul id="template"><li>1</li><li>2</li><li>3</li></ul>', $(fixture).html());
	});

	test('simple first/last', function() {
		
		var template = '<ul id="template">{{#items}}<li>{{@first}}{{@last}}</li>{{/items}}</ul>',
			model = {items: [{argument: 'one'}, {argument: 'two'}, {argument: 'three'}]};
		
		var writer = new rebind.Writer(),
			tokens = writer.parse(template);

		//Compile the template
		rebind.inject(tokens);

		var context = rebind.getContext(model);

		//Now manually render both views into the document fragments
		var output = writer.renderTokens(tokens, context, null, template);

		var fixture = document.getElementById('qunit-fixture'),
			sections,
			sectionValues;

		$(fixture).html(output);

		writer.postRender(fixture, sections, sectionValues);

		ok($(fixture).html() === '<ul id="template"><li>first</li><li></li><li>last</li></ul>', $(fixture).html());
	});

	test('simple odd/even', function() {
		
		var template = '<ul id="template">{{#items}}<li>{{@odd}}{{@even}}</li>{{/items}}</ul>',
			model = {items: [{argument: 'one'}, {argument: 'two'}, {argument: 'three'}]};
		
		var writer = new rebind.Writer(),
			tokens = writer.parse(template);

		//Compile the template
		rebind.inject(tokens);

		var context = rebind.getContext(model);

		//Now manually render both views into the document fragments
		var output = writer.renderTokens(tokens, context, null, template);

		var fixture = document.getElementById('qunit-fixture'),
			sections,
			sectionValues;

		$(fixture).html(output);

		writer.postRender(fixture, sections, sectionValues);

		ok($(fixture).html() === '<ul id="template"><li>even</li><li>odd</li><li>even</li></ul>', $(fixture).html());
	});

	test('nested counter', function() {
		
		var template = 
			'<table id="robot-table">' + 
			'<!--{{#robots}}-->' + 
			'<tr id="robot-{{@index}}"><td>' +
			'<ul class="tasks-list">' +
			'{{#tasks}}' +
			'<li id="task-{{@index}}"><input id="id{{id}}" type="text" value="{{desc}}" name="desc"></li>' +
			'<{{/tasks}}' + 
			'</ul>' + 
			'</td></tr>' +
			'<!--{{/robots}}-->' + 
			'</table>';


		var bob = {robot: 'bob', tasks: [
			{id:1, name:'task1', desc:'do task1'},
			{id:2, name:'task2', desc:'do task2'}
		]};

		var clive = {robot: 'clive', tasks: [
			{id:3, name:'task3', desc:'do task3'},
			{id:4, name:'task4', desc:'do task4'},
			{id:5, name:'task5', desc:'do task5'},
			{id:6, name:'task6', desc:'do task6'}
		]};

		var jonas = {robot: 'jonas', tasks: [
			{id:7, name:'task7', desc:'do task7'},
			{id:8, name:'task8', desc:'do task8'},
			{id:9, name:'task9', desc:'do task9'}
		]};

		var model = {robots: [bob, clive, jonas]};
		
		var writer = new rebind.Writer(),
			tokens = writer.parse(template);

		//Compile the template
		rebind.inject(tokens);

		var context = rebind.getContext(model);

		//Now manually render both views into the document fragments
		var output = writer.renderTokens(tokens, context, null, template);

		var fixture = document.getElementById('qunit-fixture'),
			sections,
			sectionValues;

		$(fixture).html(output);

		writer.postRender(fixture, sections, sectionValues);

		ok($(fixture).find('#robot-0').length === 1, $(fixture).html());
		ok($(fixture).find('#robot-0 #task-1').length === 1, $(fixture).html());
		ok($(fixture).find('#robot-0 #task-2').length === 0, $(fixture).html());

		ok($(fixture).find('#robot-1').length === 1, $(fixture).html());
		ok($(fixture).find('#robot-1 #task-0').length === 1, $(fixture).html());
		ok($(fixture).find('#robot-1 #task-0 #id3').length === 1, $(fixture).html());
		ok($(fixture).find('#robot-1 #task-4').length === 0, $(fixture).html());

		ok($(fixture).find('#robot-2').length === 1, $(fixture).html());
	});


})();
