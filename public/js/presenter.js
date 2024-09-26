//presenter.js

//script for presenting page

//close if not in a presentation
if(!navigator.presentation.receiver){
	window.location.href="/presemt/";
	console.log("closing")
}

const canvas = document.createElement("canvas");
canvas.id="slide-canvas";
const c = canvas.getContext("2d");

console.log(navigator.presentation);

navigator.presentation.receiver.connectionList.then(function(list){
	console.log(list);
});