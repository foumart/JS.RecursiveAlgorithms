var app;

window.addEventListener('load', () => {
	app = new App();
});

class App {
	constructor() {
		this.debug = document.getElementById("debug")
		if (this.debug) this.debug.highlight = this.highlight;
		if (this.debug) this.debug.instant = this.debug.hasAttribute('instant');
		if (this.debug) this.debug.serrial = this.debug.hasAttribute('serrial');
		if (this.debug) this.debug.feedback = this.debug.hasAttribute('feedback');
		if (this.debug) this.debug.visible = (this.debug.style.visibility != "hidden" && this.debug.style.display != "none");

		if (this.debug && this.debug.visible) this.debug.innerHTML = '';

		if (this.debug && this.debug.visible) document.addEventListener("DebugClick", this.onDebugClick.bind(this));

		this.width = 32;
		this.height = 32;
		this.type = 1;

		// initialize debug display
		if (this.debug && this.debug.visible) this.initializeNodeList();

		// init map generator
		this.islandGenerator = new IslandGenerator(this, this.width, this.height, {
			type: this.type,
			debug: this.debug,
			startX: this.width/2|0,
			startY: this.height/2|0
		}, this.mapGenerated);
	}

    mapGenerated(islands) {
		/* islandGenerator scope */
		let map = `${this.startY} ${this.startX}\n${this.posY} ${this.posX}\n${this.height} ${this.width}\n`;
		this.map.forEach((mapRow, index) => {
			mapRow.forEach(mapCell => {
				map += mapCell.toString(16) + '';
			});
			if (index < this.height - 1) map += '\n';
		});

		//if (this.debug && this.debug.feedback) {
			console.log(map);
			console.log("elapsed: " + (performance.now() - this.startTime) + " milliseconds");
			console.log("map "+islands[0][0]+"x"+islands[0][1]+" generated, starting position: "+islands[0][2]+"x"+islands[0][3]);
			console.log("map:\n"+islands[0][4].map(arr => arr.map(num => num.toString(16).toUpperCase())).join("\n"), "\n\nrelief:\n"+islands[0][5].join("\n"), "\n\nvisited:\n"+islands[0][6].join("\n"));
		//}

		if (this.debug && this.debug.visible) this.debug.lastChild.innerHTML =
			`press <a href="#" onClick="(function(){this.app.generateNext()})()">[SPACE]</a> to generate new map, <a href="#" onClick="(function(){this.app.islandGenerator.debugInfo()})()">[?]</a> for info`;

		if (!this.debug || !this.debug.visible) {
			this.main.generateNext();
		} else {
			const randomizePromise = new Promise((resolve, reject) => {
				this.callback = resolve;
				document.addEventListener("keypress", this.keyPressListener);
			});
	
			randomizePromise.then(() => this.main.generateNext());
		}
	}

	generateNext() {
		if (this.debug && this.debug.visible) {
			if (this.debug.feedback) console.log("generate next map");
			this.islandGenerator.destroy();
			this.debug.innerHTML = '';
			app = new App();
		} else {
			// it needs a timeout to get the reference of islandGenerator,
			// for convenience the islands data is available in caller mapGenerated.
			//setTimeout(()=>{console.log(this.islandGenerator.islands);}, 1);
		}
	}

	// debug click functions
	onDebugClick(event) {
		let x = event.detail.x;
		let y = event.detail.y;
		console.log(`onDebugClick (${x}x${y}) visited:${this.islandGenerator.visited[y][x]} relief:${this.islandGenerator.relief[y][x]} map:${this.islandGenerator.map[y][x]}`);
	}

	// sets a tile to a certain color
	// colors -1: black, 0: yellow, 1: green, 2: red, 3: blue, 4: orange
	highlight(posX, posY, type = 0) {
		const frame = document.getElementById(`debug_${posX}x${posY}`);
		frame.style.opacity = type != 3 ? type == 5 || type == 7 || type == 9 ? type == 5 ? 0.5 : 0.7 : 1 : 0.4;
		frame.style.backgroundColor = type == 1 || !type ? "seagreen" : type > 4 ? "mediumslateblue" : "blue";
		if (type > -1) frame.firstChild.innerHTML = String.fromCodePoint(
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
			128307 // white thick bordered black square
		);
		return frame;
	}

	initializeNodeList() {
		// initialize new empty map
		this.map = [];
		for (let y = 0; y < this.height; y++) {
			let tmp = [];
			for (let x = 0; x < this.width; x++) {
				tmp.push([]);
			}
			this.map.push(tmp);
		}

		const nodeList = [];

		for(let y = 0; y < this.map.length; y++) {
			let tmpArr = [];
			for(let x = 0; x < (this.map[0].length % 2 ? this.map[0].length : this.map[0].length + 1); x++) {
				tmpArr.push(this.map[y][x]);
			}
			nodeList.push(tmpArr);
		}

		if (this.debug) {
			let _height = (this.map.length % 2 ? this.map.length : this.map.length + 1);
			let _width = (this.map[0].length % 2 ? this.map[0].length : this.map[0].length + 1);
			for(let y = 0; y < _height; y++) {
				let debugHtml = '';
				for(let x = 0; x < _width; x++) {
					let char = String.fromCodePoint(128998);// default water blue tiles
					let click = `onclick='document.dispatchEvent(new CustomEvent("DebugClick",{"detail":{"x":${x},"y":${y}}}))'`;
					let transparent = true;
					debugHtml += `<div style="${x == _width-1 ? 'pointer-events:none;' : 'float:left;background-color:blue;'}${transparent?'opacity:0.25':''}" id="debug_${x}x${y}" ${click}><div>${char}</div><div style="position:absolute;margin-top:-19px;margin-left:6px">${x&&y&&x<this.width&&y<this.height?"&#9675;":""}</div></div>`;
				}
				this.debug.innerHTML += debugHtml;
			}
		}

		this.debug.innerHTML += '<span>press <a href="#" onClick="(function(){this.app.islandGenerator.callback()})()">[SPACE]</a> to advance, <a href="#" onClick="(function(){this.app.islandGenerator.debugInfo()})()">[?]</a> for info</span>';

		return nodeList;
	}
}
