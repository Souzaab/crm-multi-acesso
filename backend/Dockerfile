FROM node:18-alpine

# Diretório de trabalho
WORKDIR /app

# Copia os arquivos de dependência
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia o restante do código do backend
COPY . .

# Expõe a porta que o backend usa
EXPOSE 4000

# Comando para rodar o backend
CMD ["npm", "start"]

