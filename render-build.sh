#!/usr/bin/env bash

# Instalar Conda
if [ ! -d "$HOME/miniconda3" ]; then
  wget https://repo.anaconda.com/miniconda/Miniconda3-latest-Linux-x86_64.sh -O miniconda.sh
  bash miniconda.sh -b -p $HOME/miniconda3
  export PATH="$HOME/miniconda3/bin:$PATH"
  conda init bash
fi

# Cargar Conda
source $HOME/miniconda3/etc/profile.d/conda.sh

# Crear un entorno Conda y activar
conda create -n myenv python=3.8 -y
conda activate myenv

# Instalar dependencias
conda install -c conda-forge graphviz python-graphviz -y

# Instalar otras dependencias con pip
pip install -r requirements.txt
