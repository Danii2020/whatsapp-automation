# WhatsApp automation (without official API)

## Description 

This is the repository of the WhatsApp automation project made for the [TechCrunch WhatsApp bot](https://github.com/Danii2020/techcrunch-bot.git) project made for my [Spanish YouTube channel](https://youtu.be/f6ZsXNlmeyw) if you want to know more about the development of this project I encourage you to visit that video.

### About the project

This project is an Express app that exposes different routes to emulate a WhatsApp web session by scaning a QR code and then being able to send messages to a phone number using the `/send-message` route. In order to emulate the WhatsApp web session, the project uses the [WhatsApp web js](https://wwebjs.dev/) package.

## Pre-requirements

- NodeJS, better if the version is higher than 18.x.
- A [MongoDB Cloud](https://www.mongodb.com/products/platform/cloud) account to get the Mongo username, password and cluster name.

## Installation

1. Clone the repository by using the command `git clone https://github.com/Danii2020/whatsapp-automation.git`

2. Go to the project directory by using the command `cd whatsapp-automation`

3. Remember to create a `.env` file with your keys, see the [.env.example](.env.example) file.

4. Run the app by using the command `node index.js`.

9. Copy the URL in the terminal and use a client like [Postman](https://www.postman.com/) to test the API.


## Contribution

Feel free to clone or fork this repository, test it and modify it as you want. You can open a pull request if you want to contribute with useful changes to make this project even better.