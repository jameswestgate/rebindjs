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

this.Rebind = this.Rebind || {};

(function(o) {

	var writer = new Mustache.Writer(),
		cache = {},
		id = 0;

	//Extract the template from the element, 
	o.bind = function(element, view) {
		
		var template = element.innerHTML,
			tokens = writer.parse(template);

		//Add control flow comment tokens
		Rebind.ninject(tokens);

		//Render markup and apply to target element
		//TODO: add context and view to cache
		element.innerHTML = writer.renderTokens(tokens, new Mustache.Context(view), null, template);

		//Cache template and token for future merges
		var key = element.id;

		if (!key || !key.length) {
			key = 'id' + id;
			element._rebindId = 'id' + id;

			id++;
		}

		cache[key] = {template: template, tokens: tokens};
	}
	
	o.merge = function(element, view) {

		var div = document.createElement('div'),
			key = element._rebindId || element.id;

		//Document fragments require a child node to add innerHTML
		document.createDocumentFragment().appendChild(div);

		//Render the view into the div
		div.innerHTML = writer.renderTokens(cache[key].tokens, new Mustache.Context(view), null, cache[key].template);
	
		//Now merge and test (the newer markup is the source)
		o.mergeNodes(div.firstChild, element.firstChild, element, 0, 0);
 	}

 	//Determine if the element template has been rendered yet and call appropriately
 	o.render = function(element, view) {

 		var key = element.id,
 			method = ((key && key.length) ? cache[key] : element._rebindId) ? 'merge' : 'bind';

		o[method](element, view);
 	}


 	//TODO: add registerHelper
 	//http://handlebarsjs.com/#helpers

 	//TODO: add injectHelpers (injects into a context)

 	//Inject section tokens (as comments) to allow us to pick up dom changes accurately
 	//This allows us to leave the mustache.js source as is without modifications
 	//And still get the extra semantics needed to work out dom insertions and deletions

 	//Helpers - expand name tokens with spaces into lambdas
 	//eg {{format x y z}} to {{#format}}x y z{{/format}} - if helper registered
	o.ninject = function(branch) {

		var i = 0;

		while (i < branch.length) {
			
			var token = branch[i],
				isSection = (token[0] === '#' || token[0] === '^'),
				isHandler = (token[0] === 'name' && token[1].indexOf(' ') > 0);

			//Handler
			if (isHandler) {

				//TODO: check that helper has been registered

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

			//Control token
			if (isSection) {

				branch.splice(i, 0, ['text', '<!--' + token[0] + '-->', token[2], token[3]]);
				i++;

				//recurse subtree
				o.ninject(token[4]);
			}

			i++;

			//Close control token
			if (isSection) {
				
				branch.splice(i, 0, inject = ['text', '<!--/-->', token[2], token[3]]);
				i++;
			}
		}
	}

	//Recurse through the source dom tree and apply changes to the target
	o.mergeNodes = function(source, target, targetParent, level, index) {

		console.log('Comparing nodes - source:' + (source && source.tagName) + ', target:' + (target && target.tagName) + ' at level: ' + level + ', index: ' + index);

		//Source and target can be null if text node was removed
		if (!source && !target) return;

		//Cahce node types
		var sourceType = source && source.nodeType,
			targetType = target && target.nodeType;

		//Text node insertion
		if (sourceType === 3 && (!target || targetType !==3)) {
			
			//Text node insertion
			if (!target) {
				console.log('+ Cloned and inserted text node for empty target.');
				targetParent.appendChild(source.cloneNode(false));
			}
			else {
				console.log('+ Cloned and inserted text node before target.');
				targetParent.insertBefore(source.cloneNode(false), target);
			}
			return;
		}
			
		//Text node removal
		if (targetType === 3  && (!source || sourceType !==3)) {

			console.log('- Remove text node from target.');
			targetParent.removeChild(target);

			if (!source) return;

			//Continue
			target = targetParent.childNodes[index];
		}

		//Detect if we have hit the start of a section
		if (sourceType === 8 && targetType === 8) {
			
			if (source.nodeValue === '#') {
				
				//Get the index of the next end marker
				var sourceIdx = getSectionEnd(source),
					targetIdx = getSectionEnd(target);

				//Some kind of failure, return
				if (!sourceIdx || !targetIdx) {
					console.log('rebind.js: Could not find end of section.');/*RemoveLogging:skip*/
				}

				//Load all elements in the target between source and targetidx's into an associative array by id
				//elements without an id get p1, p2 etc
				var map = mapElements(targetParent, index + 1, targetIdx);

				//Now loop through each source node and get the relevant target node
				var idx = index + 1,
					count = 0;

				while (idx < sourceIdx){

					var node = source.parentNode.childNodes[idx],
						bound = targetParent.childNodes[idx],
						id = node.id;

					if (!id) {
						id = 'p' + count;
						count++;
					}

					//Check if the node has an id
					//If exists in target map, then move that node to the correct position 
					//This will usually be the same node, which means no dom move is necessary
					//Otherwise clone the node from the source (ie new inserts)
					var existing = map[id];
					if (existing) {

						if (existing !== bound) {

							console.log('^ Move mode with id:' + id + ' before:' + bound);
							targetParent.insertBefore(existing, bound);
						}
					}
					else {

						console.log('+ Clone and added node with id: ' + id);
						targetParent.insertBefore(node.cloneNode(true), bound);

						targetIdx++;
					}

					idx++;
				}

				//Remove any tail nodes in the target
				while (sourceIdx < targetIdx) {
					
					console.log('- Removed node at index:' + idx);
					targetParent.removeChild(targetParent.childNodes[idx]);

					sourceIdx ++;
				}
			}
			else {
				//Normal comments, just update
				target.nodeValue = source.nodeValue
			}

			return;
		}

		//Now we have compared comment nodes, we can compare branch equality
		if (source.isEqualNode(target)) return;

		//Compare text nodes
		if (sourceType === 3 && targetType === 3) {
			
			console.log('> Push text values - source:' + source.nodeValue + ', target:' + target.nodeValue);
			target.nodeValue = source.nodeValue;

			return;
		}

		//Element tagName changes ie <{{name}} ... >
		if (source.tagName !== target.tagName) {
			
			console.log('> Tag replacement: ' + target.tagName + ' -> ' + source.tagName);
			targetParent.replaceChild(source.cloneNode(true), target);
			return;
		}

		//Iterate through any child nodes
		var length = (source.childNodes.length < target.childNodes.length) ? target.childNodes.length : source.childNodes.length;

		if (length) {

			//Now loop recursively.
			for (var i = 0; i<length; i++) {
				o.mergeNodes(source.childNodes[i], target.childNodes[i], target, level + 1, i);
			}

			if (source.isEqualNode(target)) return;
		}

		//Update any attributes
		if (source.attributes && target.attributes) { 
		
			var attributes = source.attributes;

			for (var i=0, len=attributes.length; i<len; i++) {

				var value = attributes[i].nodeValue,
					name = attributes[i].nodeName;

				if (target.getAttribute(name) !== value) {
					
					console.log('+ Push attribute values for:' + name + ' - source:'+ attributes[i].nodeValue + ', target:' + target.attributes[i].nodeValue);
					target.setAttribute(name, value);
				}
			}
		}		
	}


	//Starting with the comment node 
	function getSectionEnd(node) {
		var count = 0,
			index = 0;

		while (node) {
			
			if (node.nodeType === 8) {
				if (node.nodeValue === '#') {
					count ++
				} 
				else if (node.nodeValue === '/') {
					count --;
					if (count === 0) return index;
				}
			}

			index ++;
			node = node.nextSibling;
		}

		return null;
	}

	//Return a map of live elements and their ids, or generate a predicatable id if one does not exists
	function mapElements(parent, start, end) {
		var nodes = parent.childNodes,
			map = {},
			count = 0;

		for (var i=start; i<end; i++) {
			var node = nodes[i];

			if (node.id) {
				map[node.id] = node;
			}
			else {
				map['p' + count] = node;
				count++;
			}
		}

		return map;
	}

 })(this.Rebind);