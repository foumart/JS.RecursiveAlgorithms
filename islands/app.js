var app;

window.addEventListener('load', () => {
	app = new App();
});

class App {
	constructor() {
		this.debug = document.getElementById("debug")
		const debug =  this.debug != null;
		if (debug) this.debug.highlight = this.highlight;
		if (debug) this.debug.instant = this.debug.hasAttribute('instant');
		if (debug) this.debug.visible = this.debug.hasAttribute('visible') ? false : !debug.instant;

		if (debug) this.debug.innerHTML = '';

		if (debug) document.addEventListener("DebugClick", this.onDebugClick);

		this.width = 32;
		this.height = 32;
		this.type = 1;
		this.generateMap(this.width, this.height, this.type, debug);
	}

	generateNext() {
		console.log("generate next map");
		this.islandGenerator.destroy();
		this.debug.innerHTML = '';
		app = new App();
	}

	generateMap(width, height, type, debug) {
		this.width = width;
		this.height = height;

		// initialize new empty map
		this.map = [];
		for (let y = 0; y < this.height; y++) {
			let tmp = [];
			for (let x = 0; x < this.width; x++) {
				tmp.push(0);
			}
			this.map.push(tmp);
		}
		this.initializeNodeList(this.map, debug);

		// init map generator
		this.islandGenerator = new IslandGenerator(this, this.width, this.height, {
			type: type,
			debug: this.debug,
			startX: this.width/2|0,
			startY: this.height/2|0
		}, this.mapGenerated);
        window.island = this.islandGenerator;
	}

    mapGenerated() {
		let map = `${this.startY} ${this.startX}\n${this.posY} ${this.posX}\n${this.height} ${this.width}\n`;
		this.map.forEach((mapRow, index) => {
			mapRow.forEach(mapCell => {
				map += mapCell.toString(16) + '';
			});
			if (index < this.height - 1) map += '\n';
		});

		console.log(map);

		if (!this.debug) {
			this.main.generateNext();
		} else {
			const randomizePromise = new Promise((resolve, reject) => {
				document.addEventListener("keypress", this.advanceGeneration.bind(this, resolve));
			});
	
			randomizePromise.then(() => {
				this.main.generateNext();
			});
		}
	}

	// debug click functions
	onDebugClick(event) {
		let x = event.detail.x;
		let y = event.detail.y;
		console.log(`onDebugClick (${x}x${y})`);
	}

	// sets a tile to a certain color
	// colors -1: black, 0: yellow, 1: green, 2: red, 3: blue, 4: orange
	highlight(posX, posY, type) {
		const frame = document.getElementById(`debug_${posX}x${posY}`);
		frame.style.opacity = 1;
		frame.firstChild.innerHTML = String.fromCodePoint(
			type == 0 ? 129000 : // 🟨 yellow
			type == 1 ? 129001 : // 🟩 green
			type == 2 ? 128997 : // 🟥 red
			type == 3 ? 128998 : // 🟦 blue
			type == 4 ? 128999 : // 🟧 orange
			type == 5 ? 129002 : // 🟪 violet
			type == 6 ? 129003 : // 🟫 brawn
			type == 7 ? 128994 : // 🟢 green circle
			type == 8 ? 128996 : // 🟤 brown circle
			type == 9 ? 128995 : // 🟣 violet circle
			type == 10 ? 128993 : // 🟡 yellow circle
			type == 11 ? 128992 : // 🟠 orange circle
			type == 12 ? 11036 : // white square
			type == 13 ? 11035 : // black square
			type == 14 ? 128306 : // black thick bordered white square
			type == 15 ? 128307 : // white thick bordered black square
			129000 // yellow
		);
		return frame;
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
					let char = String.fromCodePoint(128998);
					let click = `onclick='document.dispatchEvent(new CustomEvent("DebugClick",{"detail":{"x":${x},"y":${y}}}))'`;
					let transparent = true;
					debugHtml += `<div style="${x == _width-1 ? '' : 'float:left;'}${transparent?'opacity:0.5':''}" id="debug_${x}x${y}" ${click}><div>${char}</div><div style="position:absolute;margin-top:-19px;margin-left:6px"></div></div>`;
				}
				this.debug.innerHTML += debugHtml;
			}
		}

		this.debug.innerHTML += "press SPACE to advance";

		return nodeList;
	}
}
