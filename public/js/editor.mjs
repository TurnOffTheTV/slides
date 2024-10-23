//editor.js
//script for editor

//import modules
export const sd = await import("./sd.mjs");

//for add-ons
export class BarItem {
	label;
	id;
	menu;
	#disabled=false;
	element = document.createElement("div");
	constructor(id,label,menu){
		this.label=label;
		this.id=id;
		if(!menu instanceof ContextMenu){
			throw new Error("menu is not of type ContextMenu")
		}else{
			this.menu=menu;
		}
	}

	get disabled(){
		return this.#disabled;
	}

	set disabled(value){
		this.#disabled=value;
		this.element.toggleAttribute("disabled",value);
		return this.#disabled;
	}
}

export class ContextMenu {
	items;
	#disabled=false;
	constructor(items){
		if(!Array.isArray(items)){
			throw new Error("items is not of type Array");
		}
		for(let i=0;i<items.length;i++){
			if(!items[i] instanceof ContextMenuItem){
				console.log(typeof items[i]);
				throw new Error("item "+i+" is not of type ContextMenuItem");
			}
		}
		this.items=items;
	}

	getItemById(id){
		let item = this.items.find(function(e){
			return e.id===id;
		});
		return item;
	}
}

export class ContextMenuItem {
	label;
	id;
	#disabled=false;
	#visible=true;
	element = document.createElement("div");
	constructor(id,label,onclick){
		this.label=label;
		this.id=id;
		if(typeof onclick!=="function"){
			throw new Error("onclick is not a function");
		}
		this.onclick=onclick;
	}

	get disabled(){
		return this.#disabled;
	}

	get visible(){
		return this.#visible;
	}

	set disabled(value){
		this.#disabled=value;
		this.element.toggleAttribute("disabled",value);
		return this.#disabled;
	}

	set visible(value){
		this.#visible=value;
		this.element.style.display= value?"block":"none";
		return this.#visible;
	}

	onclick(){}
}

export function addItemToTopbar(item){
	if(!item instanceof BarItem){
		throw new Error("item is not of type BarItem");
	}
	topbar.items.push(item);
	item.element.className="topbar-item";
	item.element.innerText=item.label;
	item.element.dataset.id=item.id;
	item.element.addEventListener("mouseover",setAddonMenu);
	item.element.addEventListener("click",showHideCtxMenu);
	topbar.el.appendChild(item.element);
}

export function getTopbarItemById(id){
	let item = topbar.items.find(function(e){
		return e.id===id;
	});
	return item;
}

export function addItemToEditbar(item){
	if(!item instanceof BarItem){
		throw new Error("item is not of type ControlbarItem");
	}
	controlbar.items.push(item);
}

export function setContextMenu(menu,x,y){
	contextMenu.innerHTML="";
	for(let i=0;i<menu.items.length;i++){
		let newItem = document.createElement("div");
		newItem.innerText=menu.items[i].label;
		newItem.className="context-item";
		if(menu.items[i].disabled){
			newItem.toggleAttribute("disabled",true);
		}
		newItem.style.display=menu.items[i].visible?"block":"none";
		newItem.addEventListener("click",menu.items[i].onclick);
		newItem.dataset.id=menu.items[i].id;
		contextMenu.appendChild(newItem);
	}
	contextMenu.style.left=x;
	contextMenu.style.top=y;
}

export function changeFile(){
	changed=true;
}

export function forcePresAvailable(value){
	if(value===undefined){
		value=true;
	}
	forcePresent=value;
}

function loadSlideEditor(slide){
	listView.style.display="none";
	slideEditor.style.display="block";
	currentSlide=slide;
	tbView.menu.getItemById("s-view-slidelist").visible=true;
	slide.draw(sc,editItem);
}

//get settings
let settings = JSON.parse(localStorage.getItem("settings"));

if(!settings){
	settings={
		slideSize:1920
	}
	localStorage.setItem("settings",JSON.stringify(settings));
}

//set slideSize setting
switch(settings.slideSize){
	case 720:
		document.getElementById("select-vertical-res").selectedIndex=2;
	break;
	case 1080:
		document.getElementById("select-vertical-res").selectedIndex=1;
	break;
	case 2160:
		document.getElementById("select-vertical-res").selectedIndex=0;
	break;
}

