#ifndef GLOBALS_H
#define GLOBALS_H

#include <map>

#include "commands.h"
#include "json.hpp"
#include "lightGroups.h"

struct ServerOffset {
  bool initialized = false;
  long long localReference = -10000000;
  long long serverReference = -10000000;
  long long timeOffset = -10000000;
};

enum class BoardStatus { idle, processing, playing };

extern std::map<std::string, LightingGroup *> LightingGroups;
extern std::map<int, LightingGroup *> LBCorrespondingLG;

extern std::queue<std::pair<int, ltc::LGCommand *>> Commands;

extern long long showStartTime = 0;

extern ServerOffset serverOffset;

extern BoardStatus boardStatus = BoardStatus::idle;

#endif