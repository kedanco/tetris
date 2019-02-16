const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
context.scale(20, 20);

let timerArr = new Map();
let difficulty = "easy";
let gamePaused = true;
let gameOver = false;
let musicPaused = false;
let doNotSwitchMusic = 0;
let pauseOverlay = document.getElementById("pause");
let gameoverOverlay = document.getElementById("gameover");
let btnPause = document.getElementById("btn-pause");
let btnMute = document.getElementById("btn-mute");
let btnMenu = document.getElementById("btn-menu");
let btnRestart = document.getElementById("btn-restart");
let sweeperDisplay = document.getElementById("sweeper-count");
let difficultyMenu = document.getElementById("difficulty");
let gameElements = document.getElementsByClassName("hide");
let displayMode = document.getElementById("display-mode");
let randomText = document.getElementById("random-text");
let timeCounter = 0;
let gameModeInterval = 0;
var gameModeCall;

let bulldozer = new Image(60, 60);
bulldozer.src = "./bulldozer-left.png";
bulldozer.classList.add("bulldozer");

localStorage.setItem("timeMilestone", 0);
localStorage.setItem("scoreMilestone", 0);

let clickSound = new Audio("./sounds/Sound Effect - Mouse Click.mp3");
let tetrisMusic = new Audio("./sounds/Tetris Theme (Dubstep Remix).mp3");
let gameOverMusic = new Audio(
	"./sounds/Tetris (Tengen) (NES) Music - Game Over.mp3"
);

const matrix = [[0, 0, 0], [1, 1, 1], [0, 1, 0]];

const colors = [
	null,
	"#FF0D72",
	"#0DC2FF",
	"#0DFF72",
	"#F538FF",
	"#FF8E0D",
	"#FFE138",
	"#3877FF"
];
let dropCounter = 0;
let lastTime = 0;
let dropInterval = 1000;
let scoreInterval = 300;
let timeInterval = 100;
const modeMinInterval = 18000; //30 secs min interval
const minDelay = 1000;
const maxDelay = 5000; //80 secs max interval

getDifficulty();

// let dropInterval be determined by difficulty

const arena = createMatrix(12, 20);

const player = {
	pos: { x: 5, y: 5 },
	matrix: createPiece("T"),
	score: 0,
	sweeper: 0
};

btnPause.addEventListener("click", e => pauseUnpauseGame());

btnMute.addEventListener("click", e => pauseUnpauseMusic());

btnMenu.addEventListener("click", e => {
	restartGame("main");
	toggleMenu();
});

btnRestart.addEventListener("click", e => {
	restartGame("restart");
});

document.addEventListener("keydown", event => {
	if (event.keyCode === 37) {
		playerMove(-1);
	} else if (event.keyCode === 39) {
		playerMove(1);
	} else if (event.keyCode === 40) {
		playerDrop();
	} else if (event.keyCode === 81) {
		playerRotate(-1);
	} else if (event.keyCode === 87) {
		playerRotate(1);
	} else if (event.keyCode === 32) {
		useSweeper();
	}
});

function update(time = 0) {
	const deltaTime = time - lastTime;
	lastTime = time;

	dropCounter += deltaTime;
	if (dropCounter > dropInterval && !gamePaused && !gameOver) {
		playerDrop();
	}
	draw();
	updateSweepers();

	if (!gamePaused && !gameOver) {
		requestAnimationFrame(update);
	}

	// if (Math.floor(time) % 10 == 0) {
	// 	console.log(timerArr);
	// }
}

function getDifficulty() {
	[...document.getElementsByClassName("diff-buttons")].forEach(item => {
		item.addEventListener("click", e => {
			difficulty = e.target.value;
			toggleMenu();
			startGame();
		});
	});
}

function toggleMenu() {
	//should only touch visual elements
	console.log("toggle");

	[...document.getElementsByClassName("gameItem")].forEach(item => {
		item.classList.toggle("hide");
	});

	let diffButton = document.getElementById("display-difficulty");

	if (difficulty == "easy") {
		diffButton.innerText = "EASY";
		diffButton.classList.add("easy");
	} else if (difficulty == "medium") {
		diffButton.innerText = "MEDIUM";
		diffButton.classList.add("medium");
	} else if (difficulty == "hard") {
		diffButton.innerText = "HARD";
		diffButton.classList.add("hard");
	}
}

