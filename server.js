'use strict';

require('dotenv').load();
const koa = require('koa');
const lynx = require('lynx');

const app = koa();
const metrics = new lynx(process.env.STATSD_HOST, process.env.STATSD_PORT, {
  scope: process.env.STATSD_KEY,
  on_error: function noop() {}
});

const env = process.env.NODE_ENV || 'stable';
const sampleRate = env === 'canary' ? 1.0 : 0.1;

// Metric logging
// Response time
// Status codes
app.use(function *(next) {
  const start = new Date();

  yield next;

  const code = Math.floor(this.status/100) * 100;
  const responseTime = new Date() - start;
  metrics.timing(`test_app.${env}.response.time`, responseTime, sampleRate);
  metrics.increment(`test_app.${env}.response.code.${code}`, sampleRate);
});

app.use(function *() {
  this.status = this.query.status ? parseInt(this.query.status, 10) : 200;
});

app.listen(process.env.PORT || 3000);
