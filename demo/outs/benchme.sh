#!/bin/zsh
ts=$(date +%s%N)
$@
echo $((($(date +%s%N) - $ts)/1000000))