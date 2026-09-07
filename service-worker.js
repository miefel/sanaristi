const CACHE_NAME = "sanaristi-v2";

const FILES_TO_CACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./game.js",
    "./manifest.json",
    "./sanaristit/sanaristit.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];


self.addEventListener("install", event => {

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(FILES_TO_CACHE);
            })
    );

});


self.addEventListener("fetch", event => {

    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request);

            })
    );

});