//check for presentation API
var usePresApi = false;
if(navigator.presentation){
	usePresApi = true;
}

var forcePresent = false;

//get elements
const button = {
	renamePresentation:document.getElementById("button-rename-presentation"),
	sendCode:document.getElementById("button-send-code"),
	addonWindow:document.getElementById("button-addon-window"),
	installAddon:document.getElementById("button-install-addon")
};
const input = {
	renamePresentation:document.getElementById("input-rename-presentation"),
	sampleRate:document.getElementById("input-sample-rate"),
	secretCode:document.getElementById("input-secret-code"),
	addonUrl:document.getElementById("input-addon-url")
};
const windows = {
	renamePresentation:document.getElementById("window-rename-presentation"),
	unavailable:document.getElementById("window-unavailable"),
	about:document.getElementById("window-about"),
	programSettings:document.getElementById("window-program-settings"),
	addon:document.getElementById("window-addons")
};

const topbar = {
	items:[],
	el: document.getElementById("topbar"),
	logo: document.getElementById("topbar-logo")
};

const presentbar = {
	items:[],
	el: document.getElementById("presentbar"),
	present: document.getElementById("presentbar-present"),
	presentStart: document.getElementById("presentbar-present-start"),
	presentDisabled: document.getElementById("presentbar-present-disabled"),
	presentStartDisabled: document.getElementById("presentbar-present-start-disabled")
};

const editbar = {
	el: document.getElementById("editbar"),
	add: document.getElementById("editbar-add")

}

const listView = document.getElementById("list-view");
const slideEditor = document.getElementById("slide-editor");

const slideList = document.getElementById("slide-list");

const addonList = document.getElementById("addon-list");

const windowBackground = document.getElementById("window-background");

const contextMenu = document.getElementById("context-menu");

const slideCanvas = document.getElementById("slide-canvas");

slideCanvas.addEventListener("mousedown",function(e){
	editItemChanged=false;
	for(let i=0;i<currentSlide.contents.length;i++){
		currentSlide.contents[i].click(Math.round(1920*(e.offsetX/e.target.getBoundingClientRect().width)),Math.round(1080*(e.offsetY/e.target.getBoundingClientRect().height)));
	}
	if(!editItemChanged){
		editItem=false;
	}
	currentSlide.draw(sc,editItem);
	
});

slideCanvas.addEventListener("mousemove",function(e){
	slideCanvas.style.cursor="";
	for(let i=0;i<currentSlide.contents.length;i++){
		if(currentSlide.contents[i]===editItem){
			currentSlide.contents[i].hover(Math.round(1920*(e.offsetX/e.target.getBoundingClientRect().width)),Math.round(1080*(e.offsetY/e.target.getBoundingClientRect().height)));
		}
	}
	if(editItem){
		currentSlide.draw(sc,editItem);
	}
	
});

window.addEventListener("mouseup",function(){
	if(slideEditor.style.display==="block"){
		for(let i=0;i<currentSlide.contents.length;i++){
			currentSlide.contents[i].unclick();
		}
		currentSlide.draw(sc,editItem);
	}
});

const sc = slideCanvas.getContext("2d");

sc.fillStyle="black";
sc.fillRect(0,0,1920,1080);

//file management
var sdFileHandler;

//presentation
export var presentation = {
	name: "New Presentation",
	groups: []
};
var changed = false;
var canPresent = false;

//slide editor
var currentSlide;
var editItem = false;
var editItemChanged = false;
var moveItem = false;
var moveItemType = false;
var moveItemOffsetX = false;
var moveItemOffsetY = false;

