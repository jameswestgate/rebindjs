/*!
 * mustache.js - Logic-less {{mustache}} templates with JavaScript
 * http://github.com/janl/mustache.js
 */

/*global define: false*/

(function (root, factory) {
  if (typeof exports === "object" && exports) {
    factory(exports); // CommonJS
  } else {
    var mustache = {};
    factory(mustache);
    if (typeof define === "function" && define.amd) {
      define(mustache); // AMD
    } else {
      root.Mustache = mustache; // <script>
    }
  }
}(this, function (mustache) {

  // Workaround for https://issues.apache.org/jira/browse/COUCHDB-577
  // See https://github.com/janl/mustache.js/issues/189
  var RegExp_test = RegExp.prototype.test;
  function testRegExp(re, string) {
    return RegExp_test.call(re, string);
  }

  var nonSpaceRe = /\S/;
  function isWhitespace(string) {
    return !testRegExp(nonSpaceRe, string);
  }

  var Object_toString = Object.prototype.toString;
  var isArray = Array.isArray || function (object) {
    return Object_toString.call(object) === '[object Array]';
  };

  function isFunction(object) {
    return typeof object === 'function';
  }

  function escapeRegExp(string) {
    return string.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
  }

  var entityMap = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': '&quot;',
    "'": '&#39;',
    "/": '&#x2F;'
  };

  function escapeHtml(string) {
    return String(string).replace(/[&<>"'\/]/g, function (s) {
      return entityMap[s];
    });
  }

  function escapeTags(tags) {
    if (!isArray(tags) || tags.length !== 2) {
      throw new Error('Invalid tags: ' + tags);
    }

    return [
      new RegExp(escapeRegExp(tags[0]) + "\\s*"),
      new RegExp("\\s*" + escapeRegExp(tags[1]))
    ];
  }

  var whiteRe = /\s*/;
  var spaceRe = /\s+/;
  var equalsRe = /\s*=/;
  var curlyRe = /\s*\}/;
  var tagRe = /#|\^|\/|>|\{|&|=|!/;

  /**
   * Breaks up the given `template` string into a tree of tokens. If the `tags`
   * argument is given here it must be an array with two string values: the
   * opening and closing tags used in the template (e.g. [ "<%", "%>" ]). Of
   * course, the default is to use mustaches (i.e. mustache.tags).
   *
   * A token is an array with at least 4 elements. The first element is the
   * mustache symbol that was used inside the tag, e.g. "#" or "&". If the tag
   * did not contain a symbol (i.e. {{myValue}}) this element is "name". For
   * all text that appears outside a symbol this element is "text".
   *
   * The second element of a token is its "value". For mustache tags this is
   * whatever else was inside the tag besides the opening symbol. For text tokens
   * this is the text itself.
   *
   * The third and fourth elements of the token are the start and end indices,
   * respectively, of the token in the original template.
   *
   * Tokens that are the root node of a subtree contain two more elements: 1) an
   * array of tokens in the subtree and 2) the index in the original template at
   * which the closing tag for that section begins.
   */
  function parseTemplate(template, tags) {
    tags = tags || mustache.tags;
    template = template || '';

    if (typeof tags === 'string') {
      tags = tags.split(spaceRe);
    }

    var tagRes = escapeTags(tags);
    var scanner = new Scanner(template);

    var sections = [];     // Stack to hold section tokens
    var tokens = [];       // Buffer to hold the tokens
    var spaces = [];       // Indices of whitespace tokens on the current line
    var hasTag = false;    // Is there a {{tag}} on the current line?
    var nonSpace = false;  // Is there a non-space char on the current line?

    // Strips all whitespace tokens array for the current line
    // if there was a {{#tag}} on it and otherwise only space.
    function stripSpace() {
      if (hasTag && !nonSpace) {
        while (spaces.length) {
          delete tokens[spaces.pop()];
        }
      } else {
        spaces = [];
      }

      hasTag = false;
      nonSpace = false;
    }

    var start, type, value, chr, token, openSection;
    while (!scanner.eos()) {
      start = scanner.pos;

      // Match any text between tags.
      value = scanner.scanUntil(tagRes[0]);
      if (value) {
        for (var i = 0, len = value.length; i < len; ++i) {
          chr = value.charAt(i);

          if (isWhitespace(chr)) {
            spaces.push(tokens.length);
          } else {
            nonSpace = true;
          }

          tokens.push(['text', chr, start, start + 1]);
          start += 1;

          // Check for whitespace on the current line.
          if (chr === '\n') {
            stripSpace();
          }
        }
      }

      // Match the opening tag.
      if (!scanner.scan(tagRes[0])) break;
      hasTag = true;

      // Get the tag type.
      type = scanner.scan(tagRe) || 'name';
      scanner.scan(whiteRe);

      // Get the tag value.
      if (type === '=') {
        value = scanner.scanUntil(equalsRe);
        scanner.scan(equalsRe);
        scanner.scanUntil(tagRes[1]);
      } else if (type === '{') {
        value = scanner.scanUntil(new RegExp('\\s*' + escapeRegExp('}' + tags[1])));
        scanner.scan(curlyRe);
        scanner.scanUntil(tagRes[1]);
        type = '&';
      } else {
        value = scanner.scanUntil(tagRes[1]);
      }

      // Match the closing tag.
      if (!scanner.scan(tagRes[1])) {
        throw new Error('Unclosed tag at ' + scanner.pos);
      }

      token = [ type, value, start, scanner.pos ];
      tokens.push(token);

      if (type === '#' || type === '^') {
        sections.push(token);
      } else if (type === '/') {
        // Check section nesting.
        openSection = sections.pop();

        if (!openSection) {
          throw new Error('Unopened section "' + value + '" at ' + start);
        }
        if (openSection[1] !== value) {
          throw new Error('Unclosed section "' + openSection[1] + '" at ' + start);
        }
      } else if (type === 'name' || type === '{' || type === '&') {
        nonSpace = true;
      } else if (type === '=') {
        // Set the tags for the next time around.
        tagRes = escapeTags(tags = value.split(spaceRe));
      }
    }

    // Make sure there are no open sections when we're done.
    openSection = sections.pop();
    if (openSection) {
      throw new Error('Unclosed section "' + openSection[1] + '" at ' + scanner.pos);
    }

    return nestTokens(squashTokens(tokens));
  }

  /**
   * Combines the values of consecutive text tokens in the given `tokens` array
   * to a single token.
   */
  function squashTokens(tokens) {
    var squashedTokens = [];

    var token, lastToken;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];

      if (token) {
        if (token[0] === 'text' && lastToken && lastToken[0] === 'text') {
          lastToken[1] += token[1];
          lastToken[3] = token[3];
        } else {
          squashedTokens.push(token);
          lastToken = token;
        }
      }
    }

    return squashedTokens;
  }

  /**
   * Forms the given array of `tokens` into a nested tree structure where
   * tokens that represent a section have two additional items: 1) an array of
   * all tokens that appear in that section and 2) the index in the original
   * template that represents the end of that section.
   */
  function nestTokens(tokens) {
    var nestedTokens = [];
    var collector = nestedTokens;
    var sections = [];

    var token, section;
    for (var i = 0, len = tokens.length; i < len; ++i) {
      token = tokens[i];

      switch (token[0]) {
      case '#':
      case '^':
        collector.push(token);
        sections.push(token);
        collector = token[4] = [];
        break;
      case '/':
        section = sections.pop();
        section[5] = token[2];
        collector = sections.length > 0 ? sections[sections.length - 1][4] : nestedTokens;
        break;
      default:
        collector.push(token);
      }
    }

    return nestedTokens;
  }

  /**
   * A simple string scanner that is used by the template parser to find
   * tokens in template strings.
   */
  function Scanner(string) {
    this.string = string;
    this.tail = string;
    this.pos = 0;
  }

  /**
   * Returns `true` if the tail is empty (end of string).
   */
  Scanner.prototype.eos = function () {
    return this.tail === "";
  };

  /**
   * Tries to match the given regular expression at the current position.
   * Returns the matched text if it can match, the empty string otherwise.
   */
  Scanner.prototype.scan = function (re) {
    var match = this.tail.match(re);

    if (match && match.index === 0) {
      var string = match[0];
      this.tail = this.tail.substring(string.length);
      this.pos += string.length;
      return string;
    }

    return "";
  };

  /**
   * Skips all text until the given regular expression can be matched. Returns
   * the skipped string, which is the entire tail if no match can be made.
   */
  Scanner.prototype.scanUntil = function (re) {
    var index = this.tail.search(re), match;

    switch (index) {
    case -1:
      match = this.tail;
      this.tail = "";
      break;
    case 0:
      match = "";
      break;
    default:
      match = this.tail.substring(0, index);
      this.tail = this.tail.substring(index);
    }

    this.pos += match.length;

    return match;
  };

  /**
   * Represents a rendering context by wrapping a view object and
   * maintaining a reference to the parent context.
   */
  function Context(view, parentContext) {
    this.view = view == null ? {} : view;
    this.cache = { '.': this.view };
    this.parent = parentContext;
  }

  /**
   * Creates a new context using the given view with this context
   * as the parent.
   */
  Context.prototype.push = function (view) {
    return new Context(view, this);
  };

  /**
   * Returns the value of the given name in this context, traversing
   * up the context hierarchy if the value is absent in this context's view.
   */
  Context.prototype.lookup = function (name) {
    var value;
    if (name in this.cache) {
      value = this.cache[name];
    } else {
      var context = this;

      while (context) {
        if (name.indexOf('.') > 0) {
          value = context.view;

          var names = name.split('.'), i = 0;
          while (value != null && i < names.length) {
            value = value[names[i++]];
          }
        } else {
          value = context.view[name];
        }

        if (value != null) break;

        context = context.parent;
      }

      this.cache[name] = value;
    }

    if (isFunction(value)) {
      value = value.call(this.view);
    }

    return value;
  };

  /**
   * A Writer knows how to take a stream of tokens and render them to a
   * string, given a context. It also maintains a cache of templates to
   * avoid the need to parse the same template twice.
   */
  function Writer() {
    this.cache = {};
  }

  /**
   * Clears all cached templates in this writer.
   */
  Writer.prototype.clearCache = function () {
    this.cache = {};
  };

  /**
   * Parses and caches the given `template` and returns the array of tokens
   * that is generated from the parse.
   */
  Writer.prototype.parse = function (template, tags) {
    var cache = this.cache;
    var tokens = cache[template];

    if (tokens == null) {
      tokens = cache[template] = parseTemplate(template, tags);
    }

    return tokens;
  };

  /**
   * High-level method that is used to render the given `template` with
   * the given `view`.
   *
   * The optional `partials` argument may be an object that contains the
   * names and templates of partials that are used in the template. It may
   * also be a function that is used to load partial templates on the fly
   * that takes a single argument: the name of the partial.
   */
  Writer.prototype.render = function (template, view, partials) {
    var tokens = this.parse(template);
    var context = (view instanceof Context) ? view : new Context(view);
    return this.renderTokens(tokens, context, partials, template);
  };

  /**
   * Low-level method that renders the given array of `tokens` using
   * the given `context` and `partials`.
   *
   * Note: The `originalTemplate` is only ever used to extract the portion
   * of the original template that was contained in a higher-order section.
   * If the template doesn't use higher-order sections, this argument may
   * be omitted.
   */
  Writer.prototype.renderTokens = function (tokens, context, partials, originalTemplate) {
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
            buffer += this.renderTokens(token[4], context.push(value[j]), partials, originalTemplate);
          }
        } else if (typeof value === 'object' || typeof value === 'string') {
          buffer += this.renderTokens(token[4], context.push(value), partials, originalTemplate);
        } else if (isFunction(value)) {
          if (typeof originalTemplate !== 'string') {
            throw new Error('Cannot use higher-order sections without the original template');
          }

          // Extract the portion of the original template that the section contains.
          value = value.call(context.view, originalTemplate.slice(token[3], token[5]), subRender);

          if (value != null) buffer += value;
        } else {
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
        value = isFunction(partials) ? partials(token[1]) : partials[token[1]];
        if (value != null) buffer += this.renderTokens(this.parse(value), context, partials, value);
        break;
      case '&':
        value = context.lookup(token[1]);
        if (value != null) buffer += value;
        break;
      case 'name':
        value = context.lookup(token[1]);
        if (value != null) buffer += mustache.escape(value);
        break;
      case 'text':
        buffer += token[1];
        break;
      }
    }

    return buffer;
  };

  mustache.name = "mustache.js";
  mustache.version = "0.8.1";
  mustache.tags = [ "{{", "}}" ];

  // All high-level mustache.* functions use this writer.
  var defaultWriter = new Writer();

  /**
   * Clears all cached templates in the default writer.
   */
  mustache.clearCache = function () {
    return defaultWriter.clearCache();
  };

  /**
   * Parses and caches the given template in the default writer and returns the
   * array of tokens it contains. Doing this ahead of time avoids the need to
   * parse templates on the fly as they are rendered.
   */
  mustache.parse = function (template, tags) {
    return defaultWriter.parse(template, tags);
  };

  /**
   * Renders the `template` with the given `view` and `partials` using the
   * default writer.
   */
  mustache.render = function (template, view, partials) {
    return defaultWriter.render(template, view, partials);
  };

  // This is here for backwards compatibility with 0.4.x.
  mustache.to_html = function (template, view, partials, send) {
    var result = mustache.render(template, view, partials);

    if (isFunction(send)) {
      send(result);
    } else {
      return result;
    }
  };

  // Export the escaping function so that the user may override it.
  // See https://github.com/janl/mustache.js/issues/244
  mustache.escape = escapeHtml;

  // Export these mainly for testing, but also for advanced usage.
  mustache.Scanner = Scanner;
  mustache.Context = Context;
  mustache.Writer = Writer;

}));


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

						buffer += '<!--#rebind '+ token[1] +  ',' + j + '-->';
						buffer += this.renderTokens(token[4], childContext, partials, originalTemplate);
						buffer += '<!--/rebind-->';
						
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

		//-- Replace any double comments in the buffer
		buffer = buffer.replace(/<!--\s*<!--/g, '<!--');
		buffer = buffer.replace(/-->\s*-->/g, '-->');
		//-- End addition

		return buffer;
	}

	o.Writer.prototype.postRender = function(element) {

		var nodes = element.childNodes,
			node,
			data,
			remove = [];

		for (var i=0, len=nodes.length; i<len; i++) {
			node = nodes[i];

			//Comment
			if (node.nodeType === 8) {

				if (node.nodeValue.lastIndexOf('#rebind') === 0) {
					data = node.nodeValue.substring(8).split(',');
					remove.push(node);
				}
				else if (node.nodeValue.lastIndexOf('/rebind') === 0) {
					data = null;
					remove.push(node);
				}
			}

			if (data) {
				node._section = data[0];
				node._index = data[1];
			}

			if (node.childNodes) o.Writer.prototype.postRender(node);
		}

		//Now remove the section comments
		for (var j=0, len=remove.length; j<len; j++) {
			element.removeChild(remove[j]);
		}		
	}


	//-- Define the ViewModel class

	o.ViewModel = function(element) {
		
		if (typeof element === 'string') element = document.getElementById(element);

		this.element = element;
		this.id = this.element.id;

		if (!this.id) throw new Error('Template element must have an id attribute.')
	}

	o.ViewModel.prototype.clear = function() {
		this.element = null;
		this.detach();
	}

	//Extract the template from the element, 
	o.ViewModel.prototype.render = function(model) {
		
		this.template = this.element.outerHTML;
		this.tokens = writer.parse(this.template);

		//Add control flow comment tokens
		o.inject(this.tokens);

		//Create context, injecting helpers as the parent
		var context = o.getContext(model, helpers);

		//Render markup and apply to target element
		var html = writer.renderTokens(this.tokens, context, null, this.template);

		//Replace html
		this.element.outerHTML = html;
		this.element = document.getElementById(this.id);

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
		o.mergeNodes(div.firstChild, this.element, false);
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