FROM node:23.6.1-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código fuente
COPY . .

# Construir la aplicación usando npx nest build directamente
RUN echo "Starting NestJS build..." && \
    echo "Node version:" && node --version && \
    echo "NPM version:" && npm --version && \
    echo "Nest CLI available:" && npx nest --version && \
    npx nest build && \
    echo "NestJS build completed successfully"

# Verificar el resultado del build
RUN echo "=== BUILD OUTPUT VERIFICATION ===" && \
    echo "Current directory:" && pwd && \
    echo "Directory contents:" && ls -la && \
    echo "Dist folder contents:" && ls -la dist/ && \
    echo "Dist/src folder contents:" && ls -la dist/src/ && \
    echo "Main.js exists:" && test -f dist/src/main.js && echo "YES" || echo "NO" && \
    echo "All .js files in dist:" && find dist -name "*.js" -type f

# Exponer puerto
EXPOSE 3000

# Comando para ejecutar
CMD ["npm", "run", "start:prod"]