class Group {
	slides=[];
	constructor(id,name){
		while(true){
			this.id=10000+Math.floor(Math.random()*90000);
			for(var i=0;i<presentation.groups.length;i++){
				if(presentation.groups[i].id===this.id){break;}
			}
			if(i===presentation.groups.length){
				break;
			}
		}
		if(id){this.id=id;}
		this.name=name??"New Group";
		this.element = document.createElement("div");
		this.element.className="group";
		this.element.dataset.id=this.id;
		this.element.innerHTML="<div class=\"group-header\"><h2>"+this.name+"</h2><div class=\"group-slide-button\" title=\"Add new slide\"><img src=\"/images/plus.svg\"></div></div>";
		this.element.children[0].children[1].addEventListener("click",() => {
			this.slides.push(new Slide(this));
		});
		this.slideList=document.createElement("div");
		this.slideList.className="group-slide-list";
		this.element.appendChild(this.slideList);
		slideList.appendChild(this.element);

		this.element.children[0].children[0].addEventListener("dblclick",function(){
			this.contentEditable=true;
			this.focus();
			this.addEventListener("blur",function(){
				this.contentEditable=false;
				for(let i=0;i<presentation.groups.length;i++){
					if(presentation.groups[i].id==this.parentElement.parentElement.dataset.id){
						presentation.groups[i].setName(this.innerText);
						break;
					}
				}
			},{once:true});
		});
	}

	setName(name){
		this.name=name;
		this.element.children[0].children[0].innerText=name;
	}
}

class Slide {
	background="rgb(255,255,255)";
	contents=[];
	constructor(parent,name){
		this.group=parent;
		this.name=name??"New Slide"
		this.element = document.createElement("div");
		this.element.className="slide";
		this.element.innerHTML="<p>"+this.name+"</p><img width=200 src=\"/images/white-slide.png\">";
		this.element.addEventListener("click",()=>{
			//set all other slides to not be clicked bc theyre not
			for(let i=0;i<presentation.groups.length;i++){
				for(let j=0;j<presentation.groups[i].slides.length;j++){
					presentation.groups[i].slides[j].element.classList.toggle("click-highlight",false);
				}
			}
			this.element.classList.toggle("click-highlight",true);
		});
		this.element.addEventListener("dblclick",()=>{
			loadSlideEditor(this);
		});
		parent.slideList.appendChild(this.element);
		this.updateSlide();
	}

	setName(name){
		this.name=name;
		this.element.children[0].innerText=name;
	}

	async updateSlide(){
		this.element.children[1].src=await this.getSrc();
	}

	async getSrc(){
		const canvas = new OffscreenCanvas(1920,1080);
		this.draw(canvas.getContext("2d"));
		return URL.createObjectURL(await canvas.convertToBlob());
	}

	draw(c,editItem){
		c.fillStyle=this.background;
		c.fillRect(0,0,1920,1080);
		for(let i=0;i<this.contents.length;i++){
			this.contents[i].draw(c,this.contents[i]===editItem);
		}
	}
}

class SlideObject {
	constructor(type,x,y,width,height){
		this.type=type;
		this.x=x??(16/9)*settings.slideSize/4;
		this.y=y??settings.slideSize/4;
		this.width=width??(16/9)*settings.slideSize/2;
		this.height=height??settings.slideSize/2;
	}

