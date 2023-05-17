#include <vector>
#include <string>
#include <queue>

#include "lightGroups.h"
#include "commands.h"
#include "json.hpp"

//For testing & debug purposes
#include <iostream>
#include <fstream>

using json = nlohmann::json;

std::map<std::string, LightingGroup*> LightingGroups;
std::map<int, LightingGroup*> LBCorrespondingLG;

void timedTrigger(int time) {

}

void initializeLightingGroups(json groups) {
  for (auto& group : groups) {
    LightingGroups[group["id"].get<std::string>()] = new LightingGroup(
      group["pins"].get<std::vector<std::string>>(),
      LBCorrespondingLG
    );
  }
}

void resetLightingGroups() {
    for (auto group : LightingGroups) {
        delete group.second;
    }
    LightingGroups.clear();
}

int main() {
  json configJson, danceJson;
  std::ifstream spConfig("sample_jsons/sample_config.json");
  spConfig >> configJson;
  spConfig.close();
  std::ifstream sdConfig("sample_jsons/sample_dance.json");
  sdConfig >> danceJson;
  sdConfig.close();

  initializeLightingGroups(configJson["groups"]);
  for (auto it : LightingGroups) {
    std::cout << it.first << std::endl;
  }

  std::queue<std::pair<int, ltc::LGCommand*>> Commands = ltc::parseJSON(danceJson, LightingGroups);
  while (!Commands.empty()) {
    std::cout << Commands.front().first << std::endl;
    delete Commands.front().second;
    Commands.pop();
  }


}