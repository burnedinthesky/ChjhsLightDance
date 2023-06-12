#ifndef WSCOMMANDS_H
#define WSCOMMANDS_H

#include <map>
#include <string>

#include "commands.h"
#include "globals.h"
#include "json.hpp"
#include "lightGroups.h"

std::map<std::string, LightingGroup *> LightingGroups;
std::map<int, LightingGroup *> LBCorrespondingLG;
std::queue<std::pair<int, ltc::LGCommand *>> Commands;

ServerOffset serverOffset;
BoardStatus boardStatus;

long long showStartTime;

using json = nlohmann::json;

namespace wsc {

void recieveMessage(std::string content) {
  json message = json::parse(content);

  if (message["command"] == "setConfig") {
    lgc::initializeLightingGroups(LightingGroups, LBCorrespondingLG,
                                  message["payload"]);

  } else if (message["command"] == "setDance") {
    ltc::parseJSON(message["payload"], LightingGroups);

  } else if (message["command"] == "callibrateTime") {
    if (serverOffset.localReference == -10000000)
      throw std::invalid_argument("Local reference not set");

    serverOffset.serverReference =
        std::stoi(message["payload"].get<std::string>());
    serverOffset.timeOffset =
        serverOffset.localReference - serverOffset.serverReference;
    serverOffset.initialized = true;

  } else if (message["command"] == "startShow") {
    if (boardStatus != BoardStatus::idle)
      throw std::runtime_error("Board is not idle");
    if (!serverOffset.initialized)
      throw std::runtime_error("Time is not callibrated");
    if (Commands.empty())
      throw std::runtime_error("No commands to play");

    boardStatus = BoardStatus::playing;
    showStartTime = std::stoi(message["payload"].get<std::string>()) +
                    serverOffset.timeOffset;
  } else if (message["command"] == "stopShow") {
    boardStatus = BoardStatus::idle;
    showStartTime = 0;
    while (!Commands.empty()) {
      delete Commands.front().second;
      Commands.pop();
    }
  } else
    throw std::invalid_argument("Invalid command");
}

} // namespace wsc

#endif