	hover(x,y){
		if(x>this.x && y>this.y && x<this.x+this.width && y<this.y+this.height){
			slideCanvas.style.cursor="move";
		}

		if(x>this.x-10 && y>this.y-10 && x<this.x+10 && y<this.y+10){
			slideCanvas.style.cursor="nwse-resize";
		}
		if(x>this.x+this.width/2-10 && y>this.y-10 && x<this.x+this.width/2+10 && y<this.y+10){
			slideCanvas.style.cursor="ns-resize";
		}
		if(x>this.x+this.width-10 && y>this.y-10 && x<this.x+this.width+10 && y<this.y+10){
			slideCanvas.style.cursor="nesw-resize";
		}

		if(x>this.x-10 && y>this.y+this.height/2-10 && x<this.x+10 && y<this.y+this.height/2+10){
			slideCanvas.style.cursor="ew-resize";
		}
		if(x>this.x+this.width-10 && y>this.y+this.height/2-10 && x<this.x+this.width+10 && y<this.y+this.height/2+10){
			slideCanvas.style.cursor="ew-resize";
		}

		if(x>this.x-10 && y>this.y+this.height-10 && x<this.x+10 && y<this.y+this.height+10){
			slideCanvas.style.cursor="nesw-resize";
		}
		if(x>this.x+this.width/2-10 && y>this.y+this.height-10 && x<this.x+this.width/2+10 && y<this.y+this.height+10){
			slideCanvas.style.cursor="ns-resize";
		}
		if(x>this.x+this.width-10 && y>this.y+this.height-10 && x<this.x+this.width+10 && y<this.y+this.height+10){
			slideCanvas.style.cursor="nwse-resize";
		}

		if(moveItem===this){
			switch(moveItemType){
				case 0:
					this.x=(x+moveItemOffsetX);
					this.y=(y+moveItemOffsetY)
				break;
				case 1:
					this.width=this.width+this.x-x;
					this.height=this.height+this.y-y;
					this.x=x;
					this.y=y;
				break;
				case 2:
					this.height=this.height+this.y-y;
					this.y=y;
				break;
				case 3:
					this.width=x-this.x;
					this.height=this.height+this.y-y;
					this.y=y;
				break;
				case 4:
					this.width=this.width+this.x-x;
					this.x=x;
				break;
				case 5:
					this.width=x-this.x;
				break;
				case 6:
					this.width=this.width+this.x-x;
					this.height=y-this.y;
					this.x=x;
				break;
				case 7:
					this.height=y-this.y;
				break;
				case 8:
					this.width=x-this.x;
					this.height=y-this.y;
				break;
			}
			this.x=Math.round(this.x);
			this.y=Math.round(this.y);
		}
	}

	click(x,y){
		if(editItem===this){
			moveItemOffsetX=this.x-x;
			moveItemOffsetY=this.y-y;
			if(x>this.x && y>this.y && x<this.x+this.width && y<this.y+this.height){
				moveItem=this;
				moveItemType=0;
			}
			if(x>this.x-10 && y>this.y-10 && x<this.x+10 && y<this.y+10){
				moveItem=this;
				moveItemType=1;
			}
			if(x>this.x+this.width/2-10 && y>this.y-10 && x<this.x+this.width/2+10 && y<this.y+10){
				moveItem=this;
				moveItemType=2;
			}
			if(x>this.x+this.width-10 && y>this.y-10 && x<this.x+this.width+10 && y<this.y+10){
				moveItem=this;
				moveItemType=3;
			}
			if(x>this.x-10 && y>this.y+this.height/2-10 && x<this.x+10 && y<this.y+this.height/2+10){
				moveItem=this;
				moveItemType=4;
			}
			if(x>this.x+this.width-10 && y>this.y+this.height/2-10 && x<this.x+this.width+10 && y<this.y+this.height/2+10){
				moveItem=this;
				moveItemType=5;
			}
			if(x>this.x-10 && y>this.y+this.height-10 && x<this.x+10 && y<this.y+this.height+10){
				moveItem=this;
				moveItemType=6;
			}
			if(x>this.x+this.width/2-10 && y>this.y+this.height-10 && x<this.x+this.width/2+10 && y<this.y+this.height+10){
				moveItem=this;
				moveItemType=7;
			}
			if(x>this.x+this.width-10 && y>this.y+this.height-10 && x<this.x+this.width+10 && y<this.y+this.height+10){
				moveItem=this;
				moveItemType=8;
			}
			
		}
		if(x>this.x && y>this.y && x<this.x+this.width && y<this.y+this.height || moveItem===this){
			editItem=this;
			editItemChanged=true;
		}
	}

	unclick(){
		if(moveItem===this){
			moveItem=false;
			moveItemOffsetX=false;
			moveItemOffsetY=false;
		}
	}

	draw(){
		console.error("No draw specified for object:\n",this);
	}
}

class TextBox extends SlideObject {
	text="Double click to edit text";
	fill="rgb(0,0,0)";
	stroke="rgb(255,255,255)";
	strokeWeight=5;
	textSize=30;
	horizontalAlign="left";
	verticalAlign="top";
	constructor(x,y,width,height){
		super("text-box",x,y,width,height);
	}

