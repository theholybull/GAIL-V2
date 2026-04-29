import { HARDWIRED_COMMANDS } from "../../shared/command-definitions/hardwired-commands";

export class CommandBroker {
  list() {
    return HARDWIRED_COMMANDS;
  }
}
