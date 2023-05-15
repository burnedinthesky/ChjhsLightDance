#include <map>

#ifdef _WIN32
#include <Windows.h>
#else
#include <unistd.h>
#endif

#include <string>
#include <vector>

class LEDBar {
  std::string hardwareId;
  bool powered = false;

public:
  int id;
  LEDBar(std::string hwId, int givenId) {
    hardwareId = hwId;
    id = givenId;
  }

  bool getState() { return powered; }

  void lightUp() { powered = true; }

  void turnOff() { powered = false; }
};

class LightingGroup {
  std::vector<LEDBar> ledBars;

public:
  LightingGroup(std::vector<std::string> hardwareIds,
                std::map<int, LightingGroup> ledBars) {
    int prevId = ledBars.empty() ? 0 : ledBars.rbegin()->first;
    for (auto hwId : hardwareIds) {
      LEDBar tmp = LEDBar(hwId, ++prevId);
      ledBars[prevId] = *this;
    }
  }

  void lightUp() {
    for (auto bar : ledBars) {
      bar.lightUp();
    }
  }

  void turnOff() {
    for (auto bar : ledBars) {
      bar.turnOff();
    }
  }

  std::map<int, bool> getLEDStates() {
    std::map<int, bool> ret;
    for (auto bar : ledBars) {
      ret[bar.id] = bar.getState();
    }
    return ret;
  }

  void POST() {
    lightUp();
    sleep(1000);
    turnOff();
  }
};