const endpoint = 'https://universalis.app/api/v2';
const settings = document.querySelector('.settings');
const table = document.querySelector('.data-table');
const worldSelect = settings.querySelector('.world');
const retainerSelect = settings.querySelector('.retainer-type');
const retainerLevel = settings.querySelector('.retainer-level');

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

function updateTable(data) {
	// console.log(data);
	let html = '<tr><th>Item &#x21c5;</th><th>min Price &#x21c5;</th></th><th>Amounts &#x21c5;</th><th>Gil/Trip &#x21c5;</th></tr>';
	for (let i = Object.keys(data.itemIDs).length - 1; i >= 0; i--) {
		let id = Object.values(data.items)[i].itemID;
		let name = itemName(id);
		let minPrice = Object.values(data.items)[i].minPrice;
		let amount = breakpoints(itemData[id].breakpoints);
		let gilPerTrip = amount * minPrice;

		html += '<tr>';
			html += `<td>${name}</td>`;
			html += `<td>${minPrice}</td>`;
			html += `<td>${amount}</td>`;
			html += `<td>${gilPerTrip}</td>`;
		html += '</tr>';
		// console.log(Object.values(data.items)[i]);
	}
	table.innerHTML = html;
	sortCol();
}

function fetchData() {
	let world = worldSelect.value;
	let retType = retainerSelect.value;
	let items = '';
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
	items = items.join(',');

	fetch(`${endpoint}/${world}/${items}/`)
	.then(resp => resp.json())
	.then(data => {
		// theData = data;
		updateTable(data);
	})
	.catch(err => console.log(err));
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