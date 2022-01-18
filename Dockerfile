FROM apify/actor-node-puppeteer-chrome:16

COPY package*.json ./

RUN npm --quiet set progress=false \
 && npm install --only=prod --no-optional \
 && echo "Installed NPM packages:" \
 && (npm list || true) \
 && echo "Node.js version:" \
 && node --version \
 && echo "NPM version:" \
 && npm --version

COPY . ./

ENV APIFY_DISABLE_OUTDATED_WARNING 1
ENV npm_config_loglevel=silent