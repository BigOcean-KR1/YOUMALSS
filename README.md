# ♻ TrashAI - 발표용 슬라이드 웹페이지

PPT처럼 슬라이드 형식으로 넘기는 발표용 웹페이지입니다.

## 파일 구조
```
trash-classifier/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── slides.js      # 슬라이드 이동
    └── classifier.js  # AI 분류 로직
```

## 슬라이드 이동
- ← → 키보드 방향키
- 하단 ‹ › 버튼
- 하단 점 클릭
- 모바일 스와이프

## 티처블 머신 연동
`js/classifier.js` 상단 MODEL_URL 수정:
```js
MODEL_URL: "https://teachablemachine.withgoogle.com/models/여기에붙여넣기/",
```
그리고 index.html <head>에 추가:
```html
<script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js"></script>
```

## 직접 수정할 것
- 슬라이드 2: 학교 사진 img 태그로 교체
- 슬라이드 10: 그래프 이미지 교체
