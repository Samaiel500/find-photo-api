const eventSlug = "2024-studencheskii-kubok-bs-1-i-etap"
const interval = 2000; // 2 seconds
const uploadUrl = "https://marathon-photo.ru/photos/api/search_by_face/?competition=" + eventSlug;
const resultUrl = "https://marathon-photo.ru/photos/api/search_result/?search_id=";
const token = "1dd1abec525746fe6963301a5c70f3e4228434bd"; // Замените на ваш токен авторизации

Dropzone.options.selfieUpload = {
    url: uploadUrl,
    paramName: "img",
    maxFiles: 1,
    acceptedFiles: "image/*",
    headers: {},
    init: function () {
        this.on("uploadprogress", function (file, progress) {
            document.getElementById("spinner").style.display = "block";
        });
        this.on("success", function (file, response) {
            console.log("Upload successful!", response);
            if (response && response.search_id) {
                pollForResults(response.search_id);
            } else {
                console.error("Invalid response: No search_id found.");
            }
        });

        this.on("error", function (file, errorMessage) {
            console.error("Upload failed!", errorMessage);
            alert("Photo upload failed!");
        });
    }
};

function pollForResults(searchId) {

    function checkResults() {
        fetch(`${resultUrl}${searchId}`)
            .then(response => response.json())
            .then(data => {
                console.log("Polling result: ", data);
                if (data.finish) {
                    // alert("Search finished! Results: " + JSON.stringify(data));
                    document.getElementById("spinner").style.display = "none";
                    displayResults(data);
                } else {
                    setTimeout(checkResults, interval);
                }
            })
            .catch(error => {
                console.error("Error polling results: ", error);
                alert("Фотографии не найдены");
                document.getElementById("spinner").style.display = "none";
            });
    }
    checkResults();
}

function displayResults(data) {
    document.getElementById("dropzone-row").style.display = "none";
    const resultContainer = document.getElementById("resultsContainer");
    resultContainer.innerHTML = ""; // Очистка контейнера перед добавлением новых элементов

    if (data && data.result) {
        const photos = data.result['tsifrovaia-fotografiia']['fotografiia'];

        if (!photos || Object.keys(photos).length === 0) {
            const noPhotosMessage = document.createElement("p");
            noPhotosMessage.textContent = "No photos found.";
            resultContainer.appendChild(noPhotosMessage);
            return;
        }

        Object.keys(photos).forEach(photoId => {
            const photo = photos[photoId];
            const previewUrl = photo.previews.S; // Ссылка на превью
            const fullImageUrl = photo.previews.XL; // Ссылка на полный размер

            // Элемент ссылки для галереи
            const photoLink = document.createElement("a");
            photoLink.href = fullImageUrl;
            photoLink.setAttribute("data-lightbox", "gallery");
            photoLink.setAttribute("data-title", `Title: ${photo.title}, Price: ${photo.price}, Author: ${photo.author}`);

            const img = document.createElement("img");
            img.src = previewUrl;
            img.alt = photo.title;

            photoLink.appendChild(img);

            // Создание кнопки скачивания
            const downloadBtn = document.createElement("button");
            downloadBtn.className = "download-btn";
            downloadBtn.textContent = "Download";
            downloadBtn.addEventListener("click", () => downloadPhoto(photoId));

            const photoWrapper = document.createElement("div");
            photoWrapper.appendChild(photoLink);
            photoWrapper.appendChild(downloadBtn);

            resultContainer.appendChild(photoWrapper);
        });
    } else {
        alert("Фотографии не найдены");
    }
}

function downloadPhoto(photoId) {
    const downloadUrl = `https://marathon-photo.ru/photos/api/fullsize/${photoId}/`;  // URL для запроса

    fetch(downloadUrl, {
        method: 'GET',
        headers: {
            'Authorization': `Token ${token}`,
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log("Download response:", data);

            // Извлекаем URL картинки из ответа
            if (data && data.fullsize_url) {
                const imageUrl = data.fullsize_url;
                console.log("Full size image URL:", imageUrl);

                // Функция для скачивания картинки
                downloadImage(imageUrl);
            } else {
                alert("Image not found or invalid response.");
            }
        })
        .catch(error => {
            console.error("Error fetching photo data:", error);
            alert("Error fetching photo data!");
        });
}

function downloadImage(url) {
    // Создаем элемент <a> для скачивания изображения
    const a = document.createElement("a");
    a.href = url;
    a.download = url.split("/").pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}