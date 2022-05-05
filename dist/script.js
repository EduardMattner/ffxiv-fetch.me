const endpoint = 'https://universalis.app/api/v2';
const settings = document.querySelector('.settings');
const table = document.querySelector('.data-table');
const worldSelect = settings.querySelector('.world');
const retainerSelect = settings.querySelector('.retainer-type');
const retainerLevel = settings.querySelector('.retainer-level');
let tempData = {};

let theData = {};

function itemName(id) {
	return itemData[id].en;
}

function breakpoints(data) {
	let breakpoints = Object.entries(data);
	let amount = breakpoints[0][0];
	for (let i = 0; i < breakpoints.length; i++) {
		if (breakpoints[i][1] <= retainerLevel.value ) {
			amount = breakpoints[i][0];
		}
	}
	return amount;
}


function updateTable(rawData) {
	// TODO: not working right now, fix the stitching together. Or rework to have it work in parts again.
	let data = {
		itemIDs: [],
		items: {}
	};
	let html = '<tr><th>Item &#x21c5;</th><th>min Price &#x21c5;</th></th><th>Amounts &#x21c5;</th><th>Gil/Trip &#x21c5;</th></tr>';
	
	if (rawData.length) {
		for (var i = 0; i < rawData.length; i++) {
			data.itemIDs = data.itemIDs.concat(rawData[i].itemIDs);
			let objKeys = Object.keys(rawData[i].items);
			for (var q = 0; q < objKeys.length; q++) {
				data.items[objKeys[q]] = rawData[i].items[objKeys[q]];
			}
		}
	} 

	for (let i = Object.keys(data.itemIDs).length - 1; i >= 0; i--) {
		let id = Object.values(data.items)[i].itemID;
		let name = itemName(id);
		let minPrice = Object.values(data.items)[i].minPrice;
		let amount = breakpoints(itemData[id].breakpoints);
		let gilPerTrip = amount * minPrice;

		html += '<tr>';
			html += `<td><a href="https://universalis.app/market/${id}" target="_blank" rel="noopener">${name}</a></td>`;
			html += `<td>${minPrice}</td>`;
			html += `<td>${amount}</td>`;
			html += `<td>${gilPerTrip}</td>`;
		html += '</tr>';
	}
	table.innerHTML = html;
	sortCol();
}

async function fetchData() {
	let world = worldSelect.value;
	let retType = retainerSelect.value;
	let items = '';
	let result = [];
	switch(retType) {
		case "bot":
			items = botData;
			break;
		case "min":
			items = minData;
			break;
		case "fsh":
			items = fshData;
			break;
		case "hnt":
			items = hntData;
			break;
	}

	// only 100 items at a time are permitted from the API, so chop chop
	let itemsSlice = [];
	for (var i = 0; i < Math.ceil(items.length / 100); i++) {
		itemsSlice[i] = items.slice(i * 100, (i+1) * 100);
		itemsSlice[i] = itemsSlice[i].join(',');
	}

	for (var i = 0; i < itemsSlice.length; i++) {
		await fetch(`${endpoint}/${world}/${itemsSlice[i]}/`)
		.then(resp => resp.json())
		.then(data => result.push(data))
		.catch(err => console.log(err));
	}
	// theData = data;
	updateTable(result);
}

function sortCol() {
	const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

	const comparer = (idx, asc) => (a, b) => ((v1, v2) => 
	    v1 !== '' && v2 !== '' && !isNaN(v1) && !isNaN(v2) ? v1 - v2 : v1.toString().localeCompare(v2)
	    )(getCellValue(asc ? a : b, idx), getCellValue(asc ? b : a, idx));

	// do the work...
	document.querySelectorAll('th').forEach(th => th.addEventListener('click', (() => {
	    const table = th.closest('table');
	    Array.from(table.querySelectorAll('tr:nth-child(n+2)'))
	        .sort(comparer(Array.from(th.parentNode.children).indexOf(th), this.asc = !this.asc))
	        .forEach(tr => table.appendChild(tr) );
	})));
}

settings.querySelector('.fetch').addEventListener('click', (e) => {
	e.preventDefault();
	updateLocalSave();
	fetchData();
});

function updateLocalSave() {
	let saveState = {
		world: worldSelect.value,
		rType: retainerSelect.value,
		rLevel: retainerLevel.value
	}

	localStorage.setItem('ffFetchSave', JSON.stringify(saveState));
}
// hookup the onchange event for saving state
Array.from(settings.querySelectorAll('label > *')).map(el => el.addEventListener('click', updateLocalSave));

function loadLocalSave() {
	let loadState = JSON.parse(localStorage.getItem('ffFetchSave'));

	worldSelect.value = loadState.world;
	retainerSelect.value = loadState.rType;
	retainerLevel.value = loadState.rLevel;
}

if(localStorage.getItem('ffFetchSave')) {
	loadLocalSave();
}