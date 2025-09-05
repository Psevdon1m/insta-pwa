var deferredPromp;

if ("serviceWorker" in navigator) {
    //run code only if service worker is supported
    navigator.serviceWorker.register("/sw.js").then(function () {
        console.log("Service Worker Registered");
    });
}

window.addEventListener("beforeinstallprompt", (e) => {
    console.log("beforeinstallprompt fired");
    e.preventDefault();
    deferredPromp = e;
    return false;
});
