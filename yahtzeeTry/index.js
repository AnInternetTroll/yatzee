import { Game } from './game.js'

const rollButton = document.getElementById("rollDiceButton");
const dicesContainer = document.querySelector(".dices");

const Yahtzee = new Game;



rollButton.addEventListener("click", (e)=>{
    e.preventDefault();
    Yahtzee.throwDice()
})

Yahtzee.onDiceRoll = ()=> {

dicesContainer.innerHTML = ""

Yahtzee.dice.forEach(dice =>{
    dicesContainer.innerHTML += `
        <button>${dice.value}</button>
    `;
})
}

Yahtzee.round()