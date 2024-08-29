class IslandGenerator {
	constructor(_this, width, height, details, resolve) {
		this.main = _this;
		this.type = details.type;
		this.debug = details.debug;
		this.offset = details.offset;
		this.startX = details.startX;
		this.startY = details.startY;
		this.resolve = resolve;
		this.destroyed = false;
		this.startTime = performance.now();
		this.map = [];

		this.generateIslands(width, height);
	}

	destroy() {
		this.islands = null;
		this.destroyed = true;
	}

	regenerate(_startX, _startY, _endX, _endY) {
		this.startTime = performance.now();
		let islesToNotRegen = [];
		// get the islands that fall in the protected area
		for (let y = _startY; y < (_endY < this.height ? _endY : this.height); y++) {
			for (let x = _startX; x < (_endX < this.width ? _endX : this.width); x++) {
				if (islesToNotRegen.indexOf(this.map[y][x]) == -1 && this.map[y][x]) islesToNotRegen.push(this.map[y][x]);
			}
		}
		// clear the rest of the islands in the array
		for (let y = 1; y < 14; y++) {
			if (islesToNotRegen.indexOf(y) == -1) {
				this.islands[y] = [];
			}
		}
		console.log("regenerate area:", _startX+"x"+_startY+"-"+_endX+"x"+_endY, "protected islands:"+islesToNotRegen);
		// clear the map outside the protected area
		for (let y = 0; y < this.height; y++) {
			for (let x = 0; x < this.width; x++) {
				if (islesToNotRegen.indexOf(this.map[y][x]) == -1) {
					this.map[y][x] = 0;
					this.relief[y][x] = 0;
					this.visited[y][x] = 0;
					this.updateRelief(x,  y, 3, 0);
				}
			}
		}

		this.id = 1;// set the id to the next isle that have to be regenerated (skipping any protected ones in order)
		while (islesToNotRegen.indexOf(this.id) > -1) {
			if (this.debug && this.debug.feedback) console.log("skip #" + this.id, this.islands[this.id].length);
			this.id ++;
		}
		this.id --;

		document.dispatchEvent(new CustomEvent("Reset"));
		this.generateNextIsland(true);
	}

	generateIslands(width, height) {
		this.width = width;
		this.height = height;
		if (!this.startX) this.startX = this.width/2|0;
		if (!this.startY) this.startY = this.height/2|0;
		if (!this.offset) this.offset = this.height/10|0;

		this.map = this.initArray();

		this.posX = this.startX;
		this.posY = this.startY;

		this.relief = this.initArray();
		this.visited = this.initArray();
		this.islands = [];

		this.id = 0;
		for (let y = 0; y < 14; y++) {
			this.islands.push([]);
		}

		this.generateNextIsland();
	}

	generateNextIsland(regen) {
		this.advanceWithSpace(
			()=> {
				this.choseNextStartLocation(regen);
				this.advanceWithSpace(this.randomizedExpand.bind(this));
			}, true
		);
	}

	choseNextStartLocation(regen) {
		if (this.id && !regen) {
			this.islands[this.id].unshift(this.startX, this.startY);
		}
		
		if (this.debug && this.debug.visible) this.debug.highlight(this.posX, this.posY, 7);// post fix
		let attempt = 0;
		while (
			this.checkAjacentIslands(this.startX, this.startY, 3 - (attempt/33|0)) &&
			attempt < 99
		) {
			this.startY = this.rand(this.offset, this.height-this.offset);
			this.startX = this.rand(this.offset, this.width-this.offset);
			attempt ++;
			if (attempt == 99) {
				console.warn("start location "+this.startX+"x"+this.startY);
				//if (this.debug.visible) this.debug.highlight(this.posX, this.posY, 4);
			}
		};
		if (this.debug && attempt==99) console.warn("choseNextStartLocation", attempt);

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

	updateRelief(posX, posY, type = 1, inner = -1) {
		// map level topology - altitude on land, type of riff in water
		if (posX < 1 || posX > this.width-1 || posY < 1 || posY > this.height-1) return;
		if (inner) {
			this.relief[posY][posX] ++;
			if (type == 5) this.map[posY][posX] = this.id + 1;
		}
		if (this.debug && this.debug.visible) {
			if (this.debug.feedback) {
				type = this.debug.highlight(
					posX, posY, type,
					type == 5 && this.relief[posY][posX] > 1 && this.visited[posY][posX] ? 1 : null
				);
				type.children[1].innerHTML = inner > 0 ? inner.toString(16).toUpperCase() : this.relief[posY][posX];
			} else {
				type = this.debug.highlight(posX, posY, type == 5 ? 3 : type);
				type.children[1].innerHTML = inner > 0 ? inner.toString(16).toUpperCase() : "";
			}
		}
	}

	checkAjacentIslands(posX, posY, num = 3) {
		if (posX < this.offset/3 || posX > this.width - this.offset/3 || posY < this.offset/3 || posY > this.height - this.offset/3) {
			return true;
		}

		const abs = Math.abs;

		let directions = [];
		for (let dy = -num; dy <= num; dy++) {
			for (let dx = -num; dx <= num; dx++) {
				if (
					(abs(dy) <= 1 && abs(dx) <= 1) || 
					(abs(dy) === abs(dx) && abs(dy) < num) || 
					dy === 0 || 
					dx === 0 || 
					(abs(dy) === num && abs(dx) === 1) || 
					(abs(dy) === 1 && abs(dx) === num)
				) {
					directions.push([dy, dx]);
				}
			}
		}
		
		let check = directions.some(([dy, dx]) => {
			const y = posY + dy;
			const x = posX + dx;

			if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
				return true;
			}

			if (!this.relief[y][x]) {
				// mark that a water tile was checked
				this.updateRelief(x,  y, 3, 0);
			}
			return (this.relief[y][x] && num == 3 || this.map[y][x] && this.map[y][x] != this.id);

		}) || this.visited[posY][posX] ||
			this.visited[posY+1][posX] && this.map[posY+1][posX] != this.id ||
			this.visited[posY-1][posX] && this.map[posY-1][posX] != this.id ||
			this.visited[posY][posX+1] && this.map[posY][posX+1] != this.id ||
			this.visited[posY][posX-1] && this.map[posY][posX-1] != this.id;

		return check;
	}

	randomizeNextIsland() {
		if (!this.id) {
			this.islands[0] = [this.width, this.height, this.posX, this.posY, this.map, this.relief, this.visited];
		}

		this.id ++;
		while (this.islands[this.id].length) {
			if (this.debug && this.debug.feedback) console.log("skip #" + this.id, this.islands[this.id].length);
			this.id ++;
			if (this.id >= 14) {
				// if the last 13th island does not have to be regenerated, we have to resolve here
				if (this.debug && this.debug.feedback) console.log("Resolve after skip")
				this.resolve(this.islands);
				return;
			}
		}

		this.i = 0;
		this.n = 0;
		this.depth = this.rand(2 + this.id/9, 3 + this.id/9);
		this.amounts = this.rand(3 + this.id/9, 3 + this.id/6);
		this.posX = this.startX;
		this.posY = this.startY;

		this.updateRelief(this.startX, this.startY);
		this.visited[this.startY][this.startX] = 1;
		this.map[this.startY][this.startX] = this.id;

		if (this.debug && this.debug.feedback) console.log("new #"+this.id+" island will be at " + this.startX+"x"+this.startY, "depth:"+this.depth, "n:"+this.amounts)
	}

	advanceWithSpace(callback, passInteraction) {
		if (this.destroyed) return;
		this.callback = callback;

		// cursor highlight in yellow circle when generating an isle or orange square when chosing new isles
		if (this.debug && this.debug.visible) this.debug.highlight(this.posX, this.posY, this.n>0||this.i>0 ? 10 : this.id==1 ? 1 : 4);

		if (!this.debug || this.debug.instant || !this.debug.visible || passInteraction && this.debug.serrial) {
			callback();
		} else {
			const randomizePromise = new Promise(
				(resolve, reject) => {
					this.callback = resolve;
					document.addEventListener("keypress", this.keyPressListener);
				}
			);
	
			randomizePromise.then(() => {
				callback();
			});
		}
	}

	keyPressListener(evt) {
		if (evt.key == "?") {
			window.app.islandGenerator.debugInfo();
		} else {
			window.app.islandGenerator.advanceGeneration(window.app.islandGenerator.callback);
		}
	}

	debugInfo() {
		console.log(
			"map:\n"+this.map.map(arr => arr.map(num => num.toString(16).toUpperCase())).join("\n"),
			"\n\nrelief:\n"+this.relief.join("\n"), "\n\nvisited:\n"+this.visited.join("\n")
		);
	}

	randomizedExpand() {
		if (this.id >= 14) {
			if (this.debug && this.debug.feedback) console.log("Ensure resolve after skip");
			return;
		}

		if (this.debug && this.debug.visible) this.debug.highlight(this.posX, this.posY, 1);// previous highlight in green
		let dirX = 0;
		let dirY = 0;
		let attempt = 0;
		while(
			(
				this.posX + dirX < 3 || this.posX + dirX > this.width-3 ||
				this.posY + dirY < 3 || this.posY + dirY > this.height-3 ||
				this.visited[this.posY + dirY][this.posX + dirX] ||
				this.checkAjacentIslands(this.posX + dirX, this.posY + dirY, 3 - (attempt/66|0))// adjacent island adjustment
			) && attempt < 99
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
			attempt ++;
			if (attempt == 99) {
				this.i = this.depth;
				this.n = this.amounts;
				break;
			}
		};
		//if (this.debug && this.debug.feedback) console[attempt<99?"log":"warn"]("randomizedExpand", attempt);
		//if (attempt < 99) {
			this.posX += dirX;
			this.posY += dirY;
			//console.log("randomizedExpand", this.posX, this.posY, "x:"+dirX, "y:"+dirY, this.depth+"("+this.i+")", this.amounts+"("+this.n+")");
			this.visited[this.posY][this.posX] = 1;// switch if tile placed: 0 / 1
			this.map[this.posY][this.posX] = this.id;// will have to determine tile type as well
		//}

		this.islands[this.id].push([dirX, dirY]);

		this.i += 1;
		if (this.i >= this.depth) {
			this.n ++;
			this.i = 0;
			// add violet circle riffs at the end of each n itteration,
			// circle green at the last tile of an island (key) will be added later when generating new island.
			this.updateRelief(this.posX, this.posY, 9);
			if (this.n >= this.amounts) {
				// hilight isle id with squared yellow shape (town)
				this.updateRelief(this.startX, this.startY, this.id >= 13 ? 4 : 0, this.id);
				if (this.id >= 13) {
					// all islands generation done
					this.islands[this.id].unshift(this.startX, this.startY);// add the starting location
					this.resolve(this.islands);
				} else {
					this.generateNextIsland();
				}
				return;
			}
			
			this.posX = this.startX;
			this.posY = this.startY;
		} else {
			// increment and update the green relief data on each island tile we visit (adding land tiles)
			this.updateRelief(this.posX, this.posY, 1);
		}

		this.advanceWithSpace(this.randomizedExpand.bind(this), true);
	}

	advanceGeneration(callback) {
		document.removeEventListener("keypress", this.keyPressListener);
		callback();
	}

	initArray(_value = 0, _width, _height) {
		return new Array(_height || _width || this.height).fill().map(() => new Array(_width || this.width).fill(_value));
	}

	rand(min, max) {
		return (min + Math.random() * (1 + max - min)) | 0;
	}
}