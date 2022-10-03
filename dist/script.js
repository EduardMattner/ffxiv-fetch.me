const body = document.querySelector('body');
const endpoint = 'https://universalis.app/api/v2';
const settings = document.querySelector('.settings');
const table = document.querySelector('.data-table');
const langSelect = settings.querySelector('.language');
const worldSelect = settings.querySelector('.world');
const retainerSlot = settings.querySelector('.retainer-slot');
const retainerName = settings.querySelector('.retainer-name');
const retainerType = settings.querySelector('.retainer-type');
const retainerLevel = settings.querySelector('.retainer-level');

function itemName(id) {
    return itemData[id][langSelect.value];
}

function itemLvl(id) {
    return itemData[id].level;
}

function sealCost(id) {
    return itemData[id].cost;
}

function breakpoints(data) {
    let breakpoints = Object.entries(data);
    let amount = breakpoints[0][0];
    for (let i = 0; i < breakpoints.length; i++) {
        if (breakpoints[i][1] <= retainerLevel.value) {
            amount = breakpoints[i][0];
        }
    }
    return amount;
}

function updateTable(rawData, retType) {
    let retainer = false;
    // check if we are dealing with a retainer list
    if (['bot', 'fsh', 'min', 'hnt'].indexOf(retType) !== -1) {
        retainer = true;
    }

    let tableData = {
        items: {}
    };

    // in seconds instead of milliseconds
    let timeNow = Date.now() / 1000;

    // setup the table headings
    let html = `
		<tr class="sticky top-0 bg-gray-800">
			<th>${retainer ? 'Lvl': 'Seals' } &#x21c5;</th>
			<th>Item &#x21c5;</th>
			<th>min Price &#x21c5;</th>
			${retainer ? '<th>Amounts &#x21c5;</th>' : '' }
			<th class="init-sort">${retainer ? 'Gil/Trip' : 'Gil/Seal' } &#x21c5;</th>
            <th>Last Sale (hrs) &#x21c5;</th>
			<th>Last Sale (price) &#x21c5;</th>
			<th>Last Sale (qty) &#x21c5;</th>
			<th>${retainer ? 'Last Sale (gil/trip)' : 'Last Sale (Gil/Seal)'} &#x21c5;</th>
		</tr>
	`;

    // get all the data into one object, tableData
    for (var i = 0; i < rawData.length; i++) {
        let objKeys = Object.keys(rawData[i].items);
        for (var q = 0; q < objKeys.length; q++) {
            tableData.items[objKeys[q]] = rawData[i].items[objKeys[q]];
        }
    }

    // console.log(rawData);

    for (let i = 0; i < Object.keys(tableData.items).length; i++) {
        let id = Object.values(tableData.items)[i].itemID;
        let lvl = retainer ? itemLvl(id) : sealCost(id);
        let name = itemName(id);
        let minPrice = Object.values(tableData.items)[i].minPrice;
        let amount = retainer ? breakpoints(itemData[id].breakpoints) : 1;
        let gilPerTrip = 0;
        if (retainer) {
            gilPerTrip = amount * minPrice;
        } else {
            gilPerTrip = minPrice / lvl;
            gilPerTrip = gilPerTrip.toFixed(1);
        }
        // some items do not have historic data, which causes errors
        let lastSaleHrs = 'No Data';
        let lastSalePrice = 'No Data';
        let lastSaleGilPerTrip = 'No Data';
        let lastSaleQty = 'No Data';
        if (Object.values(tableData.items)[i].recentHistory.length) {
            lastSaleHrs = Math.floor((timeNow - Object.values(tableData.items)[i].recentHistory[0].timestamp) / 60) / 60;
            lastSaleHrs = lastSaleHrs.toFixed(1);
            // drop extra digits from
            lastSalePrice = Object.values(tableData.items)[i].recentHistory[0].pricePerUnit;
            lastSaleGilPerTrip = amount * lastSalePrice;

            lastSaleGilSeal = lastSalePrice / lvl;
            lastSaleGilSeal = lastSaleGilSeal.toFixed(1);

            lastSaleQty = Object.values(tableData.items)[i].recentHistory[0].quantity;
        }

        html += '<tr>';
        html += `<td>${lvl}</td>`
        html += `<td><a href="https://universalis.app/market/${id}" target="_blank" rel="noopener">${name}</a></td>`;
        html += `<td>${minPrice}</td>`;
        if (retainer) html += `<td>${amount}</td>`;
        html += `<td>${gilPerTrip}</td>`;
        html += `<td>${lastSaleHrs}</td>`;
        html += `<td>${lastSalePrice}</td>`;
        html += `<td>${lastSaleQty}</td>`;
        if (retainer) {
            html += `<td>${lastSaleGilPerTrip}</td>`;
        } else {
            html += `<td>${lastSaleGilSeal}</td>`;
        }
        html += '</tr>';
    }

    // populate table
    table.innerHTML = html;
    // apply sorting funcionality
    sortCol();
    // sort by gil/trip column Desc
    document.querySelector('table .init-sort').click();
}

