#!/bin/bash

apt-get update
apt-get install -y graphviz
export PATH=$PATH:/usr/local/bin/graphviz/bin
