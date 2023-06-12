#include <chrono>
#include <queue>
#include <string>
#include <vector>

#include "commands.h"
#include "globals.h"
#include "json.hpp"
#include "lightGroups.h"
#include "wsCommands.h"

// For testing & debug purposes
#include <fstream>
#include <iostream>

using json = nlohmann::json;

std::map<std::string, LightingGroup *> LightingGroups;
std::map<int, LightingGroup *> LBCorrespondingLG;

std::queue<std::pair<int, ltc::LGCommand *>> Commands;

enum class BoardStatus { idle, processing, playing };

BoardStatus boardStatus;

ServerOffset serverOffset;
long long showStartTime;

void showLoop() {
  if (Commands.empty()) {
    boardStatus = BoardStatus::idle;
    return;
  }

  auto currentTime = std::chrono::high_resolution_clock::now();
  auto milliseconds = std::chrono::duration_cast<std::chrono::milliseconds>(
                          currentTime.time_since_epoch())
                          .count();
  milliseconds -= showStartTime;

  while (Commands.front().first < milliseconds) {
    Commands.front().second->executeCommand();
    delete Commands.front().second;
    Commands.pop();
  }
}

int main() {
  json configJson, danceJson;
  std::ifstream spConfig("sample_jsons/sample_config.json");
  spConfig >> configJson;
  spConfig.close();
  std::ifstream sdConfig("sample_jsons/sample_dance.json");
  sdConfig >> danceJson;
  sdConfig.close();

  lgc::initializeLightingGroups(LightingGroups, LBCorrespondingLG, configJson);

  std::cout << "Initialized lighting groups:" << std::endl;
  for (auto it : LightingGroups) {
    std::cout << it.first << std::endl;
  }

  Commands = ltc::parseJSON(danceJson, LightingGroups);

  while (boardStatus == BoardStatus::playing) {
    showLoop();
  }

  lgc::resetLightingGroups(LightingGroups);
}