async function fetchData() {
    body.classList.add('loading');
    let world = worldSelect.value;
    let retType = retainerType.value;
    let items = '';
    let result = [];
    switch (retType) {
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
        case "gc":
            items = gcData;
            break;
    }

    // only 100 items at a time are permitted from the API, so chop chop
    const itemsSlice = [];
    for (var i = 0; i < Math.ceil(items.length / 100); i++) {
        itemsSlice[i] = items.slice(i * 100, (i + 1) * 100);
        itemsSlice[i] = itemsSlice[i].join(',');
    }
    // build the promise array, the resp.json() had to be here to work
    const calls = itemsSlice.map(slice => fetch(`${endpoint}/${world}/${slice}/`).then(resp => resp.json()));
    // get the promise results into new array
    const responses = await Promise.all(calls)
        .then(responses => {
            responses.map(resp => result.push(resp));
            updateTable(result, retType);
            body.classList.remove('loading');
        })
        .catch(error => {
            console.error(`Something's wrong: ${error}`)
            body.classList.add('error');
        });
}

// column sort function, fires on refresh TODO: get it to always sort Descending on refresh
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
            .forEach(tr => table.appendChild(tr));
    })));
}

// hook up the fetch to the button
settings.querySelector('.fetch').addEventListener('click', async (e) => {
    e.preventDefault();
    updateLocalSave();
    loadLocalSave();
    fetchData();
});

// accordion functionality for mobile
Array.from(document.querySelectorAll('.accordion-toggle')).map(button => button.addEventListener('click', function(e) {
    e.preventDefault;
    this.parentNode.nextElementSibling.classList.toggle('hidden');
}));

// save to local
function updateLocalSave() {
    let rSlot = retainerSlot.value;
    let saveState = {
        lang: langSelect.value,
        world: worldSelect.value,
        rName: retainerName.value,
        rType: retainerType.value,
        rLevel: retainerLevel.value,
    }

    localStorage.setItem(`ffFetchSave-${rSlot}`, JSON.stringify(saveState));
    localStorage.setItem('ffFetchSave-slot', rSlot);
}
// hookup the onchange event for saving state
Array.from(settings.querySelector('button.fetch')).map(el => el.addEventListener('click', updateLocalSave));

// load from local
function loadLocalSave() {
    let loadRSlot = localStorage.getItem('ffFetchSave-slot');
    let loadState = JSON.parse(localStorage.getItem(`ffFetchSave-${loadRSlot}`));

    langSelect.value = loadState.lang;
    worldSelect.value = loadState.world;
    retainerSlot.value = loadRSlot;
    retainerName.value = loadState.rName;
    retainerType.value = loadState.rType;
    retainerLevel.value = loadState.rLevel;

    for (var i = 0; i < retainerSlot.length; i++) {
        let tempSlot = JSON.parse(localStorage.getItem(`ffFetchSave-slot-${i + 1}`));
        if (tempSlot !== null) {
            retainerSlot.options[i].innerText = `${i + 1}: ${tempSlot.rName}`;
        }
    }
}

// hookup the onchange event for loading saved Retainer Slots
settings.querySelector('select.retainer-slot').addEventListener('change', function() {
    if (localStorage.getItem(`ffFetchSave-${this.value}`) !== null) {
        localStorage.setItem('ffFetchSave-slot', this.value);
        loadLocalSave();
    } else {
        retainerName.value = '';
        retainerLevel.value = '';
    }
});

// if we have something to load, do it
if (localStorage.getItem('ffFetchSave-slot') !== null) {
    loadLocalSave();
}