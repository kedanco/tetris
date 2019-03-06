const random = new Random();
const canvas = document.getElementById("tetris");

const context = canvas.getContext("2d");
context.scale(20, 20);

const eventMinInterval = 18000; //30 secs min interval
const minDelay = 1000;
const maxDelay = 5000; //80 secs max interval
const pieces = "ILJOTSZ";

const matrix = [[0, 0, 0], [1, 1, 1], [0, 1, 0]];

const colors = [
	null,
	"#FF0D72",
	"#0DC2FF",
	"#0DFF72",
	"#F538FF",
	"#FF8E0D",
	"#FFE138",
	"#3877FF",
	"#888888"
];

let difficulty = "easy",
	gamePaused = true,
	gameOver = false,
	musicPaused = false,
	doNotSwitchMusic = 0,
	timeCounter = 0,
	rowCount = 1,
	scoreMultiplier = 2,
	streak = 0,
	highestStreak = 0,
	modeScore = {},
	danger = false,
	dropCounter = 0,
	lastTime = 0,
	dropInterval = 1000,
	scoreInterval = 300,
	timeInterval = 100,
	scorePlusOn = false,
	randomCount = 0,
	gameEventsInterval = 0,
	gameEventsCall,
	animationEvent,
	timerList = [],
	dangerDiv = document.getElementById("danger"),
	bonusDiv = document.getElementById("bonus"),
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
	matrix: createPiece(pieces[(pieces.length * Math.random()) | 0]),
	score: 0,
	sweeper: 0
};

btnPause.addEventListener("click", e => pauseUnpauseGame());

btnMute.addEventListener("click", e => pauseUnpauseMusic());

btnMenu.addEventListener("click", e => {
	toggleMenu(false);
	restartGame("main");
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
}

function getDifficulty() {
	[...document.getElementsByClassName("diff-buttons")].forEach(item => {
		item.addEventListener("click", e => {
			difficulty = e.target.value;
			toggleMenu(true);

			startGame();
		});
	});
}

function toggleMenu(newGame) {
	//should only touch visual elements

	[...document.getElementsByClassName("gameItem")].forEach(item => {
		item.classList.toggle("hide");
	});

	if (newGame) {
		let diffButton = document.getElementById("display-difficulty");

		if (difficulty == "easy") {
			diffButton.innerText = "EASY";
			diffButton.className = "gameItem easy";
		} else if (difficulty == "medium") {
			diffButton.innerText = "MEDIUM";
			diffButton.className = "gameItem medium";
		} else if (difficulty == "hard") {
			document.querySelector("#random-mode").classList.toggle("hide");
			diffButton.innerText = "HARD";
			diffButton.className = "gameItem hard";
		}
	}
}

function startGame() {
	clickSound.currentTime = 0.2;
	clickSound.play();
	setTimeout(() => {
		tetrisMusic.play();
		tetrisMusic.loop = true;
	}, 500);

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
		animationEvent = whichAnimationEvent();
		randomEvents();
	}

	gameOver = false;
	gamePaused = false;
	player.sweeper = 0;
	timeCounter = 0;
	updateTime();
	updateScore();
	update();
}

