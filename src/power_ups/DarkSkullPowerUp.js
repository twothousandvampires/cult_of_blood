import PowerUp from "./PowerUp.js";
import DarkSkullSpell from "../spells/DarkSkullSpell.js";

export default class DarkSkullPowerUp extends PowerUp{
    constructor() {
        super()
        this.texture_id = 'dark_skull_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }
    pickUp(player){
        player.newSpell(new DarkSkullSpell())
    }
}