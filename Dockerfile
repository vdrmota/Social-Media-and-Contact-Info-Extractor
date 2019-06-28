# Here you choose the base Docker image for the act. Apify provides the following images:
#  apify/actor-node-basic
#  apify/actor-node-chrome
#  apify/actor-node-puppeteer
# However, you can use any other image from Docker Hub.
# For more information, see https://www.apify.com/docs/actor#base-images
FROM apify/actor-node-chrome

# Copy all files and directories from the directory to the Docker image
COPY . ./

# Install NPM packages, skip optional and development dependencies to keep the image small,
# avoid logging to much and show log the dependency tree
RUN npm install --quiet --only=prod \
 && npm list

# Define that start command
CMD [ "node", "./src/main.js" ]