function startGame() {
	clickSound.play();
	tetrisMusic.play();
	tetrisMusic.loop = true;

	if (difficulty == "easy") {
		dropInterval = 800;
		timeInterval = 100;
		scoreInterval = 300;
	} else if (difficulty == "medium") {
		dropInterval = 700;
		timeInterval = 200;
		scoreInterval = 400;
	} else if (difficulty == "hard") {
		dropInterval = 500;
		timeInterval = 300;
		scoreInterval = 500;
		randomTimer = randomMode();
	}

	gameOver = false;
	gamePaused = false;
	updateTime();
	updateScore();
	update();
}

let pauseUnpauseGame = function(e) {
	if (difficulty == "hard") {
		pauseUnpauseRandomInterval();
	}
	if (doNotSwitchMusic === 0 && musicPaused) {
		doNotSwitchMusic = true;
	}

	if (!gamePaused) {
		console.log("pause");
		gamePaused = true;
		pauseOverlay.style.display = "block";
		document.addEventListener("keydown", pauseUnpauseGame, true);
		if (!musicPaused) {
			doNotSwitchMusic = false;
			pauseUnpauseMusic("game");
		}
	} else {
		console.log("unpause");
		gamePaused = false;
		if (!doNotSwitchMusic) {
			pauseUnpauseMusic("game");
		}
		pauseOverlay.style.display = "none";
		requestAnimationFrame(update);
		document.removeEventListener("keydown", pauseUnpauseGame, true);
		doNotSwitchMusic = 0;
	}
};

function pauseUnpauseMusic(src = "music") {
	if (!musicPaused) {
		tetrisMusic.pause();
		musicPaused = true;
		if (src == "music") {
			btnMute.innerText = "Play Music";
		}
	} else {
		tetrisMusic.play();
		musicPaused = false;
		if (src == "music") {
			btnMute.innerText = "Stop Music";
		}
	}
}

function randomMode() {
	console.log("random");

	gameModeInterval = setInterval(() => {
		let rdmDelay = Math.floor(Math.random() * (maxDelay - minDelay) + minDelay);

		gameModeCall = new timer(() => {
			getMode();
		}, rdmDelay);
		gameModeCall.start();
		console.log(gameModeCall);
	}, modeMinInterval);

	// return gameModeCall;
}

function pauseUnpauseRandomInterval() {
	if (gameModeCall) {
		if (!gamePaused) {
			//pausing
			clearInterval(gameModeInterval);
			gameModeCall.pause();
			console.log(`gameModeInterval is ${gameModeInterval}`);
		} else {
			//unpause
			let timeRemaining = gameModeCall.getTimeLeft();
			console.log(timeRemaining);
			gameModeCall.start();
			setTimeout(() => {
				randomMode();
			}, modeMinInterval + timeRemaining + 1000);
		}
	}
}

let timer = function(callback, delay) {
	var id = timeCounter.toString(),
		started,
		remaining = delay,
		running;

	this.id = id;
	this.started = started;
	this.running = running;
	this.remaining = remaining;
	this.callback = callback;

	this.start = function() {
		running = true;
		started = new Date();
		id = setTimeout(this.callback, remaining);
	};

	this.pause = function() {
		running = false;
		clearTimeout(id);
		remaining -= new Date() - started;
	};

	this.getTimeLeft = function() {
		if (running) {
			this.pause();
			this.start();
		}

		return remaining;
	};

	this.getID = function() {
		if (running) {
			return id;
		} else {
			return "Not Running";
		}
	};

	this.getStateRunning = function() {
		return running;
	};

	this.start();
};

