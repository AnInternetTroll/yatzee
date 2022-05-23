export class Dice {
  locked = false;
  value = Math.ceil(Math.random() * 6);
  roll() {
    this.value = Math.ceil(Math.random() * 6);
  }
}

export class Game {
  rounds = 9;
  currentRound = 1;
  maxRolls = 3;
  diceRolled = 0;
  dice = [];
  score = 0;

  constructor() {
    for (let i = 0; i < 6; i++) {
      this.dice.push(new Dice());
    }
  }

  onDiceRoll() {}

  round() {
    if (this.rounds == 0) {
      return; //End game
    }

    this.throwDice();
    this.rounds--;
    this.maxRolls = 3;
  }

  lockDice(index) {
    this.dice[index].locked = true;
  }

  throwDice() {
    if (this.diceRolled == this.maxRolls) {
      return; // cant throw the dice anymore
    } else {
      for (let i = 0; i < this.dice.length; i++) {
        if (this.dice[i].locked) continue;
        this.dice[i].roll();
      }
      this.diceRolled++;
    }
    this.onDiceRoll();
  }
  checkN(n) {
    return duplicatesCount(this.dice)[n] * n;
  }

  checkOnes() {
    return checkN(1);
  }
  checkTwos() {
    return checkN(2);
  }
  checkThrees() {
    return checkN(3);
  }
  checkFours() {
    return checkN(4);
  }
  checkFives() {
    return checkN(5);
  }
  checkSixes() {
    return checkN(6);
  }

  duplicatesCount(dice) {
    const counts = {};

    for (const arr of dice) {
      counts[arr.value] = counts[arr.value] ? counts[arr.value] + 1 : 1;
    }

    return counts;
  }

  checkThreeRepeats() {
    const repeats = Object.entries(duplicatesCount(this.dice)).find(
      (dice) => dice[1] >= 3
    );
    if (repeats) return repeats[0] * repeats[1];
  }
  checkFourRepeats() {
    const repeats = Object.entries(duplicatesCount(this.dice)).find(
      (dice) => dice[1] >= 5
    );
    if (repeats) return repeats[0] * repeats[1];
  }

  checkYahtzee() {
    const repeats = Object.entries(duplicatesCount(this.dice)).find(
      (dice) => dice[1] >= 5
    );
    if (repeats) return repeats[0] * repeats[1];
  }
}
