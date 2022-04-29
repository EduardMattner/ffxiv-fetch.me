const endpoint = 'https://universalis.app/v2';
let world = 'leviathan';
let items = '36178,36166';

fetch(`${endpoint}/${world}/${items}/`, {
})
.then(resp => resp.json())
.then(resp => console.log(resp))
.catch(err => console.log(err));