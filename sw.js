// ============================================================
// 푸로찜 에스 PWA 서비스 워커  v3
// ⭐ CACHE_VERSION 을 v3 로 올렸기 때문에
//    예전에 저장된 옛날 복사본(캐시)은 전부 자동 삭제됩니다.
// ============================================================

const CACHE_VERSION = 'prozyme-pwa-cache-v3';

// 미리 저장해두는 껍데기 파일들
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 설치될 때
self.addEventListener('install', function (event) {

  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) {
        // 껍데기 파일 저장 (하나라도 없으면 그냥 넘어감)
        return Promise.all(
          ASSETS.map(function (url) {
            return cache.add(url).catch(function () { /* 없어도 OK */ });
          })
        );
      })
  );

});


// 켜질 때 : 예전 버전 캐시 전부 삭제!
self.addEventListener('activate', function (event) {

  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (key) { return key !== CACHE_VERSION; })
            .map(function (key) { return caches.delete(key); })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );

});


// 데이터를 달라고 할 때
self.addEventListener('fetch', function (event) {

  const url = new URL(event.request.url);

  // ------------------------------------------------------------
  // ⭐ GAS 데이터 요청은 절대 캐시하지 않고
  //    무조건 인터넷에서 새 것만 받는다! (v3 핵심)
  // ------------------------------------------------------------
  if (url.href.indexOf('script.google.com') > -1) {
    event.respondWith(fetch(event.request));
    return;
  }

  // ------------------------------------------------------------
  // 그 외 (html, css, 아이콘 등) :
  // 인터넷 먼저 → 실패하면 저장한 것 사용
  // ------------------------------------------------------------
  event.respondWith(
    fetch(event.request)
      .then(function (response) {

        const copy = response.clone();

        caches.open(CACHE_VERSION).then(function (cache) {
          cache.put(event.request, copy);
        });

        return response;

      })
      .catch(function () {
        return caches.match(event.request);
      })
  );

});
