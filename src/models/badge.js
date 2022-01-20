const { Schema, model } = require('mongoose');

const badgeSchema = new Schema({
    name: String,
    time: [String],
    requirements: [String]
});

const BADGE = model('BADGE', badgeSchema);

module.exports = {
    badgeSchema,
    BADGE
};
