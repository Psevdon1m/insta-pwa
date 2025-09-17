importScripts("/insta-pwa/src/js/idb.js");
importScripts("/insta-pwa/src/js/utils.js");

var CACHE_STATIC_NAME = "static-v6";
var CACHE_DYNAMIC_NAME = "dynamic-v61";
var STATIC_FILES = [
    "/insta-pwa/",
    "/insta-pwa/index.html",
    "/insta-pwa/offline.html",
    "/insta-pwa/src/js/app.js",
    "/insta-pwa/src/js/idb.js",
    "/insta-pwa/src/js/feed.js",
    "/insta-pwa/src/js/material.min.js",
    "/insta-pwa/src/css/app.css",
    "/insta-pwa/src/css/feed.css",
    "/insta-pwa/src/images/main-image.jpg",
    "https://fonts.googleapis.com/icon?family=Material+Icons",
    "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
    "https://fonts.googleapis.com/css?family=Roboto:400,700",
];

var url = "https://insta-pwa-490ec-default-rtdb.europe-west1.firebasedatabase.app/posts.json";
let local_backend_url = "https://56195551ae88.ngrok-free.app/api/add-post";

// function trimCache(cacheName, maxItems) {
//     caches.open(cacheName).then((cache) => {
//         return cache.keys().then((keys) => {
//             if (keys.length > maxItems) {
//                 //recurise call
//                 cache.delete(keys[0]).then(trimCache(cacheName, maxItems));
//             }
//         });
//     });
// }

self.addEventListener("install", (event) => {
    console.log("[Service Worker] Installing Service Worker... ", event);
    event.waitUntil(
        // waits until cache is not open, otherwise it would go to activation phase
        caches.open(CACHE_STATIC_NAME).then(function (cache) {
            //update static version on new releases
            console.log("[Service Worker] Precaching App Shell");
            cache.addAll(STATIC_FILES);
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

function isInArray(string, array) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === string) return true;
    }
    return false;
}

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
    if (e.request.url.indexOf(local_backend_url) > -1) {
        //cache then network
        e.respondWith(
            fetch(e.request).then((res) => {
                let clonedRes = res.clone();
                clearAllData("posts")
                    .then(() => {
                        return clonedRes.json();
                    })
                    .then((data) => {
                        for (let key in data) {
                            writeData("posts", data[key]);
                        }
                    });
                return res;
            })
        );
    } else if (isInArray(e.request.url, STATIC_FILES)) {
        e.respondWith(caches.match(e.request));
    } else {
        //cache with network fallback
        e.respondWith(
            caches.match(e.request).then((res) => {
                if (res) {
                    return res;
                } else {
                    return fetch(e.request)
                        .then((res) => {
                            return caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
                                // trimCache(CACHE_DYNAMIC_NAME, 25);
                                cache.put(e.request.url, res.clone()); //res can be consumed once, therefore return will be empty, so we need to call clone method
                                return res;
                            });
                        })
                        .catch((error) => {
                            return caches.open(CACHE_STATIC_NAME).then((cache) => {
                                //for fallback no cached pages
                                if (e.request.headers.get("accept").includes("text/html")) {
                                    return cache.match("/offline.html");
                                }
                                //else can return images as well depends on headers
                            });
                        });
                }
            })
        );
    }
});

const performSyncing = async () => {
    console.log("[Service Worker] Checking user status");
    const online = self.navigator.onLine && (await isActuallyOnline());
    if (!online) {
        console.log(" user is offline");

        await self.registration.sync.register("sync-new-posts");

        console.log("successfully re-registered service worker");

        return;
    }
    readAllData("sync").then((data) => {
        for (let d of data) {
            fetch(local_backend_url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    title: d.title,
                    location: d.location,
                    id: d.id,
                    image: d.image,
                }),
            })
                .then((res) => {
                    console.log("Data sent: ", res);
                    if (res.ok) {
                        deleteItemFromDB("sync", d.id);
                    }
                })
                .catch((err) => {
                    console.log("err while sending data: ", err);
                });
        }
    });
};

self.addEventListener("sync", async (e) => {
    console.log("[Service Worker] Background syncing", e);

    if (e.tag === "sync-new-posts") {
        console.log("[Service Worker] Syncing new post");

        e.waitUntil(await performSyncing());
    }
});

self.addEventListener("notificationclick", (e) => {
    let notif = e.notification;
    let action = e.action;

    console.log({ notif });

    if (action === "confirm") {
        console.log("confirm action clicked");
        notif.close();
    } else {
        console.log("cancel action clicked: ", action);
        e.waitUntil(
            clients.matchAll().then((clis) => {
                let client = clis.find((c) => c.visibilityState === "visible");
                if (client) {
                    client.navigate("https://psevdon1m.github.io/insta-pwa/");
                } else {
                    clients.openWindow("https://psevdon1m.github.io/insta-pwa/");
                }
            })
        );
        notif.close();
    }
});

self.addEventListener("notificationclose", (e) => {
    //  for analytics purposes
    console.log("notification was closed: ", e);
});

self.addEventListener("push", (e) => {
    console.log("Push notification received: ", e);
    let data = { title: "New!", content: "Something new happened!" };
    if (e.data) {
        data = JSON.parse(e.data.text());
    }

    let options = {
        body: data.content,
        icon: "/src/images/icons/app-icon-96x96.png",
        badge: "/src/images/icons/app-icon-96x96.png",
    };

    e.waitUntil(self.registration.showNotification(data.title, options));
});
