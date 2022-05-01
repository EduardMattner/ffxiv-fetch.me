const endpoint = 'https://universalis.app/api/v2';
const settings = document.querySelector('.settings');
const table = document.querySelector('.data-table');
let retainerPerception = 0; // grab updated value when fetching

let theData = {};

function itemName(id) {
	return itemData[id].en;
}

function breakpoints(data) {
	let breakpoints = Object.entries(data);
	let amount = breakpoints[0][0];
	for (let i = 0; i < breakpoints.length; i++) {
		if (breakpoints[i][1] < retainerPerception ) {
			amount = breakpoints[i][0];
		}
	}
	return amount;
}

function updateTable(data) {
	// console.log(data);
	let html = '<tr><th class="order">Item</th><th class="order">min Price</th></th><th class="order">Amounts</th><th class="order">Gil/Trip <span class="cursor-pointer">&#x21c5;</span></th></tr>';
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
	let world = settings.querySelector('.world').value;
	let retType = settings.querySelector('.retainer-type').value;
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
	// console.log(items);

	fetch(`${endpoint}/${world}/${items}/`)
	.then(resp => resp.json())
	.then(data => {
		// theData = data;
		updateTable(data);
		// console.log(data);
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
	retainerPerception = document.querySelector('.retainer-level').value;
	fetchData();
});