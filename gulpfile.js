var gulp = require('gulp');
var sass = require('gulp-sass');
var inject = require('gulp-inject');
var wiredep = require('wiredep').stream;
var del = require('del');
var mainBowerFiles = require('main-bower-files');
var filter = require('gulp-filter');
var concat = require('gulp-concat');
var csso = require('gulp-csso');
var nunjucksRender = require('gulp-nunjucks-render');
var runSequence = require('run-sequence');

gulp.task('clean', function(cb){
  del(['build', 'dist'], cb);
});

gulp.task('watch', function() {
  gulp.watch('src/**/*.+(html|nunjucks)', function(done) {
    runSequence(
      'build-html',
      'build-nj',
      'nunjucks'
      );
  });
  gulp.watch('src/**/*.scss', function(done) {
    runSequence('styles','copy-css');
  });
  gulp.watch('src/global/**/*.scss', function(done) {
    runSequence('styles','copy-css');
  });
  gulp.watch('src/styles/**/*.scss',function(done) {
    runSequence('styles','copy-css');
  });
  gulp.watch('src/js/**/*.js',function(done) {
    runSequence('build-js','copy-js');
  });
});

gulp.task('styles', function(){
  var injectAppFiles = gulp.src('src/styles/*.scss', { read: false });
  var injectGlobalFiles = gulp.src('src/global/*.scss', { read: false });

  function transformFilepath(filepath) {
    return '@import "' + filepath + '";';
  }

  var injectAppOptions = {
    transform: transformFilepath,
    starttag: '// inject:app',
    endtag: '// endinject',
    addRootSlash: false
  };

  var injectGlobalOptions = {
    transform: transformFilepath,
    starttag: '// inject:global',
    endtag: '// endinject',
    addRootSlash: false
  };

  return gulp.src('src/main.scss')
    .pipe(wiredep())
    .pipe(inject(injectGlobalFiles, injectGlobalOptions))
    .pipe(inject(injectAppFiles, injectAppOptions))
    .pipe(sass())
    .pipe(csso())
    .pipe(gulp.dest('build/assets/styles'));
});

gulp.task('vendors', function(){
  return gulp.src(mainBowerFiles())
    .pipe(filter('*.css'))
    .pipe(concat('vendors.css'))
    .pipe(csso())
    .pipe(gulp.dest('build/assets/styles'));
});

gulp.task('build-js', function() {
  return gulp.src('src/js/**/*.js')
    .pipe(gulp.dest('build/assets/js'));
});

gulp.task('build-nj', function() {
  return gulp.src('src/views/**/*.*')
    .pipe(gulp.dest('build/views/'));
});

gulp.task('build-html', function() {
  var injectFiles = gulp.src([
    'build/assets/styles/main.css',
    'build/assets/styles/vendors.css',
    'build/assets/js/**/*.js']);
  var injectOptions = {
    addRootSlash: 'true',
    ignorePath: ['src', 'build']
  };
  return gulp.src('src/index.html')
    .pipe(inject(injectFiles, injectOptions))
    .pipe(gulp.dest('build'));
});

gulp.task('nunjucks', function() {
  return gulp.src('build/views/**/*.+(html|nunjucks)')
  .pipe(nunjucksRender({
    path: ['build']
  }))
  .pipe(gulp.dest('dist'));
})

gulp.task('copy-js', function() {
  return gulp.src('build/assets/js/**/*.js')
    .pipe(gulp.dest('dist/assets/js'));
})

gulp.task('copy-css', function() {
  return gulp.src('build/assets/styles/**/*.css')
    .pipe(gulp.dest('dist/assets/styles'));
})

gulp.task('default', ['clean'], function(done) {
  runSequence(
    'vendors',
    'styles',
    'build-js',
    'build-html',
    'build-nj',
    'copy-js',
    'copy-css',
    'nunjucks',
    function() {
      gulp.start('watch');
    });
});
