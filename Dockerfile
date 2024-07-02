# Usa una imagen base de Python
FROM python:3.11-slim

# Instala Graphviz y sus dependencias
RUN apt-get update && apt-get install -y graphviz libgraphviz-dev pkg-config

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos necesarios al contenedor
COPY requirements.txt requirements.txt
COPY . .

# Instala las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Agrega graphviz al PATH
ENV PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/graphviz/bin:${PATH}"

# Expone el puerto que usará la aplicación
EXPOSE 5000

# Define el comando de inicio
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:crear_app()"]

