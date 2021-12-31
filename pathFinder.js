class PathFinder {

	constructor(_debug) {
		this.debug = _debug;
		this._node = 0;
		this._nodeX = 0;
		this._nodeY = 0;
	}

	// starts the recursive function getNextNodes until every tile is populated into the closed list
	getPath(_nodeList, _posX, _posY, _destX, _destY, _resolve) {
		this.nodesList = _nodeList;
		
		this.currentPath = [];
		this.openList = [];
		this.closedList = [];

		this.height = this.nodesList.length;
		this.width = this.nodesList[0].length;

		this.closedList.push({F:0, G:0, H:0, X:_posX, Y:_posY, _x:null, _y:null});

		this.stepForward(_posX, _posY, _destX, _destY);
		if (this.debug) this.debug.highlight(_posX, _posY, 5);
		if (this.debug) this.debug.highlight(_destX, _destY, 4);

		if (!this.openList.length) {
			this.currentPath = null;
		} else {
			this._node = 1;
			this._nodeX = _destX;
			this._nodeY = _destY;
			if (!this.debug || this.debug.instant) {
				this.getNextOpenNodes(_resolve);
			}
		}
	}

	stepForward(_posX, _posY, _destX, _destY) {
		if (_posY && this.nodesList[_posY - 1][_posX]) this.getNode(1, _posX, _posY, _destX, _destY);
		if (_posY && this.nodesList[_posY][_posX - 1]) this.getNode(2, _posX, _posY, _destX, _destY);
		if (_posX < this.width-1 && this.nodesList[_posY][_posX + 1]) this.getNode(3, _posX, _posY, _destX, _destY);
		if (_posY < this.height-1 && this.nodesList[_posY + 1][_posX]) this.getNode(4, _posX, _posY, _destX, _destY);
		if (this.debug) this.debug.highlight(_posX, _posY, _destX != _posX || _destY != _posY ? 0 : 2);

		this.sortOpenList();
	}

	sortOpenList() {
		this.openList.sort(this.sortList.bind(this));
	}

	sortList(a, b) {
		const longest = this.debug && this.debug.longest;
		return parseFloat(longest ? a.F : b.F) - parseFloat(longest ? b.F : a.F);
	}

	getNode(dir, posx, posy, destx, desty) {
		let x = posx;
		let y = posy;
		let d = 1;
		switch(dir){
			case 0:
				break;
			case 1:
				y-=1;
				break;
			case 2:
				x-=1;
				break;
			case 3:
				x+=1;
				break;
			case 4:
				y+=1;
				break;
		}
		
		if (!dir) {
			this.sortOpenList();
			this.closedList.push(this.openList.splice(this.openList.length-1, 1)[0]);
			if (this.debug) this.debug.highlight(x, y, 4);
		} else {
			let checkOpened = this.checkOpenList(x, y);
			let checkClosed = this.checkClosedList(x, y);
			if (checkOpened == -1 && checkClosed == -1) {
				const distX = (destx > x) ? destx-x : x-destx;
				const distY = (desty > y) ? desty-y : y-desty;
				const dist = (distX + distY) * 10; // Manhathan estimation method
				const node_g = 10;
				if (node_g > 0) {
					let _g = node_g;
					let _crnt;
					while(_crnt == null) {
						for(let i = 0; i < this.openList.length; i++) {
							if (posx == this.openList[i].X && posy == this.openList[i].Y) {
								_crnt = this.openList[i];
								_g += _crnt.G*d;
							}
						}
						for(let j = 0; j < this.closedList.length; j++) {
							if (posx == this.closedList[j].X && posy == this.closedList[j].Y) {
								_crnt = this.closedList[j];
								_g += _crnt.G*d;
							}
						}
						if (_crnt == null) {
							break;
						}
					}
					this.openList.push({F:_g+dist, G:_g, H:dist, X:x, Y:y, _x:posx, _y:posy});
					if (this.debug) this.debug.highlight(x, y, 6);
				} else {
					this.closedList.push({F:0, G:0, H:0, X:x, Y:y, _x:null, _y:null});
					if (this.debug) this.debug.highlight(x, y, 4);
				}
			}
		}
	}

	getNextNodes(_posX, _posY, _destX, _destY, _resolve) {
		let i;
		const chk = this.checkClosedList(_destX, _destY);
		const stillOpen = this.openList.length;
		if (chk > -1 && !stillOpen) {
			let _crnt = this.closedList[chk];
			this.currentPath.push({x:_destX, y:_destY});

			while (_crnt) {
				for(i = 0; i < this.closedList.length; i++) {
					if (_crnt._x == this.closedList[i].X && _crnt._y == this.closedList[i].Y) {
						_crnt = this.closedList[i];
						this.currentPath.push({x:_crnt.X, y:_crnt.Y});
					}
				}
				if (_crnt._x == null && _crnt._y == null) {
					_crnt = null;
				}
			}

			_resolve(this.currentPath);
		} else {
			this.getNode(0, _posX, _posY, _destX, _destY);
			
			this.stepForward(_posX, _posY, _destX, _destY);
			
			if (this.openList.length > 0) {
				this._node = 1;
				this._nodeX = _destX;
				this._nodeY = _destY;
				if (!this.debug || this.debug.instant) {
					this.getNextOpenNodes(_resolve);
				}
			} else {
				if (this.checkClosedList(_destX, _destY) > -1) {
					this._node = 2;
					this._nodeX = _destX;
					this._nodeY = _destY;
					if (!this.debug || this.debug.instant) {
						this.getNextRelativeNodes(_resolve);
					}
				} else {
					this.currentPath = null;
				}
			}
		}
	}

	getNextOpenNodes(_resolve) {
		this.getNextNodes(this.openList[this.openList.length-1].X, this.openList[this.openList.length-1].Y, this._nodeX, this._nodeY, _resolve);
	}

	getNextRelativeNodes(_resolve) {
		this.getNextNodes(null, null, this._nodeX, this._nodeY, _resolve);
	}

	advanceNodes(_resolve) {
		if (this._node == 1) {
			this._node = 0;
			this.getNextOpenNodes(_resolve);
		} else if (this._node == 2) {
			this._node = 0;
			this.getNextRelativeNodes(_resolve);
		}
	}

	checkOpenList(checkX, checkY) {
		let check = -1;
		for(let i = 0; i < this.openList.length; i++) {
			if (checkX == this.openList[i].X && checkY == this.openList[i].Y) {
				check = i;
			}
		}
		return check;
	}

	checkClosedList(checkX, checkY) {
		let check = -1;
		for(let i = 0; i < this.closedList.length; i++) {
			if (checkX == this.closedList[i].X && checkY == this.closedList[i].Y) {
				check = i;
			}
		}
		return check;
	}

}
