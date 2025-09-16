var deferredPromp;

const notificationButtons = document.querySelectorAll(".enable-notifications");

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

function displayConfirmNotification() {
    if ("serviceWorker" in navigator) {
        const options = {
            body: "You successfully subcribed to the notification service",
            icon: "/src/images/icons/app-icon-96x96.png",
            image: "/src/images/sf-boat.jpg",
            dir: "ltr",
            lang: "en-US", //BCP 47
            vibrate: [100, 50, 200], //partially supported on devices
            badge: "/src/images/icons/app-icon-96x96.png", // only android
            tag: "confirm-notification", //for stacking notificaitons for some operation. if set - only one notif will be dysplayed, if not set, multiple notification will be stacked with last on top
            renotify: true, // if true - notifs with same tag will vibrate, if false - no vibrations,
            actions: [
                //might not be dysplayed
                { action: "confirm", title: "Okay", icon: "/src/images/icons/app-icon-96x96.png" },
                { action: "cancel", title: "Cancel", icon: "/src/images/icons/app-icon-96x96.png" },
            ],
        };
        navigator.serviceWorker.ready.then((swreg) => {
            swreg.showNotification("Successfully subscribed from sw!", options);
        });
    }
}

function askForNotifPermission() {
    Notification.requestPermission((res) => {
        console.log("User Choice", res);
        if (res !== "granted") {
            alert("No notification permission granted");
        } else {
            // hide enable notif btn as access granted
            displayConfirmNotification();
        }
    });
}

if ("Notification" in window) {
    for (const btn of notificationButtons) {
        btn.style.display = "inline-block";

        btn.addEventListener("click", askForNotifPermission);
    }
}
