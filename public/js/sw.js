//sw.js
//Slides' service worker

async function addResourcesToCache(files){
    let cache = await caches.open("v1.0.0");
    await cache.addAll(files);
};

//cache the whole website
self.addEventListener("install",function(e){
    e.waitUntil(
        addResourcesToCache([
            "/",
            "/favicon.ico",
            "/manifest.json",
            "/editor/",
            "/css/editor.css",
            "/css/main.css",
            "/js/editor.js",
            "/js/sd.mjs",
            "/fonts/fira.ttf",
            "/fonts/fira-light.ttf",
            "/images/arrow-down.svg",
            "/images/arrow-up.svg",
            "/images/info.svg",
            "/images/logo.png",
            "/images/midi.svg",
            "/images/pause.svg",
            "/images/pencil.svg",
            "/images/play.svg",
            "/images/plus.svg",
            "/images/remove.svg"
        ])
    );
});

//send back cache stuff
/*self.addEventListener("fetch",function(e){
    e.respondWith(caches.match(e.request));
});*/