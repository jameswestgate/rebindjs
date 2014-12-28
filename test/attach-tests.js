(function(){

	module('attach tests');

	test('simple attach', function() {
		
		var template = '<form id="template"><input type="text" value="{{field}}" name="field"/></form>',
			model = {field: 'one'};

		//Take template and add as-is to the dom
		var fixture = $('#qunit-fixture');
		fixture.html(template);

		//Reset because qunit-fixture is always the same id
		rebind.reset();
		
		var vm = rebind.create('template');
		vm.apply(model);

		//Should automatically update the model
		var input = fixture.find('input');
		ok(input.val() === 'one', 'Input value populated.');
		
		input.val('two');

		//You have to manually trigger a change event
		var evt = new Event('change', { bubbles: true, cancelable: true });
		input[0].dispatchEvent(evt);

		//Clear handlers for following test
		vm.detach();

		ok(model.field === 'two', 'Model value updated');
	});

	test('attach to different field', function() {
		
		var template = '<form id="template"><input type="text" value="{{field}}" name="out"/></form>',
			model = {field: 'one', out: ''};

		//Take template and add as-is to the dom
		var fixture = $('#qunit-fixture');
		fixture.html(template);

		//Reset because qunit-fixture is always the same id
		rebind.reset();
		
		var vm = rebind.create('template');
		vm.apply(model);

		//Should automatically update the model
		var input = fixture.find('input');
		ok(input.val() === 'one', 'Input value populated.');
		
		input.val('two');

		//You have to manually trigger a change event
		var evt = new Event('change', { bubbles: true, cancelable: true });
		input[0].dispatchEvent(evt);

		//Clear handlers for following test
		vm.detach();

		ok(model.field === 'one', 'Model value not updated');
		ok(model.out === 'two', 'Model value updated');
	});

	test('use data field', function() {
		
		var template = '<form id="template"><input type="text" value="{{field}}" data-name="field"/></form>',
			model = {field: 'one'};

		//Take template and add as-is to the dom
		var fixture = $('#qunit-fixture');
		fixture.html(template);

		//Reset because qunit-fixture is always the same id
		rebind.reset();
		
		var vm = rebind.create('template');
		vm.apply(model);
		
		//Should automatically update the model
		var input = fixture.find('input');
		ok(input.val() === 'one', 'Input value populated.');
		
		input.val('two');

		//You have to manually trigger a change event
		var evt = new Event('change', { bubbles: true, cancelable: true });
		input[0].dispatchEvent(evt);

		//Clear handlers for following test
		vm.detach();

		ok(model.field === 'two', 'Model value updated');
	});


	test('use data field different binding', function() {
		
		var template = '<form id="template"><input type="text" value="{{field}}" data-name="out"/></form>',
			model = {field: 'one', out: ''};

		//Take template and add as-is to the dom
		var fixture = $('#qunit-fixture');
		fixture.html(template);

		//Reset because qunit-fixture is always the same id
		rebind.reset();

		var vm = rebind.create('template');
		vm.apply(model);

		//Should automatically update the model
		var input = fixture.find('input');
		ok(input.val() === 'one', 'Input value populated.');
		
		input.val('two');

		//You have to manually trigger a change event
		var evt = new Event('change', { bubbles: true, cancelable: true });
		input[0].dispatchEvent(evt);

		//Clear handlers for following test
		vm.detach();

		ok(model.field === 'one', 'Model value not updated');
		ok(model.out === 'two', 'Model value updated');
	});

	test('array binding', function() {
		
		var template = 
			'<ul id ="tasks-list" class="tasks">' +
			'{{#tasks}}' +
			'<li data-name="tasks"><label for="id{{id}}">{{name}}</label><input id="id{{id}}" type="text" value="{{desc}}" name="desc"/></li>' +
			'{{/tasks}}' + 
			'</ul>';

		var model = {tasks: [
			{id:1, name:'task1', desc:'do task1'},
			{id:2, name:'task2', desc:'do task2'},
			{id:3, name:'task3', desc:'do task3'}
		]};

		//Take template and add as-is to the dom
		var fixture = $('#qunit-fixture');
		fixture.html(template);

		//Reset because qunit-fixture is always the same id
		rebind.reset();
		
		var vm = rebind.create('tasks-list');
		vm.apply(model);

		//Should automatically update the model
		var input = fixture.find('input');

		ok(input.eq(0).val() === 'do task1', 'Input value 1 populated: ' + input.eq(0).val());
		ok(input.eq(1).val() === 'do task2', 'Input value 2 populated: ' + input.eq(1).val());
		ok(input.eq(2).val() === 'do task3', 'Input value 3 populated: ' + input.eq(2).val());
		
		input.eq(1).val('updated');

		//You have to manually trigger a change event
		var evt = new Event('change', {bubbles: true, cancelable: true });
		input[1].dispatchEvent(evt);

		//Clear handlers for following test
		vm.detach();

		ok(model.tasks[1].desc === 'updated', 'Model value updated');
	});

	test('nested binding', function() {
		
		var template = 
			'<div id="robot-template">' + 
			'{{#robots}}' + 
			'<section id="robot-{{robot}}">' +
			'<ul class="tasks-list">' +
			'{{#tasks}}' +
			'<li><input id="id{{id}}" type="text" value="{{desc}}" name="desc"></li>' +
			'<{{/tasks}}' + 
			'</ul>' + 
			'</section>' +
			'{{/robots}}' + 
			'</div>';

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

		//Take template and add as-is to the dom
		var fixture = document.getElementById('qunit-fixture');

		//fixture.html(template);
		fixture.innerHTML = template;

		//Reset because qunit-fixture is always the same id
		rebind.reset();
		
		var vm = rebind.create('robot-template');
		vm.apply(model);

		var input = $(fixture).find('#robot-clive input');

		ok(input.length ===  4, 'Inputs found: ' + input.length);

		ok(input.eq(0).val() === 'do task3', 'Input value populated: ' + input.eq(0).val());
		ok(input.eq(1).val() === 'do task4', 'Input value populated: ' + input.eq(1).val());
		ok(input.eq(2).val() === 'do task5', 'Input value populated: ' + input.eq(2).val());
		ok(input.eq(3).val() === 'do task6', 'Input value populated: ' + input.eq(3).val());
		
		//The event collects mappings as it travels up the dom tree until it arrives at the parent element

		//Update task 5
		input.eq(1).val('updated');

		//You have to manually trigger a change event
		var evt = new Event('change', {bubbles: true, cancelable: true });
		input[1].dispatchEvent(evt);

		//Clear handlers for following test
		vm.detach();

		ok(model.robots[1].tasks[1].desc === 'updated', $(fixture).html());
	});

	test('nested commented sections', function() {
		
		var template = 
			'<table id="robot-table">' + 
			'<tbody>' +
			'<!--{{#robots}}-->' + 
			'<tr id="robot-{{robot}}"><td>' +
			'<ul class="tasks-list">' +
			'{{#tasks}}' +
			'<li><input id="id{{id}}" type="text" value="{{desc}}" name="desc"></li>' +
			'<{{/tasks}}' + 
			'</ul>' + 
			'</td></tr>' +
			'<!--{{/robots}}-->' + 
			'</tbody>' +
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

		//Take template and add as-is to the dom
		var fixture = document.getElementById('qunit-fixture');

		//$(fixture).html(template);
		fixture.innerHTML = template;

		//Reset because qunit-fixture is always the same id
		rebind.reset();
		
		var vm = rebind.create('robot-table');
		vm.apply(model);

		var input = $(fixture).find('#robot-clive input');

		ok(input.length ===  4, 'Inputs found: ' + input.length);

		ok(input.eq(0).val() === 'do task3', 'Input value populated: ' + input.eq(0).val());
		ok(input.eq(1).val() === 'do task4', 'Input value populated: ' + input.eq(1).val());
		ok(input.eq(2).val() === 'do task5', 'Input value populated: ' + input.eq(2).val());
		ok(input.eq(3).val() === 'do task6', 'Input value populated: ' + input.eq(3).val());
		
		//Update task 5
		input.eq(1).val('updated');

		//You have to manually trigger a change event
		var evt = new Event('change', {bubbles: true, cancelable: true });
		input[1].dispatchEvent(evt);

		//Clear handlers for following test
		vm.detach();

		ok(model.robots[1].tasks[1].desc === 'updated', $(fixture).html());
	});
	
})();