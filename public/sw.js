var CACHE_STATIC_NAME = "static-v1112";
var CACHE_DYNAMIC_NAME = "dynamic-v11";
self.addEventListener("install", (event) => {
    console.log("[Service Worker] Installing Service Worker... ", event);
    event.waitUntil(
        // waits until cache is not open, otherwise it would go to activation phase
        caches.open(CACHE_STATIC_NAME).then(function (cache) {
            //update static version on new releases
            console.log("[Service Worker] Precaching App Shell");
            cache.addAll(["/", "/index.html", "/offline.html", "/src/js/app.js", "/src/js/feed.js", "/src/js/material.min.js", "/src/css/app.css", "/src/css/feed.css", "/src/images/main-image.jpg", "https://fonts.googleapis.com/icon?family=Material+Icons", "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css", "https://fonts.googleapis.com/css?family=Roboto:400,700"]);
        })
    );
});
self.addEventListener("activate", (event) => {
    console.log("[Service Worker] Activating Service Worker... ", event);
    event.waitUntil(
        caches.keys().then((keysList) => {
            return Promise.all(
                keysList.map((key) => {
                    if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                        //keep latest version here
                        console.log("[Service Worker] Removing old cache ", key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// self.addEventListener("fetch", (e) => {
//     e.respondWith(
//         caches.match(e.request).then((res) => {
//             if (res) {
//                 return res;
//             } else {
//                 return fetch(e.request)
//                     .then((res) => {
//                         return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
//                             cache.put(e.request.url, res.clone()); //res can be consumed once, therefore return will be empty, so we need to call clone method
//                             return res;
//                         });
//                     })
//                     .catch((e) => {
//                         return caches.open(CACHE_STATIC_NAME).then((cache) => {
//                             //should be fine-tuned for api request.
//                             return cache.match("/offline.html");
//                         });
//                     });
//             }
//         })
//     );
// });

/**                           */
/**                           */
/**   STRATEGIES EDGE CASES   */
/**                           */
/**                           */

//cache only strategy
// self.addEventListener("fetch", (e) => {
//     e.respondWith(caches.match(e.request));
// });

//network only strategy
// self.addEventListener("fetch", (e) => {
//     e.respondWith(fetch(e.request));
// });

//network with cache fallback
// self.addEventListener("fetch", (e) => {
//     e.respondWith(
//         fetch(e.request).catch((e) => {
//             console.log({ e });

//             return caches.match(e.request);
//         })
//     );
// });
/* ------------------------------------------ */

/**                           */
/**                           */
/**   STRATEGIES USED WIDELY  */
/**                           */
/**                           */

// Cache, then network

self.addEventListener("fetch", (e) => {
    var url = "https://rickandmortyapi.com/api";

    if (e.request.url.indexOf(url) > -1) {
        e.respondWith(
            caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
                return fetch(e.request).then((res) => {
                    cache.put(e.request, res.clone());
                    return res;
                });
            })
        );
    } else {
        e.respondWith(
            caches.match(e.request).then((res) => {
                if (res) {
                    return res;
                } else {
                    return fetch(e.request)
                        .then((res) => {
                            return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
                                cache.put(e.request.url, res.clone()); //res can be consumed once, therefore return will be empty, so we need to call clone method
                                return res;
                            });
                        })
                        .catch((e) => {
                            return caches.open(CACHE_STATIC_NAME).then((cache) => {
                                //should be fine-tuned for api request.
                                return cache.match("/offline.html");
                            });
                        });
                }
            })
        );
    }
});
