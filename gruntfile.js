module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		concat: {
			options: {
				// define a string to put between each file in the concatenated output
				separator: grunt.util.linefeed + grunt.util.linefeed
			},
			dist: {
				// the files to concatenate
				src: ['bower_components/mustache/mustache.js', 'src/**/*.js'],
				// the location of the resulting JS file
				dest: 'dist/<%= pkg.name %>.js'
			}
		},
		removelogging: {
			dist: {
			  src: "dist/<%= pkg.name %>.js",
			  dest: "build/<%= pkg.name %>.js",
			}
		},
		uglify: {
			options: {
				banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
			},
			build: {
				src: 'build/<%= pkg.name %>.js',
				dest: 'dist/<%= pkg.name %>.min.js'
			}
		}
	});

	// Load the plugin that provides the "uglify" task.
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks("grunt-remove-logging");

	// Default task(s).
	grunt.registerTask('debug', ['concat']);
	grunt.registerTask('default', ['concat', 'removelogging', 'uglify']);

};