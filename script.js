// --- STATE VARIABLES ---
let studentDetails = { name: "", index: "" };
let videoStream = null;
let answers = {};
let timerInterval;
const QUIZ_DURATION_SECONDS = 20 * 60; // 20 minutes

// --- TELEGRAM BOT CONFIG ---
const BOT_TOKEN = "7698861947:AAHD_0sTzjMlHpW3sFPDEHUMv8-srBmR2k8";
const CHAT_ID = "-1003525199804";

// --- QUIZ DATA ---
const quizData = [
    { q: "What is the fundamental economic problem that every society faces?", options: ["A. Inflation", "B. Scarcity", "C. Poverty", "D. Overpopulation"], ans: 1 },
    { q: "Opportunity cost is best defined as:", options: ["A. The total money spent on an item.", "B. The time spent making a decision.", "C. The value of the next best alternative given up.", "D. The cost of production."], ans: 2 },
    { q: "Which of the following is a 'land' resource in economics?", options: ["A. A tractor", "B. A factory building", "C. Crude oil deposits", "D. The owner of a business"], ans: 2 },
    { q: "A 'normative' economic statement is one that:", options: ["A. Can be proven with data.", "B. Describes things as they currently are.", "C. Is based on value judgments or opinions (what 'ought to be').", "D. Only deals with microeconomics."], ans: 2 },
    { q: "According to the Law of Demand, if the price of a product rises:", options: ["A. Demand increases.", "B. Quantity demanded decreases.", "C. Supply decreases.", "D. Quantity demanded increases."], ans: 1 },
    { q: "If the price of coffee rises, the demand for tea (a substitute) will likely:", options: ["A. Increase.", "B. Decrease.", "C. Stay the same.", "D. Become zero."], ans: 0 },
    { q: "Which of the following would cause the supply curve for bread to shift to the right?", options: ["A. An increase in the price of flour.", "B. A decrease in the price of bread.", "C. An improvement in baking technology.", "D. A tax on bakeries."], ans: 2 },
    { q: "Market equilibrium occurs at the point where:", options: ["A. Demand is higher than supply.", "B. The government sets the price.", "C. Quantity demanded equals quantity supplied.", "D. Sellers make the most profit."], ans: 2 },
    { q: "A 'surplus' exists in the market when:", options: ["A. The price is below the equilibrium price.", "B. The price is above the equilibrium price.", "C. Demand is equal to supply.", "D. The government removes all taxes."], ans: 1 },
    { q: "If both demand and supply increase at the same time, what will definitely happen?", options: ["A. Price will rise.", "B. Price will fall.", "C. Equilibrium quantity will increase.", "D. Equilibrium quantity will decrease."], ans: 2 },
    { q: "In which market structure are there a very large number of sellers selling identical products?", options: ["A. Monopoly", "B. Oligopoly", "C. Perfect Competition", "D. Monopolistic Competition"], ans: 2 },
    { q: "A firm in a perfectly competitive market is known as a:", options: ["A. Price maker.", "B. Price taker.", "C. Price leader.", "D. Monopolist."], ans: 1 },
    { q: "Which market structure is characterized by a single seller?", options: ["A. Monopoly", "B. Duopoly", "C. Oligopoly", "D. Perfect Competition"], ans: 0 },
    { q: "Product differentiation (branding/advertising) is a key feature of:", options: ["A. Perfect Competition.", "B. Monopolistic Competition.", "C. Monopoly.", "D. Pure Command Economy."], ans: 1 },
    { q: "An Oligopoly is a market dominated by:", options: ["A. Only one firm.", "B. Millions of small firms.", "C. A few large firms.", "D. The government."], ans: 2 },
    { q: "(Difficult) If the cross-price elasticity of two goods is negative, the goods are:", options: ["A. Substitutes.", "B. Complements.", "C. Inferior goods.", "D. Luxury goods."], ans: 1 },
    { q: "A government-imposed maximum price set below the equilibrium is called a:", options: ["A. Price floor.", "B. Price ceiling.", "C. Subsidy.", "D. Quota."], ans: 1 },
    { q: "A price ceiling usually leads to a:", options: ["A. Surplus.", "B. Shortage.", "C. Market clearing.", "D. Increase in supply."], ans: 1 },
    { q: "(Difficult) Which of the following would cause a 'movement along' the supply curve rather than a 'shift' of the curve?", options: ["A. A change in the cost of raw materials.", "B. A change in the price of the good itself.", "C. A change in technology.", "D. A change in the number of producers."], ans: 1 },
    { q: "The 'Invisible Hand' theory was famously proposed by:", options: ["A. John Maynard Keynes.", "B. Karl Marx.", "C. Adam Smith.", "D. David Ricardo."], ans: 2 }
];

// --- NAVIGATION & DOM ELEMENTS ---
const switchView = (hideId, showId) => {
    document.getElementById(hideId).classList.remove('active');
    document.getElementById(hideId).classList.add('hidden');
    document.getElementById(showId).classList.remove('hidden');
    document.getElementById(showId).classList.add('active');
};

