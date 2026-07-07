const CACHE_NAME = "pedidos-fornecedores-v7";
const ARQUIVOS = [
    "./",
    "./index.html",
    "./vero.html",
    "./aragua.html",
    "./wrEmbalagem.html",
    "./assets.css/style.css",
    "./java.js",
    "./manifest.json",
    "./app-icon.svg",
    "./img/html.png",
    "./img/css.png",
    "./img/js.png",
    "./img/fundo.jpg"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS))
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((nomes) => {
            return Promise.all(
                nomes
                    .filter((nome) => nome !== CACHE_NAME)
                    .map((nome) => caches.delete(nome))
            );
        })
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((resposta) => {
            return resposta || fetch(event.request);
        })
    );
});
