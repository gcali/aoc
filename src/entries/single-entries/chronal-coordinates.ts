import { entryForFile } from "../entry";
import { Coordinate, sumCoordinate } from "../../support/geometry";
import Best, { SimpleBest, CustomBest, maxNumber } from "../../support/best";
import { FixedSizeMatrix } from "../../support/matrix";
import { Queue } from "../../support/data-structure";
import * as Jimp from "jimp";

interface Territory {
	coordinate: Coordinate,
	id: number,
	distance: number
}

const entry = entryForFile(
	lines => {
		let points: Coordinate[] = parsePoints(lines);

		let { minX, minY, size } = getBoundaries(points);

		points = points.map(p => {
			return {
				x: p.x - minX.currentBest,
				y: p.y - minY.currentBest
			};
		});

		let grid = new FixedSizeMatrix<Territory>(size);

		let queue = new Queue<Territory>();
		let territoryPoints = points.map((p, index) => {
			return {
				coordinate: p,
				distance: 0,
				id: index + 1
			};
		});
		territoryPoints.forEach(p => {
			grid.set(p.coordinate, p);
			queue.add(p);
		});

		let offsets = (() => {
			let numberOffsets = [1, 0, -1];
			return numberOffsets.map(i => numberOffsets.map(j => i === j || (i !== 0 && j !== 0) ? null : {
				x: i,
				y: j
			}).filter(l => l)).reduce((acc, curr) => acc.concat(curr));
		})();
		if (offsets.length !== 4) {
			throw Error("What happened to the offsets?");
		}
		let imgCreator = (id: number, grid: FixedSizeMatrix<Territory>) => {
			let colors = [
				0xe57373, 0x662e1a, 0xcc8166, 0xe55c00, 0xd98d36, 0xe6cbac, 0x734d00, 0xffcc00, 0x332b0d, 0x8c8569, 0xfff780, 0x778000, 0xccff00, 0x416633, 0x19bf00, 0xb4e6ac, 0x1a3320, 0x29a65b, 0x40ffbf, 0x005953, 0x39e6da, 0x698a8c, 0x00ccff, 0xbfeaff, 0x006dcc, 0x13324d, 0x537fa6, 0x80b3ff, 0x000c59, 0x0000f2, 0x0000b3, 0x0000a6, 0x9173e6, 0xd0bfff, 0x686080, 0x36264d, 0xa640ff, 0x6c2080, 0x330030, 0xe600b8, 0x40303d, 0x994d80, 0xffbfea, 0xa60042, 0x40001a, 0xff408c, 0xbf8f9c, 0xd9001d, 0x66000e, 0x7f4048
			];
			new Jimp(size.x, size.y, (err, img) => {
				for (let i = 0; i < size.x; i++) {
					for (let j = 0; j < size.y; j++) {
						let status = grid.get({
							x: i,
							y: j
						});
						if (!status) {
							img.setPixelColor(0xff0000ff, i, j);
						}
						else if (!status.id) {
							img.setPixelColor(0xffff00FF, i, j);
						}
						else {
							img.setPixelColor(colors[status.id] << 2 | 0xFF, i, j);
						}
					}
				}
				img.write(`test${id}.png`);
			});
		};

		while (!queue.isEmpty) {
			let nextElement = queue.get();
			offsets.forEach(offset => {
				let newCoordinate = sumCoordinate(nextElement.coordinate, offset)
				if (newCoordinate.x >= 0 && newCoordinate.y >= 0
					&& newCoordinate.x < size.x && newCoordinate.y < size.y) {

					let newDistance = nextElement.distance + 1;
					let gridStatus = grid.get(newCoordinate);
					if (!gridStatus) {
						let newElement = {
							coordinate: newCoordinate,
							distance: newDistance,
							id: nextElement.id
						};
						grid.set(newCoordinate, newElement);
						queue.add(newElement)
					}
					else if (gridStatus.distance === newDistance && gridStatus.id !== nextElement.id) {
						let newElement: Territory = {
							id: null,
							coordinate: newCoordinate,
							distance: newDistance
						};
						grid.set(newCoordinate, newElement);
						queue.add(newElement)
					}
				}
			});
		}


		imgCreator(0, grid);
		let currentCount: { [key: number]: number } = {};
		for (let i = 0; i < size.x; i++) {
			for (let j = 0; j < size.y; j++) {
				let status = grid.get({
					x: i,
					y: j
				});
				if (status === undefined) {
					console.log("" + i + " " + j);
				}
				else if (!status.id) {
					continue;
				}
				else if (status.coordinate.x === 0 || status.coordinate.y === 0
					|| status.coordinate.x === size.x - 1 || status.coordinate.y == size.y - 1) {
					currentCount[status.id] = 0;
				}
				else {
					if (!(status.id in currentCount)) {
						currentCount[status.id] = 1;
					}
					else if (currentCount[status.id] !== 0) {
						currentCount[status.id]++;
					}
				}
			}
		}

		let bestArea = new SimpleBest<number>(maxNumber);
		for (let key in currentCount) {
			bestArea.add(currentCount[parseInt(key)]);
		}
		console.log(bestArea.currentBest);



	},
	lines => {
		function manhattan(a: Coordinate, b: Coordinate) {
			return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
		}
		let points = parsePoints(lines);
		let { minX, minY, size } = getBoundaries(points);
		let maxDistance = 10000;
		let count = 0;
		for (let i = 0; i < size.x; i++) {
			for (let j = 0; j < size.y; j++) {
				let distanceSum = points.map(p => manhattan(p, {
					x: i + minX.currentBest,
					y: j + minY.currentBest
				})).reduce((acc, curr) => acc + curr);
				if (distanceSum < maxDistance) {
					count++;
				}
			}
		}
		console.log(count);
	}
);

export default entry;

function getBoundaries(points: Coordinate[]) {
	let minComparator = (a: number, b: number) => b - a;
	let maxComparator = (a: number, b: number) => a - b;
	let minX = new SimpleBest<number>(minComparator);
	let maxX = new SimpleBest<number>(maxComparator);
	let minY = new SimpleBest<number>(minComparator);
	let maxY = new SimpleBest<number>(maxComparator);
	points.forEach(p => {
		minX.add(p.x);
		maxX.add(p.x);
		minY.add(p.y);
		maxY.add(p.y);
	});
	let size = {
		x: (maxX.currentBest - minX.currentBest + 1),
		y: (maxY.currentBest - minY.currentBest + 1)
	};
	return { minX, minY, size };
}

function parsePoints(lines: string[]): Coordinate[] {
	return lines.map(l => l.replace(/ /g, "").split(",")).map(couple => {
		return {
			x: parseInt(couple[0]),
			y: parseInt(couple[1])
		};
	});
}