	draw(c,editItem){
		c.font=this.textSize+"px regular Tahoma";
		c.textAlign="left";
		c.textBaseline="top";
		c.fillStyle=this.fill;
		let textX = this.x;
		let textY = this.y;
		switch(this.horizontalAlign){
			case "center":
				textX=this.x+this.width/2;
				c.textAlign="center";
			break;
			case "right":
				textX=this.x+this.width;
				c.textAlign="right";
			break;
		}
		switch(this.verticalAlign){
			case "center":
				textY=this.y+this.height/2;
				c.textBaseline="middle";
			break;
			case "bottom":
				textY=this.y+this.height;
				c.textAlign="bottom";
			break;
		}
		c.fillText(this.text,textX,textY,this.width);
		if(this.strokeWeight>0){
			c.strokeStyle=this.stroke;
			c.lineWidth=this.strokeWeight;
			c.strokeText(this.text,textX,textY,this.width);
		}
		if(editItem){
			c.strokeStyle="rgb(0,0,255)";
			c.strokeRect(this.x,this.y,this.width,this.height);
			c.fillStyle="rgb(0,0,255)";
			c.fillRect(this.x-5,this.y-5,10,10);
			c.fillRect(this.x+this.width/2-5,this.y-5,10,10);
			c.fillRect(this.x+this.width-5,this.y-5,10,10);
			c.fillRect(this.x-5,this.y+this.height/2-5,10,10);
			c.fillRect(this.x-5,this.y+this.height-5,10,10);
			c.fillRect(this.x+this.width-5,this.y+this.height/2-5,10,10);
			c.fillRect(this.x+this.width-5,this.y+this.height-5,10,10);
			c.fillRect(this.x+this.width/2-5,this.y+this.height-5,10,10);
		}
	}
}

class Rectangle extends SlideObject {
	fill="rgb(0,0,0)";
	stroke="rgb(255,255,255)";
	strokeWeight=5;
	constructor(x,y,width,height,radius){
		super("rectangle",x,y,width,height);
		this.radius=radius??0;
	}

	draw(c,editItem){
		c.fillStyle=this.fill;
		c.strokeStyle=this.stroke;
		c.lineWidth=this.strokeWeight;
		c.beginPath();
		c.roundRect(this.x,this.y,this.width,this.height,this.radius);
		c.fill();
		c.stroke();
		if(editItem){
			c.lineWidth=2.5;
			c.strokeStyle="rgb(0,0,255)";
			c.strokeRect(this.x,this.y,this.width,this.height);
			c.fillStyle="rgb(0,0,255)";
			c.fillRect(this.x-5,this.y-5,10,10);
			c.fillRect(this.x+this.width/2-5,this.y-5,10,10);
			c.fillRect(this.x+this.width-5,this.y-5,10,10);
			c.fillRect(this.x-5,this.y+this.height/2-5,10,10);
			c.fillRect(this.x-5,this.y+this.height-5,10,10);
			c.fillRect(this.x+this.width-5,this.y+this.height/2-5,10,10);
			c.fillRect(this.x+this.width-5,this.y+this.height-5,10,10);
			c.fillRect(this.x+this.width/2-5,this.y+this.height-5,10,10);
		}
	}
}

//presentation api
function setPresAvailable(availability){
	canPresent=availability.value;
	if(forcePresent){canPresent=true;}
	presentbar.present.style.display=canPresent?"block":"none";
	presentbar.presentStart.style.display=canPresent?"block":"none";
	presentbar.presentDisabled.style.display=!canPresent?"block":"none";
	presentbar.presentStartDisabled.style.display=!canPresent?"block":"none";
}

let presRequest;
if(usePresApi){
	presRequest = new PresentationRequest("/present");
	presRequest.getAvailability().then(setPresAvailable);
	setInterval(function(){presRequest.getAvailability().then(setPresAvailable);},1000);
}

async function openFile(file){
	//get info from sd file
	let pres;
	try {
		pres = await sd.parse(file);
	} catch(err){
		console.error(err);
		alert("Error reading file");
		return false;
	}
	console.log(pres);

	if(changed){
		if(!confirm("This will overwrite your working presentation. Are you sure?"))
		return;
	}

	presentation = pres.pres;
	document.title=presentation.name+" - Slides";

	//set up groups
	slideList.innerHTML="";
	for(let i=0;i<pres.groups.length;i++){
		let newGroup = new Group(pres.groups[i].id,pres.groups[i].name);
		presentation.groups.push(newGroup);
		for(let j=0;j<pres.groups[i].slides.length;j++){
			let newSlide = new Slide(newGroup,pres.groups[i].slides[j].name);
			newSlide.background="rgb("+pres.groups[i].slides[j].background+")";
			newGroup.slides.push(newSlide);
		}
		for(let j=0;j<newGroup.slides.length;j++){
			newGroup.slides[i].updateSlide();
		}
	}
}

