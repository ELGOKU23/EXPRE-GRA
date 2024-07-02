# Usa una imagen base de Python
FROM python:3.11-slim

# Instala Graphviz
RUN apt-get update && apt-get install -y graphviz

# Establece el directorio de trabajo
WORKDIR /app

# Copia los archivos necesarios al contenedor
COPY requirements.txt requirements.txt
COPY . .

# Instala las dependencias de Python
RUN pip install --no-cache-dir -r requirements.txt

# Expone el puerto que usará la aplicación
EXPOSE 5000

# Define el comando de inicio
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:crear_app()"]
