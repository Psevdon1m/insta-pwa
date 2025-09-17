var dbPromise = idb.open("posts-store", 1, (db) => {
    if (!db.objectStoreNames.contains("posts")) {
        db.createObjectStore("posts", { keyPath: "id" });
    }
    if (!db.objectStoreNames.contains("sync")) {
        db.createObjectStore("sync", { keyPath: "id" });
    }
});

function writeData(store, data) {
    return dbPromise.then((db) => {
        //begin tx for store and choose operation
        let tx = db.transaction(store, "readwrite");
        // get store from tx
        let storeInstance = tx.objectStore(store);
        //put data in store
        storeInstance.put(data);
        //complete tx, yes it is NOT a method
        return tx.complete;
    });
}

function readAllData(store) {
    return dbPromise.then((db) => {
        let tx = db.transaction(store, "readonly");
        let storeInstance = tx.objectStore(store);
        return storeInstance.getAll();
    });
}

function clearAllData(store) {
    return dbPromise.then((db) => {
        let tx = db.transaction(store, "readwrite");
        let storeInstance = tx.objectStore(store);
        storeInstance.clear();
        return tx.complete;
    });
}
function deleteItemFromDB(store, id) {
    return dbPromise
        .then((db) => {
            let tx = db.transaction(store, "readwrite");
            let storeInstance = tx.objectStore(store);
            storeInstance.delete(id);
            return tx.complete;
        })
        .then(() => {
            console.log("item deleted");
        });
}

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 5000 } = options; // default 1s

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(id);
    }
}

async function isActuallyOnline() {
    try {
        // Hit your API (could be a lightweight "ping" endpoint)
        const res = await fetchWithTimeout("https://insta-pwa-490ec-default-rtdb.europe-west1.firebasedatabase.app/posts.json", {
            method: "GET",
            cache: "no-store",
        });
        return res.ok;
    } catch (err) {
        if (err.name === "AbortError") {
            console.log("Request timed out!");
        }
        return false;
    }
}

function urlBase64ToUint8Array(base64String) {
    let padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    let base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

    let rawData = window.atob(base64);
    let outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; i++) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}
