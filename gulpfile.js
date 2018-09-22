'use strict';

const argv = require('yargs')
	.help('?')
	.epilog(' ©2018 Sam Grundman')
	.argv;

const include = require('@yodasws/gulp-file-includer');
const replace = require('@yodasws/gulp-json-replace');
const rename = require('gulp-rename');
const exec = require('gulp-exec');
const gulp = require('gulp');
const fs = require('fs');

gulp.task('default', gulp.series(
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
				.pipe(rename((path) => {
					path.extname = '.nml';
				}))
				.pipe(include({
					basePath: 'src/',
					prefix: '#',
				}))
				.pipe(replace({
					src: 'package.json',
				}))
				.pipe(gulp.dest('build/'));
		}
	),
	() => {
		// Compile NMLs
		return gulp.src(['build/*.nml'])
			.pipe(exec('nmlc <%= file.path %> --default-lang=en.lng --lang-dir=build/lang', {
			}))
			.pipe(exec.reporter({
				strerr: true,
				strout: true,
				err: true,
			}));
	}
));
