window.addEventListener('load', () => {
	const app = new App();
});

class App {
	constructor(data) {
		const debug = document.getElementById("debug");
		this.debug = debug;
		if (debug) this.debug.highlight = this.highlight;
		if (debug) this.debug.instant = debug.hasAttribute('instant') || debug.hasAttribute('hidden');
		if (debug) this.debug.visible = debug.hasAttribute('visible') || debug.hasAttribute('hidden') ? false : !debug.instant;

		if (debug) this.debug.innerHTML = '';

		if (debug) document.addEventListener("DebugClick", this.onDebugClick);

		if (data) {
			this.processHackerrankData(data);
			this.processPath();
		} else {
			this.width = 23;
			this.height = 23;
			this.type = 1;
			this.generateMaze(this.width, this.height, this.type);
		}
	}

	generateMaze(width, height, type) {
		this.width = width;
		this.height = height;

		// initialize new empty map
		this.map = [];
		for (let y = 0; y < this.height; y++) {
			let tmp = [];
			for (let x = 0; x < this.width; x++) {
				tmp.push(0);//tmp.push(!x || x == this.width - 1 || !y || y == this.height - 1 ? 0 : 1);
			}
			this.map.push(tmp);
		}
		this.initializeNodeList(this.map);

		// init maze generator
		this.mazeGenerator = new MazeGenerator(this.width, this.height, {
			type: type,
			debug: this.debug,
			entranceX: 1,
			entranceY: this.height - (this.height % 2 ? 2 : 1),
			exitX: this.width - (this.width % 2 ? 2 : 1),
			exitY: 1,
			maxBranchLength: Math.ceil((this.width + this.height) / 4),
			emptyRooms: 0
		}, this.mazeGenerated.bind(this));
	}

	mazeGenerated() {
		this.mazeGenerator.destroy();
		this.debug.innerHTML = '';
		let maze = `${this.mazeGenerator.entranceY} ${this.mazeGenerator.entranceX}\n${this.mazeGenerator.exitY} ${this.mazeGenerator.exitX}\n${this.height} ${this.width}\n`;
		this.mazeGenerator.maze.forEach((mazeRow, index) => {
			mazeRow.forEach(mazeCell => {
				maze += mazeCell == 1 ? '%' : '-';
			});
			if (index < this.height - 1) maze += '\n';
		});

		this.processHackerrankData(maze);
		this.processPath();
	}

	// process data is sent in hackerrank-like format
	processHackerrankData(input) {
		this.map = [];
		const parts = input.split('\n');
		parts.forEach((part, index) => {
			switch (index) {
				case 0:
					this.posY = parseInt(part.split(' ')[0]);
					this.posX = parseInt(part.split(' ')[1]);
					break;
				case 1:
					this.exitY = parseInt(part.split(' ')[0]);
					this.exitX = parseInt(part.split(' ')[1]);
					break;
				case 2:
					this.height = parseInt(part.split(' ')[0]);
					this.width = parseInt(part.split(' ')[1]);
					break;
				default:
					const nodes = [];
					part.split('').forEach(node => {
						nodes.push(node == '%' ? 0 : 1);
					});
					this.map.push(nodes);
					break;
			}
		});
	}

	processPath() {
		const pathPromise = this.findPath(this.map, this.posX, this.posY, this.exitX, this.exitY);
		pathPromise.then((path) => {
			path.reverse().forEach(pathCell => {
				if (this.debug) this.highlight(pathCell.x, pathCell.y, 3);
			});
			if (this.debug) this.highlight(this.posX, this.posY, 5);
			if (this.debug) this.highlight(this.exitX, this.exitY, 4);
			console.log(path);
		});
	}

