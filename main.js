// Selecting  Dom

//console.log(document);
// console.log(document.head);
// console.log(document.title);
//document.title = 'Hello';
// console.log(document.body);
//console.log(document.all);
//console.log((document.forms)[0]);

// getElentById
//console.log(document.getElementById('heading'));
//document.getElementById('heading').style.color = 'red';
// document.getElementById('heading').style.backgroundColor = 'green', document.getElementById('heading').style.padding = 10;
//document.getElementById('heading').textContent = 'New Heading';
// let newHeading = document.getElementById('heading');
// newHeading.style.color = 'white';
// newHeading.style.backgroundColor = 'green';
// newHeading.style.padding = 10;
// newHeading.textContent = 'Hello';
// newHeading.style.color = 'red';
// newHeading.innerText = 'Welcome!';
//newHeading.innerHTML = '<h3>Hello</h3>';
//console.log(newHeading);
// console.log(heading.textContent);
// console.log(heading.innerText);
// console.log(heading.innerHTML);


//quirySelector / quirySelectorAll
//console.log(document.querySelector('#heading'));
//document.querySelector('#heading').style.color = 'red';
//document.querySelector('#heading').textContent = 'New Heading';


// getelementsByClassName 
//let itemList = document.getElementsByClassName('group-list-item');
// itemList[1].style.backgroundColor = 'red';
// itemList[1].style.color = 'white';
// itemList[3].style.backgroundColor = 'red';
// itemList[3].style.color = 'white';
//Gives error
//itemList.style.backgroundColor = 'red';

// for (i = 0; i < itemList.length; i++) {
// 	itemList[i].style.backgroundColor = 'green';
// 	itemList[i].style.color = 'white';
// }

// console.log(itemList);


//for each
let titles = document.getElementsByClassName('title');
Array.from(titles).forEach(function (item) {
	item.style.color = 'red';
})


//getelementsByTagName

// let itemList = document.getElementsByTagName('li');
// // itemList[1].style.backgroundColor = 'red';
// // itemList[1].style.color = 'white';
// // itemList[3].style.backgroundColor = 'red';
// // itemList[3].style.color = 'white';
// //Gives error
// //itemList.style.backgroundColor = 'red';

// for (i = 0; i < itemList.length; i++) {
// 	itemList[i].style.backgroundColor = 'green';
// 	itemList[i].style.color = 'white';
// }

// console.log(itemList);


//querySelector

// let titles = document.querySelector('#heading');
// headingNew.style.backgroundColor = 'green';
// headingNew.style.color = 'white';
// headingNew.style.padding = 10;

// console.log(headingNew);

// let titles = document.querySelector('.title');
// titles.style.backgroundColor = 'green';
// titles.style.color = 'white';
// titles.style.padding = 10;

// console.log(titles);

// let input = document.querySelector('input'); // Takes first input
// input.value = 'Hello';
// input.style.padding = '10';
// input.style.color = 'red';

// let inputName = document.getElementById('name');
// let submit = document.getElementById('submit');
// let inputNewName = document.getElementById('newName');

// submit.addEventListener('submit', function (e) {
// 	console.log(inputName);
// });

//console.log(inputName.value);

// let submit = document.querySelector('input[type = "submit"]');
// submit.value = 'Send';
// submit.style.padding = 10;
// submit.style.minWidth = 70;

// let items = document.querySelector('.group-list-item');
// let firstItem = document.querySelector('.group-list-item:first-child');
// let lastItem = document.querySelector('.group-list-item:last-child')
// let secondItem = document.querySelector('.group-list-item:nth-child(2)')
// firstItem.style.color = 'red';
// lastItem.style.color = 'green';
// secondItem.style.color = 'blue';


// qyerySelectorAll

// let titles = document.querySelectorAll('.title');
// titles[0].style.color = 'red';
// titles[0].textContent = 'Add New Item'
// console.log(titles);

// let items = document.querySelectorAll('.group-list-item');
// for (let i = 0; i < items.length; i++) {
// 	items[i].style.backgroundColor = 'blue'
// 	items[i].style.color = 'white';
// }
// let items = document.querySelectorAll('.group-list-item');
// let oddItems = document.querySelectorAll('.group-list-item:nth-child(odd)');
// let evenItems = document.querySelectorAll('.group-list-item:nth-child(even)');
// for (let i = 0; i < items.length; i++) {
// 	oddItems[i].style.backgroundColor = 'blue';
// 	oddItems[i].style.color = 'white';
// 	evenItems[i].style.backgroundColor = 'green';
// 	evenItems[i].style.color = 'white';
// }

// insertBefore

const myList = document.querySelector('#myList');
const sitaList = document.querySelector('#sita');
const ramList = document.createElement('li');
ramList.textContent = 'Ram';
myList.insertBefore(ramList, sitaList)

const fruitList = document.querySelector('#fruit-list');
//let newListItem = document.createElement('li');
const fruitesMenu = ['Mango', 'Pine-Apple', 'Orange', 'Strabary', 'Guava'];
//newListItem.className = 'list-item';
//newListItem.textContent = 'Banana';
//fruitList.appendChild(newListItem);


for (let fruits of fruitesMenu) {
	let newListItem = document.createElement('li');
	newListItem.textContent = fruits;
	newListItem.className = 'list-item';
	fruitList.appendChild(newListItem);

	newListItem.style.color = 'red';
}
// Array.from(fruitList).forEach(function (items) {
// 	console.log(items);
// });

