#ifndef COMMANDS_H
#define COMMANDS_H

#include <string>
#include <vector>
#include <functional>
#include <lightGroups.h>
#include <queue>
#include <algorithm>

namespace ltc {

enum class CommandType { setPower, setOpacity };

class LGCommand {
  CommandType commandType;
  LightingGroup& targetLG;
  std::function<void()> executeFn;

  void parseCommand(std::vector<std::string> &params) {
    switch (commandType) {
    case CommandType::setPower: {
      bool powerState = std::stoi(params[0]);
      executeFn = [this, powerState]() {
        targetLG.setPower(powerState);
      };
      break;
    }
    case CommandType::setOpacity: {
      bool opacityLevel = std::stoi(params[0]);
      executeFn = [this, opacityLevel]() {
        targetLG.setOpacity(opacityLevel);
      };
    };
    default:
      throw std::invalid_argument("LGCommand command type not initalized");
    };
  }

public: 
  LGCommand(LightingGroup &inputLG, std::string command) : targetLG(inputLG)  {
    std::vector<std::string> func;
    std::string tmp;
    for (char c : command) {
      if (c == ',') {
        func.push_back(tmp);
        tmp = "";
      } else {
        tmp += c;
      } 
    }
    std::string strCommandType = func[0];
    func.erase(func.begin());

    targetLG = inputLG;

    if (strCommandType == "setPower") commandType = CommandType::setPower;
    else if (strCommandType == "setOpacity") commandType = CommandType::setOpacity;
    else throw std::invalid_argument("Invalid command type");

    parseCommand(func);
  }

  void executeCommand() {
    executeFn();
  }
};

std::map<std::string, std::queue<std::pair<int, LGCommand*>>> parseJSON(
    std::vector<std::pair<std::string, std::string>> &entries,
    std::map<std::string, LightingGroup*> &lightingGroups
    ) {

  std::map<std::string, std::vector<std::pair<int, LGCommand*>>> LGCommands;
  for (auto lg : lightingGroups) {
    LGCommands[lg.first] = {};
  }

  for (auto entry : entries) {
    std::string targetLGId;
    int triggerTime;
    int delimPos = entry.second.find(";");
    targetLGId = entry.second.substr(0, delimPos);
    triggerTime = std::stoi(entry.second.substr(delimPos+1, entry.second.size() - delimPos - 1));

    LGCommand* tmp = new LGCommand(*lightingGroups[targetLGId], entry.second);
    LGCommands[targetLGId].push_back({triggerTime, tmp});
  }

  std::map<std::string, std::queue<std::pair<int, LGCommand*>>> orderedLGCommands;

  for (auto commandList : LGCommands) {
    std::sort(commandList.second.begin(), commandList.second.end());
    orderedLGCommands[commandList.first] = std::queue<std::pair<int, LGCommand*>>();
    for (auto element : commandList.second) {
      orderedLGCommands[commandList.first].push(element);
    }
    std::vector<std::pair<int, LGCommand*>>().swap(commandList.second);
  }

  return orderedLGCommands;
};

}

#endif