function getMode() {
	const modes = ["power-Up", "bomb", "speed-Up", "greyBlock"];
	let chosenMode = modes[Math.floor(Math.random() * modes.length)];

	if (chosenMode == "powerup") {
		console.log("powerup");
		randomText.classList.add("powerup");
		randomText.innerText = "Power-Up!";
	} else if (chosenMode == "bomb") {
		console.log("bomb");
		randomText.classList.add("bomb");
		randomText.innerText = "Bomb!";
	} else if (chosenMode == "speedUp") {
		console.log("speedup");
		randomText.classList.add("speedup");
		randomText.innerText = "Speed-Up!";
	} else if (chosenMode == "greyBlock") {
		console.log("greyblock");
		randomText.classList.add("greyblock");
		randomText.innerText = "Grey Blocks!";
	}

	randomText.classList.add("animateMode");

	setTimeout(() => {
		randomText.classList.remove("animateMode");

		setTimeout(() => {
			randomText.classList.add("fade");
		}, 1000);

		setTimeout(() => {
			randomText.innerHTML = "";
			randomText.className = "";
		}, 4000);
	}, 6000);

	// return chosenMode;
}

function arenaSweep() {
	let rowCount = 1;
	outer: for (let y = arena.length - 1; y > 0; y--) {
		for (let x = 0; x < arena[y].length; x++) {
			if (arena[y][x] === 0) {
				continue outer;
			}
		}

		const row = arena.splice(y, 1)[0].fill(0);
		arena.unshift(row);
		y++;

		player.score += rowCount * 10;
		rowCount *= 2;
	}
}

function collide(arena, player) {
	const [m, o] = [player.matrix, player.pos];
	for (let y = 0; y < m.length; y++) {
		for (let x = 0; x < m[y].length; x++) {
			if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
				return true;
			}
		}
	}
	return false;
}

function createMatrix(w, h) {
	const matrix = [];
	while (h--) {
		matrix.push(new Array(w).fill(0));
	}
	return matrix;
}

function createPiece(type) {
	if (type === "T") {
		return [[0, 0, 0], [1, 1, 1], [0, 1, 0]];
	} else if (type === "O") {
		return [[2, 2], [2, 2]];
	} else if (type === "L") {
		return [[0, 3, 0], [0, 3, 0], [0, 3, 3]];
	} else if (type === "J") {
		return [[0, 4, 0], [0, 4, 0], [4, 4, 0]];
	} else if (type === "I") {
		return [[0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0], [0, 5, 0, 0]];
	} else if (type === "S") {
		return [[0, 6, 6], [6, 6, 0], [0, 0, 0]];
	} else if (type === "Z") {
		return [[7, 7, 0], [0, 7, 7], [0, 0, 0]];
	}
}

function draw() {
	context.fillStyle = "#000";
	context.fillRect(0, 0, canvas.width, canvas.height);
	drawMatrix(arena, { x: 0, y: 0 });
	drawMatrix(player.matrix, player.pos);
}

function drawMatrix(matrix, offset) {
	matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0) {
				context.fillStyle = colors[value];
				context.fillRect(x + offset.x, y + offset.y, 1, 1);
			}
		});
	});
}

// Copies updated player values (upon input) into the arena
function merge(arena, player) {
	player.matrix.forEach((row, y) => {
		row.forEach((value, x) => {
			if (value !== 0) {
				arena[y + player.pos.y][x + player.pos.x] = value;
			}
		});
	});
}

function playerDrop() {
	// console.log("drop");
	player.pos.y++;
	if (collide(arena, player)) {
		player.pos.y--;
		merge(arena, player);
		playerReset();
		arenaSweep();
		updateScore();
	}
	dropCounter = 0;
}

function playerMove(dir) {
	player.pos.x += dir;
	if (collide(arena, player)) {
		player.pos.x -= dir;
	}
}

