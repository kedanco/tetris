const random = new Random();
const canvas = document.getElementById("tetris");

const context = canvas.getContext("2d");
context.scale(20, 20);

const modeMinInterval = 18000; //30 secs min interval
const minDelay = 1000;
const maxDelay = 5000; //80 secs max interval

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

let difficulty = "easy",
	gamePaused = true,
	gameOver = false,
	musicPaused = false,
	doNotSwitchMusic = 0,
	timeCounter = 0,
	randomCount = 0,
	gameModeInterval = 0,
	scorePlusOn = false,
	rowCount = 1,
	gameModeCall,
	scoreMultiplier = 2,
	dropCounter = 0,
	lastTime = 0,
	dropInterval = 1000,
	scoreInterval = 300,
	timeInterval = 100,
	pauseOverlay = document.getElementById("pause"),
	gameoverOverlay = document.getElementById("gameover"),
	btnPause = document.getElementById("btn-pause"),
	btnMute = document.getElementById("btn-mute"),
	btnMenu = document.getElementById("btn-menu"),
	btnRestart = document.getElementById("btn-restart"),
	sweeperDisplay = document.getElementById("sweeper-count"),
	difficultyMenu = document.getElementById("difficulty"),
	gameElements = document.getElementsByClassName("hide"),
	displayMode = document.getElementById("display-mode"),
	randomText = document.getElementById("random-text"),
	randomDesc = document.getElementById("random-description");

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
		diffButton.className = "easy";
	} else if (difficulty == "medium") {
		diffButton.innerText = "MEDIUM";
		diffButton.className = "medium";
	} else if (difficulty == "hard") {
		diffButton.innerText = "HARD";
		diffButton.className = "hard";
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
		scoreMultiplier = 2;
	} else if (difficulty == "medium") {
		dropInterval = 700;
		timeInterval = 200;
		scoreInterval = 500;
		scoreMultiplier = 3;
	} else if (difficulty == "hard") {
		dropInterval = 500;
		timeInterval = 300;
		scoreInterval = 700;
		scoreMultiplier = 4;
		randomMode();
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
	if (!gamePaused) {
		//pausing
		if (gameModeCall) {
			gameModeCall.pause();
		}
		clearInterval(gameModeInterval);
	} else {
		//unpause
		if (gameModeCall) {
			var timeRemaining = gameModeCall.getTimeLeft();
			console.log(timeRemaining);
			gameModeCall.start();
		} else {
			var timeRemaining = 3000;
		}
		setTimeout(() => {
			randomMode();
		}, timeRemaining + 1000);
	}
}

let timer = function(callback, delay) {
	var id = timeCounter.toString(),
		started,
		remaining = delay,
		running;

	this.id = id;
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
};

function getMode() {
	const modes = [
		"power-up",
		"power-up",
		"speed-up",
		"speed-up",
		"score-plus",
		"speed-up",
		"power-up"
	];
	let chosenMode = modes[random.integer(0, modes.length)];

	if (chosenMode == "power-up") {
		let sweepNumToAdd =
			difficulty == "easy"
				? 1
				: difficulty == "medium"
				? 2
				: difficulty == "hard"
				? 3
				: "";
		console.log("powerup");
		randomText.innerText = "Power-Up!";
		randomDesc.innerText = `${sweepNumToAdd} Sweepers Added!`;
		for (let i = 0; i < sweepNumToAdd; i++) {
			addSweeper();
		}
	} else if (chosenMode == "bomb") {
		console.log("bomb");
		randomText.innerText = "Bomb!";
		randomDesc.innerText = "Blasting off some blocks!";
	} else if (chosenMode == "speed-up") {
		console.log("speed-up");
		randomText.innerText = "Speed-Up!";
		randomDesc.innerText = "Turbooooooo!";
		speedUp();
	} else if (chosenMode == "grey-block") {
		console.log("grey-block");
		randomText.innerText = "Grey Blocks!";
		randomDesc.innerText = "Here comes another row!";
	} else if (chosenMode == "score-plus") {
		console.log("score-plus");
		randomText.innerText = "Score Plus!";
		randomDesc.innerText = "3X the next score you gain!";
		scorePlusOn = true;
	}

	// Animating, fading Random Mode Text
	randomText.classList.add("animateMode");
	randomText.classList.add(chosenMode);
	randomDesc.classList.add(chosenMode);

	setTimeout(() => {
		randomText.classList.remove("animateMode");

		setTimeout(() => {
			randomText.classList.add("fade");
			randomDesc.classList.add("fade");
		}, 1000);

		setTimeout(() => {
			randomText.innerHTML = "";
			randomDesc.innerHTML = "";
			randomText.className = "";
			randomDesc.className = "";
		}, 4000);
	}, 6000);

	randomCount++;
}

function speedUp() {
	let originalDrop = dropInterval;
	dropInterval -= 200;

	setTimeout(() => {
		dropInterval = originalDrop;
	}, 8000);
}

function addGreyBlocks() {}

function addBombPiece() {}

function arenaSweep() {
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
		if (scorePlusOn) {
			player.score += rowCount * 10 * 2;
			scorePlusOn = false;
		}
		rowCount += scoreMultiplier;

		// Interval of Sweeper Redemption follows scoreMultiplier
		scoreInterval *= 1.1;
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
			gameModeCall ? gameModeCall.pause() : "";
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
		document.getElementById(
			"gameover-random"
		).innerText = `Random Events: ${randomCount}`;
	}
}

function restartGame(val) {
	arena.forEach(row => row.fill(0));
	player.score, player.sweeper, timeCounter, (randomCount = 0);

	renderSweeper();

	document.getElementById("time").innerHTML = "0:00";
	gameOver = false;
	if (val == "main") {
		gamePaused = true;
	} else {
		gamePaused = false;
		startGame(difficulty);
		clearInterval(gameModeInterval);
		gameModeInterval = 0;
		if (gameModeCall) {
			gameModeCall.pause();
			gameModeCall = null;
		}
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
