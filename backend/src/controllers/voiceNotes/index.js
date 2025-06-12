/**
 * Voice Notes Controllers Index
 *
 * Central export point for all voice note related controllers
 */

const voiceNoteController = require("./voiceNoteController");
const interactionController = require("./interactionController");
const feedController = require("./feedController");

module.exports = {
	voiceNoteController,
	interactionController,
	feedController,
};
