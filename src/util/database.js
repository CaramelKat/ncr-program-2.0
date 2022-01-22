const mongoose = require('mongoose');
const { mongoose: mongooseConfig } = require('../config.json');
const { BADGE } = require('../models/badge');

const { uri, database, options } = mongooseConfig;

let connection;

async function connect() {
    await mongoose.connect(`${uri}/${database}`, options);

    connection = mongoose.connection;
    connection.on('error', console.error.bind(console, 'connection error:'));
}

function verifyConnected() {
    if (!connection) {
        throw new Error('Cannot make database requests without being connected');
    }
}

async function getBadges() {
    verifyConnected();
    return BADGE.find({});
}

module.exports = {
    connect,
    getBadges
}