	// debug click functions
	onDebugClick(event) {
		let x = event.detail.x;
		let y = event.detail.y;
		if (this.openList) {
			this.openList.forEach(entry => {
				if (entry.X == x && entry.Y == y) {
					console.log(`openList (${x}x${y})`, entry);
				}
			});
		}
		if (this.closedList) {
			this.closedList.forEach(entry => {
				if (entry.X == x && entry.Y == y) {
					console.log(`closedList (${x}x${y})`, entry);
				}
			});
		}
	}

	// sets a tile to a certain color
	// colors -1: black, 0: yellow, 1: green, 2: red, 3: blue, 4: orange, 5: green circle, 6: light blue
	highlight(posX, posY, type) {
		const frame = document.getElementById(`debug_${posX}x${posY}`);
		frame.style.opacity = 1;
		frame.innerHTML = String.fromCodePoint(
			type == -1 ? 11035 :
			type == 1 ? 129001 :
			type == 2 ? 128997 :
			type == 3 ? 128998 :
			type == 4 ? 128999 :
			type == 5 ? 129002 :
			type == 6 ? 128994 : 129000
		);
	}

	/**
	 * Finds the path to a certain tile on provided 0/1 populated map
	 * @param {number[][]} map ground data
	 * @param {number} posX agent starting x
	 * @param {number} posY agent starting y
	 * @param {number} exitX destination x
	 * @param {number} exitY destination y
	 */
	findPath(map, posX, posY, exitX, exitY) {
		const nodeList = this.initializeNodeList(map, true);

		const getPathPromise = new Promise((resolve, reject) => {
			
			const pathFinder = new PathFinder(this.debug);
			pathFinder.getPath(nodeList, posX, posY, exitX, exitY, resolve);
			if (this.debug && !this.debug.instant) {
				document.addEventListener("keypress", pathFinder.advanceNodes.bind(pathFinder, resolve));
			}
		});

		return getPathPromise;
	}

	initializeNodeList(map, debug) {
		const nodeList = [];
		
		for(let y = 0; y < map.length; y++) {
			let tmpArr = [];
			for(let x = 0; x < (map[0].length % 2 ? map[0].length : map[0].length + 1); x++) {
				tmpArr.push(map[y][x]);
			}
			nodeList.push(tmpArr);
		}

		if (this.debug && !this.debug.instant || debug) {
			let _height = (map.length % 2 ? map.length : map.length + 1);
			let _width = (map[0].length % 2 ? map[0].length : map[0].length + 1);
			for(let y = 0; y < _height; y++) {
				let debugHtml = '';
				for(let x = 0; x < _width; x++) {
					let char = map.length % 2 == 0 || map[0].length % 2 == 0 || !map[y][x] ? String.fromCodePoint(11035) : String.fromCodePoint(11036);
					let click = `onclick='document.dispatchEvent(new CustomEvent("DebugClick",{"detail":{"x":${x},"y":${y}}}))'`;
					let transparent = debug && (x && x < _width-1 && y && y < _height-1);
					debugHtml += `<div style="${x == _width-1 ? '' : 'float:left;'}${transparent?'opacity:0.5':''}" id="debug_${x}x${y}" ${click}>${char}</div>`;
				}
				this.debug.innerHTML += debugHtml;
			}
		}

		this.debug.innerHTML += "press SPACE to advance";

		return nodeList;
	}
}


