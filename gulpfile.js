(function() {
	'use strict'

	require('dotenv').config()

	const gulp = require('gulp')
	const debug = require('gulp-debug')
	const gulpSequence = require('gulp-sequence')
	//var glob = require('glob');

	function getPackageJson() {
		const fs = require('fs')
		return JSON.parse(fs.readFileSync('./package.json', 'utf8'))
	}

	//--

	gulp.task('build', gulpSequence(
		'version',
		'vue:prod',
		'compress',
		'upload',
		'clean:compress'
	))

	gulp.task('version', function(){
		const bump = require('gulp-bump')

		return gulp.src(['./package.json', './index.php'])
			.pipe(bump({type:'patch'}))
			.pipe(gulp.dest('./'));

	})

	gulp.task('clean:compress', function(){
		const del = require('del')
		const pkg = getPackageJson()

		return del('../wc-change-variation-price-*.zip', {force: true})
	})

	gulp.task('vue:prod', function(cb){
		process.chdir(__dirname+'/src')
		const exec = require('gulp-exec')

		var options = {
			continueOnError: false, // default = false, true means don't emit error event
			pipeStdout: false, // default = false, true means stdout is written to file.contents
			//customTemplatingThing: "test" // content passed to gutil.template()
		}

		var reportOptions = {
			err: false, // default = true, false means don't write err
			stderr: false, // default = true, false means don't write stderr
			stdout: false // default = true, false means don't write stdout
		}

		return gulp.src('.')
			.pipe(exec('npm run build:prod', options))
			.pipe(exec.reporter(reportOptions))

	})

	gulp.task('compress', function(){
		process.chdir(__dirname)

		const zip = require('gulp-zip')
		const pkg = getPackageJson()

		return gulp
			.src(['index.php', 'dist/bundle-prod-price.js'], {
				base: '../'
			})
			.pipe(zip('wc-change-variation-price-'+ pkg.version +'.zip'))
			.pipe(gulp.dest('../'))

	})

	gulp.task('upload', function(){
		const gutil = require('gulp-util')
		const ftp = require('gulp-ftp')
		const pkg = getPackageJson()

		return gulp.src('../wc-change-variation-price-*zip')
			.pipe(ftp({
				host: process.env.FTP_HOST,
				user: process.env.FTP_USER,
				pass: process.env.FTP_PASS,
				remotePath: 'plugins/wc-change-variation-price'
			}))

			// you need to have some kind of stream after gulp-ftp to make sure it's flushed
			// this can be a gulp plugin, gulp.dest, or any kind of stream
			// here we use a passthrough stream
			.pipe(gutil.noop())
	})

}())