// Check Box
const checkBox = document.querySelector('#checkBox');
checkBox.addEventListener('change', function () {
	if (checkBox.checked) {
		fruitList.style.display = 'none';
	} else {
		fruitList.style.display = 'block';
	}
})


//add delet users
const inputUser = document.querySelector('.inputUser');
const submit = document.querySelector('.submit');
const userLists = document.querySelector('.user')
const listItem = document.querySelectorAll('.user li');
const closeBtn = document.querySelectorAll('.close');
inputUser.style.marginBottom = 10;

for (let i = 0; i < listItem.length; i++) {
	listItem[i].style.display = 'flex';
	listItem[i].style.justifyContent = 'space-between';
}

// for (let i = 0; i < closeBtn.length; i++) {
// 	closeBtn[i].addEventListener('click', function () {
// 		this.parentElement.style.display = 'none';
// 	});
// }

//same as for loop
Array.from(closeBtn).forEach(function (btn) {
	btn.addEventListener('click', function () {
		this.parentElement.style.display = 'none';
	});
});


submit.addEventListener('click', function () {
	const newList = document.createElement('li');
	const listText = document.createTextNode(inputUser.value);
	const closeBtnNew = document.createElement('button');
	closeBtnNew.className = 'close';
	const btnText = document.createTextNode('x');

	closeBtnNew.appendChild(btnText);

	newList.appendChild(listText);
	newList.appendChild(closeBtnNew);

	userLists.appendChild(newList);

});




//accordian

const pannelss = document.querySelectorAll('.accordian .pannel');
const accordian = document.querySelector('.accordian');
const button = document.querySelectorAll('.accordian button');

accordian.style.marginTop = 20;
for (let i = 0; i < button.length; i++) {
	button[i].addEventListener('click', function () {
		if (this.parentElement.className === 'pannel active-item') {
			removercase();
		} else {
			removercase();
			this.parentElement.classList.add('active-item');
		}
	});
}

function removercase() {
	for (let i = 0; i < pannelss.length; i++) {
		pannelss[i].classList.remove('active-item');
	}
}


// Selecect
const select = document.querySelector('.select');
select.style.marginTop = 10;
select.addEventListener('change', runEvent);
const allButtons = document.querySelectorAll('button');

const copyAllButtons = [];
for (i = 0; i < allButtons.length; i++) {
	copyAllButtons.push(allButtons[i].classList[1]);
}

function runEvent(e) {
	if (e.target.value === 'red') {
		buttonRed();
	} else if (e.target.value === 'green') {
		buttonGreen();
	} else if (e.target.value === 'reset') {
		buttonReset();
	} else if (e.target.value === 'random') {
		buttonRandom();
	}
}

function buttonRed() {
	for (i = 0; i < allButtons.length; i++) {
		allButtons[i].classList.remove(allButtons[i].classList[1]);
		allButtons[i].classList.add('btn-danger');
	}
}

function buttonGreen() {
	for (i = 0; i < allButtons.length; i++) {
		allButtons[i].classList.remove(allButtons[i].classList[1]);
		allButtons[i].classList.add('btn-success');
	}
}

function buttonReset() {
	for (i = 0; i < allButtons.length; i++) {
		allButtons[i].classList.remove(allButtons[i].classList[1]);
		allButtons[i].classList.add(copyAllButtons[i]);
	}
}


// // Tab Panels
const tabs = document.querySelector('.tabs');
const tabItems = document.querySelectorAll('.tabs li');
const panels = document.querySelectorAll('.panel');

tabs.addEventListener('click', function (e) {
	if (e.target.tagName === 'LI') {
		const targetPanel = document.querySelector(e.target.dataset.target);
		panels.forEach(function (panel) {
			if (panel === targetPanel) {
				panel.classList.add('active');
			} else {
				panel.classList.remove('active');
			}
		})
	}
});

tabItems.forEach(function (tab) {
	tab.addEventListener('click', function () {
		tabItems.forEach(function (tab) {
			tab.classList.remove('btn-primary');
		})
		tab.classList.add('btn-primary');
	})
})

// Creating and deleting new users

// const newUser = document.querySelector('.newUser');
// const newuserLists = document.createElement('ul');
// const users = ['Ram', 'Manoj', 'Binod', 'Sudhan', 'Bishal', 'Suma', 'Susan'];
// const closeBtns = document.createElement('span');
// closeBtns.textContent = 'x';
// closeBtns.classList.add('btn', 'btn-danger');
// const newuserItem = document.createElement('li');


// for (let user of users) {
// 	const newuserItem = document.createElement('li');
// 	newuserItem.textContent = user;
// 	newuserLists.appendChild(newuserItem);
// 	newuserItem.appendChild(closeBtns);

// 	for (let i = 0; i < newuserItem.length; i++) {
// 		newuserItem[i].appendChild(closeBtns);

// 		console.log(newuserItem);
// 	}
// }

// newUser.appendChild(newuserLists);


// New Accordian
const newAccordianPannel = document.querySelectorAll('.newAccordian-pannel');
const accordianButton = document.querySelectorAll('.newAccordian-heading');

for (let i = 0; i < accordianButton.length; i++) {
	accordianButton[i].addEventListener('click', function () {

		if (this.parentElement.className === 'newAccordian-pannel active-panel') {
			reoverclass();
		} else {
			reoverclass();
			this.parentElement.classList.toggle('active-panel');
		}
	})
}

function reoverclass() {
	for (let i = 0; i < newAccordianPannel.length; i++) {
		newAccordianPannel[i].classList.remove('active-panel');
	}
}