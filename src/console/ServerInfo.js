class ServerInfo {
    constructor() {
        this.players = []
        this.config = require("../../config.json")
    }

    setPlayers (players) {
        this.players = players
    }

    getPlayers () {
        return this.players;
    }

    getConfig () {
        return this.players;
    }

}

module.exports = ServerInfo;