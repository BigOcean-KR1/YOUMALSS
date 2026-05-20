# ♻ TrashAI - AI 쓰레기 자동 분류기

딥러닝을 활용한 쓰레기 자동화 분류 시스템 웹 데모

---

## 📁 파일 구조

```
trash-classifier/
├── index.html          # 메인 페이지
├── css/
│   ├── style.css       # 전체 스타일
│   └── animations.css  # 애니메이션
├── js/
│   ├── particles.js    # 배경 파티클
│   ├── classifier.js   # AI 분류 로직
│   └── scroll.js       # 스크롤 효과
└── README.md
```

---

## 🔗 티처블 머신 연동 방법

1. [teachablemachine.withgoogle.com](https://teachablemachine.withgoogle.com) 접속
2. Image Project → 6가지 클래스 학습
   - 플라스틱 / 캔 / 종이 / 유리 / 스티로폼 / 비닐
3. **모델 내보내기 → Tensorflow.js → 모델 업로드**
4. 생성된 URL 복사
5. `js/classifier.js` 상단 CONFIG 수정:

```js
const CONFIG = {
  MODEL_URL: "https://teachablemachine.withgoogle.com/models/여기에붙여넣기/",
  ...
};
```

6. `index.html` `<head>`에 스크립트 추가:

```html
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js"></script>
```

---

## 🚀 GitHub Pages 배포

1. GitHub에 레포지토리 생성
2. 파일 전체 업로드
3. Settings → Pages → Branch: main → Save
4. 배포 완료!

---

## 📖 논문 정보

- 제목: 딥러닝을 활용한 쓰레기 자동화 분류 시스템
- 저자: 박주형, 김영운, 황유성, 김동준, 최현진
- 학회: ICROS 2023 (한국로봇학회)
- 발표: 2023년 6월, 삼척

---

동양미래대학교 로봇소프트웨어학과 · 김대양