/*const app = new App(`1 5
4 1
7 7
%%%%%%%
%--%--%
%--%--%
%--%--%
%-----%
%-----%
%%%%%%%`);*/


	/*`25 13
3 1
27 28
%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%------------%%------------%
%-%%%%-%%%%%-%%-%%%%%-%%%%-%
%.%%%%-%%%%%-%%-%%%%%-%%%%-%
%-%%%%-%%%%%-%%-%%%%%-%%%%-%
%--------------------------%
%-%%%%-%%-%%%%%%%%-%%-%%%%-%
%-%%%%-%%-%%%%%%%%-%%-%%%%-%
%------%%----%%----%%------%
%%%%%%-%%%%%-%%-%%%%%-%%%%%%
%%%%%%-%%%%%-%%-%%%%%-%%%%%%
%%%%%%-%------------%-%%%%%%
%%%%%%-%-%%%%--%%%%-%-%%%%%%
%--------%--------%--------%
%%%%%%-%-%%%%%%%%%%-%-%%%%%%
%%%%%%-%------------%-%%%%%%
%%%%%%-%-%%%%%%%%%%-%-%%%%%%
%------------%%------------%
%-%%%%-%%%%%-%%-%%%%%-%%%%-%
%-%%%%-%%%%%-%%-%%%%%-%%%%-%
%---%%----------------%%---%
%%%-%%-%%-%%%%%%%%-%%-%%-%%%
%%%-%%-%%-%%%%%%%%-%%-%%-%%%
%------%%----%%----%%------%
%-%%%%%%%%%%-%%-%%%%%%%%%%-%
%------------P-------------%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%`*/


	/*`11 9
2 15
13 20
%%%%%%%%%%%%%%%%%%%%
%----%--------%----%
%-%%-%-%%--%%-%.%%-%
%-%-----%--%-----%-%
%-%-%%-%%--%%-%%-%-%
%-----------%-%----%
%-%----%%%%%%-%--%-%
%-%----%----%-%--%-%
%-%----%-%%%%-%--%-%
%-%-----------%--%-%
%-%%-%-%%%%%%-%-%%-%
%----%---P----%----%
%%%%%%%%%%%%%%%%%%%%`*/


	/*3 9
5 1
7 20
%%%%%%%%%%%%%%%%%%%%
%--------------%---%
%-%%-%%-%%-%%-%%-%-%
%--------P-------%-%
%%%%%%%%%%%%%%%%%%-%
%.-----------------%
%%%%%%%%%%%%%%%%%%%%`*/


	/*`35 35
35 1
37 37
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%-------%-%-%-----------%---%-----%-%
%-%%%%%%%-%-%%%-%-%%%-%%%-%%%%%%%-%-%
%-------%-------%-%-----%-----%-%---%
%%%%%-%%%%%-%%%-%-%-%-%%%-%%%%%-%-%%%
%---%-%-%-%---%-%-%-%---%-%---%-%---%
%-%%%-%-%-%-%%%-%%%%%-%%%-%-%%%-%%%-%
%-------%-----%---%---%-----%-%-%---%
%%%-%%%%%%%%%-%%%%%%%-%%%-%%%-%-%-%-%
%-------------%-------%-%---%-----%-%
%-%-%%%%%-%-%%%-%-%-%%%-%-%%%-%%%-%-%
%-%-%-----%-%-%-%-%-----%---%-%-%-%-%
%-%-%-%%%%%%%-%-%%%%%%%%%-%%%-%-%%%-%
%-%-%-%-----%---%-----%-----%---%---%
%%%-%%%-%-%%%%%-%%%%%-%%%-%%%-%%%%%-%
%-----%-%-%-----%-%-----%-%---%-%-%-%
%-%-%-%-%-%%%-%%%-%%%-%%%-%-%-%-%-%-%
%-%-%-%-%-----------------%-%-%-----%
%%%-%%%%%%%-%-%-%%%%%-%%%-%-%%%-%%%%%
%-------%-%-%-%-----%---%-----%-%---%
%%%%%-%-%-%%%%%%%%%-%%%%%%%%%%%-%-%%%
%---%-%-----------%-%-----%---%-%---%
%-%%%-%%%%%-%%%%%%%%%-%%%%%-%-%-%%%-%
%-%---%------%--------%-----%-------%
%-%-%-%%%%%-%%%-%-%-%-%-%%%%%%%%%%%%%
%-%-%---%-----%-%-%-%-------%---%-%-%
%-%-%%%-%%%-%-%-%-%%%%%%%%%-%%%-%-%-%
%-%---%-%---%-%-%---%-%---%-%-%-----%
%-%%%-%%%-%%%%%-%%%-%-%-%%%%%-%-%%%%%
%-------%---%-----%-%-----%---%-%---%
%%%-%-%%%%%-%%%%%-%%%-%%%-%-%%%-%-%%%
%-%-%-%-%-%-%-%-----%-%---%-%---%-%-%
%-%-%%%-%-%-%-%-%%%%%%%%%-%-%-%-%-%-%
%---%---%---%-----------------%-----%
%-%-%-%-%%%-%%%-%%%%%%%-%%%-%%%-%%%-%
%.%-%-%-------%---%-------%---%-%--P%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%`*/


