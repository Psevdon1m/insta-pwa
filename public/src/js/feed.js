var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector("#close-create-post-modal-btn");

function openCreatePostModal() {
    createPostArea.style.display = "block";
    if (deferredPromp) {
        deferredPromp.prompt();

        deferredPromp.userChoice.then((result) => {
            console.log(result.outcome);

            if (result.outcome === "dismissed") {
                console.log("dismissed the prompt");
            } else {
                console.log("Added to home screen");
            }
        });
        deferredPromp = null;
    }
}

function closeCreatePostModal() {
    createPostArea.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);