// --- STEP 1: VALIDATION ---
document.getElementById('proceedToVerifyBtn').addEventListener('click', () => {
    const name = document.getElementById('fullName').value.trim();
    const index = document.getElementById('indexNumber').value.trim();
    const errorElem = document.getElementById('indexError');

    const indexRegex = /^[a-zA-Z0-9]{9}$/;

    if (!name || !index) {
        errorElem.innerText = "Please fill in all fields.";
        return;
    }

    if (!indexRegex.test(index)) {
        errorElem.innerText = "Index number must be exactly 9 characters long.";
        return;
    }

    // --- TIME GATE: 2:30 PM (14:30) to 2:50 PM (14:50) ---
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    // Check if hour is 14 (2 PM) AND minutes are between 30 and 50
    const isWithinTimeWindow = (hours === 14 && minutes >= 30 && minutes <= 50);

    if (!isWithinTimeWindow) {
        alert("Access Denied: The portal is only open between 2:30 PM and 2:50 PM.");
        return;
    }

    errorElem.innerText = "";
    studentDetails.name = name;
    studentDetails.index = index;

    switchView('login-view', 'camera-view');
    initCamera();
});

// --- STEP 2: CAMERA & TELEGRAM BOT ---
async function initCamera() {
    const video = document.getElementById('videoElement');
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = videoStream;
    } catch (err) {
        alert("Camera access denied or unavailable. You must allow camera access to proceed.");
    }
}

document.getElementById('captureBtn').addEventListener('click', () => {
    const video = document.getElementById('videoElement');
    const canvas = document.getElementById('canvasElement');
    const status = document.getElementById('verificationStatus');
    const captureBtn = document.getElementById('captureBtn');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    captureBtn.disabled = true;
    status.innerText = "Verifying and Preparing Quiz... Please wait.";

    canvas.toBlob((blob) => {
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('photo', blob, `${studentDetails.index}.png`);
        formData.append('caption', `Exam Verification\nName: ${studentDetails.name}\nIndex: ${studentDetails.index}\nTime: ${new Date().toLocaleTimeString()}`);

        fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if(data.ok) {
                status.innerText = "Verification successful! Starting quiz...";
                
                // NEW: Connect the video stream to the AI Invigilator preview instead of stopping it
                const invigilatorVideo = document.getElementById('invigilatorVideo');
                invigilatorVideo.srcObject = videoStream;
                
                setTimeout(() => {
                    switchView('camera-view', 'quiz-view');
                    startQuiz();
                }, 1500);
            } else {
                status.innerText = "Failed to upload. Please try again.";
                captureBtn.disabled = false;
            }
        })
        .catch(error => {
            status.innerText = "Network error. Check connection.";
            captureBtn.disabled = false;
        });
    }, 'image/png');
});

// --- STEP 3: QUIZ LOGIC ---
function startQuiz() {
    renderQuestions();
    let timeLeft = QUIZ_DURATION_SECONDS;
    const timerDisplay = document.getElementById('timerDisplay');

    timerInterval = setInterval(() => {
        timeLeft--;
        let minutes = Math.floor(timeLeft / 60);
        let seconds = timeLeft % 60;
        timerDisplay.innerText = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert("Time is up! Your quiz will be automatically submitted.");
            processSubmission();
        }
    }, 1000);
}

function renderQuestions() {
    const container = document.getElementById('questionsContainer');
    container.innerHTML = "";

    quizData.forEach((item, qIndex) => {
        let questionHTML = `
            <div class="question-block">
                <div class="question-text">${qIndex + 1}. ${item.q}</div>
        `;
        
        item.options.forEach((opt, oIndex) => {
            questionHTML += `
                <label class="option-label">
                    <input type="radio" name="q${qIndex}" value="${oIndex}" onchange="updateProgress()"> ${opt}
                </label>
            `;
        });

        questionHTML += `</div>`;
        container.innerHTML += questionHTML;
    });
}

function updateProgress() {
    let answeredCount = 0;
    quizData.forEach((_, i) => {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        if (selected) answeredCount++;
    });

    const progressPercentage = (answeredCount / quizData.length) * 100;
    document.getElementById('progressBar').style.width = `${progressPercentage}%`;
    document.getElementById('progressText').innerText = `${answeredCount} / 20 Answered`;
}

document.getElementById('submitQuizBtn').addEventListener('click', () => {
    if (confirm("Are you sure you want to submit your quiz? You cannot change your answers after this.")) {
        clearInterval(timerInterval);
        processSubmission();
    }
});

// --- STEP 4: SUBMISSION & SCORING ---
function processSubmission() {
    switchView('quiz-view', 'result-view');
    
    // NEW: Stop the camera permanently when the quiz is submitted
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
    }
    
    let score = 0;
    quizData.forEach((item, i) => {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        if (selected && parseInt(selected.value) === item.ans) {
            score++;
        }
    });

    // 5-second loading delay
    setTimeout(() => {
        document.getElementById('loadingScore').classList.add('hidden');
        document.getElementById('finalScoreDisplay').classList.remove('hidden');
        document.getElementById('scoreValue').innerText = score;
        
        triggerConfetti();
    }, 5000);
}

function triggerConfetti() {
    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    (function frame() {
        confetti({
            particleCount: 2,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: ['#1e3c72', '#2a5298', '#e67e22', '#5cb85c'],
            ticks: 300,  
            gravity: 1.2, 
            scalar: 0.8,  
            drift: randomInRange(-0.5, 0.5) 
        });

        confetti({
            particleCount: 2,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: ['#1e3c72', '#2a5298', '#e67e22', '#5cb85c'],
            ticks: 300,
            gravity: 1.2,
            scalar: 0.8,
            drift: randomInRange(-0.5, 0.5)
        });

        if (Math.random() > 0.95) {
            confetti({
                particleCount: 10,
                startVelocity: 30,
                spread: 360,
                origin: { x: Math.random(), y: Math.random() - 0.2 },
                colors: ['#ffffff', '#ff0000']
            });
        }
        requestAnimationFrame(frame);
    }());
}