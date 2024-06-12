const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerElement = document.getElementById('timer');
const buttonsContainer = document.getElementById('buttonsContainer');

const BAR_LENGTH = 100;
const BAR_THICKNESS = 10;
const NUM_BARS = 20;  // バーの数を20に設定
const DANGO_SPEED = 1; // ダンゴムシの速度を0.5倍に設定
const DANGO_DIAMETER = 30; // ダンゴムシの直径を3倍に設定

const bars = [];
const rows = 4; // 縦に4個並べる
const cols = 5; // 横に5個並べる
const spacingX = (canvas.width - (cols * BAR_LENGTH)) / (cols + 1);
const spacingY = (canvas.height - (rows * BAR_LENGTH)) / (rows + 1);

const angles = [0, 90, 180, 270];  // 初期角度の選択肢

for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
        const angle = angles[Math.floor(Math.random() * angles.length)];
        const bar = {
            x: spacingX + j * (BAR_LENGTH + spacingX),
            y: spacingY + i * (BAR_LENGTH + spacingY),
            angle: angle
        };
        bars.push(bar);
        createRotateButton(bar); // バーごとにボタンを作成
    }
}

const dango = {
    x: 50,
    y: 50,
    direction: 'right',  // possible values: 'right', 'left', 'up', 'down'
    recentlyTurned: false,
    turnCooldown: 0  // クールダウン期間をフレーム数で設定
};

const start = { x: 50, y: 50 };  // スタート地点の座標
const goal = { x: 600, y: 400, width: 200, height: 200 }; // ゴールエリアの大きさを2倍に設定

let startTime = null;
let elapsedTime = 0;
let timerInterval = null;

function drawBar(bar) {
    ctx.save();
    ctx.translate(bar.x, bar.y);
    ctx.rotate(bar.angle * Math.PI / 180);
    ctx.fillStyle = 'blue';

    // L字の水平部分
    ctx.fillRect(0, 0, BAR_LENGTH, BAR_THICKNESS);
    // L字の垂直部分
    ctx.fillRect(0, 0, BAR_THICKNESS, BAR_LENGTH);

    ctx.restore();
}

function drawDango() {
    ctx.fillStyle = 'green';
    ctx.beginPath();
    ctx.arc(dango.x, dango.y, DANGO_DIAMETER / 2, 0, Math.PI * 2);
    ctx.fill();
}

function drawGoal() {
    ctx.fillStyle = 'red';
    ctx.fillRect(goal.x, goal.y, goal.width, goal.height); // ゴールエリアの描画
}

function drawStartAndGoalText() {
    ctx.fillStyle = 'black';
    ctx.font = '16px Arial';
    ctx.fillText('START', start.x - 20, start.y - 20);
    ctx.fillText('GOAL', goal.x + 10, goal.y + goal.height / 2 + 5);
}

function drawMazeBoundary() {
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawMazeBoundary();
    bars.forEach(drawBar);
    drawDango();
    drawGoal();
    drawStartAndGoalText();
}

function moveDango() {
    switch (dango.direction) {
        case 'right':
            dango.x += DANGO_SPEED;
            break;
        case 'left':
            dango.x -= DANGO_SPEED;
            break;
        case 'up':
            dango.y -= DANGO_SPEED;
            break;
        case 'down':
            dango.y += DANGO_SPEED;
            break;
    }

    let collision = false;
    if (!dango.recentlyTurned) {
        bars.forEach(bar => {
            if (isColliding(dango, bar)) {
                handleCollision();
                collision = true;
            }
        });

        if (isCollidingWithBoundary(dango)) {
            handleCollision();
            collision = true;
        }
    }

    if (isCollidingWithGoal(dango, goal)) {
        showCongratulations();
        return;
    }

    if (collision) {
        dango.recentlyTurned = true;
        dango.turnCooldown = 30;  // クールダウン期間をリセット
    } else {
        if (dango.turnCooldown > 0) {
            dango.turnCooldown--;
        } else {
            dango.recentlyTurned = false;
        }
    }

    // 壁をすり抜けないように位置を調整
    if (dango.x < DANGO_DIAMETER / 2) dango.x = DANGO_DIAMETER / 2;
    if (dango.x > canvas.width - DANGO_DIAMETER / 2) dango.x = canvas.width - DANGO_DIAMETER / 2;
    if (dango.y < DANGO_DIAMETER / 2) dango.y = DANGO_DIAMETER / 2;
    if (dango.y > canvas.height - DANGO_DIAMETER / 2) dango.y = canvas.height - DANGO_DIAMETER / 2;
}

