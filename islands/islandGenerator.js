class IslandGenerator {
	constructor(_this, width, height, details, resolve) {
		this.main = _this;
		this.type = details.type;
		this.debug = details.debug;
		this.startX = details.startX;
		this.startY = details.startY;
		this.resolve = resolve;
		this.destroyed = false;
		this.offset = 3;

		this.generateIslands(width, height);
	}

	destroy() {
		this.islands = null;
		this.destroyed = true;
	}

	generateIslands(width, height) {
		this.width = width;
		this.height = height;
		
		this.map = this.initArray();
		
		this.posX = this.startX;
		this.posY = this.startY;

		this.relief = this.initArray();

		this.visited = this.initArray();
		this.visited.forEach((row, indexY) => {
			row.forEach((cell, indexX) => {
				this.visited[indexY][indexX] =
					indexX < this.offset || indexY < this.offset ||
					indexY >= this.visited.length - this.offset ||
					indexX >= this.visited[indexY].length - this.offset ? 1 : 0;
			});
		});

		this.islands = [];

		//if (this.debug.visible) this.debug.highlight(this.posX, this.posY, 5);
		
		this.islands.push([]);
		this.id = 0;
		this.updateRelief(this.posX, this.posY);
		this.choseNextStartLocation();
		this.visited[this.posY][this.posX] = 1;
		this.map[this.posY][this.posX] = 1;
		this.advanceRandomization();
	}

	choseNextStartLocation() {
		let attempt = 0;
		while (
			this.checkAjacentIslands(this.startX, this.startY) &&
			attempt < 9999
		) {
			this.startY = this.rand(this.offset+(4-this.id/5-attempt/3)|0, this.height-(this.offset+(4-this.id/5-attempt/3)|0));
			this.startX = this.rand(this.offset+(4-this.id/5-attempt/3)|0, this.width-(this.offset+(4-this.id/5-attempt/3)|0));
			attempt ++;
			/*if (attempt == 8) {
				if (this.debug.visible) this.debug.highlight(this.posX, this.posY, 4);
			}*/
		}

		// add riffs and relief data
		this.updateRelief(this.startX+2, this.startY+2, 5);
		this.updateRelief(this.startX+2, this.startY-2, 5);
		this.updateRelief(this.startX-2, this.startY+2, 5);
		this.updateRelief(this.startX-2, this.startY-2, 5);
		this.updateRelief(this.startX+3, this.startY, 5);
		this.updateRelief(this.startX-3, this.startY, 5);
		this.updateRelief(this.startX, this.startY+3, 5);
		this.updateRelief(this.startX, this.startY-3, 5);

		this.randomizeNextIsland();
	}

	updateRelief(posX, posY, type = 1, inner = 0) {
		// map level topology
		if (posX < 1 || posX > this.width-1 || posY < 1 || posY > this.height-1) return;
		this.relief[posY][posX] += type == 1 && !this.relief[posY][posX] ? 2 : 1;
		if (this.debug.visible) {
			this.debug.highlight(posX, posY, type).children[1].innerHTML = inner || this.relief[posY][posX];
		}
	}

	checkAjacentIslands(posX, posY) {
		if (posX < this.offset || posX >= this.width - this.offset || posY < this.offset || posY >= this.height - this.offset) {
			return false;
		}
		if (posX == this.startX && posY == this.startY && !this.i && !this.n) return false;
		// TODO: check which one compresses better
		/*let check = this.visited[posY][posX] ||// this.relief[posY][posX] ||
			this.map[posY-1][posX] && this.map[posY-1][posX] != this.id || this.relief[posY-1][posX] ||
			this.map[posY+1][posX] && this.map[posY+1][posX] != this.id || this.relief[posY+1][posX] ||
			this.map[posY][posX-1] && this.map[posY][posX-1] != this.id || this.relief[posY][posX-1] ||
			this.map[posY][posX+1] && this.map[posY][posX+1] != this.id || this.relief[posY][posX+1] ||
			this.map[posY-2][posX] && this.map[posY-2][posX] != this.id || this.relief[posY-1][posX] ||
			this.map[posY+2][posX] && this.map[posY+2][posX] != this.id || this.relief[posY-1][posX] ||
			this.map[posY][posX-2] && this.map[posY][posX-2] != this.id || this.relief[posY][posX-2] ||
			this.map[posY][posX+2] && this.map[posY][posX+2] != this.id || this.relief[posY][posX+2] ||
			this.map[posY+1][posX+1] && this.map[posY+1][posX+1] != this.id || this.relief[posY+1][posX+1] ||
			this.map[posY+1][posX-1] && this.map[posY+1][posX-1] != this.id || this.relief[posY+1][posX-1] ||
			this.map[posY-1][posX+1] && this.map[posY-1][posX+1] != this.id || this.relief[posY-1][posX+1] ||
			this.map[posY-1][posX-1] && this.map[posY-1][posX-1] != this.id || this.relief[posY-1][posX-1] ||
			this.map[posY+2][posX+2] && this.map[posY+2][posX+2] != this.id || this.relief[posY+2][posX+2] ||
			this.map[posY+2][posX-2] && this.map[posY+2][posX-2] != this.id || this.relief[posY+2][posX-2] ||
			this.map[posY-2][posX+2] && this.map[posY-2][posX+2] != this.id || this.relief[posY-2][posX+2] ||
			this.map[posY-2][posX-2] && this.map[posY-2][posX-2] != this.id || this.relief[posY-2][posX-2] ||
			this.map[posY-3][posX] && this.map[posY-3][posX] != this.id || this.relief[posY-3][posX] ||
			this.map[posY+3][posX] && this.map[posY+3][posX] != this.id || this.relief[posY+3][posX] ||
			this.map[posY][posX-3] && this.map[posY][posX-3] != this.id || this.relief[posY][posX-3] ||
			this.map[posY][posX+3] && this.map[posY][posX+3] != this.id || this.relief[posY][posX+3] ||
			this.map[posY-3][posX+1] && this.map[posY-3][posX+1] != this.id || this.relief[posY-3][posX+1] ||
			this.map[posY-3][posX-1] && this.map[posY-3][posX-1] != this.id || this.relief[posY-3][posX-1] ||
			this.map[posY+3][posX+1] && this.map[posY+3][posX+1] != this.id || this.relief[posY+3][posX+1] ||
			this.map[posY+3][posX-1] && this.map[posY+3][posX-1] != this.id || this.relief[posY+3][posX-1] ||
			this.map[posY+1][posX-3] && this.map[posY+1][posX-3] != this.id || this.relief[posY+1][posX-3] ||
			this.map[posY-1][posX-3] && this.map[posY-1][posX-3] != this.id || this.relief[posY-1][posX-3] ||
			this.map[posY-1][posX+3] && this.map[posY-1][posX+3] != this.id || this.relief[posY-1][posX+3] ||
			this.map[posY+1][posX+3] && this.map[posY+1][posX+3] != this.id || this.relief[posY+1][posX+3];*/

		const abs = Math.abs;

		const generateDirections = () => {
			const directions = [];
			for (let dy = -3; dy <= 3; dy++) {
				for (let dx = -3; dx <= 3; dx++) {
					if (
						(abs(dy) <= 1 && abs(dx) <= 1) || 
						(abs(dy) === abs(dx)) || 
						dy === 0 || 
						dx === 0 || 
						(abs(dy) === 3 && abs(dx) === 1) || 
						(abs(dy) === 1 && abs(dx) === 3)
					) {
						directions.push([dy, dx]);
					}
				}
			}
			return directions;
		};
		
		const directions = generateDirections();
		
		let check = directions.some(([dy, dx]) => {
			const y = posY + dy;
			const x = posX + dx;
			return (this.map[y] && this.map[y][x] && this.map[y][x] != this.id) || (this.visited[y] && this.visited[y][x]);
		}) || this.visited[posY][posX];

		return check;
	}

	randomizeNextIsland() {
		this.id ++;
		this.i = 0;
		this.n = 0;
		this.islands.push([]);
		this.depth = this.rand(3, 3 + this.id/7);
		this.amounts = this.rand(3 + this.id/7, 5 + this.id/5);
		this.posX = this.startX;
		this.posY = this.startY;
		console.log("new #"+this.id+" island will be at " + this.startX+"x"+this.startY, "depth:"+this.depth, "n:"+this.amounts)
	}

	advanceRandomization() {
		if (this.destroyed) return;

		if (this.debug.visible) this.debug.highlight(this.posX, this.posY);// cursor highlight yellow

		if (!this.debug || this.debug.instant) {
			this.randomizedExpand();
		} else {
			const randomizePromise = new Promise((resolve, reject) => {
				document.addEventListener("keypress", this.advanceGeneration.bind(this, resolve));
			});
	
			randomizePromise.then(() => {
				this.randomizedExpand();
			});
		}
	}

	randomizedExpand() {
		if (this.debug.visible) this.debug.highlight(this.posX, this.posY, 1);// previous highlight in green
		let dirX = 0;
		let dirY = 0;
		let attempt = 0;
		let adjacent = 0;
		while(
			this.posX + dirX < 2 || this.posX + dirX > this.width-3 ||
			this.posY + dirY < 2 || this.posY + dirY > this.height-3 ||
			this.visited[this.posY + dirY][this.posX + dirX] &&
			attempt < 9
		) {
			dirX = Math.random();
			if (dirX < .4) {
				dirX = dirX < .2 ? -1 : 1;
				dirY = 0;
			}
			else {
				dirY = dirX > .7 ? -1 : 1;
				dirX = 0;
			}
			attempt ++
			if (attempt == 8) {
				if (this.checkAjacentIslands(this.posX + dirX, this.posY + dirY)) {
					adjacent ++;
					if (adjacent > 9) {
						//if (this.debug.visible) this.debug.highlight(this.posX, this.posY, 11);//orange circle
						break;
					}
				}
			}
		}
		this.posX += dirX;
		this.posY += dirY;

		//console.log("randomizedExpand", this.posX, this.posY, "x:"+dirX, "y:"+dirY, this.depth+"("+this.i+")", this.amounts+"("+this.n+")");

		this.visited[this.posY][this.posX] = 1;// switch if tile placed: 0 / 1
		this.map[this.posY][this.posX] = this.id;// will have to determine tile type as well
		this.islands[this.id].push([dirX, dirY, 1]);

		this.i += 1;
		if (this.i >= this.depth) {
			this.n ++;
			this.i = 0;
			// add violet circle riffs at the end of each n itteration and circle green at the last tile of the island (key)
			this.updateRelief(this.posX, this.posY, this.n >= this.amounts ? 7 : 9);
			if (this.n >= this.amounts) {
				// hilight isle id with circular shape (town)
				this.updateRelief(this.startX, this.startY, this.id == 13 ? 11 : 10, this.id);
				if (this.id == 13) {
					// all islands generation done
					this.resolve();
					return;
				}

				this.choseNextStartLocation();
			}
			
			this.posX = this.startX;
			this.posY = this.startY;
		} else {
			// update the green relief data on each island tile (land)
			this.updateRelief(this.posX, this.posY, 1);
		}

		this.advanceRandomization();
	}

	advanceGeneration(callback) {
		document.removeEventListener("keypress", this.advanceGeneration.bind(this, callback));
		callback();
	}

	checkDebugCell(posX, posY, checkX, checkY) {
		return ((posX || this.posX) != (checkX || this.entranceX) || (posY || this.posY) != (checkY || this.entranceY));
	}

	initArray(value = 0) {
		return new Array(this.height).fill().map(() => new Array(this.width).fill(value));
	}

	rand(min, max) {
		return (min + Math.random() * (1 + max - min)) | 0;
	}
}