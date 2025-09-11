var dbPromise = idb.open("posts-store", 1, (db) => {
    if (!db.objectStoreNames.contains("posts")) {
        db.createObjectStore("posts", { keyPath: "id" });
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