function isColliding(dango, bar) {
    const cos = Math.cos(bar.angle * Math.PI / 180);
    const sin = Math.sin(bar.angle * Math.PI / 180);

    const relativeX = dango.x - bar.x;
    const relativeY = dango.y - bar.y;

    const transformedX = relativeX * cos + relativeY * sin;
    const transformedY = -relativeX * sin + relativeY * cos;

    const isCollidingHorizontal = (
        transformedX > 0 &&
        transformedX < BAR_LENGTH &&
        transformedY > 0 &&
        transformedY < BAR_THICKNESS
    );

    const isCollidingVertical = (
        transformedX > 0 &&
        transformedX < BAR_THICKNESS &&
        transformedY > 0 &&
        transformedY < BAR_LENGTH
    );

    return isCollidingHorizontal || isCollidingVertical;
}

function handleCollision() {
    switch (dango.direction) {
        case 'right':
            dango.direction = Math.random() < 0.5 ? 'up' : 'down';
            break;
        case 'left':
            dango.direction = Math.random() < 0.5 ? 'up' : 'down';
            break;
        case 'up':
            dango.direction = Math.random() < 0.5 ? 'left' : 'right';
            break;
        case 'down':
            dango.direction = Math.random() < 0.5 ? 'left' : 'right';
            break;
    }
}

function isCollidingWithBoundary(dango) {
    return (
        dango.x <= DANGO_DIAMETER / 2 ||
        dango.x >= canvas.width - DANGO_DIAMETER / 2 ||
        dango.y <= DANGO_DIAMETER / 2 ||
        dango.y >= canvas.height - DANGO_DIAMETER / 2
    );
}

function isCollidingWithGoal(dango, goal) {
    return (
        dango.x >= goal.x &&
        dango.x <= goal.x + goal.width &&
        dango.y >= goal.y &&
        dango.y <= goal.y + goal.height
    );
}

function createRotateButton(bar) {
    const button = document.createElement('button');
    button.className = 'rotateButton';

    // バーの中心を回転の中心に設定
    const centerX = bar.x + BAR_LENGTH / 2;
    const centerY = bar.y + BAR_THICKNESS / 2;

    button.style.left = `${centerX}px`;
    button.style.top = `${centerY}px`;
    button.textContent = '';
    button.addEventListener('click', () => {
        bar.angle = (bar.angle + 90) % 360;
    });
    buttonsContainer.appendChild(button);
}

function startTimer() {
    startTime = performance.now();
    timerInterval = setInterval(updateTimer, 100);
}

function updateTimer() {
    const currentTime = performance.now();
    elapsedTime = (currentTime - startTime) / 1000;
    timerElement.textContent = `Time: ${elapsedTime.toFixed(2)} seconds`;
}

function stopTimer() {
    clearInterval(timerInterval);
    timerElement.textContent = `Time: ${elapsedTime.toFixed(2)} seconds`;
}

function resetGame() {
    dango.x = start.x;
    dango.y = start.y;
    dango.direction = 'right';
    dango.recentlyTurned = false;
    dango.turnCooldown = 0;
    elapsedTime = 0;
    startTimer();
}

function showCongratulations() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Congratulations!', canvas.width / 2, canvas.height / 2);
    stopTimer();
}

resetGame();
requestAnimationFrame(function gameLoop() {
    moveDango();
    draw();
    requestAnimationFrame(gameLoop);
});
