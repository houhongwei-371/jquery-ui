module.exports = function( grunt ) {

"use strict";

var fs = require( "fs" );

function expandFiles( files ) {
	return grunt.util._.pluck( grunt.file.expandMapping( files ), "src" ).filter(function(filepath) {
		// restrict to files, exclude folders
		try {
			return fs.statSync( filepath[ 0 ] ).isFile();
		} catch(e) {
			throw grunt.task.taskError(e.message, e);
		}
	}).map(function( values ) {
		return values[ 0 ];
	});
}

grunt.registerTask( "manifest", "Generate jquery.json manifest files", function() {
	var pkg = grunt.config( "pkg" ),
		base = {
			core: {
				name: "ui.{plugin}",
				title: "jQuery UI {Plugin}"
			},
			widget: {
				name: "ui.{plugin}",
				title: "jQuery UI {Plugin}",
				dependencies: [ "core", "widget" ]
			},
			interaction: {
				name: "ui.{plugin}",
				title: "jQuery UI {Plugin}",
				dependencies: [ "core", "widget", "mouse" ]
			},
			effect: {
				name: "ui.effect-{plugin}",
				title: "jQuery UI {Plugin} Effect",
				keywords: [ "effect", "show", "hide" ],
				homepage: "http://jqueryui.com/effect/",
				demo: "http://jqueryui.com/effect/",
				docs: "http://api.jqueryui.com/{plugin}-effect/",
				dependencies: [ "effect" ]
			}
		};

	Object.keys( base ).forEach(function( type ) {
		var baseManifest = base[ type ],
			plugins = grunt.file.readJSON( "build/" + type + ".json" );

		Object.keys( plugins ).forEach(function( plugin ) {
			var manifest,
				data = plugins[ plugin ],
				name = plugin.charAt( 0 ).toUpperCase() + plugin.substr( 1 );

			function replace( str ) {
				return str.replace( "{plugin}", plugin ).replace( "{Plugin}", name );
			}

			manifest = {
				name: data.name || replace( baseManifest.name ),
				title: data.title || replace( baseManifest.title ),
				description: data.description,
				keywords: [ "ui", plugin ]
					.concat( baseManifest.keywords || [] )
					.concat( data.keywords || [] ),
				version: pkg.version,
				author: pkg.author,
				maintainers: pkg.maintainers,
				licenses: pkg.licenses,
				bugs: pkg.bugs,
				homepage: data.homepage || replace( baseManifest.homepage ||
					"http://jqueryui.com/{plugin}/" ),
				demo: data.demo || replace( baseManifest.demo ||
					"http://jqueryui.com/{plugin}/" ),
				docs: data.docs || replace( baseManifest.docs ||
					"http://api.jqueryui.com/{plugin}/" ),
				download: "http://jqueryui.com/download/",
				dependencies: {
					jquery: ">=1.6"
				},
				// custom
				category: data.category || type
			};

			(baseManifest.dependencies || [])
				.concat(data.dependencies || [])
				.forEach(function( dependency ) {
					manifest.dependencies[ "ui." + dependency ] = pkg.version;
				});

			grunt.file.write( manifest.name + ".jquery.json",
				JSON.stringify( manifest, null, "\t" ) + "\n" );
		});
	});
});

grunt.registerMultiTask( "copy", "Copy files to destination folder and replace @VERSION with pkg.version", function() {
	function replaceVersion( source ) {
		return source.replace( /@VERSION/g, grunt.config( "pkg.version" ) );
	}
	function copyFile( src, dest ) {
		if ( /(js|css)$/.test( src ) ) {
			grunt.file.copy( src, dest, {
				process: replaceVersion
			});
		} else {
			grunt.file.copy( src, dest );
		}
	}
	var files = expandFiles( this.filesSrc ),
		target = this.data.dest + "/",
		strip = this.data.strip,
		renameCount = 0,
		fileName;
	if ( typeof strip === "string" ) {
		strip = new RegExp( "^" + grunt.template.process( strip, grunt.config() ).replace( /[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&" ) );
	}
	files.forEach(function( fileName ) {
		var targetFile = strip ? fileName.replace( strip, "" ) : fileName;
		copyFile( fileName, target + targetFile );
	});
	grunt.log.writeln( "Copied " + files.length + " files." );
	for ( fileName in this.data.renames ) {
		renameCount += 1;
		copyFile( fileName, target + grunt.template.process( this.data.renames[ fileName ], grunt.config() ) );
	}
	if ( renameCount ) {
		grunt.log.writeln( "Renamed " + renameCount + " files." );
	}
});

grunt.registerTask( "clean", function() {
	require( "rimraf" ).sync( "dist" );
});

};
