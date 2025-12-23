const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let gameStarted = false;
let gameOver = false;
let score = 0;

// Load highscore from localStorage
let highscore = localStorage.getItem("flappyHighscore") || 0;

let birdImage = null;
let pipeImage = new Image();  // For the pipe image

// Load the pipe image (Make sure this path is correct!)
pipeImage.src = "images/1757063785554.jpg";  

let bird = {
    x: 50,
    y: 300,
    width: 32,
    height: 32,
    velocity: 0
};

let gravity = 0.4;
let jump = -8;

let pipes = [];
let pipeWidth = 60;
let pipeSpeed = 2;
let difficulty = 6;

/* --- Sounds --- */
// Ensure these files (die.mp3 and tap.mp3) are in the same directory as your HTML/JS
let dieSound = new Audio("die.mp3");
let tapSound = new Audio("tap.mp3");

/* --- SETTINGS PANEL --- */
document.getElementById("settings").onclick = () => {
    let p = document.getElementById("settingsPanel");
    p.style.display = (p.style.display === "none") ? "block" : "none";
};

/* Upload bird image */
document.getElementById("birdUpload").onchange = function (event) {
    let file = event.target.files[0];
    let img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => { birdImage = img; };
};

function applyBirdURL() {
    let url = document.getElementById("birdURL").value;
    if (url.trim() === "") return;
    let img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    img.onload = () => { birdImage = img; };
}

/* --- PIPE CREATION --- */
function createPipe() {
    if (!gameStarted || gameOver) return; // Prevent pipe creation if game is over

    let gap = bird.height * difficulty; // gap height
    let topHeight = Math.random() * (canvas.height - gap - 100) + 50;

    pipes.push({
        x: canvas.width,
        top: topHeight,
        bottom: topHeight + gap,
        counted: false
    });
}
// Automatically create a new pipe every 2000 milliseconds (2 seconds)
setInterval(createPipe, 2000);

/* --- START GAME --- */
document.getElementById("playBtn").onclick = () => {
    document.getElementById("menu").style.display = "none";
    gameStarted = true;
    if (pipes.length === 0) {
        // Create an initial pipe immediately when the game starts
        createPipe();
    }
};

/* --- CONTROLS --- */
document.addEventListener("keydown", (event) => {
    if (!gameStarted) return;

    if (gameOver) {
        restartGame();  // Restart the game when a key is pressed after game over
        return;
    }

    // Space bar (or any key) should make the bird jump
    // Note: Checking for "Space" is usually better for Flappy Bird
    tapSound.currentTime = 0;
    tapSound.play();
    bird.velocity = jump;
});

document.addEventListener("touchstart", () => {
    if (!gameStarted) return;

    if (gameOver) {
        restartGame();  // Restart the game when screen is tapped after game over
        return;
    }

    tapSound.currentTime = 0;
    tapSound.play();
    bird.velocity = jump;
});

/* --- RESTART GAME --- */
function restartGame() {
    // Update highscore if needed
    if (score > highscore) {
        highscore = score;
        localStorage.setItem("flappyHighscore", highscore);
    }

    gameOver = false;
    score = 0;
    pipes = [];
    bird.y = 300;
    bird.velocity = 0;
    gameStarted = true;
}

/* --- UPDATE GAME --- */
function update() {
    if (!gameStarted || gameOver) return;

    // Apply gravity and update bird position
    bird.velocity += gravity;
    bird.y += bird.velocity;

    // Death by hitting top/bottom
    if (bird.y < 0 || bird.y + bird.height > canvas.height) {
        if (!gameOver) dieSound.play();
        gameOver = true;
        bird.y = Math.min(bird.y, canvas.height - bird.height); // Keep bird visible after death
    }

    // Pipe movement and collision detection
    pipes.forEach(pipe => {
        pipe.x -= pipeSpeed;

        // Collision with pipe
        if (
            bird.x < pipe.x + pipeWidth &&  // Check if bird has reached the pipe's x-coordinate
            bird.x + bird.width > pipe.x &&  // Check if bird is inside the pipe's width
            (bird.y < pipe.top || bird.y + bird.height > pipe.bottom) // Check if bird is hitting top or bottom section
        ) {
            if (!gameOver) dieSound.play();
            gameOver = true;
        }

        // Score counting (bird passed the pipe)
        if (!pipe.counted && pipe.x + pipeWidth < bird.x) {
            score++;
            pipe.counted = true;
        }
    });
    
    // Remove pipes that have moved off-screen to improve performance
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);
}

/* --- DRAW --- */
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Game should always show score/highscore, but only proceed with game elements if started
    
    // Bird
    if (birdImage) {
        ctx.drawImage(birdImage, bird.x, bird.y, bird.width, bird.height);
    } else {
        ctx.fillStyle = "yellow";
        ctx.fillRect(bird.x, bird.y, bird.width, bird.height);
    }

    // Pipes (using the pipeImage you provided)
    pipes.forEach(pipe => {
        // Top Pipe
        ctx.drawImage(pipeImage, pipe.x, 0, pipeWidth, pipe.top);

        // Bottom Pipe
        ctx.drawImage(pipeImage, pipe.x, pipe.bottom, pipeWidth, canvas.height - pipe.bottom);
    });

    // Score on left
    ctx.fillStyle = "white";
    ctx.font = "28px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 10, 40);

    // Highscore on right
    ctx.textAlign = "right";
    ctx.fillText("Highscore: " + highscore, canvas.width - 10, 40);

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, 300);
        ctx.font = "20px Arial";
        ctx.fillText("Press any key / tap to continue", canvas.width / 2, 340);
    }
}

/* --- GAME LOOP --- */
function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}
// Start the main loop
loop();