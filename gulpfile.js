/* File: gulpfile.js */

var gulp  = require('gulp'),
  fs = require('fs'),
  os = require('os'),
  jshint = require('gulp-jshint'),
  uglify = require('gulp-uglify'),
  mocha = require('gulp-mocha'), // jshint ignore: line
  argv = require('yargs').argv,
  gulp_ssh = require('gulp-ssh'),
  gulp_delete = require('del'),
  zip = require('gulp-zip'),
  install = require('gulp-install'),
  jeditor = require('gulp-json-editor'),
  package = require('./package.json');

// Deploy tasks

try
{
  var ssh_config = JSON.parse(fs.readFileSync('.sshrc', 'utf8'));
  var scheme = argv.production ? 'production' : (argv.development ? 'development' : 'buggy');
  var remote_path = '/home/rain/website/app/releases/' + package.name + '/' + os.type().toLowerCase() + '-' + os.arch() + '/' + scheme + '/';
  var endpoint = 'https://rain.vg/releases/' +  package.name + '/' + os.type().toLowerCase() + '-' + os.arch() + '/' + scheme + '/';

  var ssh = new gulp_ssh({
    sshConfig: ssh_config
  });

  gulp.task('change_scheme', function()
  {
    gulp.src('./package.json').pipe(jeditor({
      'scheme': scheme
    })).pipe(gulp.dest('.'));
  });

  gulp.task('delete_node_modules', ['change_scheme'], function()
  {
    return gulp_delete(['node_modules']);
  });

  gulp.task('install_npm_dependencies', ['delete_node_modules'], function()
  {
    return gulp.src(['./package.json']).pipe(install({production: true}));
  });

  gulp.task('install_bower_dependencies', ['install_npm_dependencies'], function()
  {
    return gulp.src(['./bower.json']).pipe(install());
  });

  gulp.task('zip', ['install_bower_dependencies'], function()
  {
    return gulp.src(['./**/*', '!.git*', '!.jshint*', '!gulpfile.js', '!.sshrc']).pipe(zip(package.version + '.zip')).pipe(gulp.dest('tmp/'));
  });

  gulp.task('scp', ['zip'], function()
  {
    return gulp.src(['tmp/**/*']).pipe(ssh.dest(remote_path + '/versions/'));
  });

  gulp.task('package_deploy', ['scp'], function()
  {
    var distro_package = {
      'version': package.version,
      'latest': {
        'url': endpoint + 'versions/' + package.version + '.zip'
      }
    };

    fs.writeFile('tmp/package', JSON.stringify(distro_package, null, 4), function()
    {
      gulp.src(['tmp/package']).pipe(ssh.dest(remote_path));
    });
  });

  gulp.task('restore_dev_dependencies', ['package_deploy'], function()
  {
    return gulp.src(['./package.json']).pipe(install({
      args: ['--only=dev']
    }));
  });

  gulp.task('delete_tmp', ['restore_dev_dependencies'], function()
  {
    return gulp_delete(['tmp']);
  });

  gulp.task('deploy', ['delete_tmp'], function()
  {
  });
}
catch(e)
{
  console.log('ssh private key not found or not valid.');
}

// Lint tasks

gulp.task('default', ['lint', 'test', 'minify'], function()
{
});

gulp.task('lint', function()
{
  return gulp.src('src/**/*.js').pipe(jshint()).pipe(jshint.reporter('jshint-stylish')).pipe(jshint.reporter('fail'));
});

gulp.task('minify', ['lint', 'test'], function()
{
  return gulp.src(['src/**/*.js']).pipe(uglify()).pipe(gulp.dest('dist'));
});

gulp.task('test', ['lint'], function()
{
  return gulp.src('test/*.js', {read: false}).pipe(mocha()).once('error', function()
  {
    process.exit(1);
  });
});
