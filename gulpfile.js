'use strict';

const argv = require('yargs')
	.command('build-vehicles', 'Build NML from vehicle tables', {
		file: {
			alias: 'f',
			desc: 'Vehicle table to convert',
			type: 'string',
			normalize: true,
		},
	})
	.help('?')
	.epilog(' ©2018 Sam Grundman')
	.argv;

const plugins = {
	...require('gulp-load-plugins')({
		rename: {
			'gulp-file': 'newFile',
		},
	}),
	patternReplace: require('@yodasws/gulp-pattern-replace'),
	jsonReplace: require('@yodasws/gulp-json-replace'),
	include: require('@yodasws/gulp-file-includer'),
}
const gulp = require('gulp');
const fs = require('fs');

gulp.task('build-vehicles', gulp.series(
	(done) => {
		// Check that file is a CSV
		let file = argv.file || 'src/*.csv';
		if (typeof file === 'string' && !/\.csv$/.test(file)) {
			done();
			return;
		}
		// Convert Vehicle Tables to NML
		return gulp.src(file)
			.pipe(plugins.csvtojson())
			.pipe(plugins.transform('utf8', (content, file) => {
				let str = JSON.stringify(JSON.parse(content), null, '\t');
				return str;
			}))
			.pipe(plugins.patternReplace([
				/*
				 * Remove JSON syntax
				 */
				// Remove wrapping array brackets
				[/(^\[\s*|\s*\]\s*$)/g, ''],
				// Remove wrapping quotes
				[/(?<!\\)"/g, ''],
				// Remove backslashes
				[/\\"/g, '"'],
				[/(\\{2})/g, '\\'],
				// Fix block open/close
				[/\s*:\s*{/g, ' {'],
				[/},/g, '}'],
				// Remove empty properties
				[/\s*\w+\s*:\s*,?\n/g, '\n'],
				// Remove empty lines
				[/\n+/g, '\n'],
				// Fix indent
				[/^\t/gm, ''],
				/*
				 * Transform properties to NML
				 */
				// Start item_feature block
				[/\s*{\s*item_feature:\s*(.+),\n/g, '\nitem ($1) {\n'],
			]))
			.pipe(plugins.extReplace('.pnml'))
			.pipe(gulp.dest('build/'));
	},
));

gulp.task('default', gulp.series(
	// TODO: Check GRFIDs for uniqueness
	gulp.parallel(
		() => {
			// Replace Tags from package.json
			return gulp.src(['src/**/*.{lng,txt}'])
				.pipe(replace({
					src: 'package.json',
					keepNoMatch: true,
					prefix: '%',
					suffix: '%',
				}))
				.pipe(gulp.dest('build/'));
		},
		() => {
			// Merge PNMLs together
			return gulp.src(['src/*.pnml'])
				.pipe(plugins.rename((path) => {
					path.extname = '.nml';
				}))
				.pipe(plugins.include({
					basePath: 'src/',
					prefix: '#',
				}))
				.pipe(plugins.jsonReplace({
					src: 'package.json',
				}))
				.pipe(gulp.dest('build/'));
		},
	),
	() => {
		// Compile NMLs
		return gulp.src(['build/*.nml'])
			.pipe(plugins.exec('nmlc <%= file.path %> --default-lang=en.lng --lang-dir=build/lang', {
			}))
			.pipe(plugins.exec.reporter({
				strerr: true,
				strout: true,
				err: true,
			}));
	},
));
