'use strict';

const argv = require('yargs')
	.help('?')
	.epilog(' ©2018 Sam Grundman')
	.argv;

const replace = require('@yodasws/gulp-json-replace');
const include = require('gulp-file-includer');
const rename = require('gulp-rename');
const exec = require('gulp-exec');
const gulp = require('gulp');
const fs = require('fs');
const packageJson = JSON.parse(fs.readFileSync('./package.json'));

gulp.task('default', gulp.series(
	gulp.parallel(
		() => {
			return gulp.src(['src/**/*.{lng,txt}'])
				.pipe(replace({
					src: 'package.json',
				}))
				.pipe(gulp.dest('.'));
		},
		() => {
			return gulp.src(['*.pnml'])
				.pipe(rename((path) => {
					path.extname = '.nml';
				}))
				.pipe(include({
					basePath: 'src',
					prefix: '#',
				}))
				.pipe(replace({
					src: 'package.json',
				}))
				.pipe(gulp.dest('.'));
		}
	),
	() => {
		return gulp.src(['*.nml'])
			.pipe(exec('nmlc <%= file.path %> --default-lang=en.lng', {
			}))
			.pipe(exec.reporter({
				strerr: true,
				strout: true,
				err: true,
			}));
	}
));
