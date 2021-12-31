let nodesList;

let currentPath;

let openList;
let closedList;

let _debug;

let _node;
let _nodeX;
let _nodeY;

let width;
let height;

// starts the recursive function getNextNodes until every tile is populated into the closed list
function getPath(_nodeList, _posX, _posY, _destX, _destY, _resolve, _dbg) {
	nodesList = _nodeList;
	_debug = _dbg;
	
	currentPath = [];
	openList = [];
	closedList = [];

	closedList.push({F:0, G:0, H:0, X:_posX, Y:_posY, _x:null, _y:null});

	stepForward(_posX, _posY, _destX, _destY);
	if (_debug) _debug.highlight(_posX, _posY, 5);
	if (_debug) _debug.highlight(_destX, _destY, 4);

	if (!openList.length) {
		currentPath = null;
	} else {
		_node = 1;
		_nodeX = _destX;
		_nodeY = _destY;
		if (!_debug || _debug.instant) getNextOpenNodes(_resolve);
	}
}

function stepForward(_posX, _posY, _destX, _destY) {
	if (_posY && nodesList[_posY - 1][_posX]) getNode(1, _posX, _posY, _destX, _destY);
	if (_posY && nodesList[_posY][_posX - 1]) getNode(2, _posX, _posY, _destX, _destY);
	if (_posX < width-1 && nodesList[_posY][_posX + 1]) getNode(3, _posX, _posY, _destX, _destY);
	if (_posY < height-1 && nodesList[_posY + 1][_posX]) getNode(4, _posX, _posY, _destX, _destY);
	if (_debug) _debug.highlight(_posX, _posY, _destX != _posX || _destY != _posY ? 0 : 2);

	sortOpenList();
}

function sortOpenList() {
	openList.sort(sortList);
}

function sortList(a, b) {
	const dbg = _debug.longest;
	return parseFloat(_debug.longest ? a.F : b.F) - parseFloat(_debug.longest ? b.F : a.F);
}

function getNode(pos, posx, posy, destx, desty) {
	let x = posx;
	let y = posy;
	let d = 1;
	switch(pos){
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
	
	if (!pos) {
		sortOpenList();
		closedList.push(openList.splice(openList.length-1, 1)[0]);
		if (_debug) _debug.highlight(x, y, 4);
	} else {
		let checkOpened = checkOpenList(x, y);
		let checkClosed = checkClosedList(x, y);
		if (checkOpened == -1 && checkClosed == -1) {
			const distX = (destx > x) ? destx-x : x-destx;
			const distY = (desty > y) ? desty-y : y-desty;
			const dist = (distX + distY) * 10; // Manhathan estimation method
			const node_g = 10;
			if (node_g > 0) {
				let _g = node_g;
				let _crnt;
				while(_crnt == null) {
					for(let i = 0; i < openList.length; i++) {
						if (posx == openList[i].X && posy == openList[i].Y) {
							_crnt = openList[i];
							_g += _crnt.G*d;
						}
					}
					for(let j = 0; j < closedList.length; j++) {
						if (posx == closedList[j].X && posy == closedList[j].Y) {
							_crnt = closedList[j];
							_g += _crnt.G*d;
						}
					}
					if (_crnt == null) {
						break;
					}
				}
				openList.push({F:_g+dist, G:_g, H:dist, X:x, Y:y, _x:posx, _y:posy});
				if (_debug) _debug.highlight(x, y, 6);
			} else {
				closedList.push({F:0, G:0, H:0, X:x, Y:y, _x:null, _y:null});
				if (_debug) _debug.highlight(x, y, 4);
			}
		}
	}
}

function getNextNodes(_posX, _posY, _destX, _destY, _resolve) {
	let i;
	const chk = checkClosedList(_destX, _destY);
	const stillOpen = openList.length;
	if (chk > -1 && !stillOpen) {
		let _crnt = closedList[chk];
		currentPath.push({x:_destX, y:_destY});

		while (_crnt) {
			for(i = 0; i < closedList.length; i++) {
				if (_crnt._x == closedList[i].X && _crnt._y == closedList[i].Y) {
					_crnt = closedList[i];
					currentPath.push({x:_crnt.X, y:_crnt.Y});
				}
			}
			if (_crnt._x == null && _crnt._y == null) {
				_crnt = null;
			}
		}

		_resolve(currentPath);
	} else {
		getNode(0, _posX, _posY, _destX, _destY);
		
		stepForward(_posX, _posY, _destX, _destY);
		
		if (openList.length > 0) {
			_node = 1;
			_nodeX = _destX;
			_nodeY = _destY;
			if (!_debug || _debug.instant) getNextOpenNodes(_resolve);
		} else {
			if (checkClosedList(_destX, _destY) > -1) {
				_node = 2;
				_nodeX = _destX;
				_nodeY = _destY;
				if (!_debug || _debug.instant) getNextRelativeNodes(_resolve);
			} else {
				currentPath = null;
			}
		}
	}
}

function getNextOpenNodes(_resolve) {
	getNextNodes(openList[openList.length-1].X, openList[openList.length-1].Y, _nodeX, _nodeY, _resolve);
}

function getNextRelativeNodes(_resolve) {
	getNextNodes(null, null, _nodeX, _nodeY, _resolve);
}

function advanceNodes(_resolve) {
	if (_node == 1) {
		_node = 0;
		getNextOpenNodes(_resolve);
	} else if (_node == 2) {
		_node = 0;
		getNextRelativeNodes(_resolve);
	}
}

function checkOpenList(checkX, checkY) {
	let check = -1;
	for(let i = 0; i < openList.length; i++) {
		if (checkX == openList[i].X && checkY == openList[i].Y) {
			check = i;
		}
	}
	return check;
}

function checkClosedList(checkX, checkY) {
	let check = -1;
	for(let i = 0; i < closedList.length; i++) {
		if (checkX == closedList[i].X && checkY == closedList[i].Y) {
			check = i;
		}
	}
	return check;
}