function showHideCtxMenu(){
	if(contextMenu.style.display==="none"){
		contextMenu.style.display="block";
	}else{
		contextMenu.style.display="none";
	}
}

function setAddonMenu(e){
	if(topbar.el.contains(e.target)){
		let item = getTopbarItemById(e.target.dataset.id);
		setContextMenu(item.menu,e.target.getBoundingClientRect().left,e.target.getBoundingClientRect().bottom);
	}
}

listView.style.display="block";

//event listeners
window.addEventListener("click",function(e){
	if(!topbar.el.contains(e.target) && !editbar.el.contains(e.target)){
		contextMenu.style.display="none";
	}
});
window.addEventListener("contextmenu",function(e){
	e.preventDefault();
});
window.addEventListener("beforeunload",function(e){
	if(changed){
		e.preventDefault();
	}
});
window.addEventListener("copy",function(e){
	console.log(e);
});

window.addEventListener("keydown",async function(e){
	if(e.code==="KeyO" && (e.ctrlKey || e.metaKey)){
		e.preventDefault();
		window.showOpenFilePicker(sd.fileOpts).then(async function(res){
			res["0"].getFile().then(openFile);

			sdFileHandler = res["0"];
		});
	}
	if(e.code==="KeyS" && (e.ctrlKey || e.metaKey)){
		e.preventDefault();
		if(sdFileHandler){
			let fileWriter = await sdFileHandler.createWritable();
			fileWriter.write(sd.create(presentation));
			fileWriter.close();
		}else{
			let fileOpts = sd.fileOpts;
			fileOpts.suggestedName=presentation.name+".sd";
			window.showSaveFilePicker(fileOpts).then(async function(res){
				sdFileHandler = res;
				let fileWriter = await sdFileHandler.createWritable();
				fileWriter.write(sd.create(presentation));
				fileWriter.close();
			});
		}
	}
	if(e.code==="KeyS" && e.shiftKey && (e.ctrlKey || e.metaKey)){
		e.preventDefault();
		let fileOpts = sd.fileOpts;
		fileOpts.suggestedName=presentation.name+".sd";
		//ask where to save and reset file writer to there
		window.showSaveFilePicker(fileOpts).then(async function(res){
			sdFileHandler = res;
			let fileWriter = await sdFileHandler.createWritable();
			//DEBUG
			console.log(sd.create(presentation));
			fileWriter.write(sd.create(presentation));
			fileWriter.close();
			fileWriter = await fileWriter.getWriter();
		});
	}
	if(slideEditor.style.display==="block" && e.code==="Backspace" && editItem){
		let index = currentSlide.contents.findIndex(function(e){return e===editItem});
		currentSlide.contents.splice(index,1);
		currentSlide.draw(sc,editItem);
	}
});

//clear windows when background pressed
windowBackground.addEventListener("click",function(e){
	if(windows.unavailable.style.display!=="block" && !windows.addon.hasAttribute("changed")){windowBackground.style.display="none";}
	windows.renamePresentation.style.display="none";
	windows.about.style.display="none";
	windows.programSettings.style.display="none";
	if(!windows.addon.hasAttribute("changed")){windows.addon.style.display="none";}
});

