
//var mysql = require('mysql');
//var express = require('express');
//var session = require('express-session');
//var bodyParser = require('body-parser');
//var path = require('path');

import mysql from "mysql";
import express from "express";
import session from "express-session";
import path from "path";
import fetch from "node-fetch";

var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'nodelogin',
    password : 'NodeLogin123!',
    database : 'nodelogin'
});

function doLogin(username, password, request, response) {
    console.log("performing username/password lookup");
    if (username && password) {
        connection.query('SELECT * FROM accounts WHERE username = ? AND password = ?', [username, password], function(error, results, fields) {
	    if (error) {
		response.send(error);
	    } else if (results.length > 0) {
   	        request.session.loggedin = true;
	        request.session.username = username;
	        response.redirect('/home');
	    } else {
	        response.send('Incorrect Username and/or Password!');
	    }           
	    response.end();
        });
    } else {
        response.send('Please enter Username and Password!');
        response.end();
    }
}

var app = express();
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));
app.use(express.urlencoded({extended : true}));
app.use(express.json());

app.get('/', function(request, response) {
    response.sendFile(path.join(path.resolve() + '/login.html'));
});

app.post('/auth', async (request, response) => {

	console.log("about to post verification request: " + request.body['g-recaptcha-response']);
	const params = new URLSearchParams();
	params.append('secret', "6LcabdwcAAAAAFsOLU5WGrF0anrXTepl3szPt3WE");
	params.append('response', request.body['g-recaptcha-response']);

	const gCaptchaResponse = await fetch("https://www.google.com/recaptcha/api/siteverify", {method: 'POST', body: params}); 

	const jsonResponse = await gCaptchaResponse.json();

	console.log('jsonResponse: ' + JSON.stringify(jsonResponse));
        var score = parseFloat(jsonResponse.score);
        if (score > 0.7) {
	  console.log("score = " + score + " about to call doLogin");
	  var username = request.body.username;
	  var password = request.body.password;
	  console.log("username = " + username + " , password = " + password);
	  doLogin(username, password, request, response);
	} else {
	  console.log("score = " + score + " too low, suspicious behaviour detected, blocking login attempt");
	  response.send('Suspicious activity detected, blocking login attempt');
        }

});

app.get('/home', function(request, response) {
    if (request.session.loggedin) {
        response.send('Welcome back, ' + request.session.username + '!');
    } else {
        response.send('Please login to view this page!');
    }
    response.end();
});

app.listen(3000);
