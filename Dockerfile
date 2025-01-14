# Use the Zenika image with Puppeteer support
FROM zenika/alpine-chrome:with-puppeteer

# Set working directory inside the container
WORKDIR /usr/src/app

# Switch to 'chrome' user before copying and installing
USER chrome

# Copy the package.json and package-lock.json for npm install
COPY --chown=chrome:chrome package*.json ./

# Install dependencies
RUN rm -rf node_modules && npm install

# Copy the rest of your app files into the container
COPY --chown=chrome:chrome . .

# Expose the required ports
# Create uploads directory
RUN rm -f uploads && mkdir uploads

EXPOSE 3000
CMD ["node", "index.js"]
