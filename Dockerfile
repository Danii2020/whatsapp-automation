# Use the Zenika image with Puppeteer support
# reference https://developers.google.com/web/tools/puppeteer/troubleshooting#setting_up_chrome_linux_sandbox
FROM node:current-alpine

# manually installing chrome
RUN apk add chromium

# skips puppeteer installing chrome and points to correct binary
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Set working directory inside the container
WORKDIR /usr/src/app

# Switch to 'chrome' user before copying and installing
# Copy your application files into the container
COPY . .

# Install dependencies
RUN npm install


# Expose the required ports
# Create uploads directory
RUN rm -rf uploads && mkdir uploads

EXPOSE 8080
CMD ["node", "index.js"]
