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
            this.completed(data);
		} else {
			this.width = 32;
			this.height = 32;
			this.type = 1;
			this.generateMap(this.width, this.height, this.type);
		}
	}

    completed(data) {
        console.log(data);
    }

	generateMap(width, height, type) {
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
		this.initializeNodeList(this.map);

		// init map generator
		this.islandGenerator = new IslandGenerator(this.width, this.height, {
			type: type,
			debug: this.debug,
			startX: this.width/2|0,
			startY: this.height/2|0
		}, this.mapGenerated.bind(this));
        window.island = this.islandGenerator;
	}

    mapGenerated() {
		//this.islandGenerator.destroy();
		//this.debug.innerHTML = '';
		let map = `${this.islandGenerator.startY} ${this.islandGenerator.startX}\n${this.islandGenerator.posY} ${this.islandGenerator.posX}\n${this.height} ${this.width}\n`;
		this.islandGenerator.map.forEach((mapRow, index) => {
			mapRow.forEach(mapCell => {
				map += mapCell.toString(16) + '';
			});
			if (index < this.height - 1) map += '\n';
		});

		this.completed(map);
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
			type == -1 ? 11035 : // black box
			type == 1 ? 129001 : // green
			type == 2 ? 128997 : // red
			type == 3 ? 128998 : // blue
			type == 4 ? 128999 : // orange
			type == 5 ? 129002 : // violet
			type == 6 ? 129003 : // brawn
			type == 7 ? 128994 : // green circle
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
					let transparent = debug && (x && x < _width-1 && y && y < _height-1);
					debugHtml += `<div style="${x == _width-1 ? '' : 'float:left;'}${transparent?'opacity:0.5':''}" id="debug_${x}x${y}" ${click}><div>${char}</div><div style="position:absolute;margin-top:-19px;margin-left:6px"></div></div>`;
				}
				this.debug.innerHTML += debugHtml;
			}
		}

		this.debug.innerHTML += "press SPACE to advance";

		return nodeList;
	}
}
