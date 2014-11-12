/*!
 * rebind.js - Databinding for mustache.js templates (http://github.com/janl/mustache.js)
 */

this.Rebind = this.Rebind || {};

(function(o) {

	o.memoize = function(source, target) {
 		var output = [];

 		//Begin recursive call into source making changes to target
 		compareNodes(source, target, output);

 		return output;
 	}

 	//Inject section tokens (as comments) to allow us to pick up dom changes accurately
	o.ninject = function(branch) {

		var i = 0;

		while (i < branch.length) {
			
			var token = branch[i],
				isSection = token[0] === '#' || token[0] === '^';

			//Control token
			if (isSection) {

				var inject = ['text', '<!--' + token[0] + '-->', token[2], token[3]];
				branch.splice(i, 0, inject);

				i++;

				//recurse subtree
				o.ninject(token[4]);
			}

			i++;

			//Close control token
			if (isSection) {
				var inject = ['text', '<!--/-->', branch[i][2], branch[i][3]];
				branch.splice(i, 0, inject);

				i++;
			}
		}
	}

	//Apply changes in source to target as a list of memoized actions
	function compareNodes(source, target, output) {

	}

 })(this.Rebind);