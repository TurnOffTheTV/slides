const editor = await import("./editor.mjs");

if(!localStorage.getItem("addons")){
    localStorage.setItem("addons","[]");
}

async function loadAddon(url){
    let req = new Request(url);
	let res = await fetch(req);
	let json = await res.json();
    const addon = await import(json.src);
    addon.init(editor);
}

let addons = JSON.parse(localStorage.getItem("addons"));

for(let i=0;i<addons.length;i++){
    loadAddon(addons[i]);
}