let pauseUnpauseGame = function() {
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

function arenaSweep() {
	let rowCleared = 0;
	outer: for (let y = arena.length - 1; y > 0; y--) {
		for (let x = 0; x < arena[y].length; x++) {
			if (arena[y][x] === 0 || arena[y][x] === 8) {
				continue outer;
			}
		}

		const row = arena.splice(y, 1)[0].fill(0);
		arena.unshift(row);
		y++;

		let rowAdder = scoreMultiplier;

		player.score += (rowCount + rowAdder) * 10;
		if (scorePlusOn) {
			player.score += (rowCount + rowAdder) * 10 * 2;
			scorePlusOn = false;
		}
		rowAdder += scoreMultiplier / 2;
		rowCount++;
		rowCleared++;
		// Interval of Sweeper Redemption follows scoreMultiplier
		scoreInterval *= 1.1;
	}
	return rowCleared;
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

function animateDangerCall() {
	dangerDiv.classList.remove("animateMode");
	dangerDiv.classList.add("fade");
	dangerDiv.removeEventListener("animationend", animateDangerCall);
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
			// if (value !== 0) {
			if (value !== 0 && value !== 8) {
				context.fillStyle = colors[value];
				context.fillRect(x + offset.x, y + offset.y, 1, 1);
			}
			// Add stroke for greyblocks
			if (value === 8) {
				context.fillStyle = colors[value];
				context.fillRect(x + offset.x, y + offset.y, 1, 1);
				context.strokeStyle = "black";
				context.lineWidth = 0.03;
				context.strokeRect(x + offset.x, y + offset.y, 1, 1);
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
	if (player.pos.y < 6 && !danger) {
		danger = true;
		dangerDiv.className = "animated-text";

		dangerDiv.addEventListener("animationend", () => animateDangerCall());
		dangerDiv.classList.add("animateMode");
	}
	if (player.pos.y > 6) {
		dangerDiv.classList.add("hide");
		danger = false;
	}
}

function animateDangerCall() {
	dangerDiv.classList.remove("animateMode");
	dangerDiv.classList.add("fade");
	dangerDiv.removeEventListener("animationend", animateDangerCall);
}

function playerDrop() {
	// console.log("drop");
	player.pos.y++;
	let rowCleared = 0;
	if (collide(arena, player)) {
		player.pos.y--;
		merge(arena, player);
		playerReset();
		rowCleared = arenaSweep();
		updateScore();

		rowCleared > 0 ? (streak += rowCleared) : (streak = 0);
		if (streak > 1) streakCombo(streak);
	}
	dropCounter = 0;
}

function streakCombo(st) {
	highestStreak < st ? (highestStreak = st) : "";
	document.querySelector("#combo-number").innerText = st;
	let comboScore = Math.round((st * scoreInterval) / 2);
	player.score += comboScore;
	console.log(`Streak: ${st}, ${comboScore} added!`);
	document.querySelector("#bonus-score").innerText = comboScore;
	updateScore();

	updateScore();

	// Run Bonus Animation
	bonusDiv.addEventListener("animationend", () => {
		bonusAnimationCall();
	});

	bonusDiv.classList.remove("hide");

	if ((bonusDiv.style.animationPlayState = "running")) {
		bonusDiv.className = "animated-text";
	}
	bonusDiv.classList.add("bonus-animation");
}

function bonusAnimationCall() {
	console.log("bonus animation end");
	if (bonusDiv.className.includes("bonus-animation")) {
		bonusDiv.classList.remove("bonus-animation");
		bonusDiv.classList.add("fade");
	} else {
		bonusDiv.className = "animated-text hide";
		bonusDiv.removeEventListener("animationend", bonusAnimationCall);
	}
}

function playerMove(dir) {
	player.pos.x += dir;
	if (collide(arena, player)) {
		player.pos.x -= dir;
	}
}

function playerReset() {
	player.matrix = createPiece(pieces[(pieces.length * Math.random()) | 0]);
	player.pos.y = 0;
	player.pos.x =
		((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);

	if (collide(arena, player)) {
		gameOver = true;
		tetrisMusic.pause();
		tetrisMusic.currentTime = 0;
		gameOverMusic.play();

		// Stop randomEvents timers
		if (difficulty == "hard") {
			clearInterval(gameEventsInterval);
			gameEventsCall ? gameEventsCall.pause() : "";
			randomText.innerText = "";
		}

		// Stop Animations
		stopAnimation("fade");
		stopAnimation("animateMode");
		stopAnimation("bonus-animation");
		dangerDiv.classList.add("hide");
		bonusDiv.classList.add("hide");

		// Update High Score
		let highScore = localStorage.getItem("tetrisHighScore");
		let num = difficulty == "easy" ? 0 : difficulty == "medium" ? 1 : 2;

		if (!highScore) {
			highScore = ["", "", ""];
			modeScore = { score: 0 };
			console.log("fresh record");
		} else if (highScore && !highScore[num]) {
			modeScore = { score: 0 };
		} else {
			modeScore = highScore[num];
		}
		if (player.score > modeScore.score) {
			console.log("setting high score");
			modeScore = {
				difficulty: difficulty,
				score: player.score,
				endTime: timeCounter,
				rowCount: rowCount,
				streak: highestStreak
			};

			highScore[num] = modeScore;

			localStorage.setItem("tetrisHighScore", highScore);
		} else {
			console.log("No records added.");
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
			"gameover-rows"
		).innerText = `Rows Cleared: ${rowCount - 1}`;
		document.getElementById(
			"gameover-streak"
		).innerText = `Max Streak: ${highestStreak}`;

		if (difficulty == "hard") {
			document.getElementById(
				"gameover-random"
			).innerText = `Random Events: ${randomCount}`;
		}
	}
}

function stopAnimation(cls) {
	console.log(`stopping ${cls}`);
	[...document.getElementsByClassName(cls)].forEach(item => {
		item.classList.remove(cls);
	});
}

function restartGame(val) {
	arena.forEach(row => row.fill(0));
	player.score = 0;
	player.sweeper = 0;
	timeCounter = 0;
	randomCount = 0;

	renderSweeper();
	document.querySelector("#danger").className = "animated-text hide";

	document.getElementById("time").innerHTML = "0:00";
	gameOver = false;
	if (val == "main") {
		gamePaused = true;
	} else {
		gamePaused = false;
		clearInterval(gameEventsInterval);
		gameEventsInterval = 0;
		startGame(difficulty);
		if (gameEventsCall) {
			gameEventsCall.pause();
			gameEventsCall = null;
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
				clearInterval(x);
			}
		}, 1000);
	}
	if (gameOver) {
		console.log("Game over");
		timeCounter = 0;
	}
}

// Sweepers
// ==================================

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

// Hard Mode: Random Events
// ==================================

function randomEvents() {
	console.log("random");
	randomText.addEventListener(animationEvent, e => eventSetup(e), true);

	gameEventsInterval = setInterval(() => {
		let rdmDelay = Math.floor(Math.random() * (maxDelay - minDelay) + minDelay);

		gameEventsCall = new timer(() => {
			getEvent();
		}, rdmDelay);
		gameEventsCall.start();
		timerList.push(gameEventsCall);
		if (timerList.length > 2) {
			getEvent();
		}
	}, eventMinInterval);
}

function eventSetup(e) {
	if (randomText.className.includes("animateMode")) {
		animateToFade();
	} else if (randomText.className.includes("fade")) {
		clearRandomText(randomText);
		clearRandomText(randomDesc);
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

function getEvent() {
	timerList = [];
	const events = ["power-up", "score-plus", "speed-up", "grey-block"];
	let chosenEvent = events[random.integer(0, events.length)];

	if (chosenEvent == "power-up") {
		let sweepNumToAdd =
			difficulty == "easy" || difficulty == "medium"
				? 2
				: difficulty == "hard"
				? 1
				: "";
		console.log("powerup");
		randomText.innerText = "Power-Up!";
		randomDesc.innerText = `${sweepNumToAdd} Sweepers Added!`;
		for (let i = 0; i < sweepNumToAdd; i++) {
			addSweeper();
		}
	} else if (chosenEvent == "speed-up") {
		console.log("speed-up");
		randomText.innerText = "Speed-Up!";
		randomDesc.innerText = "Turbooooooo!";
		speedUp();
	} else if (chosenEvent == "grey-block") {
		console.log("grey-block");
		randomText.innerText = "Grey Blocks!";
		randomDesc.innerText = "Here comes another row!";
		addGreyBlocks();
	} else if (chosenEvent == "score-plus") {
		console.log("score-plus");
		randomText.innerText = "Score Plus!";
		randomDesc.innerText = "3X the next score you gain!";
		scorePlusOn = true;
	}

	// Start flashing animation
	randomText.classList.add("animateMode");
	randomText.classList.add(chosenEvent);
	randomDesc.classList.add(chosenEvent);

	randomCount++;
}

//David Walsh
//https://davidwalsh.name/css-animation-callback
function whichAnimationEvent() {
	var a;
	var el = document.createElement("fakeelement");
	var animations = {
		animation: "animationend",
		OAnimation: "oAnimationEnd",
		MozAnimation: "animationend",
		WebkitAnimation: "webkitAnimationEnd"
	};

	for (a in animations) {
		if (el.style[a] !== undefined) {
			return animations[a];
		}
	}
}

function animateToFade() {
	randomText.classList.remove("animateMode");
	randomFade();
}

function randomFade() {
	// console.log(`randomFade`);
	if (!gamePaused) {
		randomText.removeEventListener(animationEvent, eventSetup, true);
		setTimeout(() => {
			randomText.classList.add("fade");
			randomDesc.classList.add("fade");
		}, 1000);
	}
}

function clearRandomText(item) {
	item.innerHTML = "";
	item.className = "";
}

function speedUp() {
	let originalDrop = dropInterval;
	dropInterval -= 200;

	setTimeout(() => {
		dropInterval = originalDrop;
	}, 8000);
}

function addGreyBlocks() {
	//
	let greyMatrix = Array(arena[0].length).fill(8);
	arena.shift();
	arena.push(greyMatrix);
}

function pauseUnpauseRandomInterval() {
	if (!gamePaused) {
		console.log("pausing");
		//pausing
		if (gameEventsCall === undefined || gameEventsCall === null) {
			setInterval(() => {
				if (gameEventsCall) {
					gameEventsCall.pause();
				}
			}, 6000);
		} else {
			gameEventsCall.pause();
		}

		clearInterval(gameEventsInterval);

		// Pause flashfade animations
		[randomText, randomDesc].forEach(item => {
			item.classList.remove("running");
			item.classList.add("paused");
		});
	} else {
		//unpause
		if (gameEventsCall) {
			var timeRemaining = gameEventsCall.getTimeLeft();

			console.log(timeRemaining);
			if (timeRemaining > 0) {
				gameEventsCall.start();
			}

			[randomText, randomDesc].forEach(item => {
				item.classList.remove("paused");
				item.classList.add("running");
			});
		} else {
			var timeRemaining = 3000;
		}

		randomText.removeEventListener(animationEvent, eventSetup, true);

		setTimeout(() => {
			randomEvents();
		}, timeRemaining + 1000);
	}
}
