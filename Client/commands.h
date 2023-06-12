#ifndef COMMANDS_H
#define COMMANDS_H

#include <queue>
#include <string>
#include <vector>

#include <algorithm>
#include <functional>

#include "json.hpp"
#include "lightGroups.h"

#include <iostream>

using json = nlohmann::json;

namespace ltc {

enum class CommandType { setPower, setOpacity };

class LGCommand {
  CommandType commandType;
  LightingGroup &targetLG;
  std::function<void()> executeFn;

  void parseCommand(std::vector<std::string> &params) {
    switch (commandType) {
    case CommandType::setPower: {
      bool powerState = std::stoi(params[0]);
      executeFn = [this, powerState]() {
        std::cout << "Setting power to " << powerState << std::endl;
        targetLG.setPower(powerState);
      };
      break;
    }
    case CommandType::setOpacity: {
      bool opacityLevel = std::stoi(params[0]);
      executeFn = [this, opacityLevel]() {
        std::cout << "Setting opacity to " << opacityLevel << std::endl;
        targetLG.setOpacity(opacityLevel);
      };
      break;
    };
    default:
      throw std::invalid_argument("LGCommand command type not initalized");
    };
  }

public:
  LGCommand(LightingGroup &inputLG, std::string command) : targetLG(inputLG) {
    std::vector<std::string> func;
    std::string tmp;
    for (char c : command) {
      if (c == ';') {
        func.push_back(tmp);
        tmp = "";
      } else {
        tmp += c;
      }
    }
    func.push_back(tmp);
    std::string strCommandType = func[0];
    func.erase(func.begin());

    targetLG = inputLG;

    if (strCommandType == "setPower")
      commandType = CommandType::setPower;
    else if (strCommandType == "setOpacity")
      commandType = CommandType::setOpacity;
    else
      throw std::invalid_argument("Invalid command type");

    parseCommand(func);
  }

  void executeCommand() {
    std::cout << "Executing command: " << std::endl;
    std::cout << "Command type: " << (int)commandType << std::endl;
    if (!executeFn)
      throw std::invalid_argument("LGCommand executeFn not initialized");
    executeFn();
    std::cout << std::endl;
  }
};

std::queue<std::pair<int, LGCommand *>>
parseJSON(json actions,
          std::map<std::string, LightingGroup *> &lightingGroups) {

  std::vector<std::pair<int, LGCommand *>> LGCommands;

  for (json::iterator it = actions.begin(); it != actions.end(); ++it) {
    std::string boardId = it.key();
    for (auto &boardActions : it.value()) {
      for (auto &item : boardActions.items()) {
        int triggerTime = std::stoi(item.key());
        LGCommand *tmp = new LGCommand(*lightingGroups[boardId], item.value());
        LGCommands.push_back({triggerTime, tmp});
      }
    }
  }

  std::sort(LGCommands.begin(), LGCommands.end());

  std::queue<std::pair<int, LGCommand *>> orderedLGCommands;

  for (auto element : LGCommands) {
    orderedLGCommands.push(element);
  }

  return orderedLGCommands;
};

} // namespace ltc

#endif