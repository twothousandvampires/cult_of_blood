import PowerUp from "./PowerUp.js";

export default class LifePowerUp extends PowerUp{
    constructor() {
        super();
        this.texture_id = 'life_pu'
        this.id = 'pu' + Math.floor(Math.random() * 1000000)
    }

    pickUp(player){
        player.hp += 30
        if(player.hp > 100) player.hp = 100
    }
}