const body = document.querySelector('body');
const endpoint = 'https://universalis.app/api/v2';
const settings = document.querySelector('.settings');
const table = document.querySelector('.data-table');
const langSelect = settings.querySelector('.language');
const worldSelect = settings.querySelector('.world');
const retainerSelect = settings.querySelector('.retainer-type');
const retainerStatLabel = settings.querySelector('.retainer-stat-label');
const retainerLevel = settings.querySelector('.retainer-level');

function itemName(id) {
	return itemData[id][langSelect.value];
}

function itemLvl(id) {
	return itemData[id].level;
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
	let tableData = {
		itemIDs: [],
		items: {}
	};
	let html = '<tr class="sticky top-0 bg-gray-800"><th>Lvl &#x21c5;</th><th>Item &#x21c5;</th><th>min Price &#x21c5;</th></th><th>Amounts &#x21c5;</th><th>Gil/Trip &#x21c5;</th></tr>';
	
	for (var i = 0; i < rawData.length; i++) {
		tableData.itemIDs = tableData.itemIDs.concat(rawData[i].itemIDs);
		let objKeys = Object.keys(rawData[i].items);
		for (var q = 0; q < objKeys.length; q++) {
			tableData.items[objKeys[q]] = rawData[i].items[objKeys[q]];
		}
	}

	for (let i = 0; i < Object.keys(tableData.items).length; i++) {
		let id = Object.values(tableData.items)[i].itemID;
		let lvl = itemLvl(id);
		let name = itemName(id);
		let minPrice = Object.values(tableData.items)[i].minPrice;
		let amount = breakpoints(itemData[id].breakpoints);
		let gilPerTrip = amount * minPrice;

		html += '<tr>';
			html += `<td>${lvl}</td>`
			html += `<td><a href="https://universalis.app/market/${id}" target="_blank" rel="noopener">${name}</a></td>`;
			html += `<td>${minPrice}</td>`;
			html += `<td>${amount}</td>`;
			html += `<td>${gilPerTrip}</td>`;
		html += '</tr>';
	}

	// populate table
	table.innerHTML = html;
	// apply sorting funcionality
	sortCol();
	// sort by gil/trip column Desc
	document.querySelector('table th:last-of-type').click();
}

async function fetchData() {
	body.classList.add('loading');
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
	const itemsSlice = [];
	for (var i = 0; i < Math.ceil(items.length / 100); i++) {
		itemsSlice[i] = items.slice(i * 100, (i+1) * 100);
		itemsSlice[i] = itemsSlice[i].join(',');
	}
	// build the promise array, the resp.json() had to be here to work
	const calls = itemsSlice.map(slice => fetch(`${endpoint}/${world}/${slice}/`).then(resp => resp.json()));
	// get the promise results into new array
	const responses = await Promise.all(calls);
	responses.map(resp => result.push(resp));

	updateTable(result);
	body.classList.remove('loading');
}

function sortCol() {
	const getCellValue = (tr, idx) => tr.children[idx].innerText || tr.children[idx].textContent;

	const comparer = (idx, asc) => (a, b) => ((v2, v1) => 
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

Array.from(document.querySelectorAll('.accordion-toggle')).map(button => button.addEventListener('click', function(e) {
	e.preventDefault;
	console.log(this.parentNode.nextElementSibling);
	this.parentNode.nextElementSibling.classList.toggle('hidden');
}));
function updateLocalSave() {
	let rType = retainerSelect.value;
	let saveState = {
		lang: langSelect.value,
		world: worldSelect.value,
		rLevel: retainerLevel.value
	}

	localStorage.setItem(`ffFetchSave-${rType}`, JSON.stringify(saveState));
	localStorage.setItem('ffFetchSave-type', rType);
}
// hookup the onchange event for saving state
Array.from(settings.querySelector('button.fetch')).map(el => el.addEventListener('click', updateLocalSave));

function loadLocalSave() {
	retainerStatLabel.innerText = retainerStatLabels[retainerSelect.value][langSelect.value];
	// todo: swap job labels on select when language is switched
	let loadRType = localStorage.getItem('ffFetchSave-type');
	let loadState = JSON.parse(localStorage.getItem(`ffFetchSave-${loadRType}`));
	langSelect.value = loadState.lang;
	worldSelect.value = loadState.world;
	retainerSelect.value = loadRType;
	retainerLevel.value = loadState.rLevel;
}
// hookup the onchange event for loading retainer type save
settings.querySelector('select.retainer-type').addEventListener('change', function() {
	localStorage.setItem('ffFetchSave-type', this.value);
	loadLocalSave();
});

if(localStorage.getItem('ffFetchSave-type')) {
	loadLocalSave();
}
