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
module.exports = {
  getProtocol(version) {
    switch (version) {
      case "1.19.63":
        return 568;
      case "1.19.60":
        return 567;
      case "1.19.51":
      case "1.19.50":
      case "1.19.50.25":
      case "1.19.50.24":
      case "1.19.50.23":
      case "1.19.50.22":
      case "1.19.50.21":
        return 559;
      case "1.19.50.20":
        return 558;
      case "1.19.41":
      case "1.19.40":
      case "1.19.40.24":
      case "1.19.40.23":
        return 557;
      case "1.19.40.22":
      case "1.19.40.21":
        return 555;
      case "1.19.40.20":
      case "1.19.31":
      case "1.19.30":
        return 554;
      case "1.19.30.25":
      case "1.19.30.24":
      case "1.19.30.23":
        return 553;
      case "1.19.30.22":
      case "1.19.30.21":
      case "1.19.30.20":
        return 551;
      case "1.19.22":
      case "1.19.21":
        return 545;
      case "1.19.20":
      case "1.19.20.24":
        return 544;
      case "1.19.20.23":
        return 543;
      case "1.19.20.22":
      case "1.19.20.21":
      case "1.19.20.20":
        return 542;
      default:
        return 568;
    }
  },
};
