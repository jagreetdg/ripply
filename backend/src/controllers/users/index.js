/**
 * Users Controllers Index
 *
 * Central export point for all user related controllers
 */

const profileController = require("./profileController");
const followController = require("./followController");
const contentController = require("./contentController");

module.exports = {
	profileController,
	followController,
	contentController,
};
