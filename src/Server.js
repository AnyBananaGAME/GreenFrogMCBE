/** This file is the main file that start the server and manages it */
/* eslint-disable no-unsafe-finally */

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
const VersionToProtocol = require("./utils/VersionToProtocol");

const ServerInfo = require("./api/ServerInfo");
const PlayerInfo = require("./api/PlayerInfo");
const Frog = require('./Frog')

const GarbageCollector = require("./utils/GarbageCollector");
const ValidateClient = require("./player/ValidateClient");
const PlayerInit = require("./server/PlayerInit");

const DefaultWorld = require("./world/DefaultWorld");

const Logger = require("./server/Logger");

const PluginLoader = require("./plugins/PluginLoader");
const ResponsePackInfo = require("./network/packets/ServerResponsePackInfoPacket");
const ServerInternalServerErrorEvent = require("./events/ServerInternalServerErrorEvent");
const PlayerConnectionCreateEvent = require("./events/PlayerConnectionCreateEvent");

const { RateLimitError } = require("./utils/exceptions/RateLimitException");

const FrogProtocol = require("frog-protocol");

const assert = require("assert");

const path = require("path");
const fs = require("fs");

process.env.DEBUG = Frog.isDebug ? "minecraft-protocol" : "";

let clients = [];
let server = null;
let config = null;
let lang = null;

