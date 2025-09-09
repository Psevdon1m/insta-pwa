var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector("#close-create-post-modal-btn");
var sharedMomentsArea = document.querySelector("#shared-moments");

function openCreatePostModal() {
    createPostArea.style.display = "block";
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

function createCard() {
    var cardWrapper = document.createElement("div");
    cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
    cardWrapper.style.margin = "0 auto";
    var cardTitle = document.createElement("div");
    cardTitle.className = "mdl-card__title";
    cardTitle.style.backgroundImage = 'url("/src/images/sf-boat.jpg")';
    cardTitle.style.backgroundSize = "cover";
    cardTitle.style.color = "white";
    cardTitle.style.height = "180px";
    cardWrapper.appendChild(cardTitle);
    var cardTitleTextElement = document.createElement("h2");
    cardTitleTextElement.className = "mdl-card__title-text";
    cardTitleTextElement.textContent = "San Francisco Trip";
    cardTitle.appendChild(cardTitleTextElement);
    var cardSupportingText = document.createElement("div");
    cardSupportingText.className = "mdl-card__supporting-text";
    cardSupportingText.textContent = "In San Francisco";
    cardSupportingText.style.textAlign = "center";
    // var cardSaveButton = document.createElement("button");
    // cardSaveButton.textContent = "Save";
    // cardSaveButton.addEventListener("click", onSaveButtonClicked);
    // cardSupportingText.appendChild(cardSaveButton);
    cardWrapper.appendChild(cardSupportingText);
    componentHandler.upgradeElement(cardWrapper);
    sharedMomentsArea.appendChild(cardWrapper);
}

var url = "https://rickandmortyapi.com/api";
var networkDataReceived = false;

fetch(url)
    .then(function (res) {
        return res.json();
    })
    .then(function (data) {
        networkDataReceived = true;
        console.log("FROM WEB: ", data);
        clearCards();
        createCard();
    });

if ("caches" in window) {
    caches
        .match(url)
        .then((res) => {
            if (res) {
                return res.json();
            }
        })
        .then((data) => {
            console.log("FROM CACHE: ", data);
            if (!networkDataReceived) {
                clearCards();
                createCard();
            }
        });
}
