/**
 * Auth Services Index
 *
 * Central export point for all authentication related services
 */

const authService = require("./authService");
const universalAuthService = require("./universalAuthService");

module.exports = {
	authService,
	universalAuthService,
};