module.exports = {
	/** Client list */
	clients: clients,
	/** The server object */
	server: server,
	/** Config as JSON */
	config: config,
	/** Language as JSON */
	lang: lang,

	/**
	 * Loads JSON files into the server
	 * @private
	 */
	async _initJson() {
		config = ServerInfo.config;
		lang = ServerInfo.lang;
	},

	/**
	 * Handles critical errors
	 * @private
	 */
	async _handleCriticalError(err) {
		if (err.toString().includes("Server failed to start")) {
			Logger.error(lang.errors.failedToBind.replace("%address%", `${config.host}:${config.port}`));
			Logger.error(lang.errors.otherServerRunning);
			process.exit(config.crashCode);
		}
		Logger.error(`Server error: \n${err.stack}`);
		if (!config.unstable) process.exit(config.crashCode);
	},

	/**
	 * Handles packets
	 * @private
	 */
	async __handlePacket(client, packetparams) {
		if (client.offline) return;

		const packetsDir = path.join(__dirname, "network", "packets");

		let exist = false;

		fs.readdirSync(packetsDir).forEach((filename) => {
			if (filename.startsWith("Client") && filename.endsWith(".js")) {
				const packetPath = path.join(packetsDir, filename);
				try {
					if (++client.packetCount > 2000) {
						Frog.eventEmitter.emit('packetRatelimit', {
							player: client,
							server: this,
							cancel() {
								return true;
							},
						});
						throw new RateLimitError(`Too many packets from ${client.username} (${client.packetCount})`);
					}

					const packet = new (require(packetPath))();
					if (packet.getPacketName() === packetparams.data.name) {
						Frog.eventEmitter.emit('packetRead', {
							player: client,
							data: packet.data,
							server: this,
							cancel() {
								return true;
							},
						});
						packet.readPacket(client, packetparams, this);
						exist = true;
					}
				} catch (e) {
					client.kick(lang.kickmessages.invalidPacket);
					Frog.eventEmitter.emit('packetReadError', {
						player: client,
						error: e,
						server: this,
						cancel() {
							return false;
						},
					});
					Logger.error(`${lang.errors.packetHandlingException.replace("%player%", client.username).replace("%error%", e.stack)}`);
				}
			}
		});

		if (!exist && config.logUnhandledPackets) {
			Logger.warning(lang.devdebug.unhandledPacket);
			console.info("%o", packetparams);
		}
	},

	/**
	 * @private
	 */
	async _onJoin(client, server) {
		await PlayerInit._initPlayer(client, server);
		await ValidateClient._initAndValidateClient(client);

		client.world = null; // This gets initialised in PlayerResourcePacksCompletedEvent
		Object.assign(client, { x: 0, y: 0, z: 0 }); // Player coordinates
		Object.assign(client, { health: 20, hunger: 20, chunksEnabled: true, packetCount: 0 }); // Network stuff
		Object.assign(client, { dead: false, offline: false, initialised: false, isConsole: true, fallDamageQueue: 0 }); // API fields

		setInterval(() => {
			client.packetCount = 0;
		}, 1000);

		const playerConnectionEvent = new PlayerConnectionCreateEvent();
		playerConnectionEvent.server = this;
		playerConnectionEvent.player = client;
		playerConnectionEvent.execute();

		PlayerInfo.addPlayer(client);

		if (PlayerInfo.players.length > config.maxPlayers) {
			client.kick(lang.kickmessages.serverFull);
			return;
		}

		if (!(client.version === VersionToProtocol.getProtocol(config.version)) && !config.multiProtocol) {
			client.kick(lang.kickmessages.versionMismatch.replace("%version%", config.version));
			return;
		}

		const responsepackinfo = new ResponsePackInfo();
		responsepackinfo.setMustAccept(true);
		responsepackinfo.setHasScripts(false);
		responsepackinfo.setBehaviorPacks([]);
		responsepackinfo.setTexturePacks([]);
		responsepackinfo.writePacket(client);
	},

	/**
	 * It logs a warning if the config.debug or config.unstable is true.
	 * @private
	 */
	async _initDebug() {
		if (config.unstable) Logger.warning(lang.devdebug.unstableWarning);
		if (process.env.DEBUG === "minecraft-protocol" || config.debug) Logger.debug(lang.errors.debugWarning);
	},

	/**
	 * It loads the config, lang files, and commands, then loads the plugins and starts the server.
	 */
	async start() {
		await this._initJson();

		await assert(parseInt(config.garbageCollectorDelay), NaN);
		await assert(parseInt(config.randomTickSpeed), NaN);

		if (!fs.existsSync("ops.yml")) {
			fs.writeFile("ops.yml", "", (err) => {
				if (err) throw err;
			});
		}

		if (!fs.existsSync("world")) fs.mkdirSync("world");

		console.clear()

		Logger.info(lang.server.loadingServer);
		Logger.info(lang.commands.verInfo.replace("%version%", ServerInfo.minorServerVersion));

		process.on("uncaughtException", (err) => this._handleCriticalError(err));
		process.on("uncaughtExceptionMonitor", (err) => this._handleCriticalError(err));
		process.on("unhandledRejection", (err) => this._handleCriticalError(err));

		this._initDebug();

		PluginLoader.loadPlugins();

		this._listen();

		setInterval(() => {
			GarbageCollector.gc();
		}, parseInt(config.garbageCollectorDelay));

		setInterval(() => {
			const serverLocalWorld = new DefaultWorld();
			serverLocalWorld.tick();
		}, parseInt(config.randomTickSpeed));
	},

	/**
	 * @private
	 */
	_listen() {
		const { host, port, version, offlineMode: offline, maxPlayers, motd } = config;

		try {
			const server = FrogProtocol.createServer({
				host,
				port,
				version,
				offline,
				maxPlayers,
				motd: {
					motd: motd,
					levelName: "GreenFrog",
				},
			});

			Logger.info(`${lang.server.listeningOn.replace(`%address%`, `/${host}:${port}`)}`);

			server.on("connect", (client) => {
				client.on("join", () => {
					this._onJoin(client, this);
				});

				client.on("packet", (packet) => {
					try {
						this.__handlePacket(client, packet);
					} catch (e) {
						client.kick(lang.kickmessages.invalidPacket);

						const internalerrorevent = new ServerInternalServerErrorEvent();
						internalerrorevent.server = this;
						internalerrorevent.error = e;
						internalerrorevent.execute();
						Logger.error(`${lang.errors.packetHandlingException.replace("%player%", client.username).replace("%error%", e.stack)}`);
					}
				});
			});
		} catch (e) {
			Logger.error(`${lang.errors.listeningFailed.replace(`%address%`, `/${host}:${port}`).replace("%error%", e.stack)}`);
			process.exit(config.exitCode);
		}
	},

	/**
	 * Shutdowns the server.
	 */
	async shutdown() {
		await require("./server/ConsoleCommandSender").close();
		Logger.info(lang.server.stoppingServer);

		try {
			for (const player of PlayerInfo.players) {
				if (!player.offline) player.kick(lang.kickmessages.serverShutdown);
			}
		} catch (ignored) {
			/* ignored */
		}

		setTimeout(() => {
			PluginLoader.unloadPlugins();
		}, 1000);
	},
};
