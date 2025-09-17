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
            swreg.showNotification("Successfully subscribed!", options);
        });
    }
}

function configurePushSubscription() {
    if (!("serviceWorker" in navigator)) return;

    let reg;

    navigator.serviceWorker.ready.then((swreg) => {
        reg = swreg;
        swreg.pushManager
            .getSubscription()
            .then((subs) => {
                //if null we do not have subscriptions
                if (subs === null) {
                    //create new subscriptions

                    const vapidPublicKey = "BA3ytKP-L5bcjUbI4F5_0fvGpl9V07lgWh3zZO8TTv93gsVCyiEAACsQX3vNM0_3tLq8UDS-5m-dLT4Y6Bu6o8Q";
                    const convertedPubKey = urlBase64ToUint8Array(vapidPublicKey);
                    return reg.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: convertedPubKey,
                    });
                } else {
                    //we already have subscription
                }
            })
            .then((newSub) => {
                return fetch("https://insta-pwa-490ec-default-rtdb.europe-west1.firebasedatabase.app/subscriptions.json", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify(newSub),
                });
            })
            .then((res) => {
                if (res.ok) {
                    displayConfirmNotification();
                }
            })
            .catch((err) => {
                console.log("Error adding subs: ", err);
            });
    });
}

function askForNotifPermission() {
    Notification.requestPermission((res) => {
        console.log("User Choice", res);
        if (res !== "granted") {
            alert("No notification permission granted");
        } else {
            // hide enable notif btn as access granted
            configurePushSubscription();
        }
    });
}

if ("Notification" in window && "serviceWorker" in navigator) {
    for (const btn of notificationButtons) {
        btn.style.display = "inline-block";

        btn.addEventListener("click", askForNotifPermission);
    }
}
