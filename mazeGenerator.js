class MazeGenerator {
	constructor(width, height, details, resolve) {
		this.type = details.type;
		this.debug = details.debug;
		this.maxBranchLength = details.maxBranchLength;
		this.emptyRooms = details.emptyRooms || 0;
		this.currentBranchLength = 0;
		this.entranceX = details.entranceX;
		this.entranceY = details.entranceY;
		this.exitX = details.exitX;
		this.exitY = details.exitY;
		this.resolve = resolve;
		this.destroyed = false;

		switch(this.type) {
			case 1:
				this.generateMazeByRandomizedDepthSearch(width, height);
				break;
			default:
				this.generateMazeByRecursiveDivision(width, height);
				break;
		}
	}

	destroy() {
		this.openCells = [];
		this.destroyed = true;
	}

	// initializes the maze grid
	initMazeGrid() {
		this.maze = this.initArray(0);
		this.maze.forEach((row, indexY) => {
			row.forEach((cell, indexX) => {
				switch(indexY) {
					case 0:
					case this.rows - 1:
						this.maze[indexY][indexX] = 1;
						break;

					default:
						if (this.type) {
							this.maze[indexY][indexX] = 1;
						} else {
							if ((indexY % 2) == 1) {
								if ((indexX == 0) || (indexX == this.cols - 1)) {
									this.maze[indexY][indexX] = 1;
								}
							} else if (indexX % 2 == 0) {
								this.maze[indexY][indexX] = 1;
							}
						}
						break;
				}
			});

			if (indexY == 1 && (!this.exitX || !this.exitY)) {
				let exitPos = this.posToSpace(this.rand(1, this.width));
				this.maze[indexY][exitPos] = 3;
				this.exitX = exitPos;
				this.exitY = indexY;
			}

			if (indexY == this.rows - 2 && (!this.entranceX || !this.entranceY)) {
				let entrancePos = this.posToSpace(this.rand(1, this.width));
				this.maze[indexY][entrancePos] = 2;
				this.entranceX = entrancePos;
				this.entranceY = indexY;
			}
		});
	}

	generateMazeByRandomizedDepthSearch(width, height) {
		this.width = width;
		this.height = height;

		this.density = 4;
		this.openess = 2;
		
		this.cols = this.width;
		this.rows = this.height;

		this.initMazeGrid();
		
		this.posX = this.entranceX;
		this.posY = this.entranceY;

		this.visited = this.initArray(0);
		this.visited.forEach((row, indexY) => {
			row.forEach((cell, indexX) => {
				this.visited[indexY][indexX] = !indexX || !indexY || indexY == this.visited.length-1 || indexX == this.visited[indexY].length-1 ? 0 : -1;
			});
		});

		this.visited[this.posY][this.posX] = 1;
		this.visited[this.exitY][this.exitX] = 1;
		this.maze[this.posY][this.posX] = 0;
		this.count = 0;
		this.openCells = [];

		if (this.debug.visible) this.debug.highlight(this.posX, this.posY, 5);
		if (this.debug.visible) this.debug.highlight(this.exitX, this.exitY, 4);

		this.advanceRandomization();
	}

	advanceRandomization() {
		if (this.destroyed) return;

		if (!this.debug || this.debug.instant) {
			this.randomizedDepthSearch();
		} else {
			const randomizePromise = new Promise((resolve, reject) => {
				document.addEventListener("keypress", this.advanceGeneration.bind(this, resolve));
			});
	
			randomizePromise.then(() => {
				this.randomizedDepthSearch();
			});
		}
	}

	advanceGeneration(callback) {
		document.removeEventListener("keypress", this.advanceGeneration.bind(this, callback));
		callback();
	}

	// when a branch reaches a dead end, all the opened cells are itterated in order to pick one to proceed with
	itterateCells(resolve) {
		let nextCell;
		const debug = this.debug;
		for (let i = this.openCells.length - 1; i > 0; i --) {
			const cell = this.openCells[i];

			const offsets = [{x:0, y:-2}, {x:2, y:0}, {x:0, y:2}, {x:-2, y:0}];
			offsets.forEach((offset, index) => {
				const offsetX = offset.x;
				const offsetY = offset.y;
				if ((
						(offset.y < 0 && cell.y > 1) || (offset.y > 0 && cell.y < this.height-2) ||
						(offset.x < 0 && cell.x > 1) || (offset.x > 0 && cell.x < this.width-2)
					) && this.visited[cell.y + offsetY][cell.x + offsetX] == 1 && this.maze[cell.y + offsetY][cell.x + offsetX]
				) {
					// starting a new branch
					this.maze[cell.y + offsetY / 2][cell.x + + offsetX / 2] = 0;
					nextCell = {x: cell.x + offsetX, y: cell.y + offsetY, direction: index + 1};
					if (debug.visible) debug.highlight(nextCell.x - offsetX / 2, nextCell.y - offsetY / 2);
					if (debug.visible) debug.highlight(nextCell.x, nextCell.y, 6);
				}
			});

			if (nextCell) break;
		}

		if (!nextCell) {
			if (this.openCells.length < 1) {
				document.removeEventListener("keypress", this.advanceGeneration.bind(this, resolve));
				if (this.destroyed) return;
				this.resolve();
				return;
			} else {
				// choses a random opened cell to proceed with
				nextCell = this.openCells[this.rand(0, this.openCells.length - 1)];
				//nextCell = this.openCells[i - 1];
				if (debug.visible) debug.highlight(nextCell.x, nextCell.y, 4);
			}
		}

		return nextCell;
	}

	// compares a given cell with all the cells marked as open
	itterateOpenCells(nextCell) {
		this.openCells.forEach((cell, index) => {
			if (cell.x == nextCell.x && cell.y == nextCell.y) {
				return index;
			}
		});
		return false;
	}

	// check all adjacent directions of a cell, chose an empty one and proceed with it
	randomizedDepthSearch() {
		let nextCell;
		let moveDirs = [];
		const debug = this.debug;
		let internalResolve;
		const offsets = [{x:0, y:0}, {x:0, y:-2}, {x:2, y:0}, {x:0, y:2}, {x:-2, y:0}];
		for (let direction = 1; direction < 5; direction++) {
			const offsetX = offsets[direction].x;
			const offsetY = offsets[direction].y;
			if ((
					(offsets[direction].y < 0 && this.posY > 2) ||
					(offsets[direction].y > 0 && this.posY < this.height-2) ||
					(offsets[direction].x < 0 && this.posX > 2) ||
					(offsets[direction].x > 0 && this.posX < this.width-2)
				) && this.maze[this.posY + offsetY][this.posX + offsetX]
			) {
				this.visited[this.posY+offsetY/2][this.posX+offsetX/2] = 5;
				this.visited[this.posY+offsetY][this.posX+offsetX] = direction;
				moveDirs.push(direction);
				if (this.visited[this.posY+offsetY][this.posX+offsetX] == -1 && debug.visible) {
					debug.highlight(this.posX+offsetX/2, this.posY+offsetY/2, 1);
				}
				if (debug.visible) debug.highlight(this.posX+offsetX, this.posY+offsetY, 3);
			}
		}

		const randomizePromise = new Promise((resolve, reject) => {
			// if a dead end is reached or the branch length is enough
			if (!moveDirs.length || this.currentBranchLength > this.maxBranchLength) {
				if (debug.visible) debug.highlight(this.posX, this.posY, this.currentBranchLength > this.maxBranchLength ? 4 : 2);
				this.currentBranchLength = 0;
				nextCell = this.itterateCells(resolve);
				if (nextCell) {
					this.openCells.splice(this.openCells.indexOf(nextCell), 1);
				}
			}

			this.currentBranchLength ++;

			if (!this.debug || this.debug.instant) {
				resolve();
			} else {
				document.addEventListener("keypress", this.advanceGeneration.bind(this, resolve));
			}
		});

		randomizePromise.then(() => {
			let internalCount = 0;
			if (nextCell) {
				// check how many non-visited cells are there still remaining
				let emptyCells = 0;
				this.maze.forEach((row, rowId) => {
					row.forEach((cell, cellId) => {
						if (cell == 1 && rowId % 2 && cellId % 2) emptyCells ++;
					});
				});

				// leave a certain number of empty cells before completion (for bonus), or just complete if no more cells are left.
				if (emptyCells <= this.emptyRooms || !emptyCells) {
					document.removeEventListener("keypress", this.advanceGeneration.bind(this, internalResolve));
					if (this.destroyed) return;
					this.resolve();
					return;
				}

				// find a cell from the open cells list from where to continue maze generation, or perform a cell itteration.
				let cellAtIndex = this.itterateOpenCells(nextCell);
				while (cellAtIndex) {
					if (cellAtIndex) {
						this.openCells.splice(this.openCells.indexOf(cellAtIndex), 1);
					} else {
						nextCell = this.itterateCells(internalResolve);
					}
					cellAtIndex = this.itterateOpenCells(nextCell);
				}

				this.posX = nextCell.x;
				this.posY = nextCell.y;

				// mark the selected cell as empty in the maze
				this.maze[this.posY][this.posX] = 0;
				if (debug.visible) debug.highlight(this.posX, this.posY, 6);
				this.advanceRandomization();
			} else {
				// try to find a suitable cell
				while (!nextCell && internalCount < 10) {
					internalCount ++;
					let direction = moveDirs[this.rand(0, moveDirs.length - 1)];
					const offsetX = offsets[direction].x;
					const offsetY = offsets[direction].y;
					if ((
							(offsets[direction].y < 0 && this.posY > 2) ||
							(offsets[direction].y > 0 && this.posY < this.height-2) ||
							(offsets[direction].x < 0 && this.posX > 2) ||
							(offsets[direction].x > 0 && this.posX < this.width-2)
						) && this.maze[this.posY + offsetY/2][this.posX + offsetX/2] && this.maze[this.posY + offsetY][this.posX + offsetX]
					) {
						nextCell = {y: this.posY + offsetY, x: this.posX + offsetX, direction: direction};
						this.maze[this.posY + offsetY/2][this.posX + offsetX/2] = 0;
						this.maze[this.posY + offsetY][this.posX + offsetX] = 0;
						if (debug.visible) debug.highlight(this.posX, this.posY);
						if (debug.visible) debug.highlight(this.posX + offsetX/2, this.posY + offsetY/2);
						if (debug.visible) debug.highlight(this.posX + offsetX, this.posY + offsetY, 6);
						this.posX += offsetX;
						this.posY += offsetY;
					}
				}
	
				if (nextCell) {
					this.openCells.push(nextCell);
				}
	
				this.advanceRandomization();
			}
		});
	}



	//
	generateMazeByRecursiveDivision(width, height) {
		this.width = Math.floor(width / 2);
		this.height = Math.floor(height / 2);

		this.density = 4;
		this.openess = 2;

		this.cols = 2 * this.width + 1;
		this.rows = 2 * this.height + 1;

		this.initMazeGrid();

	  	// start partitioning
		this.nextPartition(1, this.height-1, 1, this.width-1);
	}
  
	initArray(value) {
		return new Array(this.rows).fill().map(() => new Array(this.cols).fill(value));
	}
  
	rand(min, max) {
		return min + Math.floor(Math.random() * (1 + max - min));
	}
  
	posToSpace(x) {
		return 2 * (x-1) + 1;
	}
  
	posToWall(x) {
		return 2 * x;
	}
  
	inBounds(r, c) {
		if ((typeof this.maze[r] == "undefined") || (typeof this.maze[r][c] == "undefined")) {
			return false; // out of bounds
		}
		return true;
	}
  
	shuffle(array) {
		for(let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
		}
		return array;
	}
  
	nextPartition(r1, r2, c1, c2) {
		if (!this.debug || this.debug.instant) {
			this.partition(r1, r2, c1, c2);
		} else {
			const randomizePromise = new Promise((resolve, reject) => {
				document.addEventListener("keypress", this.advanceGeneration.bind(this, resolve));
			});
	
			randomizePromise.then(() => {
				//if () {
				//	this.resolve();
				//}
				this.partition(r1, r2, c1, c2);
			});
		}
	}

	partition(r1, r2, c1, c2) {

		// create partition walls
		// ref: https://en.wikipedia.org/wiki/Maze_generation_algorithm#Recursive_division_method

		let horiz, vert, x, y, start, end;

		if ((r2 < r1) || (c2 < c1)) {
			return false;
		}

		if (r1 == r2) {
			horiz = r1;
		} else {
			x = r1 + 1;
			y = r2 - 1;
			start = Math.round(x + (y-x) / this.density);
			end = Math.round(x + this.density * (y-x) / this.density);
			horiz = this.rand(start, end);
		}

		if (c1 == c2) {
			vert = c1;
		} else {
			x = c1 + 1;
			y = c2 - 1;
			start = Math.round(x + (y - x) / this.density);
			end = Math.round(x + this.density * (y - x) / this.density);
			vert = this.rand(start, end);
		}

		for(let i = this.posToWall(r1)-1; i <= this.posToWall(r2)+1; i++) {
			for(let j = this.posToWall(c1)-1; j <= this.posToWall(c2)+1; j++) {
				if ((i == this.posToWall(horiz)) || (j == this.posToWall(vert))) {
					this.maze[i][j] = 1;
				}
			}
		}
  
		let gaps = this.shuffle([true, true, true, false]);
  
		// create gaps in partition walls
		if (gaps[0]) {
			let passed = 0;
			while (Math.random() < 0.5 || passed < this.rand(1, this.openess)) {
				let gapPosition = this.rand(c1, vert);
				this.maze[this.posToWall(horiz)][this.posToSpace(gapPosition)] = 0;
				passed ++;
			}
		}

		if (gaps[1]) {
			let passed = 0;
			while (Math.random() < 0.5 || passed < this.rand(1, this.openess)) {
				let gapPosition = this.rand(vert+1, c2+1);
				this.maze[this.posToWall(horiz)][this.posToSpace(gapPosition)] = 0;
				passed ++;
			}
		}

		if (gaps[2]) {
			let passed = 0;
			while (Math.random() < 0.5 || passed < this.rand(1, this.openess)) {
				let gapPosition = this.rand(r1, horiz);
				this.maze[this.posToSpace(gapPosition)][this.posToWall(vert)] = 0;
				passed ++;
			}
		}

		if (gaps[3]) {
			let passed = 0;
			while (Math.random() < 0.5 || passed < this.rand(1, this.openess)) {
				let gapPosition = this.rand(horiz+1, r2+1);
				this.maze[this.posToSpace(gapPosition)][this.posToWall(vert)] = 0;
				passed ++;
			}
		}
  
		// recursively partition newly created chambers
		this.nextPartition(r1, horiz-1, c1, vert-1);
		this.nextPartition(horiz+1, r2, c1, vert-1);
		this.nextPartition(r1, horiz-1, vert+1, c2);
		this.nextPartition(horiz+1, r2, vert+1, c2);
	}
  
	isGap(...cells) {
		return cells.every((array) => {
			let row, col;
			[row, col] = array;
			if (this.maze[row][col] > 0 && this.maze[row][col] < 2) {
				return false;
			}
			return true;
		});
	}
  
	/*countSteps(array, r, c, val, stop) {
		if (!this.inBounds(r, c)) {
			return false; // out of bounds
		}

		if (array[r][c] <= val) {
			return false; // shorter route already mapped
		}

		if (!this.isGap([r, c])) {
			return false; // not traversable
		}

		array[r][c] = val;

		if (this.maze[r][c] > 1) {
			return true; // reached destination
		}

		this.countSteps(array, r-1, c, val+1, stop);
		this.countSteps(array, r, c+1, val+1, stop);
		this.countSteps(array, r+1, c, val+1, stop);
		this.countSteps(array, r, c-1, val+1, stop);
	}*/
}