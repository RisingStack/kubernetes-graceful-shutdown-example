FROM risingstack/alpine:3.4-v4.6.0-4.0.0

ENV PORT 3000
EXPOSE 3000

COPY package.json package.json
RUN npm install

COPY . .

CMD ["npm", "start", "-s"]
