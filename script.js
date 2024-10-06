let scene, camera, renderer, player, obstacles, score, highScore;
let difficulty = 'normal';
let gameStarted = false;
let gameOver = false;
let gamePaused = false;

// Audio elements
let themeAudio, failAudio, winAudio;

function initThreeJS() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new THREE.SphereGeometry(0.5, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    player = new THREE.Mesh(geometry, material);
    scene.add(player);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    camera.position.z = 5;

    obstacles = [];
    score = 0;
}

function initAudio() {
    themeAudio = new Audio('audio.m4a');
    themeAudio.loop = true;
    failAudio = new Audio('fail.m4a');
    winAudio = new Audio('win.m4a');
}

function init() {
    initThreeJS();
    initAudio();
    highScore = parseInt(Cookies.get('highScore')) || 0;
    updateScoreDisplay();
    setupEventListeners();
}

function startGame() {
    hideAllMenus();
    gameStarted = true;
    gameOver = false;
    gamePaused = false;
    score = 0;
    document.getElementById('ui').classList.remove('hidden');
    document.getElementById('pause-button').classList.remove('hidden');
    themeAudio.play();
    animate();
    spawnObstacle();
}

function animate() {
    if (gameStarted && !gameOver && !gamePaused) {
        requestAnimationFrame(animate);
        player.rotation.x += 0.01;
        player.rotation.y += 0.01;
        moveObstacles();
        renderer.render(scene, camera);
    }
}

function spawnObstacle() {
    if (gameStarted && !gameOver && !gamePaused) {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshPhongMaterial({ color: 0xff0000 });
        const obstacle = new THREE.Mesh(geometry, material);
        obstacle.position.x = Math.random() * 4 - 2;
        obstacle.position.y = Math.random() * 4 - 2;
        obstacle.position.z = -10;
        scene.add(obstacle);
        obstacles.push(obstacle);

        const spawnDelay = getDifficultyValue(500, 1500, 3000);
        setTimeout(spawnObstacle, spawnDelay - Math.min(score * 5, spawnDelay / 2));
    }
}

function moveObstacles() {
    const baseSpeed = getDifficultyValue(0.12, 0.06, 0.03);
    const speed = baseSpeed + (score * 0.0002);
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].position.z += speed;
        if (obstacles[i].position.z > 5) {
            scene.remove(obstacles[i]);
            obstacles.splice(i, 1);
            i--;
            updateScore();
        } else if (detectCollision(obstacles[i])) {
            endGame();
        }
    }
}

function getDifficultyValue(hardValue, normalValue, easyValue) {
    switch (difficulty) {
        case 'hard': return hardValue;
        case 'easy': return easyValue;
        default: return normalValue;
    }
}

function hideAllMenus() {
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('new-high-score').classList.add('hidden');
    document.getElementById('difficulty-section').classList.add('hidden');
    document.getElementById('home-section').classList.add('hidden');
}

function detectCollision(obstacle) {
    return player.position.distanceTo(obstacle.position) < 0.75;
}

function updateScore() {
    score++;
    updateScoreDisplay();
}

function updateScoreDisplay() {
    document.getElementById('currentScore').textContent = score;
    document.getElementById('highScore').textContent = highScore;
}

function endGame() {
    gameOver = true;
    gameStarted = false;
    gamePaused = false;
    document.getElementById('finalScore').textContent = score;
    hideAllMenus();
    document.getElementById('game-over').classList.remove('hidden');
    document.getElementById('pause-button').classList.add('hidden');

    themeAudio.pause();
    themeAudio.currentTime = 0;

    if (score > highScore) {
        highScore = score;
        Cookies.set('highScore', highScore, { expires: 365 });
        document.getElementById('new-high-score').classList.remove('hidden');
        setTimeout(() => {
            document.getElementById('new-high-score').classList.add('hidden');
        }, 3000);
        winAudio.play();
    } else {
        failAudio.play();
    }
}

function restartGame() {
    hideAllMenus();
    resetGame();
    startGame();
}

function resetGame() {
    obstacles.forEach(obstacle => scene.remove(obstacle));
    obstacles = [];
    player.position.set(0, 0, 0);
    score = 0;
    updateScoreDisplay();
    gameOver = false;
    gamePaused = false;
}

function pauseGame() {
    if (gameStarted && !gameOver) {
        gamePaused = true;
        hideAllMenus();
        document.getElementById('pause-menu').classList.remove('hidden');
        themeAudio.pause();
    }
}

function resumeGame() {
    gamePaused = false;
    hideAllMenus();
    document.getElementById('pause-button').classList.remove('hidden');
    themeAudio.play();
    animate();
    spawnObstacle();
}

function showMainMenu() {
    hideAllMenus();
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('home-section').classList.remove('hidden');
    document.getElementById('pause-button').classList.add('hidden');
    resetGame();
    themeAudio.pause();
    themeAudio.currentTime = 0;
}

function showDifficultyMenu() {
    hideAllMenus();
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('difficulty-section').classList.remove('hidden');
}

function setDifficulty(newDifficulty) {
    difficulty = newDifficulty;
    updateDifficultyDisplay();
    showMainMenu();
}

function updateDifficultyDisplay() {
    const difficultyButtons = document.querySelectorAll('.difficulty-button');
    difficultyButtons.forEach(button => {
        if (button.id === `${difficulty}-button`) {
            button.style.backgroundColor = '#00ff00';
        } else {
            button.style.backgroundColor = '#ff00ff';
        }
    });
}

function handleMouseMove(event) {
    if (gameStarted && !gameOver && !gamePaused) {
        player.position.x = (event.clientX / window.innerWidth) * 4 - 2;
        player.position.y = -(event.clientY / window.innerHeight) * 4 + 2;
    }
}

function handleResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function setupEventListeners() {
    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('restart-button').addEventListener('click', restartGame);
    document.getElementById('main-menu-button').addEventListener('click', showMainMenu);
    document.getElementById('difficulty-button').addEventListener('click', showDifficultyMenu);
    document.getElementById('pause-button').addEventListener('click', pauseGame);
    document.getElementById('resume-button').addEventListener('click', resumeGame);
    document.getElementById('reset-button').addEventListener('click', restartGame);
    document.getElementById('pause-difficulty-button').addEventListener('click', showDifficultyMenu);
    document.getElementById('back-button').addEventListener('click', showMainMenu);
    document.querySelectorAll('.difficulty-button').forEach(button => {
        button.addEventListener('click', (e) => setDifficulty(e.target.id.replace('-button', '')));
    });
}

document.addEventListener('DOMContentLoaded', init);