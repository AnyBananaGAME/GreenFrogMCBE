/**
 * ░██████╗░██████╗░███████╗███████╗███╗░░██╗███████╗██████╗░░█████╗░░██████╗░
 * ██╔════╝░██╔══██╗██╔════╝██╔════╝████╗░██║██╔════╝██╔══██╗██╔══██╗██╔════╝░
 * ██║░░██╗░██████╔╝█████╗░░█████╗░░██╔██╗██║█████╗░░██████╔╝██║░░██║██║░░██╗░
 * ██║░░╚██╗██╔══██╗██╔══╝░░██╔══╝░░██║╚████║██╔══╝░░██╔══██╗██║░░██║██║░░╚██╗
 * ╚██████╔╝██║░░██║███████╗███████╗██║░╚███║██║░░░░░██║░░██║╚█████╔╝╚██████╔╝
 * ░╚═════╝░╚═╝░░╚═╝╚══════╝╚══════╝╚═╝░░╚══╝╚═╝░░░░░╚═╝░░╚═╝░╚════╝░░╚═════╝░
 *
 *
 * Copyright 2023 andriycraft
 * Github: https://github.com/andriycraft/GreenFrogMCBE
 */
const { players } = require("../api/player/PlayerInfo");

const { getKey } = require("../utils/Language");

/**
 * @type {import('../type/Command').Command}
 */
module.exports = {
	data: {
		name: getKey("commands.time.name"),
		description: getKey("commands.time.description"),
		minArgs: 1,
		maxArgs: 1,
		requiresOp: true,
	},

	execute(_server, player, args) {
		const time = args[0];

		const setTime = time === getKey("commands.time.times.day") ? 1000 : time === getKey("commands.time.times.night") ? 17000 : parseInt(time, 10);

		if (!Number.isInteger(setTime)) {
			player.sendMessage(getKey("commands.time.execution.failed"));
			return;
		}

		for (const player of players) {
			const parsedTime = parseInt(time);

			player.world.setTime(parsedTime);
			player.setTime(parsedTime);
		}

		player.sendMessage(getKey("commands.time.execution.success").replace("%s%", time));
	},
};
