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

		//switch(this.type) {
		//	case 1:
				this.generateMazeByRandomizedDepthSearch(width, height);
		//		break;
		//	default:
		//		this.generateMazeByRecursiveDivision(width, height);
		//		break;
		//}
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
						//if (this.type) {
							this.maze[indexY][indexX] = 1;
						/*} else {
							if ((indexY % 2) == 1) {
								if ((indexX == 0) || (indexX == this.cols - 1)) {
									this.maze[indexY][indexX] = 1;
								}
							} else if (indexX % 2 == 0) {
								this.maze[indexY][indexX] = 1;
							}
						}*/
						break;
				}
			});

			if (indexY == 1 && (!this.exitX || !this.exitY)) {
				let exitPos = 1 + this.rand(this.width % 2, Math.floor(this.width / 2) - (this.width % 2 ? 2 : 1)) * 2;
				this.maze[indexY][exitPos] = 3;
				this.exitX = exitPos;
				this.exitY = indexY;
			}

			if (indexY == (this.rows % 2 ? this.rows - 2 : this.rows - 1) && (!this.entranceX || !this.entranceY)) {
				let entrancePos = 1 + this.rand(this.height % 2, Math.floor(this.height / 2) - (this.height % 2 ? 2 : 1)) * 2;
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
		if (this.debug.visible) this.debug.highlight(this.exitX, this.exitY, 2);

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
				if (!nextCell && (cell.x != this.posX || cell.y != this.posY) && (
						(offset.y < 0 && cell.y > 1) || (offset.y > 0 && cell.y < this.height-2) ||
						(offset.x < 0 && cell.x > 1) || (offset.x > 0 && cell.x < this.width-2)
					) && this.visited[cell.y + offsetY][cell.x + offsetX] == 1 && this.maze[cell.y + offsetY][cell.x + offsetX]
				) {
					// starting a new branch
					this.maze[cell.y + offsetY / 2][cell.x + offsetX / 2] = 0;
					nextCell = {x: cell.x + offsetX, y: cell.y + offsetY, direction: index + 1};
					if (debug.visible && this.checkDebugCell(nextCell.x - offsetX / 2, nextCell.y - offsetY / 2)) debug.highlight(nextCell.x - offsetX / 2, nextCell.y - offsetY / 2);
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
				if (debug.visible) debug.highlight(nextCell.x, nextCell.y, 1);
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
				if (debug.visible && this.checkDebugCell(this.posX+offsetX, this.posY+offsetY)) {
					debug.highlight(this.posX+offsetX, this.posY+offsetY, 3);
				}
			}
		}

		const randomizePromise = new Promise((resolve, reject) => {
			// if the exit is found, or a dead end is reached, or the branch is already long enough
			if (!moveDirs.length || this.currentBranchLength > this.maxBranchLength || this.posX == this.exitX && this.posY == this.exitY) {
				if (debug.visible) {
					debug.highlight(this.posX, this.posY, this.currentBranchLength > this.maxBranchLength ? 1 : this.posX == this.exitX && this.posY == this.exitY ? 2 : this.currentBranchLength > 1 ? 4 : 0);
				}
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
					if (!moveDirs.length) continue;
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
						if (debug.visible && this.checkDebugCell()) debug.highlight(this.posX, this.posY);
						if (debug.visible && this.checkDebugCell(this.posX + offsetX/2, this.posY + offsetY/2)) debug.highlight(this.posX + offsetX/2, this.posY + offsetY/2);
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

	checkDebugCell(posX, posY) {
		return ((posX || this.posX) != this.exitX || (posY || this.posY) != this.exitY) && ((posX || this.posX) != this.entranceX || (posY || this.posY) != this.entranceY);
	}

	initArray(value) {
		return new Array(this.rows).fill().map(() => new Array(this.cols).fill(value));
	}

	rand(min, max) {
		return min + Math.floor(Math.random() * (1 + max - min));
	}
}