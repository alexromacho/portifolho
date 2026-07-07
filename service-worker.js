const CACHE_NAME = "pedidos-fornecedores-v10";
const ARQUIVOS = [
    "./",
    "./index.html",
    "./vero.html",
    "./aragua.html",
    "./wrEmbalagem.html",
    "./fornecedores.html",
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
    self.skipWaiting();

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
        }).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((resposta) => {
                const copia = resposta.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, copia);
                });

                return resposta;
            })
            .catch(() => caches.match(event.request))
    );
});
