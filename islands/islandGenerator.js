class IslandGenerator {
	constructor(width, height, details, resolve) {
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
					indexY > this.visited.length - this.offset ||
					indexX > this.visited[indexY].length - this.offset ? 1 : 0;
			});
		});

		this.islands = [];

		//if (this.debug.visible) this.debug.highlight(this.posX, this.posY, 5);
		
		this.islands.push([]);
		this.id = 0;
		this.choseNextStartLocation();
		this.visited[this.posY][this.posX] = 1;
		this.relief[this.posY][this.posX] = 1;
		this.map[this.posY][this.posX] = 1;
		this.advanceRandomization();
	}

	choseNextStartLocation() {
		let attempt = 0;
		while (
			this.checkAjacentIslands(this.startX, this.startY) &&
			attempt < 50
		) {
			this.startY = this.rand(this.offset*2, this.height-this.offset*2);
			this.startX = this.rand(this.offset*2, this.width-this.offset*2);
			attempt ++;
			if (attempt == 49) {
				if (this.debug.visible) this.debug.highlight(this.posX, this.posY, 6);
			}
		}
		// TODO: improve
		if (this.debug.visible) this.debug.highlight(this.startX+2, this.startY+2, 5).children[1].innerHTML = 1;
		if (this.debug.visible) this.debug.highlight(this.startX+2, this.startY-2, 5).children[1].innerHTML = 1;
		if (this.debug.visible) this.debug.highlight(this.startX-2, this.startY+2, 5).children[1].innerHTML = 1;
		if (this.debug.visible) this.debug.highlight(this.startX-2, this.startY-2, 5).children[1].innerHTML = 1;
		if (this.debug.visible) this.debug.highlight(this.startX+3, this.startY, 5).children[1].innerHTML = 1;
		if (this.debug.visible) this.debug.highlight(this.startX-3, this.startY, 5).children[1].innerHTML = 1;
		if (this.debug.visible) this.debug.highlight(this.startX, this.startY+3, 5).children[1].innerHTML = 1;
		if (this.debug.visible) this.debug.highlight(this.startX, this.startY-3, 5).children[1].innerHTML = 1;

		if (this.debug.visible) this.debug.highlight(this.posX, this.posY, 3).children[1].innerHTML =
			this.relief[this.posY][this.posX];// hilight relief

		this.randomizeNextIsland();
	}

	checkAjacentIslands(posX, posY) {
		if (posX < this.offset || posX > this.width - this.offset || posY < this.offset || posY > this.height - this.offset) {
			return false;
		}
		// TODO: fix
		let check = this.visited[posY][posX] ||
			this.map[posY-1][posX] && this.map[posY-1][posX] != this.id ||
			this.map[posY+1][posX] && this.map[posY+1][posX] != this.id ||
			this.map[posY][posX-1] && this.map[posY][posX-1] != this.id ||
			this.map[posY][posX+1] && this.map[posY][posX+1] != this.id ||
			this.map[posY-2][posX] && this.map[posY-2][posX] != this.id ||
			this.map[posY+2][posX] && this.map[posY+2][posX] != this.id ||
			this.map[posY][posX-2] && this.map[posY][posX-2] != this.id ||
			this.map[posY][posX+2] && this.map[posY][posX+2] != this.id ||
			this.map[posY + 1][posX + 1] && this.map[posY + 1][posX + 1] != this.id ||
			this.map[posY + 1][posX - 1] && this.map[posY + 1][posX - 1] != this.id ||
			this.map[posY - 1][posX + 1] && this.map[posY - 1][posX + 1] != this.id ||
			this.map[posY - 1][posX - 1] && this.map[posY - 1][posX - 1] != this.id ||
			this.map[posY + 2][posX + 2] && this.map[posY + 2][posX + 2] != this.id ||
			this.map[posY + 2][posX - 2] && this.map[posY + 2][posX - 2] != this.id ||
			this.map[posY - 2][posX + 2] && this.map[posY - 2][posX + 2] != this.id ||
			this.map[posY - 2][posX - 2] && this.map[posY - 2][posX - 2] != this.id ||
			this.map[posY-3][posX] && this.map[posY-3][posX] != this.id ||
			this.map[posY+3][posX] && this.map[posY+3][posX] != this.id ||
			this.map[posY][posX-3] && this.map[posY][posX-3] != this.id ||
			this.map[posY][posX+3] && this.map[posY][posX+3] != this.id ||
			this.map[posY-3][posX+1] && this.map[posY-3][posX+1] != this.id ||
			this.map[posY-3][posX-1] && this.map[posY-3][posX-1] != this.id ||
			this.map[posY+3][posX+1] && this.map[posY+3][posX+1] != this.id ||
			this.map[posY+3][posX-1] && this.map[posY+3][posX-1] != this.id ||
			this.map[posY+1][posX-3] && this.map[posY+1][posX-3] != this.id ||
			this.map[posY-1][posX-3] && this.map[posY-1][posX-3] != this.id ||
			this.map[posY-1][posX+3] && this.map[posY-1][posX+3] != this.id ||
			this.map[posY+1][posX+3] && this.map[posY+1][posX+3] != this.id;

		return check;
	}

	randomizeNextIsland() {
		this.id ++;
		this.i = 0;
		this.n = 0;
		this.islands.push([]);
		this.depth = this.rand(3,4);
		this.amounts = this.rand(4,8);
		this.posX = this.startX;
		this.posY = this.startY;
		console.log("new #"+this.id+" island will be at " + this.startX+"x"+this.startY, "depth:"+this.depth, "n:"+this.amounts)
	}

	advanceRandomization() {
		if (this.destroyed) return;

		if (this.debug.visible) this.debug.highlight(this.posX, this.posY);//yellow

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
		if (this.debug.visible) this.debug.highlight(this.posX, this.posY, 1);//green
		let dirX = 0;
		let dirY = 0;
		let attempt = 0;
		while(
			this.visited[this.posY + dirY][this.posX + dirX] &&
			this.checkAjacentIslands(this.posX + dirX, this.posY + dirY) &&
			attempt < 50
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
			//this.posX += dirX;
			//this.posY += dirY;
			attempt ++
			/*if (attempt == 49) {
				if (this.debug.visible) this.debug.highlight(this.posX, this.posY, 6);
			}*/
		}
		this.posX += dirX;
		this.posY += dirY;
		
		console.log("randomizedExpand", this.posX, this.posY, "x:"+dirX, "y:"+dirY, this.depth+"("+this.i+")", this.amounts+"("+this.n+")");
		
		this.visited[this.posY][this.posX] = 1;
		this.map[this.posY][this.posX] = this.id;// will have to determine tile type as well
		this.relief[this.posY][this.posX] ++;// map level topology
		this.islands[this.id].push([dirX, dirY, 1]);
		//if (this.debug.visible) this.debug.highlight(this.posX, this.posY, 5);// edge violet
		if (this.debug.visible) this.debug.highlight(this.posX, this.posY, this.map[this.posY][this.posX] == this.id ? 1 : 5).children[1].innerHTML =
			this.relief[this.posY][this.posX];// hilight relief

		this.i += 1;
		if (this.i >= this.depth) {
			this.n ++;
			this.i = 0;
			if (this.n >= this.amounts) {
				if (this.debug.visible) this.debug.highlight(this.startX, this.startY);
				//if (this.debug.visible) this.debug.highlight(this.posX, this.posY, 4);// edge orange
				if (this.debug.visible) this.debug.highlight(this.startX, this.startY).children[1].innerHTML = this.id;
				if (this.id == 13) {
					console.log("done");
					this.resolve();
					return;
				}

				this.choseNextStartLocation();
			}

			this.posX = this.startX;
			this.posY = this.startY;
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
		return min + Math.floor(Math.random() * (1 + max - min));
	}
}