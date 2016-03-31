/* File: gulpfile.js */

var gulp  = require('gulp'),
  fs = require('fs'),
  path = require('path'),
  os = require('os'),
  jshint = require('gulp-jshint'),
  uglify = require('gulp-uglify'),
  mocha = require('gulp-mocha'), // jshint ignore: line
  rename = require('gulp-rename'),
  argv = require('yargs').argv,
  gulp_ssh = require('gulp-ssh'),
  gulp_delete = require('del'),
  zip = require('gulp-zip'),
  install = require('gulp-install'),
  package = require('./package.json');

// Deploy tasks

try
{
  var ssh_config = JSON.parse(fs.readFileSync('.sshrc', 'utf8'));
  var remote_path = path.resolve('/home/rain/website/app/releases/', package.name, os.type().toLowerCase() + '-' + os.arch(), argv.production ? 'production/' : 'development/');
  var endpoint = 'https://rain.vg/releases/' +  package.name + '/' + os.type().toLowerCase() + '-' + os.arch() + '/' + (argv.production ? 'production/' : 'development/');

  var ssh = new gulp_ssh({
    sshConfig: ssh_config
  });

  gulp.task('delete_modules', function()
  {
    return gulp_delete(['node_modules']);
  });

  gulp.task('install_dependencies', ['delete_modules'], function()
  {
    return gulp.src(['./package.json']).pipe(install({production: true}));
  });

  gulp.task('pack', ['install_dependencies'], function()
  {
    return gulp.src(['*', '!.git*', '!.jshint', '!gulpfile.js']).pipe(zip(package.version + '.zip')).pipe(gulp.dest('tmp/'));
  });

  gulp.task('transfer', ['pack'], function()
  {
    return gulp.src(['tmp/**/*']).pipe(ssh.dest(path.resolve(remote_path, 'versions/')));
  });

  gulp.task('edit_json', ['transfer'], function()
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

  gulp.task('install_dev_dependencies', ['edit_json'], function()
  {
    return gulp.src(['./package.json']).pipe(install({
      args: ['--onley=dev']
    }));
  });

  gulp.task('delete_temp_files', ['install_dev_dependencies'], function()
  {
    return gulp_delete(['tmp']);
  });

  gulp.task('deploy', ['delete_temp_files'], function()
  {
  });
}
catch(e)
{
  console.log('ssh private key not found or not valid.');
}

// Lint tasks

gulp.task('default', ['lint','test', 'minify'], function()
{
});

gulp.task('lint', function()
{
  return gulp.src('./src/*.js').pipe(jshint()).pipe(jshint.reporter('jshint-stylish')).pipe(jshint.reporter('fail'));
});

gulp.task('minify', ['lint', 'test'], function()
{
  return gulp.src('src/index.js').pipe(uglify()).pipe(rename({suffix: '.min'})).pipe(gulp.dest('dist'));
});

gulp.task('test', ['lint'], function()
{
  return gulp.src('test/index.js', {read: false}).pipe(mocha()).once('error', function()
  {
    process.exit(1);
  });
});
