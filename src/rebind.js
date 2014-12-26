/*!
 * rebind.js - Databinding for mustache.js templates 
 * https://github.com/jameswestgate/rebindjs
 * Released under the MIT license
 */

this.rebind = this.rebind || {};

(function(o) {

	var writer,
		helpers,
		helpersContext,

		Object_toString = Object.prototype.toString,
		isArray = Array.isArray || function (object) {
    		return Object_toString.call(object) === '[object Array]';
  		};

	o.reset = function() {
		writer = new o.Writer();
		helpers = {};
		helpersContext = new Mustache.Context(helpers);
	}


	//-- Override the Mustache writer with our own

	o.Writer = function() {
		
	}

	o.Writer.prototype = new Mustache.Writer();

	//Copied from the mustache implementation, with additions for section + index values
	o.Writer.prototype.renderTokens = function(tokens, context, partials, originalTemplate) {
		
		var buffer = '';

		// This function is used to render an arbitrary template
		// in the current context by higher-order sections.
		var self = this;

		function subRender(template) {
		  return self.render(template, context, partials);
		}

		var token, value;
		for (var i = 0, len = tokens.length; i < len; ++i) {
			token = tokens[i];

			switch (token[0]) {
			
			case '#':
				value = context.lookup(token[1]);
				if (!value) continue;

				if (isArray(value)) {
					for (var j = 0, jlen = value.length; j < jlen; ++j) {
						
						//-- Rebindjs - add sections variables and inject section data wrapper 

						//Add the index to the context
						var childContext = context.push(value[j]),
							cache = childContext.cache;

						cache['@index'] = j;
						cache['@index1'] = j + 1;
						cache['@first'] = (j === 0) ? 'first' : '';
						cache['@last'] = (j + 1 === jlen) ? 'last' : '';
						cache['@even'] = (j % 2 === 0) ? 'even' : '';
						cache['@odd'] = (j % 2 === 1) ? 'odd' : '';

						buffer += '<div data-rebind="' + token[1] +  ',' + j + '">';
						buffer += this.renderTokens(token[4], childContext, partials, originalTemplate);
						buffer += '</div>';
						
						//-- end modification
				  	}
				}
				else if (typeof value === 'object' || typeof value === 'string') {
				  	buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
				} 
				else if (typeof value === 'function') {
					if (typeof originalTemplate !== 'string') {
						throw new Error('Cannot use higher-order sections without the original template');
					}

				  	// Extract the portion of the original template that the section contains.
				  	value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

				  	if (value != null) buffer += value;
				} 
				else {
				  	buffer += this.renderTokens(token[4], context, partials, originalTemplate);
				}

				break;
			
			case '^':
				value = context.lookup(token[1]);

				// Use JavaScript's definition of falsy. Include empty arrays.
				// See https://github.com/janl/mustache.js/issues/186
				if (!value || (isArray(value) && value.length === 0)) {
					buffer += this.renderTokens(token[4], context, partials, originalTemplate);
				}

				break;
			
			case '>':
				if (!partials) continue;
				value = (typeof partials === 'function') ? partials(token[1]) : partials[token[1]];
				if (value != null) buffer += this.renderTokens(this.parse(value), context, partials, value);
				break;
			
			case '&':
				value = context.lookup(token[1]);
				if (value != null) buffer += value;
				break;
			case 'name':
				value = context.lookup(token[1]);

				//-- Change scope from mustache to Mustache
				if (value != null) buffer += Mustache.escape(value);
				//-- End change

				break;
			case 'text':
				buffer += token[1];
				break;
			}
		}

		return buffer;
	}

	o.Writer.prototype.postRender = function(element) {

		var elements = element.querySelectorAll('[data-rebind]'),
			div,
			nodes,
			section,
			idx,
			parent,
			node;

		for (var i=0, len=elements.length; i<len; i++) {
			div = elements[i];
			nodes = div.childNodes;
			data = div.getAttribute('data-rebind').split(',');
			parent = div.parentNode;
			
			//Loop through each child node, adding the values as (safe) expando properties
			while (nodes.length) {
				node = nodes[0];
				node._section = data[0];
				node._index = data[1];

				//Unwrap the element form the div
				parent.insertBefore(node, div);
			}

			//Now remove the div wrapper from the parent
			parent.removeChild(div);
		}
	}


	//-- Define the ViewModel class

	o.ViewModel = function(element) {
		
		if (typeof element === 'string') element = document.getElementById(element);

		this.element = element;
	}

	o.ViewModel.prototype.clear = function() {
		this.element = null;
		this.detach();
	}

	//Extract the template from the element, 
	o.ViewModel.prototype.render = function(model) {
		
		this.template = this.element.innerHTML;
		this.tokens = writer.parse(this.template);

		//Add control flow comment tokens
		o.inject(this.tokens);

		//Create context, injecting helpers as the parent
		var context = o.getContext(model, helpers);

		//Render markup and apply to target element
		this.element.innerHTML = writer.renderTokens(this.tokens, context, null, this.template);
		writer.postRender(this.element);
	}
	
	o.ViewModel.prototype.merge = function(model) {

		var div = document.createElement('div');

		//Document fragments require a child node to add innerHTML
		document.createDocumentFragment().appendChild(div);

		//It is easiest to get a new context rather than clear the cache.
		//Render the model into the div
		div.innerHTML = writer.renderTokens(this.tokens, o.getContext(model), null, this.template);
		writer.postRender(div);
		
		//Now merge into the existing dom (the newer markup is the source)
		//Merge will also merge the section and index values
		o.mergeNodes(div.firstChild, this.element.firstChild, false);
	}

	//Determine if the element template has been rendered yet and call appropriately
	o.ViewModel.prototype.apply = function(model) {

		var	method = this.template && this.tokens ? 'merge' : 'render';

		this[method](model);
		this.attach(model);
	}

	//Watch for change events and update model accordingly
	//The element originating the change event must have a 'name' or 'data-name' attribute
	o.ViewModel.prototype.attach = function(model) {

		//Add / replace a listener to the template
		attachListener(this.element, model, false);
	}

	//Remove any event handlers for this viewmodel
	o.ViewModel.prototype.detach = function(model) {
		attachListener(this.element, model, true);
	}

	//Register a helper function with rebind. 
	//The tokeniser will use this to create a lambda function and to bind helpers to views
	o.registerHelper = function(name, fn) {
		
		helpers[name] = function() {

			return function() {
				
				var parameters = arguments[0].split(' '),
					argsArray = [];

				//Lookup each argument in the view context
				for (var i=0, len=parameters.length; i<len; i++) {

					//Check for literal syntax
					var parameter = parameters[i],
						first = parameter.slice(0, 1),
						last = parameter.slice(-1);

					argsArray.push((first === '"' && last === '"') || (first === "'" && last === "'") ? parameter.slice(1,-1): this[parameter]);
				}

				//Add subrender as last argument
				argsArray.push(arguments[1]);

				return fn.apply(this, argsArray);
			}
		};
	}

	//Get a context that includes the registered helpers
	o.getContext = function(view) {
		
		return new Mustache.Context(view, helpersContext);
	}

	o.create = function(element) {
		return new o.ViewModel(element);
	}

	//Inject Helpers into template by expanding name tokens with spaces into lambdas
	//eg {{format x y z}} to {{#format}}x y z{{/format}}
	o.inject = function(branch) {

		var i = 0;

		while (i < branch.length) {
			
			var token = branch[i],
				isSection = (token[0] === '#' || token[0] === '^'),
				isHandler = (token[0] === 'name' && token[1].indexOf(' ') > 0);

			//Handler
			if (isHandler) {

				//Rewrite token as a lambda function call
				var values = token[1].split(' '),
					end = token[3],
					bound = token[2] + values[0].length + 3, //{{+
					func = values.shift(),
					args = values.join(' ');

				token[0] = '#';
				token[1] = func;
				token[3] = bound; 
				token.push(['name', args, bound, end - 2]);
				token.push(end - 2);
			}

			//recurse subtree
			if (isSection) o.inject(token[4]);
 
			i++;
		}
	}

	//Recurse through the source dom tree and apply changes to the target
	o.mergeNodes = function(source, target, removeAttributes) {

		//First, reset any model binding data
		target._section = null;
		target._index = null;

		//Map binding information
		if (source.section) {
			target._section = source._section;
			target._index = source._index;
		}

		//Update comments and text nodes
		if ((source.nodeType  === 3 && target.nodeType === 3) || (source.nodeType === 8 && target.nodeType === 8)) {
			
			//Compare and update		
			if (target.nodeValue !== source.nodeValue) {
				console.log('> Updating comment/text value - source:' + source.nodeValue + ', target:' + target.nodeValue);

				target.nodeValue = source.nodeValue;
			}
			
			//No attributes or child elements, so we are done
			return;
		}

		//Update any attributes
		if (source.attributes && target.attributes) { 
		
			var attributes = source.attributes,
				value,
				name;

			//Add / update attributes
			for (var i=0, len=attributes.length; i<len; i++) {

				value = attributes[i].nodeValue;
				name = attributes[i].nodeName;

				if (target.getAttribute(name) !== value) {
					
					console.log('+ Set attribute value for:' + name + ' - source:'+ attributes[i].nodeValue + ', target:' + target.attributes[i].nodeValue);
					target.setAttribute(name, value);
				}
			}

			//Remove attributes
			if (removeAttributes){
				attributes = target.attributes;

				for (var i=0, len=attributes.length; i<len; i++) {

					name = attributes[i].nodeName;

					if (source.getAttribute(name) === null) {
						
						console.log('- remove target attribute:' + name);
						target.removeAttribute(name);
					}
				}
			}
		}

		//Return if equal after attribute update
		if (source.isEqualNode(target)) return;

		//Insert, delete and move child nodes based on predicted id
		//Resetting any model binding attributes in the loop below
		if (source.childNodes && target.childNodes) {
			
			var	map = mapElements(target.childNodes),
				tags = {},
				nodes = source.childNodes;

			//Now loop through each source node and get the relevant target node
			for (var i=0, len=nodes.length; i<len; i++) {

				var node = nodes[i],
					bound = target.childNodes[i],
					id = (node.id) ? node.id : generateId(node, tags);

				//Check if the node has an id
				//If exists in target map, then move that node to the correct position 
				//This will usually be the same node, which means no dom move is necessary
				//Otherwise clone the node from the source (ie new inserts)
				var existing = map[id];
				
				if (existing) {

					if (existing !== bound) {

						console.log('^ Move mode with id:' + id + ' before:' + bound);
						target.insertBefore(existing, bound);
					}
				}
				else {

					console.log('+ Clone and added node with id: ' + id);
					target.insertBefore(node.cloneNode(true), bound);
				}
			}

			//Remove any tail nodes in the target
			while (target.childNodes.length > source.childNodes.length) {
				
				var remove = target.childNodes[target.childNodes.length -1];
				
				console.log('- Remove node: ' + remove);
				
				target.removeChild(remove);
			}
		}

		//Iterate through any child nodes
		var length = source.childNodes.length;

		if (length) {

			for (var i = 0; i<length; i++) {
				o.mergeNodes(source.childNodes[i], target.childNodes[i], removeAttributes);
			}
		}
	}


	//Return a map of live elements and their ids, or generate a predicatable id if one does not exist
	function mapElements(nodes) {

		var map = {},
			tags = {},
			node;

		for (var i=0, len=nodes.length; i<len; i++) {
			
			node = nodes[i];

			//Use the id provided or generate and id based on existing usage
			map[(node.id) ? node.id : generateId(node, tags)] = node;
		}

		return map;
	}

	//Create a unique id, using the tags collection for disambiguation
	function generateId(node, tags) {

		//Get the tag or create one from other node types
		var tag = (node.tagName) ? node.tagName : 'x' + node.nodeType;

		//Set the counter to zero
		if (!tags[tag]) tags[tag] = 0;

		//Increment the counter for that tag
		tags[tag]++;

		return tag + tags[tag];
	}

	function attachListener(element, model, remove) {

		//Always try remove any previous listeners
		element.removeEventListener('change', eventListener);
		if (remove) return;

		element.addEventListener('change', eventListener);

		//Make the handled argument available via a closure
		function eventListener(e) {
			
			//Check the event target to see if it has a name or data-name attribute
			var target = e.target || e.srcElement || e.originalTarget,
				name = target.getAttribute('name') || target.getAttribute('data-name');

			if (!name) return;

			var sections = [];

			//Loop up the dom from the target to this element, collecting section information
			while (target !== element) {
				if (target._section) sections.push([target._section, target._index]);
				target = target.parentNode;
			}

			//Loop through the sections and set the model
			var scope = model,
				section;

			while (sections.length) {
				section = sections.pop();
				
				if (scope[section[0]]) {
					scope = scope[section[0]];
					if (scope[parseInt(section[1], 10)]) scope = scope[parseInt(section[1], 10)];
				}
			}

			scope[name] = e.target.value;
		};
	}

	o.reset();

 })(this.rebind);