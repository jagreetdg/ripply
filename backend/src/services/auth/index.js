/**
 * Auth Services Index
 *
 * Central export point for all authentication related services
 */

const authService = require("./authService");
const socialAuthService = require("./socialAuthService");

module.exports = {
	authService,
	socialAuthService,
};
