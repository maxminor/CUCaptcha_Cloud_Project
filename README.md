# CUCaptcha
CU Captcha is a website (that run locally) that simulate recaptcha's picture authentication method as simple games with some modifications.

## Setup
To setup CU captcha, do an `npm install` in the project directory.

## Run
To run CU captcha, do an `npm run` in the project directory.

To access the running CU captcha application, enter the address http://localhost:3000 in any browser.

## Game mode
There are two game modes availabe for CU captcha.
 1. Write picture description
 2. Select pictures with object

The Write mode can be access via http://localhost:3000/write. In this mode the player will be given one picture. Then the player must provide 3 objects or features present in the picture. To pass the game, the player must provide 2 or more object or features present in the picure.

The Select mode can be access via http://localhost:3000/select. In this mode the player will be given 9 pictures. The player must select any picture that has a specific object given in the instruction. To pass the game the player must select every picture with the object, no more, no less.

## Tech
CU Captcha uses a number of cloud services as the core of the web:
* [AWS S3](https://aws.amazon.com/s3/) - To store images.
* [AWS dynamoDB](https://aws.amazon.com/dynamodb) - To store images' objects and features
* [AWS Rekognition](https://aws.amazon.com/rekognition) - To detect objects and features in images
* [Google Cloud Vision](https://cloud.google.com/vision) - To detect objects and features in images
