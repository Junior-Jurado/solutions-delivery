FROM public.ecr.aws/lambda/nodejs:18

# Instalar dependencias del sistema necesarias para Chromium
RUN yum install -y \
    alsa-lib \
    atk \
    cups-libs \
    gtk3 \
    libXcomposite \
    libXcursor \
    libXdamage \
    libXext \
    libXi \
    libXrandr \
    libXScrnSaver \
    libXtst \
    pango \
    xorg-x11-fonts-100dpi \
    xorg-x11-fonts-75dpi \
    xorg-x11-fonts-Type1 \
    xorg-x11-fonts-cyrillic \
    xorg-x11-fonts-misc

# Directorio de trabajo de Lambda
WORKDIR /var/task

# Copiar package.json
COPY package*.json ./

# Instalar dependencias
RUN npm install --production

# COPIAR TODO EL PROYECTO
COPY . .

# Handler
CMD [ "index.handler" ]
