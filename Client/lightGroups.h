#ifndef LIGHTGROUPS_H
#define LIGHTGROUPS_H

#include <map>
#include <string>
#include <vector>

#include "globals.h"
#include "json.hpp"

#include <iostream>

#ifdef _WIN32
#include <Windows.h>
#else
#include <unistd.h>
#endif

using json = nlohmann::json;

class LightBar {
  std::string hardwareId;
  bool powered = false;

public:
  int id;
  LightBar(std::string hwId, int givenId) {
    hardwareId = hwId;
    id = givenId;
  }

  bool getState() { return powered; }

  void setPower(bool power) { powered = power; }

  void setOpacity(int level) {
    if (level < 0 || level > 10)
      throw std::invalid_argument(
          "Power opacity must be between levels 0 to 10");
  }
};

class LightingGroup {
  std::vector<LightBar> LightBars;

public:
  LightingGroup(std::vector<std::string> hardwareIds,
                std::map<int, LightingGroup *> LightBars) {
    int prevId = LightBars.empty() ? 0 : LightBars.rbegin()->first;
    for (auto hwId : hardwareIds) {
      LightBar tmp = LightBar(hwId, ++prevId);
      LightBars[prevId] = this;
    }
  }

  void setPower(bool state) {
    for (auto bar : LightBars) {
      bar.setPower(state);
    }
  }

  void setOpacity(int level) {
    for (auto bar : LightBars) {
      bar.setOpacity(level);
    }
  }

  std::map<int, bool> getLEDStates() {
    std::map<int, bool> ret;
    for (auto bar : LightBars) {
      ret[bar.id] = bar.getState();
    }
    return ret;
  }

  void POST() {
    setPower(true);
    sleep(1000);
    setPower(false);
  }
};

namespace lgc {
void initializeLightingGroups(
    std::map<std::string, LightingGroup *> &LightingGroups,
    std::map<int, LightingGroup *> &LBCorrespondingLG, json &parsedConfig) {

  for (auto &[key, value] : parsedConfig.items()) {
    std::cout << "Board: " << key << '\n';

    if (!value.contains("groups"))
      throw std::invalid_argument(
          "Config file does not contain a \"groups\" array");
    for (const auto &group : value["groups"]) {
      std::cout << "Group ID: " << group["id"] << '\n';
      LightingGroups[group["id"].get<std::string>()] = new LightingGroup(
          group["pins"].get<std::vector<std::string>>(), LBCorrespondingLG);
    }
  }
}

void resetLightingGroups(
    std::map<std::string, LightingGroup *> &LightingGroups) {
  for (auto group : LightingGroups)
    delete group.second;

  LightingGroups.clear();
}
} // namespace lgc

#endif
