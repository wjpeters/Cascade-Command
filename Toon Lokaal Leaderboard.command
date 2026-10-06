#!/bin/zsh
cd "${0:A:h}" || exit 1
rtk proxy node start.mjs --leaderboard
