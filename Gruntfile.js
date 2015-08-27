var openBrowser = require('open'),
    config = require('./modules/config');

module.exports = function (grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concurrent: {
      dev: {
        tasks: ['watch', 'exec:mongo', 'nodemon:dev'],
        options: {
          logConcurrentOutput: true
        }
      },
      notProd: {
        tasks: ['exec:mongo', 'nodemon:notProd'],
        options: {
          logConcurrentOutput: true
        }
      },
      prod: {
        tasks: ['exec:mongo', 'nodemon:prod'],
        options: {
          logConcurrentOutput: true
        }
      }
    },

    copy: {
      fonts: {
        expand: true,
        cwd: 'src/',
        src: 'fonts/*',
        dest: 'public/',
        filter: 'isFile'
      },
      images: {
        expand: true,
        cwd: 'src/',
        src: 'images/*',
        dest: 'public/',
        filter: 'isFile'
      },
      quotes: {
        src: 'src/quotes.json',
        dest: 'public/quotes.json'
      }
    },

    exec: {
      mongo: 'mongod --config /usr/local/etc/mongod.conf'
    },

    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        files: {
          'public/index.html': 'src/index.html',
        }
      }
    },

    ngconstant: {
      dist: {
        options: {
          name: 'FitbitLeaderboard.constants',
          dest: 'src/js/constants.js'
        },
        constants: {
          config: {
            startDate: config.startDate,
            endDate: config.endDate,
            updateInterval: config.updateInterval
          }
        }
      }
    },

    nodemon: {
      dev: {
        script: 'bin/www',
        options: {
          nodeArgs: ['--debug'],
          env: {
            PORT: '5455'
          },
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });

            // opens browser on initial server start
            nodemon.on('config:update', function () {
              // Delay before server listens on port
              setTimeout(function () {
                openBrowser('http://127.0.0.1:5455');
              }, 1000);
            });

            // refreshes browser when server reboots
            nodemon.on('restart', function () {
              // Delay before server listens on port
              setTimeout(function () {
                require('fs').writeFileSync('.rebooted', 'rebooted');
              }, 1000);
            });
          }
        }
      },
      notProd: {
        script: 'bin/www',
        options: {
          env: {
            PORT: '5455',
            NODE_ENV: 'not-production'
          },
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });
          }
        }
      },
      prod: {
        script: 'bin/www',
        options: {
          env: {
            PORT: '5455',
            NODE_ENV: 'production'
          },
          callback: function (nodemon) {
            nodemon.on('log', function (event) {
              console.log(event.colour);
            });
          }
        }
      }
    },

    sass: {
      options: {
        sourceMap: true
      },
      dist: {
        files: {
          'public/styles.css': 'src/scss/main.scss'
        }
      }
    },

    uglify: {
      dist: {
        options: {
          sourceMap: true
        },
        files: {
          'public/scripts.js': [
            'bower_components/angular/angular.js',
            'bower_components/angular-route/angular-route.js',
            'bower_components/momentjs/moment.js',
            'src/js/app.js',
            'src/js/constants.js',
            'src/js/controllers.js',
            'src/js/directives.js',
            'src/js/filters.js',
            'src/js/services.js'
          ]
        }
      }
    },

    watch: {
      options: {
        atBegin: true
      },
      config: {
        files: ['config.json'],
        tasks: ['ngconstant:dist']
      },
      copy: {
        files: ['src/images/**/*', 'src/fonts/**/*', 'src/quotes.json'],
        tasks: ['copy']
      },
      html: {
        files: ['src/**/*.html'],
        tasks: ['htmlmin:dist']
      },
      scripts: {
        files: ['src/js/**/*.js'],
        tasks: ['uglify:dist']
      },
      scss: {
        files: ['src/scss/**/*.scss'],
        tasks: ['sass:dist']
      }
    }
  });

  grunt.loadNpmTasks('grunt-concurrent');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-htmlmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-exec');
  grunt.loadNpmTasks('grunt-ng-constant');
  grunt.loadNpmTasks('grunt-nodemon');
  grunt.loadNpmTasks('grunt-sass');


  grunt.registerTask('build', ['copy', 'ngconstant:dist', 'sass:dist', 'uglify:dist', 'htmlmin:dist']);
  grunt.registerTask('dev', ['copy', 'concurrent:dev']);
  grunt.registerTask('prod', ['build', 'nodemon:prod']);
  grunt.registerTask('not-prod', ['build', 'nodemon:notProd']);
  grunt.registerTask('default', ['dev']);
};
