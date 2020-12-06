'use strict';

const program = require('commander');
program.option('--proxy-env <proxyEnv>', 'Api environment to connect (defaults to dev)', null, 'dev');
program.parse(process.argv)

const envMap = {
  //dev: 'http://192.168.31.168:9090',
  dev: 'http://localhost:8666',
  test: 'http://192.168.21.72:9090',
};

module.exports = {
  devServer:{
      host: 'localhost',//target host
      port: 8080,
      //proxy:{'/api':{}},代理器中设置/api,项目中请求路径为/api的替换为target
      proxy:{
        '^/api/': {
          target: envMap[program.proxyEnv] || program.proxyEnv,
          logLevel: 'debug',
          onProxyRes(proxyRes) {
            proxyRes.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
          },
        },
      }
    }
  }
