// TTS
let currentEnglishAnswer = '';

function speak(text, lang) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
}

function speakKorean() {
    const word = document.getElementById('koreanWord').textContent;
    speak(word, 'ko-KR');
}

function speakEnglishAnswer() {
    speak(currentEnglishAnswer, 'en-US');
}

// 게임 상태
let gameState = {
    hearts: 5,
    streak: 0,
    totalXP: 0,
    currentQuestion: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    sessionXP: 0,
    questionResults: [],
    currentWords: []
};

// 로컬 스토리지에서 데이터 로드
function loadGameState() {
    const saved = localStorage.getItem('wordChallengeState');
    if (saved) {
        const parsed = JSON.parse(saved);
        gameState.totalXP = parsed.totalXP || 0;
        gameState.streak = parsed.streak || 0;
    }
    updateDisplay();
}

// 로컬 스토리지에 저장
function saveGameState() {
    localStorage.setItem('wordChallengeState', JSON.stringify({
        totalXP: gameState.totalXP,
        streak: gameState.streak
    }));
}

// 화면 업데이트
function updateDisplay() {
    document.getElementById('heartCount').textContent = gameState.hearts;
    document.getElementById('streakCount').textContent = gameState.streak;
    document.getElementById('totalXP').textContent = gameState.totalXP;
    updateProgressNumbers();
}

// 문제 번호 업데이트
function updateProgressNumbers() {
    const container = document.getElementById('progressNumbers');
    container.innerHTML = '';
    for (let i = 1; i <= 10; i++) {
        const num = document.createElement('div');
        num.className = 'progress-num';
        num.textContent = i;

        if (i < gameState.currentQuestion + 1) {
            if (gameState.questionResults[i-1] === true) {
                num.classList.add('completed');
            } else if (gameState.questionResults[i-1] === false) {
                num.classList.add('wrong');
            }
        } else if (i === gameState.currentQuestion + 1) {
            num.classList.add('active');
        }
        container.appendChild(num);
    }
}

// 랜덤 단어 10개 선택
function selectRandomWords() {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    gameState.currentWords = shuffled.slice(0, 10);
}

// 보기 생성 (정답 + 오답 3개)
function generateOptions(correctWord) {
    const options = [correctWord];
    const otherWords = words.filter(w => w.english !== correctWord.english);
    const shuffled = otherWords.sort(() => Math.random() - 0.5);

    for (let i = 0; i < 3 && i < shuffled.length; i++) {
        options.push(shuffled[i]);
    }

    return options.sort(() => Math.random() - 0.5);
}

// 챌린지 시작
function startChallenge() {
    gameState.hearts = 5;
    gameState.currentQuestion = 0;
    gameState.correctAnswers = 0;
    gameState.wrongAnswers = 0;
    gameState.sessionXP = 0;
    gameState.questionResults = [];

    selectRandomWords();

    document.getElementById('mainScreen').classList.add('hidden');
    document.getElementById('quizScreen').style.display = 'block';
    document.getElementById('completeScreen').style.display = 'none';

    showQuestion();
}

// 문제 표시
function showQuestion() {
    if (gameState.currentQuestion >= 10 || gameState.hearts <= 0) {
        showComplete();
        return;
    }

    const word = gameState.currentWords[gameState.currentQuestion];
    document.getElementById('koreanWord').textContent = word.korean;
    document.getElementById('wordCard').classList.remove('correct');

    const options = generateOptions(word);
    const optionsContainer = document.getElementById('options');
    optionsContainer.innerHTML = '';

    options.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="num">${index + 1}</span>${opt.english}`;
        btn.onclick = () => checkAnswer(opt, word, btn);
        optionsContainer.appendChild(btn);
    });

    updateDisplay();
}

// 정답 확인
function checkAnswer(selected, correct, button) {
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(btn => btn.disabled = true);

    const isCorrect = selected.english === correct.english;
    const panel = document.getElementById('resultPanel');

    if (isCorrect) {
        button.classList.add('correct');
        document.getElementById('wordCard').classList.add('correct');
        panel.className = 'result-panel correct';
        document.getElementById('resultTitle').textContent = '정답입니다!';
        document.getElementById('resultMessage').textContent = '계속 집중하세요!';

        gameState.correctAnswers++;
        gameState.streak++;
        gameState.sessionXP += 10 + (gameState.streak > 1 ? gameState.streak : 0);
        gameState.totalXP += 10 + (gameState.streak > 1 ? gameState.streak : 0);
        gameState.questionResults.push(true);
    } else {
        button.classList.add('wrong');
        buttons.forEach(btn => {
            if (btn.textContent.includes(correct.english)) {
                btn.classList.add('correct');
            }
        });

        panel.className = 'result-panel wrong';
        document.getElementById('resultTitle').textContent = '틀렸습니다!';
        document.getElementById('resultMessage').textContent = `정답: ${correct.english}`;

        gameState.wrongAnswers++;
        gameState.hearts--;
        gameState.streak = 0;
        gameState.questionResults.push(false);
    }

    saveGameState();
    updateDisplay();
    panel.style.display = 'block';

    // 영어 발음 자동 재생 + 결과 패널 버튼 표시
    currentEnglishAnswer = correct.english;
    document.getElementById('ttsEngBtn').style.display = 'inline-block';
    setTimeout(() => speak(correct.english, 'en-US'), 300);
}

// 다음 문제
function nextQuestion() {
    window.speechSynthesis && window.speechSynthesis.cancel();
    document.getElementById('resultPanel').style.display = 'none';
    document.getElementById('ttsEngBtn').style.display = 'none';
    gameState.currentQuestion++;
    showQuestion();
}

// 완료 화면
function showComplete() {
    document.getElementById('quizScreen').style.display = 'none';
    document.getElementById('completeScreen').style.display = 'block';
    document.getElementById('resultPanel').style.display = 'none';

    document.getElementById('correctCount').textContent = gameState.correctAnswers;
    document.getElementById('wrongCount').textContent = gameState.wrongAnswers;
    document.getElementById('earnedXP').textContent = '+' + gameState.sessionXP;
}

// 리셋
function resetChallenge() {
    document.getElementById('completeScreen').style.display = 'none';
    document.getElementById('mainScreen').classList.remove('hidden');
    gameState.hearts = 5;
    updateDisplay();
}

// 초기화
loadGameState();
updateProgressNumbers();
