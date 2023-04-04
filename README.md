# TweetMate
TweetMate is a small social media application built with React and Node. It is designed to allow users to post and share tweets with their followers, as well as follow other users and view their tweets.

## Table of Contents
1. Installation
2. Usage
3. Features
4. Technologies Used

## Installation
To install TweetMate, clone this repository to your local machine using the following command:
#### git clone https://github.com/yourusername/tweetmate.git

Once cloned, navigate to the client and server directories and run the following command in each to install the required dependencies:
#### npm install

Create a .env file in the server directory with following constants:
1. DATABASE_URL (MongoDB)
2. PORT
3. CLIENT_ID (Google OAUTH)
4. CLIENT_SECRET (Google OAUTH)
5. JWT_SECRET


## Usage
To use TweetMate, run the following command in the client and server directories to start the development servers:
#### npm start

This will start the React development server at http://localhost:3000 and the Node development server at http://localhost:5000.

## Features
1. User authentication with JSON Web Tokens (JWT)
2. Posting, sharing and editing tweets/posts
3. Liking and unliking, commenting tweets
4. Profile viewing of users

## Technologies Used
TweetMate is built using the following technologies:
1. React
2. Node.js
3. Redux
4. React Router
5. React Share
6. JSON Web Tokens (JWT)
7. SweetAlert
8. Axios
9. REST APIs
