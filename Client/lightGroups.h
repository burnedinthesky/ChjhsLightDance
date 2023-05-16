#ifndef LIGHTGROUPS_H
#define LIGHTGROUPS_H

#include <map>
#include <string>
#include <vector>

#ifdef _WIN32
#include <Windows.h>
#else
#include <unistd.h>
#endif


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

  void setPower(bool power) {
      powered = power;
  }

  void setOpacity(int level) {
    if (level < 0 || level > 10) throw std::invalid_argument("Power opacity must be between levels 0 to 10");

  }
};

class LightingGroup {
  std::vector<LightBar> LightBars;

public:
  LightingGroup(std::vector<std::string> hardwareIds,
                std::map<int, LightingGroup*> LightBars) {
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

#endif