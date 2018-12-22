const canvas = document.getElementById("tetris");
const context = canvas.getContext("2d");
context.scale(20, 20);

let difficulty = "easy";
let gamePaused = true;
let gameOver = false;
let musicPaused = false;
let pauseOverlay = document.getElementById("pause");
let gameoverOverlay = document.getElementById("gameover");
let btnPause = document.getElementById("btn-pause");
let btnMute = document.getElementById("btn-mute");
let btnMenu = document.getElementById("btn-menu");
let btnRestart = document.getElementById("btn-restart");
let sweeperDisplay = document.getElementById("sweepers");
let difficultyMenu = document.getElementById("difficulty");
let gameElements = document.getElementsByClassName("hide");
let timeCounter = 0;

let bulldozer = new Image(60, 60);
bulldozer.src = "./bulldozer-left.png";
bulldozer.classList.add("bulldozer");

localStorage.setItem("timeMilestone", 0);
localStorage.setItem("scoreMilestone", 0);

let clickSound = new Audio("./sounds/Sound Effect - Mouse Click.mp3");
let hoverSound = new Audio(
	"./sounds/166186__drminky__menu-screen-mouse-over.wav"
);

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

getDifficulty();

// let dropInterval be determined by difficulty

const arena = createMatrix(12, 20);

const player = {
	pos: { x: 5, y: 5 },
	matrix: createPiece("T"),
	score: 0,
	sweeper: 0
};

document
	.getElementById("btn-pause")
	.addEventListener("click", e => pauseUnpauseGame());

document
	.getElementById("btn-mute")
	.addEventListener("click", e => pauseUnpauseMusic());

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

playerReset();
update();

function update(time = 0) {
	const deltaTime = time - lastTime;
	lastTime = time;

	dropCounter += deltaTime;
	if (dropCounter > dropInterval && !gamePaused && !gameOver) {
		playerDrop();
	}
	draw();
	updateSweepers();

	requestAnimationFrame(update);
}

function getDifficulty() {
	[...document.getElementsByClassName("diff-buttons")].forEach(item => {
		item.addEventListener("click", e => startGame(e.target.value));
		item.addEventListener("mouseover", e => {
			hoverSound.play();
		});
	});
}

function toggleMenu() {
	difficultyMenu.style.display == "none"
		? (difficultyMenu.style.display = "block")
		: (difficultyMenu.style.display = "none");

	[...document.getElementsByClassName("gameItem")].forEach(item => {
		item.classList.toggle("hide");
	});
}

function startGame(val) {
	console.log(val);
	clickSound.play();
	tetrisMusic.play();
	tetrisMusic.loop = true;

	toggleMenu();

	if (val == "easy") {
		dropInterval = 800;
		timeInterval = 100;
		scoreInterval = 300;
	} else if (val == "medium") {
		dropInterval = 700;
		timeInterval = 200;
		scoreInterval = 400;
	} else if (val == "hard") {
		dropInterval = 600;
		timeInterval = 300;
		scoreInterval = 500;
		randomMode();
	}

	gamePaused = false;
	updateTime();
	updateScore();
}

function pauseUnpauseGame() {
	pauseUnpauseMusic("game");
	if (!gamePaused) {
		gamePaused = true;
		pauseOverlay.style.display = "block";
	} else {
		gamePaused = false;
		pauseOverlay.style.display = "none";
		requestAnimationFrame(update);
	}

	document.addEventListener("keydown", e => pauseUnpauseGame());
}

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
	const minInterval = 20000; //20 secs min interval
	const maxInterval = 80000; //80 secs max interval
	console.log("random");
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
		gameOverMusic.play();

		// Update High Score
		let highScore = localStorage.getItem("tetrisHighScore");

		if (!highScore) {
			highScore = 0;
		}
		if (player.score > highScore) {
			localStorage.setItem("tetrisHighScore", player.score);
			localStorage.setItem("tetrisEndTime", timeCounter);
		}

		// Display Game Over Overlay
		gameoverOverlay.style.display = "block";
		document.getElementById("gameover-score").innerText = `Final Score: ${
			player.score
		}`;
		document.getElementById(
			"gameover-time"
		).innerText = `Final Time: ${timeCounter}`;

		btnMenu.addEventListener("click", e => {
			restartGame();
			toMainMenu();
		});

		btnRestart.addEventListener("click", e => {
			restartGame();
		});
	}
}

function restartGame() {
	arena.forEach(row => row.fill(0));
	player.score = 0;
	timeCounter = 0;
	gamePaused = false;
	gameOver = false;
	updateScore();
	document.getElementById("time").innerHTML = "0:00";

	gameoverOverlay.style.display = "none";
}

function toMainMenu() {
	gamePaused = true;

	toggleMenu();
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
	if (player.sweeper < 1) {
		sweeperDisplay.innerText = "No Sweepers Available";
	}
}

function renderSweeper() {
	console.log("rendering");
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
}