function playerReset() {
	const pieces = "ILJOTSZ";
	player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
	player.pos.y = 0;
	player.pos.x =
		((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);

	if (collide(arena, player)) {
		gameOver = true;
		tetrisMusic.pause();
		tetrisMusic.currentTime = 0;
		gameOverMusic.play();

		// Stop randomMode timers
		if (difficulty == "hard") {
			clearInterval(gameModeInterval);
			gameModeCall.pause();
			randomText.innerText = "";
		}

		// Update High Score
		let highScore = localStorage.getItem("tetrisHighScore");

		if (!highScore) {
			highScore = 0;
		}
		if (player.score > highScore) {
			console.log("setting high score");
			localStorage.setItem("tetrisHighScore", player.score);
			localStorage.setItem("tetrisEndTime", timeCounter);
		} else {
			console.log("you weak");
		}

		// Display Game Over Overlay
		gameoverOverlay.style.display = "block";
		document.getElementById("gameover-score").innerText = `Final Score: ${
			player.score
		}`;
		document.getElementById(
			"gameover-time"
		).innerText = `Final Time: ${timeCounter}`;
	}
}

function restartGame(val) {
	arena.forEach(row => row.fill(0));
	player.score = 0;
	player.sweeper = 0;
	renderSweeper();

	timeCounter = 0;
	document.getElementById("time").innerHTML = "0:00";
	gameOver = false;
	if (val == "main") {
		gamePaused = true;
	} else {
		gamePaused = false;
		startGame(difficulty);
		clearInterval(gameModeInterval);
		gameModeCall.pause();
	}

	gameoverOverlay.style.display = "none";
}

function playerRotate(dir) {
	const pos = player.pos.x;
	let offset = 1;
	rotate(player.matrix, dir);
	while (collide(arena, player)) {
		player.pos.x += offset;
		offset = -(offset + (offset > 0 ? 1 : -1));
		if (offset > player.matrix[0].length) {
			rotate(player.matrix, -dir);
			player.pos.x = pos;
			return;
		}
	}
}

//To rotate tetris block, we need to do transposition:
// Changing the rows into columns
// Reverse each row to get a rotated matrix
// Transpose + Reverse = Rotate
function rotate(matrix, dir) {
	for (let y = 0; y < matrix.length; y++) {
		for (let x = 0; x < y; x++) {
			[matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
		}
	}

	if (dir > 0) {
		matrix.forEach(row => row.reverse());
	} else {
		matrix.reverse;
	}
}

function updateScore() {
	document.getElementById("score").innerText = player.score;
}

function updateTime() {
	// console.log("time");
	if (!gamePaused) {
		let minutes,
			seconds = 0;
		document.getElementById("time").innerHTML = "0:00";

		let x = setInterval(() => {
			if (!gamePaused && !gameOver) {
				timeCounter++;

				minutes = Math.floor(timeCounter / 60);
				seconds = Math.floor(timeCounter % 60);
				// console.log(minutes, seconds);

				if (seconds < 10) {
					seconds = "0".concat(seconds);
				}
				document.getElementById("time").innerHTML = `${minutes}:${seconds}`;
			} else if (gameOver) {
				console.log("remove time");
				clearInterval(x);
			}
		}, 1000);
	}
}

function updateSweepers() {
	// Check Score
	let scoreMilestone = localStorage.getItem("scoreMilestone");
	if (!scoreMilestone) {
		scoreMilestone = 0;
	}
	let scoreDifference = player.score - scoreMilestone;
	if (scoreDifference >= scoreInterval) {
		console.log("score sweeper");
		addSweeper();
		localStorage.setItem(
			"scoreMilestone",
			parseInt(scoreMilestone) + scoreInterval
		);
	}

	// Check Time
	let timeMilestone = localStorage.getItem("timeMilestone");
	if (!timeMilestone) {
		timeMilestone = 0;
	}
	let timeDifference = timeCounter - timeMilestone;
	if (timeDifference >= timeInterval) {
		console.log("time sweeper");
		addSweeper();
		localStorage.setItem(
			"timeMilestone",
			parseInt(timeMilestone) + timeInterval
		);
	}
}

function addSweeper() {
	player.sweeper++;
	renderSweeper();
}

function useSweeper() {
	if (player.sweeper > 0) {
		console.log("Using Sweeper");

		// Remove row from bottom

		let y = arena.length - 1;
		let row = arena.splice(y, 1)[0].fill(0);
		arena.unshift(row);
		y++;

		// Update amount, display
		player.sweeper--;
		renderSweeper();
	}
}

function renderSweeper() {
	// console.log("rendering");
	sweeperDisplay.innerText = "";
	[...sweeperDisplay.children].forEach(child => {
		sweeperDisplay.removeChild(child);
	});

	for (let x = 0; x < player.sweeper; x++) {
		if (x > 0) {
			let image = document.getElementsByClassName("bulldozer")[0];
			let clone = image.cloneNode(true);
			sweeperDisplay.appendChild(clone);
		} else {
			sweeperDisplay.appendChild(bulldozer);
		}
	}
	if (player.sweeper < 1) {
		sweeperDisplay.innerText = "No Sweepers Available";
	}
}
