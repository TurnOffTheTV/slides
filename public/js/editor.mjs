//editor.js
//script for editor

//import modules
export const sd = await import("./sd.mjs");

//get settings
let settings = JSON.parse(localStorage.getItem("settings"));

if(!settings){
	settings={
		debugMenu:false
	}
	localStorage.setItem("settings",JSON.stringify(settings));
}

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
	logo: document.getElementById("topbar-logo"),
	file: document.getElementById("topbar-file"),
	edit: document.getElementById("topbar-edit"),
	view: document.getElementById("topbar-view")
};

const editbar = {
	items:[],
	el: document.getElementById("editbar"),
	play: document.getElementById("editbar-play"),
	pause: document.getElementById("editbar-pause")
};

const listView = document.getElementById("list-view");
const slideView = document.getElementById("slide-view");

const channelDeck = document.getElementById("channel-deck");

const addonList = document.getElementById("addon-list");

const windowBackground = document.getElementById("window-background");

const contextMenu = document.getElementById("context-menu");

//file management
var sdFileHandler;

//presentation
export var presentation = {
	name: "New Presentation",
	groups: []
};
var changed = false;

async function openFile(file){
	//get info from sd file
	let pres = await sd.parse(file);
	presentation = pres.pres;
	document.title=presentation.name+" - Slides";

	//set up channels
	channelDeck.innerHTML="";
	for(var i=0;i<pres.groups.length;i++){
		//TODO: add groups based on file data
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
	contextMenu.innerHTML="";
	let item;
	if(topbar.el.contains(e.target)){
		item = getTopbarItemById(e.target.dataset.id);
	}
	for(let i=0;i<item.menu.items.length;i++){
		let newItem = document.createElement("div");
		newItem.innerText=item.menu.items[i].label;
		newItem.className="context-item";
		if(item.menu.items[i].disabled){
			newItem.toggleAttribute("disabled",true);
		}
		newItem.addEventListener("click",item.menu.items[i].onclick);
		newItem.dataset.id=item.menu.items[i].id;
		contextMenu.appendChild(newItem);
	}
	contextMenu.style.left=e.target.getBoundingClientRect().x;
	contextMenu.style.top=e.target.getBoundingClientRect().bottom;
}

listView.style.display="block";

//event listeners
window.addEventListener("click",function(e){
	if(!topbar.el.contains(e.target)){
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
	if(e.code==="KeyS" && e.ctrlKey){
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
topbar.file.addEventListener("mouseover",function(){
	contextMenu.innerHTML="";
	let newItem = document.createElement("div");
	newItem.innerText="New";
	newItem.className="context-item";
	newItem.addEventListener("click",function(){

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
				name: "New presentation",
				sampleRate: settings.sampleRate,
				channels: [],
				patches: []
			};
			if(presentation.sampleRate!==a.sampleRate){
				a = new AudioContext({sampleRate:presentation.sampleRate});
			}
			channelDeck.innerHTML="";
			document.title=presentation.name;
		}
	});
	contextMenu.appendChild(newItem);
	
	let openItem = document.createElement("div");
	openItem.innerText="Open";
	openItem.className="context-item";
	openItem.addEventListener("click",function(){
		window.showOpenFilePicker(sd.fileOpts).then(async function(res){
			res["0"].getFile().then(openFile);

			sdFileHandler = res["0"];
		});
	});
	contextMenu.appendChild(openItem);

	let saveItem = document.createElement("div");
	saveItem.innerText="Save";
	saveItem.className="context-item";
	saveItem.addEventListener("click",async function(){
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
	});
	contextMenu.appendChild(saveItem);

	let saveAsItem = document.createElement("div");
	saveAsItem.innerText="Save As";
	saveAsItem.className="context-item";
	saveAsItem.addEventListener("click",async function(){
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
	});
	contextMenu.appendChild(saveAsItem);

	let renameItem = document.createElement("div");
	renameItem.innerText="Rename";
	renameItem.className="context-item";
	renameItem.addEventListener("click",function(){
		windowBackground.style.display="block";
		windows.renamePresentation.style.display="block";
		input.renamePresentation.value=presentation.name;
		input.renamePresentation.placeholder=presentation.name;
		input.renamePresentation.focus();
	});
	contextMenu.appendChild(renameItem);
	contextMenu.style.left=topbar.file.getBoundingClientRect().x;
	contextMenu.style.top=topbar.file.getBoundingClientRect().bottom;
});
topbar.edit.addEventListener("mouseover",function(){
	contextMenu.innerHTML="";
	let cutItem = document.createElement("div");
	cutItem.innerText="Cut";
	cutItem.className="context-item";
	cutItem.addEventListener("click",function(){});
	contextMenu.appendChild(cutItem);

	let copyItem = document.createElement("div");
	copyItem.innerText="Copy";
	copyItem.className="context-item";
	copyItem.addEventListener("click",function(){});
	contextMenu.appendChild(copyItem);

	let pasteItem = document.createElement("div");
	pasteItem.innerText="Paste";
	pasteItem.className="context-item";
	pasteItem.addEventListener("click",function(){});
	contextMenu.appendChild(pasteItem);

	if(listView.style.display==="block"){
		let newChannelItem = document.createElement("div");
		newChannelItem.innerText="New Group";
		newChannelItem.className="context-item";
		newChannelItem.addEventListener("click",function(){
			presentation.groups.push(new Group());
			changed=true;
		});
		contextMenu.appendChild(newChannelItem);
	}

	contextMenu.style.left=topbar.edit.getBoundingClientRect().x;
	contextMenu.style.top=topbar.edit.getBoundingClientRect().bottom;
});
topbar.view.addEventListener("mouseover",function(){
	contextMenu.innerHTML="";
	let settingsItem = document.createElement("div");
	settingsItem.innerText="Settings";
	settingsItem.className="context-item";
	settingsItem.addEventListener("click",function(){
		windowBackground.style.display="block";
		windows.programSettings.style.display="block";
	});
	contextMenu.appendChild(settingsItem);

	contextMenu.style.left=topbar.view.getBoundingClientRect().x;
	contextMenu.style.top=topbar.view.getBoundingClientRect().bottom;
});

topbar.logo.addEventListener("click",showHideCtxMenu);
topbar.file.addEventListener("click",showHideCtxMenu);
topbar.edit.addEventListener("click",showHideCtxMenu);
topbar.view.addEventListener("click",showHideCtxMenu);

//edit bar buttons
editbar.play.addEventListener("click",function(){
	editbar.play.style.display="none";
	editbar.pause.style.display="block";
});
editbar.pause.addEventListener("click",function(){
	editbar.pause.style.display="none";
	editbar.play.style.display="block";
});

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
}

export class ContextMenuItem {
	label;
	id;
	#disabled=false;
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

	set disabled(value){
		this.#disabled=value;
		this.element.toggleAttribute("disabled",value);
		return this.#disabled;
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

export function addItemToControlbar(item){
	if(!item instanceof BarItem){
		throw new Error("item is not of type ControlbarItem");
	}
	editbar.items.push(item);
}

export function addItemToPatchbar(item){
	if(!item instanceof BarItem){
		throw new Error("item is not of type BarItem");
	}
	patchbar.items.push(item);
	item.element.className="topbar-item";
	item.element.innerText=item.label;
	item.element.dataset.id=item.id;
	item.element.addEventListener("mouseover",setAddonMenu);
	item.element.addEventListener("click",showHideCtxMenu);
	patchbar.el.appendChild(item.element);
}

export function getPatchbarItemById(id){
	let item = patchbar.items.find(function(e){
		return e.id===id;
	});
	return item;
}

export function changeFile(){
	changed=true;
}