/*processBot(`0 0
5 5
b---d
-d--d
--dd-
--d--
----d`);*/
	
/*let posX;
let posY;
let width;
let height;
let exitX;
let exitY;
let map;

let path;
let debug;
	const width = 35;
	const height = 35;
	const mazeGenerator = new MazeGenerator(width, height, {type: 0, maxBranchLength: 20, emptyRooms: 0}, 1, 33, 33, 1, resolve);

	if (!mazeGenerator.debug.instant) {
		solve();
	}

	function solve() {
		mazeGenerator.debug.innerHTML = '';
		initializeNodeList();
	}

	function resolve() {
		mazeGenerator.destroy();
		mazeGenerator.debug.innerHTML = '';
		let maze = `${mazeGenerator.entranceY} ${mazeGenerator.entranceX}\n${mazeGenerator.exitY} ${mazeGenerator.exitX}\n${height} ${width}\n`;
		mazeGenerator.maze.forEach(mazeRow => {
			mazeRow.forEach(mazeCell => {
				maze += mazeCell == 1 ? '%' : '-';
			});
			maze += '\n';
		});

		processHackerrankData(maze);
		processPath();
	}
});
*/





/*
function processBot(input) {
	map = [];
	const dirtyCells = [];
	const parts = input.split('\n');
	let itteration = 1;
	parts.forEach((part, index) => {
		switch (index) {
			case 0:
				posY = parseInt(part.split(' ')[0]) + 1;
				posX = parseInt(part.split(' ')[1]) + 1;
				break;
			case 1:
				height = parseInt(part.split(' ')[0]) + 2;
				width = parseInt(part.split(' ')[1]) + 2;
				break;
			default:
				if (index == 2) {
					const border = []
					for (let i = 0; i < width; i++) {
						border.push(0);
					}
					map.push(border);
				}
				
				const nodes = [0];
				part.split('').forEach((node, index) => {
					nodes.push(1);
					//nodes.push(node == '-' ? 1 : 0);
					if (node != '-') {
						dirtyCells.push({x: index + 1, y: itteration})
					}
				});
				nodes.push(0);
				map.push(nodes);
				if (index == height - 1) {
					const border = []
					for (let i = 0; i < width; i++) {
						border.push(0);
					}
					map.push(border);
				}
				itteration ++;
				break;
		}
	});

	const paths = [];
	let count = 0;
	dirtyCells.forEach((cell, index) => {
		const pathPromise = findPath(map, posX, posY, cell.x, cell.y, !index);
		pathPromise.then((path) => {
			path.reverse().forEach(pathCell => {
				if (debug) highlight(pathCell.x, pathCell.y, 3);
			});

			if (path.length > 1) {
				path.shift();
				paths.push(path);
			}

			highlight(cell.x, cell.y, 4);

			count ++;
			if (count == dirtyCells.length) {
				//console.log(map, paths);
				const shortest = paths.reduce(function(p,c) {return p.length>c.length?c:p;},{length:Infinity});
				console.log(shortest);
			}

			highlight(posX, posY, 5);
		});
	});

// 	processBot(`${posX} ${posY}
// 5 5
// b---d
// -d--d
// --dd-
// --d--
// ----d`);
}
*/