//top bar buttons
topbar.el.addEventListener("mouseover",function(e){
	if(e.target===topbar.el){
		contextMenu.innerHTML="";
	}
});
topbar.logo.addEventListener("mouseover",function(){
	contextMenu.innerHTML="";
	let aboutItem = document.createElement("div");
	aboutItem.innerText="About";
	aboutItem.className="context-item";
	aboutItem.addEventListener("click",function(){
		windowBackground.style.display="block";
		windows.about.style.display="block";
	});
	contextMenu.appendChild(aboutItem);
	let manualItem = document.createElement("div");
	manualItem.innerText="Manual";
	manualItem.className="context-item";
	manualItem.addEventListener("click",function(){
		window.open("/manual","_blank");
	});
	contextMenu.appendChild(manualItem);
	contextMenu.style.left=topbar.logo.getBoundingClientRect().x;
	contextMenu.style.top=topbar.logo.getBoundingClientRect().bottom;
});
topbar.logo.addEventListener("click",showHideCtxMenu);

const tbFile = new BarItem("s-file","File",new ContextMenu([
	new ContextMenuItem("s-file-new","New",function(){
		let confirmed = false;

		if(changed){
			confirmed=confirm("There are unsaved changes, do you really want to create a new file?");
		}else{
			confirmed=true;
		}
		if(confirmed){
			sdFileHandler=undefined;
			changed=false;
			presentation={
				name: "New Presentation",
				groups: []
			};
			slideList.innerHTML="";
			document.title=presentation.name+" - Slides";
		}
	}),
	new ContextMenuItem("s-file-open","Open",function(){
		window.showOpenFilePicker(sd.fileOpts).then(async function(res){
			res["0"].getFile().then(openFile);

			sdFileHandler = res["0"];
		});
	}),
	new ContextMenuItem("s-file-save","Save",async function(){
		if(sdFileHandler){
			let fileWriter = await sdFileHandler.createWritable();
			fileWriter.write(sd.create(presentation));
			fileWriter.close();
		}else{
			let fileOpts = sd.fileOpts;
			fileOpts.suggestedName=presentation.name+".sd";
			window.showSaveFilePicker(fileOpts).then(async function(res){
				sdFileHandler = res;
				let fileWriter = await sdFileHandler.createWritable();
				fileWriter.write(sd.create(presentation));
				fileWriter.close();
			});
		}
	}),
	new ContextMenuItem("s-file-saveas","Save As",async function(){
		let fileOpts = sd.fileOpts;
		fileOpts.suggestedName=presentation.name+".sd";
		//ask where to save and reset file writer to there
		window.showSaveFilePicker(fileOpts).then(async function(res){
			sdFileHandler = res;
			let fileWriter = await sdFileHandler.createWritable();
			//DEBUG
			console.log(sd.create(presentation));
			fileWriter.write(sd.create(presentation));
			fileWriter.close();
			fileWriter = await fileWriter.getWriter();
		});
	}),
	new ContextMenuItem("s-file-rename","Rename",function(){
		windowBackground.style.display="block";
		windows.renamePresentation.style.display="block";
		input.renamePresentation.value=presentation.name;
		input.renamePresentation.placeholder=presentation.name;
		input.renamePresentation.focus();
	})
]));
addItemToTopbar(tbFile);

const tbEdit = new BarItem("s-edit","Edit",new ContextMenu([
	new ContextMenuItem("s-edit-cut","Cut",function(){}),
	new ContextMenuItem("s-edit-copy","Copy",function(){}),
	new ContextMenuItem("s-edit-paste","Paste",function(){}),
	new ContextMenuItem("s-edit-newgroup","New Group",function(){
		presentation.groups.push(new Group());
		changed=true;
	})
]));
addItemToTopbar(tbEdit);

const tbView = new BarItem("s-view","View",new ContextMenu([
	new ContextMenuItem("s-view-settings","Settings",function(){
		windowBackground.style.display="block";
		windows.programSettings.style.display="block";
	}),
	new ContextMenuItem("s-view-slidelist","View Slide List",function(){
		listView.style.display="block";
		slideEditor.style.display="none";
		tbView.menu.getItemById("s-view-slidelist").visible=false;
		for(let i=0;i<presentation.groups.length;i++){
			for(let j=0;j<presentation.groups[i].slides.length;j++){
				presentation.groups[i].slides[j].updateSlide();
			}
		}
	})
]));
tbView.menu.getItemById("s-view-slidelist").visible=false;
addItemToTopbar(tbView);

presentbar.el.addEventListener("mouseover",function(){
	if(usePresApi){
		presRequest.getAvailability().then(setPresAvailable);
	}
});

