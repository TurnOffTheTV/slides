const http = require("node:http");
const express = require("express");
const slides = express();
const server = http.createServer(slides);
const fs = require("node:fs");
const path = require("node:path");

//special case for present page (to be implemented later)
slides.get("/present/",function(req,res){
	res.sendFile("./public/present/index.html");
})

//serve webpage
slides.use(express.static(path.join(__dirname,"public"),{setHeaders:function(res,path,stat){
    res.set('Service-Worker-Allowed',"/");
}}));

//get updates
slides.post("/update",function(req,res){
    console.log("TODO: get latest from Github");
    res.sendStatus(200);
});

//404 handling
slides.get("*",function(req,res){
	res.status(404).send(fs.readFileSync(__dirname+"/public/404.html").toString());
});

//start server
server.listen(7080,function(){
    console.log('server is running on port', server.address().port);
});