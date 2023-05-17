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

void timedTrigger(int time) {

}

void initializeLightingGroups() {
  LightingGroups["b1g1"] = new LightingGroup({}, {});
  LightingGroups["b1g2"] = new LightingGroup({}, {});
}

void destoryAllLightingGroups() {

}

int main() {
  json danceJson;
  std::ifstream file("sample_dance.json");
  file >> danceJson;

  initializeLightingGroups();
  std::queue<std::pair<int, ltc::LGCommand*>> Commands = ltc::parseJSON(danceJson, LightingGroups);
  while (!Commands.empty()) {
    std::cout << Commands.front().first << std::endl;
    delete Commands.front().second;
    Commands.pop();
  }


}