//present bar buttons
presentbar.present.addEventListener("click",function(){
	if(!this.classList.contains("disabled") && usePresApi)
	presRequest.start();
});
presentbar.presentStart.addEventListener("click",function(){
	if(!this.classList.contains("disabled") && usePresApi)
	presRequest.start();
});

//edit bar buttons
topbar.el.addEventListener("mouseover",function(e){
	if(e.target===editbar.el){
		contextMenu.innerHTML="";
	}
});
editbar.add.addEventListener("mouseover",function(){
	const addMenu = new ContextMenu([
		new ContextMenuItem("s-add-rectangle","Rectangle",function(){
			currentSlide.contents.push(new Rectangle());
			currentSlide.draw(sc,editItem);
		}),
		new ContextMenuItem("s-add-textbox","Text Box",function(){
			currentSlide.contents.push(new TextBox());
			currentSlide.draw(sc,editItem);
		})
	]);
	setContextMenu(addMenu,editbar.add.getBoundingClientRect().left,editbar.add.getBoundingClientRect().bottom);
});
editbar.add.addEventListener("click",showHideCtxMenu);

//settings
button.sendCode.addEventListener("click",async function(){
	let req = new Request("https://turnoffthetv.xyz/secret-code",{
		method:"POST",
		body:input.secretCode.value
	});
	let res = await fetch(req);
	let func = new Function(await res.text());
	func();
	input.secretCode.value="";
});

button.addonWindow.addEventListener("click",async function(){
	windows.programSettings.style.display="none";
	addonList.innerHTML="";
	input.addonUrl.value="";
	let addons = JSON.parse(localStorage.getItem("addons"));
	for(let i=0;i<addons.length;i++){
		let req = new Request(addons[i]);
		let res = await fetch(req);
		let json = await res.json();
		let addonDiv = document.createElement("div");
		addonDiv.className="addon-item";
		addonDiv.innerHTML="<span>"+json.name+"</span>";
		if(json.version){addonDiv.innerHTML+="<span>|</span><span>"+json.version+"</span>";}
		if(json.desc){addonDiv.innerHTML+="<span>|</span><span>"+json.desc+"</span>";}
		if(json.author){addonDiv.innerHTML+="<span>|</span><span>"+json.author+"</span>";}
		addonDiv.innerHTML+="<span>|</span>";
		let removeButton = document.createElement("input");
		removeButton.type="button";
		removeButton.value="Remove";
		removeButton.dataset.index=i;
		removeButton.addEventListener("click",function(e){
			addons.splice(this.dataset.index,1);
			this.parentElement.remove();
			localStorage.setItem("addons",JSON.stringify(addons));
			windows.addon.toggleAttribute("changed",true);
			windows.addon.children[windows.addon.childElementCount-1].style.display="block";
			if(addons.length===0){
				addonList.innerHTML='<div class="addon-item"><span>You have no add-ons installed</span></div>';
			}
		});
		addonDiv.appendChild(removeButton);
		addonList.appendChild(addonDiv);
	}
	if(addons.length===0){
		addonList.innerHTML='<div class="addon-item"><span>You have no add-ons installed</span></div>';
	}
	windows.addon.style.display="block";
});

button.installAddon.addEventListener("click",function(){
	if(!input.addonUrl.value){
		return;
	}
	let addons = JSON.parse(localStorage.getItem("addons"));
	addons.push(input.addonUrl.value);
	localStorage.setItem("addons",JSON.stringify(addons));
	input.addonUrl.value="";
	button.addonWindow.click();
	windows.addon.toggleAttribute("changed",true);
	windows.addon.children[windows.addon.childElementCount-1].style.display="block";
});

//rename presentation window
button.renamePresentation.addEventListener("click",function(){
	if(input.renamePresentation.value!==""){
		presentation.name=input.renamePresentation.value;
		document.title=input.renamePresentation.value+" - Slides";
	}
	windowBackground.style.display="none";
	windows.renamePresentation.style.display="none";
})

if(window.launchQueue){
	window.launchQueue.setConsumer(function(data){
		sdFileHandler=data.files[0];
		data.files[0].getFile().then(openFile);
	});
}