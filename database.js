const redis = require('redis');
require('dotenv').config();

const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ||6379
});

module.exports = client;