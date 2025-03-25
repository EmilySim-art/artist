// js/script.js

// ===== Firebase 초기화 =====
export function initializeFirebase() {
  const firebaseConfig = {
    apiKey: "AIzaSyBoEyNEA_TdRx1doVHo4YzQChwzT3Tq_jw",
    authDomain: "artist-3fe1a.firebaseapp.com",
    projectId: "artist-3fe1a",
    storageBucket: "artist-3fe1a.firebasestorage.app",
    messagingSenderId: "44948061489",
    appId: "1:44948061489:web:65f4d8c4bb33f118790410",
    measurementId: "G-CZTN005F3W"
  };

  firebase.initializeApp(firebaseConfig);
  return firebase.storage();
}

// ===== 오늘의 주제 생성 =====
export function getPrompt() {
  const adjectives = ["고장난", "쓸데없이 멋진", "기대 이하의", "갑자기 등장한", "웃기게 생긴", "삐뚤어진", "진지한", "너무 느린"];
  const subjects = ["토스터기", "달팽이", "사자 탈 쓴 사람", "유령 햄스터", "춤추는 고래", "짜증내는 가방", "감자 인간", "셀카 찍는 나무"];
  const situations = ["결혼식", "면접 보는 중", "우주에서 튀어나옴", "혼자만 신나 있음", "자기 반성 중", "뛰다가 넘어짐", "SNS 라이브 방송 중"];

  function seedRandom(seed) {
    let x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  const today = new Date();
  const seed = parseInt(today.getFullYear().toString() + (today.getMonth()+1).toString().padStart(2, '0') + today.getDate().toString().padStart(2, '0'));
  const adj = adjectives[Math.floor(seedRandom(seed) * adjectives.length)];
  const subj = subjects[Math.floor(seedRandom(seed + 1) * subjects.length)];
  const sit = situations[Math.floor(seedRandom(seed + 2) * situations.length)];
  return `${adj} ${subj}이(가) ${sit}`;
}

// ===== 캔버스 설정 =====
export function setupCanvas() {
  const canvas = document.getElementById("drawCanvas");
  const ctx = canvas.getContext("2d");
  let drawing = false;

  function getPos(e) {
    if (e.touches) e = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e) {
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    e.preventDefault();
  }

  function stopDraw(e) {
    drawing = false;
    ctx.closePath();
    e.preventDefault();
  }

  function draw(e) {
    if (!drawing) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    e.preventDefault();
  }

  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mouseup", stopDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("touchstart", startDraw);
  canvas.addEventListener("touchend", stopDraw);
  canvas.addEventListener("touchmove", draw);

  return canvas;
}

// ===== 캔버스 리사이징 =====
function resizeCanvas(canvas, width, height) {
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = width;
  tempCanvas.height = height;
  const ctx = tempCanvas.getContext("2d");
  ctx.fillStyle = "#fff"; // 흰 배경
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(canvas, 0, 0, width, height);
  return tempCanvas;
}

// ===== 제출하기 (진행률 표시 포함) =====
export function submitDrawing(storage, canvas, promptText) {
  const status = document.getElementById("submitStatus");
  status.innerText = "업로드 중입니다...";

  const resizedCanvas = resizeCanvas(canvas, 300, 240);
  const canvasData = resizedCanvas.toDataURL("image/jpeg", 0.8);
  const blob = dataURLToBlob(canvasData);

  const timestamp = new Date().toISOString();
  const fileName = `drawing-${timestamp}_${promptText}.jpg`;
  const ref = storage.ref().child("submissions/" + fileName);

  const uploadTask = ref.put(blob);

  uploadTask.on("state_changed",
    (snapshot) => {
      const percent = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
      status.innerText = `업로드 중... (${percent}%)`;
    },
    (error) => {
      status.innerText = "제출 실패: " + error;
    },
    () => {
      status.innerText = "제출 완료! 🎉";
    }
  );
}

function dataURLToBlob(dataURL) {
  const parts = dataURL.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = atob(parts[1]);
  const uInt8Array = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }
  return new Blob([uInt8Array], { type: contentType });
}

// ===== 갤러리 로딩 =====
export function loadGallery(storage) {
  const container = document.getElementById("gallery");
  const listRef = storage.ref("submissions");

  listRef.listAll().then(res => {
    if (res.items.length === 0) {
      container.innerText = "아직 제출된 작품이 없습니다.";
      return;
    }

    const items = res.items.sort(() => 0.5 - Math.random()).slice(0, 10);
    container.innerHTML = "";

    items.forEach(itemRef => {
      itemRef.getDownloadURL().then(url => {
        const artBox = document.createElement("div");
        artBox.className = "art";

        const img = document.createElement("img");
        img.src = url;

        const caption = document.createElement("div");
        caption.className = "caption";
        caption.innerText = itemRef.name.split("_")[1]?.replace(".jpg", "") || "제목 없음";

        artBox.appendChild(img);
        artBox.appendChild(caption);
        container.appendChild(artBox);
      });
    });
  }).catch(err => {
    container.innerText = "갤러리를 불러오는 중 오류 발생: " + err;
  });
}
