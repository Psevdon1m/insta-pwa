var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector("#close-create-post-modal-btn");
var sharedMomentsArea = document.querySelector("#shared-moments");
var from = document.querySelector("form");
var titleInput = document.querySelector("#title");
var locationInput = document.querySelector("#location");

var videoPlayer = document.querySelector("#player");
var canvasElement = document.querySelector("#canvas");
var captureButton = document.querySelector("#capture-btn");
var imagePicker = document.querySelector("#image-picker");
var imagePickerArea = document.querySelector("#pick-image");

function initializeMedia() {
    if ("mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices) {
        //check if video & audio supported
        navigator.mediaDevices
            .getUserMedia({ video: true })
            .then((stream) => {
                videoPlayer.srcObject = stream;
                videoPlayer.style.display = "block";
            })
            .catch((err) => {
                imagePickerArea.style.display = "block";
                console.log("No access to media: ", err);
            });
    }
}

captureButton.addEventListener("click", (e) => {
    canvasElement.style.display = "block";
    videoPlayer.style.display = "none";
    captureButton.style.display = "none";

    let ctx = canvasElement.getContext("2d");
    ctx.drawImage(videoPlayer, 0, 0, canvasElement.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvasElement.width));
    videoPlayer.srcObj.getVideoTracks().forEach((track) => track.stop());
});

function openCreatePostModal() {
    // createPostArea.style.display = "block";
    createPostArea.style.transform = "translateY(0)";
    initializeMedia();
    if (deferredPrompt) {
        deferredPrompt.prompt();

        deferredPrompt.userChoice.then(function (choiceResult) {
            console.log(choiceResult.outcome);

            if (choiceResult.outcome === "dismissed") {
                console.log("User cancelled installation");
            } else {
                console.log("User added to home screen");
            }
        });

        deferredPrompt = null;
    }
    //unregustering service worker
    // if ("serviceWorker" in navigator) {
    //     navigator.serviceWorker.getRegistration().then((registrations) => {
    //         for (let i = 0; i < registrations.length; i++) {
    //             registrations[i].unregister();
    //         }
    //     });
    // }
}

function closeCreatePostModal() {
    createPostArea.style.display = "none";
    imagePickerArea.style.display = "none";
    videoPlayer.style.display = "none";
    canvasElement.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

// currently not in use, using dynamic caching in sw.js instead
function onSaveButtonClicked() {
    console.log("clicked");

    if ("caches" in window) {
        caches.open("user-requested").then((cache) => {
            cache.add("https://httpbin.org/get");
            cache.add("/src/images/sf-boat.jpg");
        });
    }
}

function clearCards() {
    while (sharedMomentsArea.hasChildNodes()) {
        sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
    }
}

function createCard(data) {
    var cardWrapper = document.createElement("div");
    cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
    cardWrapper.style.margin = "0 auto";
    var cardTitle = document.createElement("div");
    cardTitle.className = "mdl-card__title";
    cardTitle.style.backgroundImage = `url(${data.image})`;
    cardTitle.style.backgroundSize = "cover";
    cardTitle.style.color = "white";
    cardTitle.style.height = "180px";
    cardWrapper.appendChild(cardTitle);
    var cardTitleTextElement = document.createElement("h2");
    cardTitleTextElement.className = "mdl-card__title-text";
    cardTitleTextElement.textContent = data.location;
    cardTitle.appendChild(cardTitleTextElement);
    var cardSupportingText = document.createElement("div");
    cardSupportingText.className = "mdl-card__supporting-text";
    cardSupportingText.textContent = data.title;
    cardSupportingText.style.textAlign = "center";
    // var cardSaveButton = document.createElement("button");
    // cardSaveButton.textContent = "Save";
    // cardSaveButton.addEventListener("click", onSaveButtonClicked);
    // cardSupportingText.appendChild(cardSaveButton);
    cardWrapper.appendChild(cardSupportingText);
    componentHandler.upgradeElement(cardWrapper);
    sharedMomentsArea.appendChild(cardWrapper);
}

var url = "https://insta-pwa-490ec-default-rtdb.europe-west1.firebasedatabase.app/posts.json";
let local_backend_url = "https://56195551ae88.ngrok-free.app/api";
var networkDataReceived = false;

function updateUI(data) {
    for (const post of data) {
        createCard(post);
    }
}

fetch(url)
    .then(function (res) {
        return res.json();
    })
    .then(function (data) {
        networkDataReceived = true;
        console.log("FROM WEB: ", data);
        clearCards();
        updateUI(Object.values(data));
    });

if ("indexedDB" in window) {
    readAllData("posts").then((data) => {
        if (!networkDataReceived) {
            console.log("From db", data);
            updateUI(data);
        }
    });
}

function sendData() {
    fetch(local_backend_url + "/add-post", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify({
            title: titleInput.value,
            location: locationInput.value,
            id: new Date().toISOString(),
            image: "https://www.ukrainer.net/wp-content/uploads/2019/12/15.jpg",
        }),
    }).then((res) => {
        console.log("Data sent: ", res);
        updateUI();
    });
}

from.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("click submit");
    if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
        alert("Please enter valid data");
        return;
    }

    closeCreatePostModal();
    //registering sync request
    if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then(async (sw) => {
            let post = {
                title: titleInput.value,
                location: locationInput.value,
                id: new Date().toISOString(),
            };

            //in brawe and other browsers bg sync is disabled by default, so we need to check and inform user
            let isSyncAllowed;
            try {
                await sw.sync.register("test-sync");
                isSyncAllowed = true;
            } catch (error) {
                isSyncAllowed = false;
            }
            console.log({ isSyncAllowed });
            if (isSyncAllowed) {
                // store data for sync in idb
                writeData("sync", post)
                    .then(() => {
                        return sw.sync.register("sync-new-posts");
                    })
                    .then(() => {
                        let snackBarContainer = document.querySelector("#confirmation-toast");
                        let data = { message: "Your ppost is saved for syncing!" };
                        snackBarContainer.MaterialSnackbar.showSnackbar(data);
                    })
                    .catch((err) => {
                        console.log(err);
                    });
            } else {
                alert("syncing is disabled by the browser, please allow it in settings");
            }
        });
    } else {
        sendData();
    }
});
