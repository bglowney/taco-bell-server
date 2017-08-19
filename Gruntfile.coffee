module.exports = (grunt) ->
  config =
    pkg: grunt.file.readJSON 'package.json'
    clean: ['src/*.js','index.js','tst/*.js']
    ts:
      default:
        src: ['src/*.ts','index.ts','tst/*.ts']
        options:
          module: 'commonjs'
          sourceMap: false
          target: 'es6'
    execute:
      server:
        src: ['tst/test-server.js']
        options:
          cwd: 'tst/'
          args: []
    coffee:
      compile:
        options:
          bare: true
        files:
          'tst/test.js': 'tst/test.coffee'
    mochaTest:
      default:
        src: 'tst/test.js'

  grunt.initConfig config

  grunt.loadNpmTasks 'grunt-contrib-clean'
  grunt.loadNpmTasks 'grunt-ts'
  grunt.loadNpmTasks 'grunt-execute'
  grunt.loadNpmTasks 'grunt-contrib-coffee'
  grunt.loadNpmTasks 'grunt-mocha-test'

  grunt.registerTask 'default', ['ts', 'coffee:compile']
  grunt.registerTask 'server', ['execute:server']
  grunt.registerTask 'test', ['mochaTest:default']